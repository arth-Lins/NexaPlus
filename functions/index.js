const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Nota: Em produção, mude o cors para permitir apenas o seu domínio do Firebase Hosting
const cors = require("cors")({ origin: true });

// Deixe sua chave guardada com segurança aqui no ambiente de servidor
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

exports.tutorIA = onRequest((req, res) => {
  // Trata a permissão de CORS para o seu próprio Front-end conseguir acessar
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    try {
      const { messages, model } = req.body;

      // O servidor faz a chamada direta pro Groq (Sem barreiras de CORS aqui)
      const groqResponse = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: model || "llama-3.1-8b-instant",
          messages: messages,
          temperature: 0.7
        })
      });

      if (!groqResponse.ok) {
        const erroTexto = await groqResponse.text();
        throw new Error(`Erro no Groq: ${groqResponse.status} - ${erroTexto}`);
      }

      const data = await groqResponse.json();
      
      // Devolve apenas a resposta do texto para o seu Front-end
      return res.status(200).json({
        text: data.choices[0].message.content
      });

    } catch (error) {
      logger.error("Erro na Function TutorIA:", error);
      return res.status(500).json({ error: "Erro interno no servidor de IA" });
    }
  });
});