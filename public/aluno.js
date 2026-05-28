import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ===== CONFIGURAÇÃO DO FIREBASE (ATUALIZADA) =====
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
const provider = new GoogleAuthProvider();

// URL Atualizada com o novo ID do projeto para testes locais
const BACKEND_FUNCTION_URL = "http://127.0.0.1:5001/nexaplus-1a781/us-central1/tutorIA";

// ===== ESTADO REESTRUTURADO =====
// ... (o restante do seu código aluno.js continua exatamente igual)

// ===== ESTADO REESTRUTURADO =====
let listaConversas = JSON.parse(localStorage.getItem('listaConversas_aluno')) || [];
let chatIdAtivo = localStorage.getItem('chatIdAtivo_aluno') || null;
let escolaPublicaSelecionada = ""; 

const savedPerfil = localStorage.getItem('perfilAluno');

// ===== NAVEGAÇÃO DO ONBOARDING =====
function nextStep(num) {
    document.querySelectorAll('.step').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    const target = document.getElementById('step-' + num);
    if (!target) return;
    target.style.display = 'flex';
    target.classList.add('active');
    
    if(num === 3) {
        validarFormularioAluno();
    }
}

// ===== ROTEAMENTO INICIAL =====
if (savedPerfil) {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dashboard-aluno').style.display = 'flex';
    inicializarHistoricoChats();
} else {
    const savedNome = localStorage.getItem('alunoNomeProvisorio');
    if (savedNome) {
        const welcomeEl = document.getElementById('welcome-text');
        if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), ${savedNome.split(' ')[0]}!`;
        nextStep(3);
    }
}

getRedirectResult(auth).then((result) => {
    const user = result?.user;
    if (!user) return;
    tratarLoginSucesso(user);
}).catch(console.error);

async function verificarPerfilAposLogin() {
    try {
        const result = await signInWithPopup(auth, provider);
        if (result?.user) tratarLoginSucesso(result.user);
    } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') return;
        const user = auth.currentUser;
        if (user) {
            tratarLoginSucesso(user);
            return;
        }
        alert("Erro ao conectar com o Google. Tente novamente.");
    }
}

function tratarLoginSucesso(user) {
    const nome = user.displayName || "Estudante";
    localStorage.setItem('alunoNomeProvisorio', nome);
    localStorage.setItem('userRole', 'aluno');

    if (localStorage.getItem('perfilAluno')) {
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('dashboard-aluno').style.display = 'flex';
        inicializarHistoricoChats();
    } else {
        const welcomeEl = document.getElementById('welcome-text');
        if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), ${nome.split(' ')[0]}!`;
        const nomeInput = document.getElementById('nome-aluno');
        if (nomeInput && !nomeInput.value) nomeInput.value = nome;
        nextStep(3);
    }
}

// ===== SISTEMA DE VALIDAÇÃO ESTREITA (TRAVA DO BOTÃO) =====
window.selecionarTipoEscolaAluno = function(opcao) {
    escolaPublicaSelecionada = opcao;
    const btnSim = document.getElementById('btn-escola-sim');
    const btnNao = document.getElementById('btn-escola-nao');

    if (opcao === 'Sim') {
        btnSim.classList.add('selected');
        btnNao.classList.remove('selected');
    } else {
        btnNao.classList.add('selected');
        btnSim.classList.remove('selected');
    }
    validarFormularioAluno();
}

function validarFormularioAluno() {
    const nome = document.getElementById('nome-aluno')?.value.trim();
    const serie = document.getElementById('serie-aluno')?.value;
    const escola = document.getElementById('escola-aluno')?.value.trim();
    const neuro = document.getElementById('neuro-aluno')?.value.trim();
    const btnConcluir = document.getElementById('btn-concluir-aluno');

    // Todos os 5 campos precisam ter conteúdo para liberar a progressão
    if (nome && serie && escola && neuro && escolaPublicaSelecionada !== "") {
        btnConcluir.removeAttribute('disabled');
    } else {
        btnConcluir.setAttribute('disabled', 'true');
    }
}

function finalizarCadastroAluno() {
    const nome = document.getElementById('nome-aluno')?.value.trim();
    const serie = document.getElementById('serie-aluno')?.value;
    const escola = document.getElementById('escola-aluno')?.value.trim();
    const neuro = document.getElementById('neuro-aluno')?.value.trim();

    if (!nome || !serie || !escola || !neuro || escolaPublicaSelecionada === "") {
        alert("Por favor, preencha todos os campos obrigatórios antes de prosseguir.");
        return;
    }

    const perfil = { 
        nome, 
        serie, 
        escola, 
        escolaPublica: escolaPublicaSelecionada, 
        neuro 
    };
    
    localStorage.setItem('perfilAluno', JSON.stringify(perfil));

    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dashboard-aluno').style.display = 'flex';
    
    inicializarHistoricoChats();
}

// ===== SISTEMA MULTI-CHAT =====

function inicializarHistoricoChats() {
    if (listaConversas.length === 0) {
        criarNovaConversa();
    } else {
        if (!chatIdAtivo || !listaConversas.find(c => c.id === chatIdAtivo)) {
            chatIdAtivo = listaConversas[0].id;
            localStorage.setItem('chatIdAtivo_aluno', chatIdAtivo);
        }
        renderizarListaLateral();
        carregarMensagensChatAtivo();
    }
}

function criarNovaConversa() {
    const novoId = 'chat_' + Date.now();
    const novaConversa = {
        id: novoId,
        titulo: "Nova conversa",
        messages: []
    };
    
    listaConversas.unshift(novaConversa);
    chatIdAtivo = novoId;
    
    localStorage.setItem('listaConversas_aluno', JSON.stringify(listaConversas));
    localStorage.setItem('chatIdAtivo_aluno', chatIdAtivo);
    
    renderizarListaLateral();
    carregarMensagensChatAtivo();
}

function alternarParaChat(id) {
    chatIdAtivo = id;
    localStorage.setItem('chatIdAtivo_aluno', chatIdAtivo);
    renderizarListaLateral();
    carregarMensagensChatAtivo();
}

function renderizarListaLateral() {
    const listContainer = document.getElementById('history-list-aluno');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    listaConversas.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === chatIdAtivo ? 'active' : ''}`;
        item.onclick = () => alternarParaChat(chat.id);
        
        item.innerHTML = `
            <span class="history-item-icon">💬</span>
            <span class="sidebar-text">${chat.titulo}</span>
        `;
        listContainer.appendChild(item);
    });
}

function carregarMensagensChatAtivo() {
    const chatWindow = document.getElementById('chat-window-aluno');
    if (!chatWindow) return;
    
    chatWindow.innerHTML = '';
    const chatAtual = listaConversas.find(c => c.id === chatIdAtivo);
    
    if (!chatAtual || chatAtual.messages.length === 0) {
        chatWindow.innerHTML = `
            <div class="empty-state" id="empty-state-aluno">
                <div class="empty-icon">✨</div>
                <p>Oi! Estou pronto(a) para te ajudar a aprender hoje.<br>O que vamos estudar agora?</p>
            </div>
        `;
        return;
    }
    
    chatAtual.messages.forEach(msg => {
        appendMsgAluno(msg.role === 'model' ? 'bot' : 'user', msg.content);
    });
}

// ===== ENVIO DE MENSAGENS E CONTEXTO À IA =====
async function sendMessageAluno() {
    const input = document.getElementById('user-input-aluno');
    const chatWindow = document.getElementById('chat-window-aluno');
    const msgText = input?.value?.trim();
    
    if (!msgText || !chatWindow) return;

    input.value = '';
    
    const emptyState = document.getElementById('empty-state-aluno');
    if (emptyState) emptyState.remove();

    appendMsgAluno('user', msgText);

    const chatAtual = listaConversas.find(c => c.id === chatIdAtivo);
    if (chatAtual) {
        chatAtual.messages.push({ role: "user", content: msgText });
        if (chatAtual.titulo === "Nova conversa") {
            chatAtual.titulo = msgText.length > 22 ? msgText.substring(0, 20) + "..." : msgText;
            renderizarListaLateral();
        }
        localStorage.setItem('listaConversas_aluno', JSON.stringify(listaConversas));
    }

    const typingId = 'typing_' + Date.now();
    chatWindow.innerHTML += `<div id="${typingId}" class="typing-indicator"><span></span><span></span><span></span></div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        const perfilObj = JSON.parse(localStorage.getItem('perfilAluno')) || {};
        const systemPrompt = `Você é um tutor de estudos de IA focado em acessibilidade pedagógica para o estudante ${perfilObj.nome || 'Estudante'}.
Série do Aluno: ${perfilObj.serie || 'Não especificada'}.
Escola: ${perfilObj.escola || 'Não especificada'} (Escola Pública: ${perfilObj.escolaPublica || 'Não informada'}).
Neurodivergência/Condição informada: ${perfilObj.neuro || 'Nenhuma'}.

Instruções fundamentais de resposta:
1. Adeque estritamente seu vocabulário e profundidade de conteúdo à série/idade do aluno (${perfilObj.serie}).
2. Divida explicações complexas em tópicos fáceis e estruturados.
3. Se o aluno tiver condições específicas (como TDAH, Autismo ou Dislexia), use mensagens diretas, evite blocos gigantescos de texto e use negritos estrategicamente para prender a atenção.
4. Seja sempre encorajador, paciente e positivo.`;

        const mappedHistory = chatAtual.messages.slice(0, -1).map(item => ({
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

        if (!response.ok) throw new Error("Erro de conexão com o servidor.");

        const data = await response.json();
        const apiResponse = data.text;

        document.getElementById(typingId)?.remove();
        appendMsgAluno('bot', apiResponse);

        if (chatAtual) {
            chatAtual.messages.push({ role: "model", content: apiResponse });
            localStorage.setItem('listaConversas_aluno', JSON.stringify(listaConversas));
        }

    } catch (err) {
        document.getElementById(typingId)?.remove();
        appendMsgAluno('bot', "⚠️ Não consegui responder agora. Verifique sua conexão e tente novamente.");
        console.error(err);
    }
}

function appendMsgAluno(role, text) {
    const chatWindow = document.getElementById('chat-window-aluno');
    if (!chatWindow) return;
    
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.innerText = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ===== RECONHECIMENTO DE VOZ =====
let recognitionAluno = null;
let isRecordingAluno = false;

window.toggleVoiceAluno = function() {
    const btn = document.getElementById('btn-voice-aluno');
    const input = document.getElementById('user-input-aluno');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Seu navegador não suporta reconhecimento de voz. Tente o Chrome.');
        return;
    }

    if (isRecordingAluno) {
        recognitionAluno?.stop();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionAluno = new SpeechRecognition();
    recognitionAluno.lang = 'pt-BR';
    recognitionAluno.continuous = false;
    recognitionAluno.interimResults = true;

    recognitionAluno.onstart = () => {
        isRecordingAluno = true;
        btn?.classList.add('recording');
        if (input) input.placeholder = '🎙️ Ouvindo você...';
    };

    recognitionAluno.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        if (input) input.value = transcript;
    };

    recognitionAluno.onend = () => {
        isRecordingAluno = false;
        btn?.classList.remove('recording');
        if (input) input.placeholder = 'Pergunte qualquer coisa sobre os seus estudos...';
    };

    recognitionAluno.onerror = () => {
        isRecordingAluno = false;
        btn?.classList.remove('recording');
        if (input) input.placeholder = 'Pergunte qualquer coisa sobre os seus estudos...';
    };

    recognitionAluno.start();
};

// Vinculações ao escopo global
window.nextStep = nextStep;
window.verificarPerfilAposLogin = verificarPerfilAposLogin;
window.finalizarCadastroAluno = finalizarCadastroAluno;
window.sendMessageAluno = sendMessageAluno;
window.criarNovaConversa = criarNovaConversa;

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input-aluno');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessageAluno();
        });
    }

    // Monitora as entradas para validação em tempo real
    const campos = ['nome-aluno', 'serie-aluno', 'escola-aluno', 'neuro-aluno'];
    campos.forEach(id => {
        document.getElementById(id)?.addEventListener('input', validarFormularioAluno);
        document.getElementById(id)?.addEventListener('change', validarFormularioAluno);
    });
    
    if (!savedPerfil && !localStorage.getItem('alunoNomeProvisorio')) {
        const s1 = document.getElementById('step-1');
        if (s1) s1.style.display = 'flex';
    }
});