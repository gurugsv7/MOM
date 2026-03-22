# MOM - My Own Manager 🚀

MOM is a sovereign, high-security managerial intelligence designed to handle complex adaptive scheduling and encrypted secret storage within the **Obsidian Cipher** design system.

![MOM Banner](https://img.shields.io/badge/MOM-Mission_Complete-black?style=for-the-badge&logoColor=white&color=000)

## 🌟 Overview

MOM (My Own Manager) is a personal operating system for your professional and private life. It combines the power of AI-driven scheduling with bank-grade local encryption to ensure your data stays yours.

### Core Capabilities
- **Intelligence**: Neural Link interaction via Azure OpenAI (GPT-4o).
- **Vault**: Zero-exposure, client-side AES-256-GCM encrypted secret storage.
- **Adaptive Scheduling**: Intelligent task redistribution and mission roadmaps.
- **LTM Protocol**: Persistent long-term memory that adapts to your working habits.
- **Voice Interface**: Low-latency tactical voice commands and specialized synthesis.

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **AI**: [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Security**: SubtleCrypto (AES-256-GCM)

## 🔐 Security First

MOM follows a strict **"No-Secret-to-Server"** rule:
1. **Local Encryption**: All sensitive data (passwords, notes) is encrypted on your device *before* being sent to the database.
2. **Zero-AI Exposure**: The actual secret payloads are never sent to the AI servers; only metadata/hints are used for intent parsing.
3. **Auto-Purge**: Decrypted secrets in the UI feature a 30-second self-destruct timer, ensuring no persistent DOM leak of sensitive information.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project
- Azure OpenAI Instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gurugsv7/MOM.git
   cd MOM/mom-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📦 Deployment (Vercel)

This project is optimized for deployment on Vercel.

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add the environment variables from your `.env` file to the Vercel project settings.
4. Deployment command: `npm run build`, Output directory: `dist`.

---

### MISSION COMPLETE.
MOM is fully operational and awaiting your first directive, Operator.
