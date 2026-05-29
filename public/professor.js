import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== CONFIGURAÇÃO DO FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyDPY8rM_zRcqN5iphAG9Q6TruUyK6tbyz0",
    authDomain: "nexaplus-1a781.firebaseapp.com",
    projectId: "nexaplus-1a781",
    storageBucket: "nexaplus-1a781.firebasestorage.app",
    messagingSenderId: "275366446278",
    appId: "1:275366446278:web:cbfbcb90a514b00da083c7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db  = getFirestore(app);
const provider = new GoogleAuthProvider();

// ===== FIX 1 — URL DE PRODUÇÃO =====
// Para desenvolvimento local troque por: "http://127.0.0.1:5001/nexaplus-1a781/us-central1/tutorIA"
const BACKEND_FUNCTION_URL = "https://us-central1-nexaplus-1a781.cloudfunctions.net/tutorIA";

// ===== ESTADO GLOBAL MULTI-CHAT =====
// FIX 2 — Histórico de conversa (sem dados sensíveis) permanece no localStorage.
// Fichas dos alunos (dados sensíveis) são gravadas no Firestore por UID.
let listaConversasProf = JSON.parse(localStorage.getItem('listaConversas_prof')) || [];
let chatIdAtivoProf = localStorage.getItem('chatIdAtivo_prof') || null;

const savedNomeProf = localStorage.getItem('professorNome');
const savedAreaProf = localStorage.getItem('professorArea');

let tipoEscolaSelecionada = "";

// ===== FIX 2 — HELPERS DO FIRESTORE =====
// Salva a ficha de um aluno no Firestore vinculada ao UID do professor
async function salvarFichaAlunoFirestore(uid, alunoId, dados) {
    try {
        await setDoc(doc(db, "professores", uid, "alunos", alunoId), dados);
    } catch (err) {
        console.error("Erro ao salvar ficha no Firestore:", err);
    }
}

// Lê todas as fichas de alunos do professor logado do Firestore
async function carregarFichasAlunosFirestore(uid) {
    try {
        const snap = await getDocs(collection(db, "professores", uid, "alunos"));
        const fichas = {};
        snap.forEach(d => { fichas[d.id] = d.data(); });
        return fichas;
    } catch (err) {
        console.error("Erro ao carregar fichas do Firestore:", err);
        return {};
    }
}

// Cache local das fichas para uso na sessão (não armazena em localStorage)
let fichasAlunosCache = {};

// ===== NAVEGAÇÃO ENTRE PASSOS =====
window.nextStep = function(num) {
    document.querySelectorAll('.step').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    const target = document.getElementById('step-' + num);
    if (!target) return;
    target.style.display = 'flex';
    target.classList.add('active');

    if (num === 3) {
        validarFormularioProf();
    }
}

// ===== ROTEAMENTO INICIAL =====
if (savedNomeProf && savedAreaProf) {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dashboard-professor').style.display = 'flex';
    inicializarHistoricoChatsProf();
} else if (savedNomeProf) {
    const welcomeEl = document.getElementById('welcome-professor-text');
    if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${savedNomeProf.split(' ')[0]}!`;
    window.nextStep(3);
}

// ===== CAPTURA RETORNO DO REDIRECT =====
getRedirectResult(auth).then((result) => {
    const user = result?.user;
    if (!user) return;
    tratarLoginSucessoProf(user);
}).catch(console.error);

// ===== LOGIN POR POPUP (GOOGLE) =====
window.verificarPerfilAposLogin = async function() {
    try {
        const result = await signInWithPopup(auth, provider);
        if (result?.user) tratarLoginSucessoProf(result.user);
    } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') return;
        const user = auth.currentUser;
        if (user) {
            tratarLoginSucessoProf(user);
            return;
        }
        console.error("Erro no login:", err);
        alert("Erro ao conectar com o Google. Tente novamente.");
    }
}

async function tratarLoginSucessoProf(user) {
    const nome = user.displayName || "Professor";
    localStorage.setItem('professorNome', nome);
    localStorage.setItem('userRole', 'professor');
    localStorage.setItem('professorUID', user.uid);

    // FIX 2 — carrega fichas sensíveis do Firestore ao logar
    fichasAlunosCache = await carregarFichasAlunosFirestore(user.uid);

    if (localStorage.getItem('professorArea')) {
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('dashboard-professor').style.display = 'flex';
        inicializarHistoricoChatsProf();
    } else {
        const welcomeEl = document.getElementById('welcome-professor-text');
        if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${nome.split(' ')[0]}!`;
        const nomeInput = document.getElementById('nome-prof');
        if (nomeInput && !nomeInput.value) nomeInput.value = nome;
        window.nextStep(3);
    }
}

// ===== SELEÇÃO TIPO DE ESCOLA =====
window.selecionarTipoEscola = function(tipo) {
    tipoEscolaSelecionada = tipo;
    const btnSim = document.getElementById('btn-escola-sim');
    const btnNao = document.getElementById('btn-escola-nao');

    if (tipo === 'Pública') {
        btnSim.classList.add('selected');
        btnNao.classList.remove('selected');
    } else {
        btnNao.classList.add('selected');
        btnSim.classList.remove('selected');
    }
    validarFormularioProf();
}

// ===== VALIDAÇÃO DO FORMULÁRIO =====
function validarFormularioProf() {
    const nome = document.getElementById('nome-prof')?.value.trim();
    const area = document.getElementById('area-ensino')?.value.trim();
    const schoolName = document.getElementById('nome-escola')?.value.trim();
    const btnFinalizar = document.getElementById('btn-finalizar-cadastro');

    if (nome && area && schoolName && tipoEscolaSelecionada !== "") {
        btnFinalizar.removeAttribute('disabled');
    } else {
        btnFinalizar.setAttribute('disabled', 'true');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const inputs = ['nome-prof', 'area-ensino', 'nome-escola'];
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', validarFormularioProf);
    });

    // FIX 4 — ARIA: adiciona aria-label nos botões do chat via JS (complementar ao HTML)
    const btnVoz = document.getElementById('btn-voice-prof');
    if (btnVoz) btnVoz.setAttribute('aria-label', 'Ativar reconhecimento de voz');

    const btnEnviar = document.querySelector('.btn-send');
    if (btnEnviar) btnEnviar.setAttribute('aria-label', 'Enviar mensagem');

    const inputProf = document.getElementById('user-input-prof');
    if (inputProf) {
        inputProf.setAttribute('aria-label', 'Campo de mensagem para o assistente pedagógico');
        inputProf.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.sendMessageProf();
        });
    }

    if (!savedNomeProf && !savedAreaProf) {
        const s1 = document.getElementById('step-1');
        if (s1) s1.style.display = 'flex';
    }
});

// ===== FINALIZAR CADASTRO =====
window.finalizarCadastro = function() {
    const nomeInput = document.getElementById('nome-prof')?.value.trim();
    const areaInput = document.getElementById('area-ensino')?.value.trim();
    const nomeEscolaInput = document.getElementById('nome-escola')?.value.trim();

    if (!areaInput || !nomeInput || !nomeEscolaInput || tipoEscolaSelecionada === "") {
        alert("Por favor, preencha todos os campos antes de concluir.");
        return;
    }

    localStorage.setItem('professorNome', nomeInput);
    localStorage.setItem('professorArea', areaInput);
    localStorage.setItem('professorTipoEscola', tipoEscolaSelecionada);
    localStorage.setItem('professorEscola', nomeEscolaInput);

    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dashboard-professor').style.display = 'flex';

    inicializarHistoricoChatsProf();
}

// ===== MODAL DE CADASTRO DE ALUNO =====
window.abrirModalAluno = function() {
    const modal = document.getElementById('modal-aluno');
    if (modal) modal.style.display = 'flex';
}

window.fecharModalAluno = function() {
    const modal = document.getElementById('modal-aluno');
    if (modal) modal.style.display = 'none';
    
    // Limpa os campos usando encadeamento opcional (?) para evitar erros caso o HTML não tenha o ID exato
    const nomeInput = document.getElementById('modal-nome-aluno');
    if (nomeInput) nomeInput.value = '';
    
    const serieInput = document.getElementById('modal-serie-aluno');
    if (serieInput) serieInput.value = ''; // Voltando para .value='' para garantir compatibilidade
    
    const escolaInput = document.getElementById('modal-escola-aluno');
    if (escolaInput) escolaInput.value = '';
    
    const idadeInput = document.getElementById('modal-idade-aluno');
    if (idadeInput) idadeInput.value = '';
    
    const atipicidadeInput = document.getElementById('modal-atipicidade-aluno');
    if (atipicidadeInput) atipicidadeInput.value = '';
}

window.salvarNovoAluno = async function() {
    try {
        const nomeInput = document.getElementById('modal-nome-aluno');
        const serieInput = document.getElementById('modal-serie-aluno');
        const escolaInput = document.getElementById('modal-escola-aluno');
        const idadeInput = document.getElementById('modal-idade-aluno');
        const atipicidadeInput = document.getElementById('modal-atipicidade-aluno');

        // Garante que pega os valores, ou string vazia se o input não existir
        const nome        = nomeInput ? nomeInput.value.trim() : '';
        const serie       = serieInput ? serieInput.value : '';
        const escola      = escolaInput ? escolaInput.value.trim() : '';
        const idade       = idadeInput ? idadeInput.value.trim() : '';
        const atipicidade = atipicidadeInput ? atipicidadeInput.value.trim() : '';

        if (!nome || !serie || !escola || !idade || !atipicidade) {
            alert("Por favor, preencha todas as informações do aluno.");
            return;
        }

        const novoId = 'aluno_' + Date.now();
        const fichaAluno = { nome, serie, escola, idade, atipicidade };
        
        // Pega lista atual garantindo que seja um array válido
        let listaAtual = [];
        try {
            const storedLista = localStorage.getItem('listaConversas_prof');
            if (storedLista) listaAtual = JSON.parse(storedLista);
        } catch(e) {
            console.error("Erro ao ler lista do localStorage", e);
        }
        
        // Garante que a variável global aponte para a mesma lista
        listaConversasProf = listaAtual;

        const dadosAlunoFormatados = `📌 Ficha do Aluno Cadastrado:\n• Nome: ${nome}\n• Série: ${serie}\n• Escola: ${escola}\n• Idade: ${idade} anos\n• Atipicidade: ${atipicidade}`;

        const novaConversa = {
            id: novoId,
            titulo: nome,
            messages: [{ role: "system_card", content: dadosAlunoFormatados }]
        };

        // Atualiza os dados primeiro
        listaConversasProf.unshift(novaConversa);
        chatIdAtivoProf = novoId;

        // Salva localmente IMEDIATAMENTE
        localStorage.setItem('listaConversas_prof', JSON.stringify(listaConversasProf));
        localStorage.setItem('chatIdAtivo_prof', chatIdAtivoProf);

        // FECHA O MODAL AQUI (Antes de chamar renderizações ou Firebase)
        window.fecharModalAluno();
        
        // ATUALIZA A INTERFACE AQUI
        if (typeof renderizarListaLateralProf === 'function') {
            renderizarListaLateralProf();
        }
        if (typeof carregarMensagensChatAtivoProf === 'function') {
            carregarMensagensChatAtivoProf();
        }

        // Tenta salvar no Firebase DEPOIS de tudo visual estar pronto
        const uid = localStorage.getItem('professorUID');
        if (uid) {
            // Dispara assincronamente sem usar 'await' para NÃO BLOQUEAR a execução caso demore/falhe
            salvarFichaAlunoFirestore(uid, novoId, fichaAluno)
                .then(() => {
                    if (typeof fichasAlunosCache !== 'undefined') {
                        fichasAlunosCache[novoId] = fichaAluno; 
                    }
                })
                .catch(err => console.error("Erro ao salvar no Firestore (background):", err));
        }

    } catch (erroGeral) {
        console.error("Erro fatal ao salvar aluno:", erroGeral);
        // Em caso de emergência, pelo menos tenta fechar o modal
        document.getElementById('modal-aluno').style.display = 'none';
        alert("Ocorreu um erro ao salvar, mas fechamos a janela. Tente recarregar a página.");
    }
}

// ===== LÓGICA MULTI-CHAT =====
function inicializarHistoricoChatsProf() {
    if (listaConversasProf.length > 0) {
        if (!chatIdAtivoProf || !listaConversasProf.find(c => c.id === chatIdAtivoProf)) {
            chatIdAtivoProf = listaConversasProf[0].id;
            localStorage.setItem('chatIdAtivo_prof', chatIdAtivoProf);
        }
    }
    renderizarListaLateralProf();
    carregarMensagensChatAtivoProf();
}

// FIX 6 — confirmação antes de trocar de aluno se há conversa em andamento
function alternarParaChatProf(id) {
    if (id === chatIdAtivoProf) return; // já está neste chat, ignora clique duplo

    const chatAtual = listaConversasProf.find(c => c.id === chatIdAtivoProf);
    const temMensagens = chatAtual?.messages?.some(m => m.role === 'user');

    if (temMensagens) {
        const confirmar = confirm(
            `Você está em uma conversa com ${chatAtual.titulo}.\n\nDeseja mudar para outro aluno? A conversa atual ficará salva no histórico.`
        );
        if (!confirmar) return;
    }

    chatIdAtivoProf = id;
    localStorage.setItem('chatIdAtivo_prof', chatIdAtivoProf);
    renderizarListaLateralProf();
    carregarMensagensChatAtivoProf();
}

function renderizarListaLateralProf() {
    const listContainer = document.getElementById('history-list-prof');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    listaConversasProf.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === chatIdAtivoProf ? 'active' : ''}`;
        // FIX 4 — ARIA: item da lista acessível para leitores de tela
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Abrir conversa com ${chat.titulo}`);
        item.onclick = () => alternarParaChatProf(chat.id);
        item.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') alternarParaChatProf(chat.id); };

        item.innerHTML = `
            <span class="history-item-icon" aria-hidden="true">👤</span>
            <span class="sidebar-text">${chat.titulo}</span>
        `;
        listContainer.appendChild(item);
    });
}

function carregarMensagensChatAtivoProf() {
    const chatWindow = document.getElementById('chat-window-prof');
    if (!chatWindow) return;

    chatWindow.innerHTML = '';
    const chatAtual = listaConversasProf.find(c => c.id === chatIdAtivoProf);

    if (!chatAtual) {
        chatWindow.innerHTML = `
            <div class="empty-state" id="empty-state-prof">
                <div class="empty-icon" aria-hidden="true">👥</div>
                <p>Nenhum aluno selecionado.<br>Clique em "+ Adicionar Aluno" para iniciar um acompanhamento especializado.</p>
            </div>
        `;
        return;
    }

    chatAtual.messages.forEach(msg => {
        appendMsgProf(msg.role, msg.content);
    });

    // FIX 5 — removida variável chatWindow2 desnecessária; usa chatWindow já declarado
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMsgProf(role, text) {
    const chatWindow = document.getElementById('chat-window-prof');
    if (!chatWindow) return;

    const div = document.createElement('div');

    if (role === 'system_card') {
        div.className = 'msg system-card';
        // FIX 4 — ARIA: ficha do aluno identificada para leitores de tela
        div.setAttribute('role', 'note');
        div.setAttribute('aria-label', 'Ficha do aluno cadastrado');
    } else if (role === 'model' || role === 'bot') {
        div.className = 'msg bot';
        div.setAttribute('aria-label', 'Resposta do assistente');
    } else {
        div.className = 'msg user';
        div.setAttribute('aria-label', 'Sua mensagem');
    }

    div.innerText = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ===== ENVIAR MENSAGEM =====
window.sendMessageProf = async function() {
    const input = document.getElementById('user-input-prof');
    const chatWindow = document.getElementById('chat-window-prof');
    const msgText = input?.value?.trim();

    if (!msgText || !chatWindow) return;

    const chatAtual = listaConversasProf.find(c => c.id === chatIdAtivoProf);
    if (!chatAtual) {
        alert("Selecione ou cadastre um aluno antes de enviar uma mensagem.");
        return;
    }

    input.value = '';

    const emptyState = document.getElementById('empty-state-prof');
    if (emptyState) emptyState.remove();

    appendMsgProf('user', msgText);

    chatAtual.messages.push({ role: "user", content: msgText });
    localStorage.setItem('listaConversas_prof', JSON.stringify(listaConversasProf));

    const typingId = 'typing_' + Date.now();
    chatWindow.innerHTML += `<div id="${typingId}" class="typing-indicator" aria-label="Assistente digitando" aria-live="polite"><span></span><span></span><span></span></div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        // FIX 2 — lê ficha sensível do cache em memória (não do localStorage)
        const infoAluno = fichasAlunosCache[chatAtual.id] || {};

        const nomeProf     = localStorage.getItem('professorNome')      || 'Professor';
        const areaProf     = localStorage.getItem('professorArea')      || 'Área não informada';
        const escolaProf   = localStorage.getItem('professorEscola')    || 'Escola não informada';
        const tipoEscolaProf = localStorage.getItem('professorTipoEscola') || 'Não informado';

        const systemPrompt = `Você é um assistente pedagógico especializado da plataforma NexaPlus, auxiliando o(a) Professor(a) ${nomeProf}.

Informações do professor:
- Área de ensino: ${areaProf}
- Escola: ${escolaProf} (Tipo: ${tipoEscolaProf})

Informações do aluno em foco:
- Nome: ${infoAluno.nome || 'Não informado'}
- Série: ${infoAluno.serie || 'Não informada'}
- Escola: ${infoAluno.escola || 'Não informada'}
- Idade: ${infoAluno.idade || 'Não informada'} anos
- Atipicidade / Necessidade especial: ${infoAluno.atipicidade || 'Nenhuma informada'}

Suas responsabilidades:
1. Ajude o professor a criar estratégias pedagógicas adaptadas para esse aluno específico.
2. Sugira metodologias, adaptações de materiais e abordagens inclusivas considerando a atipicidade do aluno.
3. Ofereça sugestões de planos de aula, atividades avaliativas acessíveis e comunicação com a família.
4. Seja objetivo, prático e direto — o professor precisa de respostas aplicáveis em sala de aula.
5. Use linguagem profissional, mas acolhedora. Reconheça os desafios reais de um professor de escola ${tipoEscolaProf.toLowerCase()}.
6. Quando relevante, cite abordagens baseadas em evidências (ABA, TEACCH, UDL, pedagogia de Paulo Freire, etc).`;

        // FIX 3 — limita o histórico enviado à API às últimas 20 mensagens (10 trocas)
        const MAX_HISTORICO = 20;
        const mappedHistory = chatAtual.messages
            .filter(item => item.role === 'user' || item.role === 'model')
            .slice(0, -1)
            .slice(-MAX_HISTORICO)
            .map(item => ({
                role: item.role === 'model' ? 'assistant' : 'user',
                content: item.content
            }));

        const response = await fetch(BACKEND_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...mappedHistory,
                    { role: "user", content: msgText }
                ]
            })
        });

        if (!response.ok) throw new Error(`Erro de servidor: ${response.status}`);

        const data = await response.json();
        const apiResponse = data.text;

        document.getElementById(typingId)?.remove();
        appendMsgProf('bot', apiResponse);

        chatAtual.messages.push({ role: "model", content: apiResponse });
        localStorage.setItem('listaConversas_prof', JSON.stringify(listaConversasProf));

    } catch (err) {
        document.getElementById(typingId)?.remove();
        appendMsgProf('bot', "⚠️ Não consegui responder agora. Verifique sua conexão e tente novamente.");
        console.error("Erro na chamada à API:", err);
    }
}

// ===== RECONHECIMENTO DE VOZ =====
let recognitionProf = null;
let isRecordingProf = false;

window.toggleVoiceProf = function() {
    const btn   = document.getElementById('btn-voice-prof');
    const input = document.getElementById('user-input-prof');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Seu navegador não suporta reconhecimento de voz. Tente o Chrome.');
        return;
    }

    if (isRecordingProf) {
        recognitionProf?.stop();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionProf = new SpeechRecognition();
    recognitionProf.lang = 'pt-BR';
    recognitionProf.continuous = false;
    recognitionProf.interimResults = true;

    recognitionProf.onstart = () => {
        isRecordingProf = true;
        btn?.classList.add('recording');
        btn?.setAttribute('aria-label', 'Parar reconhecimento de voz');
        if (input) input.placeholder = '🎙️ Ouvindo você...';
    };

    recognitionProf.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        if (input) input.value = transcript;
    };

    recognitionProf.onend = () => {
        isRecordingProf = false;
        btn?.classList.remove('recording');
        btn?.setAttribute('aria-label', 'Ativar reconhecimento de voz');
        if (input) input.placeholder = 'Pergunte sobre estratégias pedagógicas, adaptações ou planos de aula...';
    };

    recognitionProf.onerror = () => {
        isRecordingProf = false;
        btn?.classList.remove('recording');
        btn?.setAttribute('aria-label', 'Ativar reconhecimento de voz');
        if (input) input.placeholder = 'Pergunte sobre estratégias pedagógicas, adaptações ou planos de aula...';
    };

    recognitionProf.start();
};

// ===== MODAL ATIVIDADES DE PESQUISA =====
window.abrirModalPesquisa = async function() {
    const modal = document.getElementById('modal-pesquisa');
    const resultado = document.getElementById('pesquisa-resultado');
    if (!modal || !resultado) return;

    // Apenas professores logados com escola cadastrada têm acesso
    const escolaProf = localStorage.getItem('professorEscola');
    if (!escolaProf) {
        alert("Conclua seu cadastro com o nome da escola antes de acessar esta funcionalidade.");
        return;
    }

    modal.style.display = 'flex';

    // Mostra loading
    resultado.innerHTML = `
        <div class="pesquisa-loading">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
            <span>Analisando as pesquisas da sua escola...</span>
        </div>
    `;

    try {
        // Coleta contexto dos alunos cadastrados pelo professor (apenas da mesma escola)
        const uid = localStorage.getItem('professorUID');
        const alunosDaEscola = [];

        if (uid && Object.keys(fichasAlunosCache).length > 0) {
            Object.values(fichasAlunosCache).forEach(ficha => {
                if (ficha.escola && ficha.escola.toLowerCase().includes(escolaProf.toLowerCase().substring(0, 8))) {
                    alunosDaEscola.push(`${ficha.nome || 'Aluno'} (${ficha.serie || '?'}, ${ficha.atipicidade || 'sem atipicidade'})`);
                }
            });
        }

        const contextoAlunos = alunosDaEscola.length > 0
            ? `Alunos cadastrados nessa escola: ${alunosDaEscola.join('; ')}.`
            : `Nenhum aluno cadastrado ainda. Use o perfil da escola para inferir o contexto.`;

        const areaProf = localStorage.getItem('professorArea') || 'não informada';
        const tipoEscola = localStorage.getItem('professorTipoEscola') || 'não informado';

        const prompt = `Você é um analista educacional especializado. Com base no perfil da escola abaixo, identifique os 3 temas/assuntos mais relevantes e prováveis para atividades de pesquisa dos alunos desta escola.

Escola: "${escolaProf}"
Tipo: ${tipoEscola}
Área do professor que consulta: ${areaProf}
${contextoAlunos}

Retorne APENAS um JSON válido no seguinte formato (sem markdown, sem texto extra, somente o JSON):
{
  "escola": "nome resumido da escola",
  "pesquisas": [
    { "rank": 1, "materia": "Nome da Disciplina", "assunto": "Descrição do tema de pesquisa em 2-3 frases, explicando por que é relevante para essa escola." },
    { "rank": 2, "materia": "Nome da Disciplina", "assunto": "Descrição do tema de pesquisa em 2-3 frases." },
    { "rank": 3, "materia": "Nome da Disciplina", "assunto": "Descrição do tema de pesquisa em 2-3 frases." }
  ]
}`;

        const response = await fetch(BACKEND_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "Você é um analista educacional. Responda SOMENTE com JSON válido, sem markdown, sem texto adicional." },
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) throw new Error("Erro de servidor");

        const data = await response.json();
        let rawText = data.text || "";

        // Remove possíveis blocos markdown caso o modelo os inclua
        rawText = rawText.replace(/```json|```/g, "").trim();

        const parsed = JSON.parse(rawText);
        const pesquisas = parsed.pesquisas || [];
        const nomeEscola = parsed.escola || escolaProf;

        const rankLabel = ["🥇 1º Mais Pesquisado", "🥈 2º Mais Pesquisado", "🥉 3º Mais Pesquisado"];

        resultado.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:12px; margin-top:4px;">
                ${pesquisas.map((p, i) => `
                    <div class="pesquisa-card">
                        <span class="pesquisa-card-rank">${rankLabel[i] || `#${p.rank}`}</span>
                        <span class="pesquisa-card-materia">${p.materia}</span>
                        <span class="pesquisa-card-assunto">${p.assunto}</span>
                    </div>
                `).join('')}
                <p class="pesquisa-escola-label">📍 Dados gerados para: ${nomeEscola}</p>
            </div>
        `;

    } catch (err) {
        console.error("Erro ao buscar pesquisas:", err);
        resultado.innerHTML = `
            <div class="pesquisa-erro">
                ⚠️ Não foi possível carregar as pesquisas agora. Verifique sua conexão e tente novamente.
            </div>
        `;
    }
};

window.fecharModalPesquisa = function() {
    const modal = document.getElementById('modal-pesquisa');
    if (modal) modal.style.display = 'none';
};