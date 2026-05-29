# NexaPlus

## Ensino para Cada Mente: Inclusão, Tecnologia e Aprendizagem no Ensino Médio

![NexaPlus Logo](public/infinity.png)

A NexaPlus é uma plataforma educacional inovadora e inclusiva, projetada para conectar professores e alunos — tanto neurotípicos quanto neurodivergentes — em um ambiente virtual adaptativo. Nosso objetivo é personalizar o processo de ensino-aprendizagem, utilizando inteligência artificial para adaptar conteúdos, estratégias pedagógicas e recursos educacionais às necessidades individuais de cada estudante do ensino médio.

## Visão Geral

### Por que o NexaPlus existe?

A plataforma NexaPlus nasceu da percepção de que a inclusão educacional no ensino médio ainda enfrenta desafios significativos, especialmente na personalização da aprendizagem e no acompanhamento pedagógico de alunos com diferentes perfis. Desenvolvemos uma solução que oferece organização acadêmica, acessibilidade e apoio contínuo, com uma abordagem moderna e empática, adequada à realidade dos adolescentes.

### Nossos Valores

-   **Inclusão Real:** Celebramos a diversidade e construímos para ela, garantindo que todos os alunos se sintam pertencentes e capazes.
-   **Empatia Ativa:** Colocamos as necessidades de alunos, famílias e professores no centro de nossas decisões.
-   **Crescimento Contínuo:** Acreditamos na evolução constante, aprendendo com nossa comunidade para aprimorar a plataforma.
-   **Acesso Livre:** Oferecemos recursos inclusivos de qualidade, removendo barreiras para o aprendizado.

## Funcionalidades Principais

A NexaPlus oferece um conjunto robusto de funcionalidades, divididas entre perfis de professor e aluno, além de recursos de apoio à aprendizagem e acessibilidade:

### Para Professores

-   **Autenticação Segura:** Login via Google para acesso facilitado.
-   **Gerenciamento de Alunos:** Criação e acompanhamento de fichas sensíveis de alunos, armazenadas de forma segura no Firestore.
-   **Multichat com IA:** Interação direta com a inteligência artificial (`tutorIA` Cloud Function) para obter suporte pedagógico e adaptar estratégias.
-   **Acompanhamento Personalizado:** Visão detalhada do progresso e das necessidades de cada aluno.
-   **Recursos de Voz:** Possível integração de funcionalidades de voz para facilitar a comunicação e o ensino.

### Para Alunos

-   **Onboarding e Perfil Personalizável:** Processo inicial guiado para configurar o perfil do aluno (nome, série, escola, tipo de neurodivergência).
-   **IA Adaptativa:** Interação com a inteligência artificial que ajusta o `systemPrompt` com base no perfil do estudante, oferecendo respostas e conteúdos personalizados.
-   **Reconhecimento de Voz:** Utilização da Web Speech API para uma interação mais natural e acessível.
-   **Histórico de Conversas:** Manutenção de um histórico multichat para revisão e continuidade do aprendizado.

### Oficinas Inclusivas

Uma vasta biblioteca de atividades interativas e lúdicas, projetadas para diferentes estilos de aprendizagem e necessidades, incluindo:

-   Experiências sensoriais e visuais
-   Comunicação alternativa (ex: prancha AAC)
-   Jogos educativos (ex: jogo de ordenação, memória, boliche)
-   Atividades motoras
-   Recursos de Braille e Libras
-   Ferramentas de escrita guiada

### Na Minha Forma de Aprender

Página dedicada a organizar conteúdos por perfis de aprendizagem (visual, auditivo, cinestésico e textual), com painéis didáticos, estratégias explicativas e sandboxes interativos para explorar conceitos de forma prática.

### Acessibilidade

Integração com ferramentas como VLibras e UserWay para garantir que a plataforma seja acessível a todos os usuários, promovendo a inclusão digital.

## Tecnologias Utilizadas

-   **Frontend:** HTML5, CSS3 (com estilos customizados inspirados em Tailwind CSS), JavaScript.
-   **Backend:** Google Firebase (Cloud Functions, Firestore, Authentication).
-   **Linguagem de Programação (Backend):** Node.js (v24).
-   **Bibliotecas/Ferramentas:** `cors`, `eslint`, Google Fonts (Sora, DM Sans, Baloo 2), Web Speech API.

## Estrutura do Projeto

O repositório NexaPlus está organizado da seguinte forma:

```
NexaPlus/
├── README.md
├── firebase.json
├── functions/             # Cloud Functions para o backend
│   ├── index.js           # Lógica principal das funções (ex: tutorIA)
│   ├── package.json       # Dependências do backend
│   └── package-lock.json
└── public/                # Arquivos estáticos do frontend
    ├── index.html         # Página inicial
    ├── aluno.html         # Interface do aluno
    ├── aluno.js           # Lógica JavaScript do aluno
    ├── professor.html     # Interface do professor
    ├── professor.js       # Lógica JavaScript do professor
    ├── oficinas.html      # Página de oficinas inclusivas
    ├── aprender.html      # Página 'Na Minha Forma de Aprender'
    ├── saibamais.html     # Página 'Saiba Mais' (institucional)
    ├── 404.html           # Página de erro 404
    └── assets/            # Imagens e outros recursos (ex: infinity.png, tutuh.png, etc.)
```

## Como Contribuir

Detalhes sobre como contribuir com o projeto serão adicionados em breve. Fique atento às diretrizes para submissão de código, relatórios de bugs e sugestões de melhoria.

## Instalação e Execução Local

Para configurar e executar o projeto NexaPlus localmente, siga os passos abaixo:

1.  **Pré-requisitos:**
    -   Node.js (versão 24 ou superior)
    -   Firebase CLI (instale com `npm install -g firebase-tools`)

2.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/arth-Lins/NexaPlus.git
    cd NexaPlus
    ```

3.  **Instalar dependências do backend:**
    ```bash
    cd functions
    npm install
    cd ..
    ```

4.  **Configurar Firebase:**
    -   Certifique-se de ter um projeto Firebase configurado. Se não tiver, crie um em [Firebase Console](https://console.firebase.google.com/).
    -   Faça login no Firebase CLI:
        ```bash
        firebase login
        ```
    -   Associe o projeto local ao seu projeto Firebase:
        ```bash
        firebase use --add
        ```
        Selecione o projeto Firebase que você criou.

5.  **Executar localmente (com emuladores):**
    ```bash
    firebase emulators:start
    ```
    Isso iniciará os emuladores do Firebase (Auth, Firestore, Functions, Hosting) e servirá o frontend localmente. O acesso será geralmente em `http://localhost:5000` (ou outra porta indicada pelo CLI).

## Equipe

O projeto NexaPlus foi desenvolvido por uma equipe dedicada:

-   **Arthur Lins:** Líder
-   **Isabella Antonelle:** Designer
-   **Maria Lauria:** Sub-líder
-   **Emilly Suel:** Designer
-   **Victor Moraes:** Pesquisador
-   **Helio Campos:** Professor Orientador

## Licença

Este projeto está licenciado sob a licença [MIT](LICENSE). Mais detalhes serão fornecidos no arquivo `LICENSE`.

---

**Desenvolvido com ❤️ por Manus AI**
