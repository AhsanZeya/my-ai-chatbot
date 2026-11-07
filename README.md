# ChatGPT Clone (Free GitHub Pages AI Chatbot)

A modern, fast, ChatGPT-like AI chatbot web application that can be hosted **100% free on GitHub Pages** with zero backend servers required.

## ✨ Features

- **ChatGPT UI**: Sleek dark and light mode, collapsible sidebar, auto-resizing input box.
- **Full Chat History**: Automatically saved in your browser's `localStorage`—persists across refreshes, closing tabs, and device restarts.
- **Export & Import**: Download your entire chat history as `.json` or restore past chats anytime.
- **Markdown & Code Highlighting**: Renders markdown tables, bullet points, and code blocks with syntax highlighting and a 1-click **"Copy Code"** button.
- **Free AI Models**:
  - **Google Gemini 2.0 / 1.5 Flash**: Completely free API with real-time streaming answers.
  - **OpenAI**: Supports GPT-4o, GPT-4o-mini.
  - **OpenRouter**: Access dozens of free and open-source models.
  - **Demo Mode**: Test the interface right away without needing an API key.
- **100% Private**: Your API keys and chat data are stored strictly on your own device and are never sent to any external tracking server or committed to GitHub.

---

## 🚀 How to Host for Free on GitHub Pages (in 2 Minutes)

### Step 1: Create a GitHub Repository
1. Go to [GitHub.com](https://github.com/) and click **New Repository**.
2. Name it (for example: `my-ai-chat`).
3. Make it **Public** and click **Create repository**.

### Step 2: Upload Files
Upload the three files in this folder to your repository:
- `index.html`
- `style.css`
- `app.js`

*(Or if you use Git in your terminal)*:
```bash
git init
git add .
git commit -m "Initial commit: ChatGPT clone"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/my-ai-chat.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. In your GitHub repository, click on **Settings** (gear icon at top).
2. On the left sidebar, click **Pages**.
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
4. Click **Save**.
5. Wait 30–60 seconds. GitHub will give you a live link:
   `https://<YOUR-USERNAME>.github.io/my-ai-chat/`

---

## 🔑 How to Get a 100% Free Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API key"**.
4. Open your hosted website, click **Settings (API Key)**, and paste it.
5. Start chatting!

