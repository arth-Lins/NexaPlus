import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// ===== MESMA CONFIG DO ALUNO (projeto que funciona) =====
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
const genAI = new GoogleGenerativeAI("AIzaSyBAsPpRe8gvEfNuzzBr27w78SafBdIVbs8");

// ===== ESTADO =====
let alunoAtivo = null;
let chatHistory = JSON.parse(localStorage.getItem('chatHistory_prof')) || [];
const savedNomeProf = localStorage.getItem('professorNome');

// ===== NAVEGAÇÃO (igual ao aluno) =====
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

// ===== ROTEAMENTO INICIAL =====
// Se já tem nome salvo, pula login e vai direto para os dados do aluno
if (savedNomeProf) {
    const welcomeEl = document.getElementById('welcome-professor-text');
    if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${savedNomeProf.split(' ')[0]}!`;
    nextStep(4);
}

// ===== CAPTURA REDIRECT (fallback caso popup seja bloqueado) =====
getRedirectResult(auth).then((result) => {
    const user = result?.user;
    if (!user) return;

    const nome = user.displayName || "Professor";
    localStorage.setItem('professorNome', nome);
    localStorage.setItem('userRole', 'professor');

    const welcomeEl = document.getElementById('welcome-professor-text');
    if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${nome.split(' ')[0]}!`;

    const temArea = localStorage.getItem('professorArea');
    nextStep(temArea ? 4 : 3);
}).catch(console.error);

// ===== LOGIN COM GOOGLE (mesmo padrão do aluno) =====
async function verificarPerfilAposLogin() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const nome = user.displayName || "Professor";

        localStorage.setItem('professorNome', nome);
        localStorage.setItem('userRole', 'professor');

        const welcomeEl = document.getElementById('welcome-professor-text');
        if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${nome.split(' ')[0]}!`;

        const temArea = localStorage.getItem('professorArea');
        nextStep(temArea ? 4 : 3);

    } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') return;

        // Erro COOP é só aviso — verifica se login funcionou mesmo assim
        const user = auth.currentUser;
        if (user) {
            const nome = user.displayName || "Professor";
            localStorage.setItem('professorNome', nome);
            localStorage.setItem('userRole', 'professor');

            const welcomeEl = document.getElementById('welcome-professor-text');
            if (welcomeEl) welcomeEl.innerText = `Bem-vindo(a), Prof. ${nome.split(' ')[0]}!`;

            const temArea = localStorage.getItem('professorArea');
            nextStep(temArea ? 4 : 3);
            return;
        }

        console.error("Erro no login:", err);
        alert("Erro ao conectar com o Google. Tente novamente.");
    }
}
// ===== FINALIZAR CADASTRO DO ALUNO =====

// ===== ENVIAR MENSAGEM =====

// ===== PROMPT DO PROFESSOR =====

// ===== UTILITÁRIOS =====

// ===== EXPOSIÇÃO GLOBAL =====

// ===== ENTER NO INPUT + INIT =====

// ===== VOZ - PROFESSOR =====
let recognitionProf = null;
let isRecordingProf = false;

window.toggleVoiceProf = function() {
    const btn = document.getElementById('btn-voice-prof');
    const input = document.getElementById('user-input');

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