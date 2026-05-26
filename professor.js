import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ===== CONFIGURAÇÃO DO FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyD1bH3bgVXww_prqfr1-TF4rbCl4Aag2C0",
    authDomain: "eduadapt-12a2e.firebaseapp.com",
    projectId: "eduadapt-12a2e",
    storageBucket: "eduadapt-12a2e.firebasestorage.app",
    messagingSenderId: "138838747156",
    appId: "1:138838747156:web:f6dc19e1308cc3c9b19f01"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const BACKEND_FUNCTION_URL = "http://127.0.0.1:5001/eduadapt-12a2e/us-central1/tutorIA";

// ===== ESTADO GLOBAL MULTI-CHAT =====
let listaConversasProf = JSON.parse(localStorage.getItem('listaConversas_prof')) || [];
let chatIdAtivoProf = localStorage.getItem('chatIdAtivo_prof') || null;

const savedNomeProf = localStorage.getItem('professorNome');
const savedAreaProf = localStorage.getItem('professorArea');

// ===== NAVEGAÇÃO ENTRE PASSO A PASSO =====
function nextStep(num) {
    document.querySelectorAll('.step').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    const target = document.getElementById('step-' + num);
    if (!target) return;
    target.style.display = 'flex';
    target.classList.add('active');
}

// ===== VERIFICAÇÃO DE ROTEAMENTO INICIAL =====
if (savedNomeProf && savedAreaProf) {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dashboard-professor').style.display = 'flex';
    inicializarHistoricoChatsProf();
} else if (savedNomeProf) {
    const welcomeEl = document.getElementById('welcome-professor-text');
    if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${savedNomeProf.split(' ')[0]}!`;
    nextStep(3);
}

// ===== CAPTURA RETORNO DO REDIRECT =====
getRedirectResult(auth).then((result) => {
    const user = result?.user;
    if (!user) return;
    tratarLoginSucessoProf(user);
}).catch(console.error);

// ===== LOGIN POR POPUP (GOOGLE) =====
async function verificarPerfilAposLogin() {
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

function tratarLoginSucessoProf(user) {
    const nome = user.displayName || "Professor";
    localStorage.setItem('professorNome', nome);
    localStorage.setItem('userRole', 'professor');

    if (localStorage.getItem('professorArea')) {
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('dashboard-professor').style.display = 'flex';
        inicializarHistoricoChatsProf();
    } else {
        const welcomeEl = document.getElementById('welcome-professor-text');
        if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${nome.split(' ')[0]}!`;
        const nomeInput = document.getElementById('nome-prof');
        if (nomeInput && !nomeInput.value) nomeInput.value = nome;
        nextStep(3);
    }
}

// ===== CONCLUIR CADASTRO DO PROFESSOR =====
function finalizarCadastro() {
    const nomeInput = document.getElementById('nome-prof')?.value.trim();
    const areaInput = document.getElementById('area-ensino')?.value.trim();
    const tipoEscolaInput = document.getElementById('tipo-escola')?.value.trim();
    const nomeEscolaInput = document.getElementById('nome-escola')?.value.trim();

    if (!areaInput) {
        alert("Por favor, informe a sua área de ensino.");
        return;
    }

    if (nomeInput) localStorage.setItem('professorNome', nomeInput);
    localStorage.setItem('professorArea', areaInput);
    localStorage.setItem('professorTipoEscola', tipoEscolaInput);
    localStorage.setItem('professorEscola', nomeEscolaInput);

    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dashboard-professor').style.display = 'flex';

    inicializarHistoricoChatsProf();
}

// ===== LOGICA MULTI-CHAT (IGUAL DO ALUNO) =====

function inicializarHistoricoChatsProf() {
    if (listaConversasProf.length === 0) {
        criarNovaConversaProf();
    } else {
        if (!chatIdAtivoProf || !listaConversasProf.find(c => c.id === chatIdAtivoProf)) {
            chatIdAtivoProf = listaConversasProf[0].id;
            localStorage.setItem('chatIdAtivo_prof', chatIdAtivoProf);
        }
        renderizarListaLateralProf();
        carregarMensagensChatAtivoProf();
    }
}

function criarNovaConversaProf() {
    const novoId = 'chat_prof_' + Date.now();
    const novaConversa = {
        id: novoId,
        titulo: "Atendimento Pedagógico",
        messages: []
    };

    listaConversasProf.unshift(novaConversa);
    chatIdAtivoProf = novoId;

    localStorage.setItem('listaConversas_prof', JSON.stringify(listaConversasProf));
    localStorage.setItem('chatIdAtivo_prof', chatIdAtivoProf);

    renderizarListaLateralProf();
    carregarMensagensChatAtivoProf();
}

function alternarParaChatProf(id) {
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
        item.onclick = () => alternarParaChatProf(chat.id);

        item.innerHTML = `
            <span class="history-item-icon">📋</span>
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

    if (!chatAtual || chatAtual.messages.length === 0) {
        chatWindow.innerHTML = `
            <div class="empty-state" id="empty-state-prof">
                <div class="empty-icon">💡</div>
                <p>Olá, Professor(a)! Estou pronto para ajudar no seu planejamento.<br>Informe o caso do seu aluno para gerarmos estratégias adaptadas.</p>
            </div>
        `;
        return;
    }

    chatAtual.messages.forEach(msg => {
        appendMsgProf(msg.role === 'model' ? 'bot' : 'user', msg.content);
    });
}

// ===== ENVIAR MENSAGEM NO CHAT =====
async function sendMessageProf() {
    const input = document.getElementById('user-input-prof');
    const chatWindow = document.getElementById('chat-window-prof');
    const msgText = input?.value?.trim();
    if (!msgText || !chatWindow) return;

    input.value = '';

    const emptyState = document.getElementById('empty-state-prof');
    if (emptyState) emptyState.remove();

    appendMsgProf('user', msgText);

    // Grava no estado local da conversa ativa
    const chatAtual = listaConversasProf.find(c => c.id === chatIdAtivoProf);
    if (chatAtual) {
        chatAtual.messages.push({ role: "user", content: msgText });
        if (chatAtual.titulo === "Atendimento Pedagógico") {
            chatAtual.titulo = msgText.length > 22 ? msgText.substring(0, 20) + "..." : msgText;
            renderizarListaLateralProf();
        }
        localStorage.setItem('listaConversas_prof', JSON.stringify(listaConversasProf));
    }

    const typingId = 'typing_' + Date.now();
    chatWindow.innerHTML += `<div id="${typingId}" class="typing-indicator"><span></span><span></span><span></span></div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        const area = localStorage.getItem('professorArea') || 'geral';
        const school = localStorage.getItem('professorEscola') || 'não informada';

        const systemPrompt = `Você é um assistente pedagógico de IA especialista em inclusão e neurodiversidade. Você está auxiliando um professor da área de ${area} da escola ${school}.

DIRETRIZES DE ATUAÇÃO:
1. Ofereça sugestões práticas de adaptações curriculares, planos de aula focados e avaliações flexibilizadas baseadas no caso trazido.
2. Sempre use uma abordagem acolhedora e baseada em evidências científicas na educação inclusiva (como Desenho Universal para a Aprendizagem - DUA, TEACCH, ABA, etc.).
3. Formate suas respostas de forma limpa, objetiva e estruturada em tópicos legíveis para otimizar o tempo do professor.`;

        const mappedHistory = chatAtual.messages.slice(0, -1).map(item => ({
            role: item.role === 'model' ? 'assistant' : 'user',
            content: item.content
        }));

        const response = await fetch(BACKEND_FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...mappedHistory,
                    { role: "user", content: msgText }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        const resposta = data.text;

        document.getElementById(typingId)?.remove();
        appendMsgProf('bot', resposta);

        if (chatAtual) {
            chatAtual.messages.push({ role: "model", content: resposta });
            localStorage.setItem('listaConversas_prof', JSON.stringify(listaConversasProf));
        }

    } catch (e) {
        document.getElementById(typingId)?.remove();
        appendMsgProf('bot', '⚠️ Erro ao processar resposta com o servidor pedagógico. Tente novamente.');
        console.error(e);
    }
}

function appendMsgProf(role, text) {
    const chat = document.getElementById('chat-window-prof');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerText = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// ===== FUNCIONALIDADE DE VOZ =====
let recognitionProf = null;
let isRecordingProf = false;

window.toggleVoiceProf = function() {
    const btn = document.getElementById('btn-voice-prof');
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
        if (input) input.placeholder = '🎙️ Ouvindo...';
    };

    recognitionProf.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        if (input) input.value = transcript;
    };

    recognitionProf.onend = () => {
        isRecordingProf = false;
        btn?.classList.remove('recording');
        if (input) input.placeholder = 'Pergunte sobre estratégias pedagógicas...';
    };

    recognitionProf.onerror = () => {
        isRecordingProf = false;
        btn?.classList.remove('recording');
        if (input) input.placeholder = 'Pergunte sobre estratégias pedagógicas...';
    };

    recognitionProf.start();
};

// Exportando funções para o escopo global (cliques inline do HTML)
window.nextStep = nextStep;
window.verificarPerfilAposLogin = verificarPerfilAposLogin;
window.finalizarCadastro = finalizarCadastro;
window.sendMessageProf = sendMessageProf;
window.criarNovaConversaProf = criarNovaConversaProf;

// Evento de inicialização do teclado
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input-prof');
    if (input) input.addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessageProf();
    });

    if (!savedNomeProf) {
        const s1 = document.getElementById('step-1');
        if (s1) s1.style.display = 'flex';
    }
});

