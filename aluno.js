import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithRedirect, getRedirectResult, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const firebaseConfig = {
    apiKey: "AIzaSyD1bH3bgVXww_prqfr1-TF4rbCl4Aag2C0",
    authDomain: "eduadapt-12a2e.firebaseapp.com",
    projectId: "eduadapt-12a2e",
    storageBucket: "eduadapt-12a2e.firebasestorage.app",
    messagingSenderId: "138838747156",
    appId: "1:138838747156:web:f6dc19e1308cc3c9b19f01",
    measurementId: "G-X7JK0TDZ6L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const genAI = new GoogleGenerativeAI("AIzaSyBAsPpRe8gvEfNuzzBr27w78SafBdIVbs8");

// ===== ESTADO =====
let perfilAluno = JSON.parse(localStorage.getItem('perfilAluno')) || null;
let chatHistory = JSON.parse(localStorage.getItem('chatHistory_aluno')) || [];

// ===== ROTEAMENTO INICIAL =====
const urlParams = new URLSearchParams(window.location.search);
const isDirect = urlParams.get('direct') === 'true';
const isSetup = urlParams.get('setup') === 'true';
const savedNome = localStorage.getItem('alunoNome');

// Verifica redirecionamento baseado nos parâmetros e sessão salva
if (isDirect && savedNome && perfilAluno) {
    // Sessão ativa + perfil completo: vai direto para o chat
    irParaChat(savedNome);
} else if (isSetup && savedNome && !perfilAluno) {
    // Veio do login.html após login, sem perfil: mostra formulário de perfil-
    const el = document.getElementById('welcome-aluno-text');
    if (el) el.innerText = `Olá, ${savedNome.split(' ')[0]}! Vamos te conhecer.`;
    nextStep(3);
} else if (savedNome && perfilAluno) {
    // Sessão salva normalmente (ex: botões "Sou Aluno" do index): vai para o chat
    irParaChat(savedNome);
}
// else: exibe o onboarding normal (steps 1, 2...)

// ===== RESULTADO DO REDIRECT (fluxo de primeiro acesso via professor.html) =====
getRedirectResult(auth).then((result) => {
    const user = result?.user;
    if (!user) return;

    const nome = user.displayName || "Estudante";
    localStorage.setItem('alunoNome', nome);
    localStorage.setItem('userRole', 'aluno');

    if (perfilAluno) {
        irParaChat(nome);
    } else {
        const el = document.getElementById('welcome-aluno-text');
        if (el) el.innerText = `Olá, ${nome.split(' ')[0]}! Vamos te conhecer.`;
        nextStep(3);
    }
}).catch(console.error);

// ===== ETAPAS =====
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

async function fazerLoginAluno() {
    try {
        // Tenta popup primeiro (mais fluido); fallback para redirect se bloquear
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const nome = user.displayName || "Estudante";

        localStorage.setItem('alunoNome', nome);
        localStorage.setItem('userRole', 'aluno');

        if (perfilAluno) {
            irParaChat(nome);
        } else {
            const el = document.getElementById('welcome-aluno-text');
            if (el) el.innerText = `Olá, ${nome.split(' ')[0]}! Vamos te conhecer.`;
            nextStep(3);
        }
    } catch (err) {
        // Fallback para redirect (mobile)
        await signInWithRedirect(auth, provider);
    }
}

function salvarPerfilAluno() {
    const nome = localStorage.getItem('alunoNome') || "Estudante";
    const serie = document.getElementById('aluno-serie')?.value?.trim() || "";
    const idade = document.getElementById('aluno-idade')?.value || "";
    const neuro = document.getElementById('aluno-neuro')?.value?.trim() || "";

    perfilAluno = { nome, serie, idade, neuro };
    localStorage.setItem('perfilAluno', JSON.stringify(perfilAluno));

    irParaChat(nome);
}
// ===== IR PARA O CHAT =====
function irParaChat(nome) {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('dashboard-aluno').style.display = 'flex';

    const nomeEl = document.getElementById('chat-aluno-name');
    if (nomeEl) nomeEl.innerText = `Tutor de ${nome.split(' ')[0]}`;

    const sidebarNome = document.getElementById('sidebar-nome-aluno');
    if (sidebarNome) sidebarNome.innerText = nome.split(' ')[0];

    const neuroTag = document.getElementById('aluno-neuro-tag');
    if (neuroTag && perfilAluno?.neuro) {
        neuroTag.innerText = perfilAluno.neuro;
        neuroTag.style.display = 'inline-block';
    }

    const chat = document.getElementById('chat-window-aluno');
    if (!chat) return;
    chat.innerHTML = '';

    if (chatHistory.length > 0) {
        chatHistory.forEach(m => {
            const role = m.role === 'user' ? 'user' : 'bot';
            appendMsg(role, m.parts[0].text);
        });
    } else {
        appendMsg('bot', `Oi, ${nome.split(' ')[0]}! 👋 Sou seu tutor pessoal. Estou aqui para te ajudar a entender qualquer assunto do jeito que funciona melhor pra você.\n\nO que você quer aprender hoje?`);
    }

    atualizarSidebar();
}

//===== PROMPT DO SISTEMA =====
function buildSystemPromptAluno() {
    const p = perfilAluno || {};
    return `Você é um tutor educacional gentil, paciente e criativo para o aluno ${p.nome || 'estudante'}.

PERFIL DO ALUNO:
- Nome: ${p.nome || 'não informado'}
- Série: ${p.serie || 'não informada'}
- Idade: ${p.idade || 'não informada'}
- Condição/Neurodivergência: ${p.neuro || 'não informada'}

DIRETRIZES:
1. Use linguagem simples, clara e amigável
2. Divida explicações em partes menores quando o assunto for complexo
3. Use exemplos do dia a dia, analogias e comparações visuais
4. Se o aluno tiver TDAH: seja direto, use listas curtas, evite textos longos
5. Se o aluno tiver TEA: seja literal e preciso, evite metáforas confusas
6. Se o aluno tiver dislexia: prefira bullet points e frases curtas
7. Sempre encoraje e elogie o esforço
8. Se o aluno errar: corrija gentilmente, sem julgamento
9. Ofereça exercícios práticos quando adequado
10. Termine respostas longas com um resumo curto`;
}

// ===== MENSAGEM =====
async function sendMessageAluno() {
    const input = document.getElementById('user-input-aluno');
    const chat = document.getElementById('chat-window-aluno');
    const msg = input?.value?.trim();
    if (!msg || !chat) return;

    input.value = '';
    appendMsg('user', msg);

    const typingId = 'typing_' + Date.now();
    chat.innerHTML += `<div id="${typingId}" class="typing-indicator"><span></span><span></span><span></span></div>`;
    chat.scrollTop = chat.scrollHeight;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const systemPrompt = buildSystemPromptAluno();

        const messages = [
            { role: "user", parts: [{ text: systemPrompt + "\n\nResponda a próxima mensagem como tutor." }] },
            { role: "model", parts: [{ text: "Entendido! Estou pronto para ser seu tutor. Pode perguntar!" }] },
            ...chatHistory,
            { role: "user", parts: [{ text: msg }] }
        ];

        const chatSession = model.startChat({ history: messages.slice(0, -1) });
        const result = await chatSession.sendMessage(msg);
        const resposta = result.response.text();

        chatHistory.push({ role: "user", parts: [{ text: msg }] });
        chatHistory.push({ role: "model", parts: [{ text: resposta }] });

        if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);
        localStorage.setItem('chatHistory_aluno', JSON.stringify(chatHistory));

        document.getElementById(typingId)?.remove();
        appendMsg('bot', resposta);
        atualizarSidebar();

    } catch (e) {
        document.getElementById(typingId)?.remove();
        appendMsg('bot', '⚠️ Erro de conexão. Tente novamente em instantes.');
        console.error(e);
    }
}

// ===== SIDEBAR =====

// ===== UTILITÁRIOS =====

// ===== EXPOSIÇÃO DE FUNÇÕES =====

// ===== VOZ - ALUNO =====
