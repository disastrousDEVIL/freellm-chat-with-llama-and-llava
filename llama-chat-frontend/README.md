# 🖼️ Frontend – FreeLLM Chat

This is the **frontend** for [FreeLLM Chat](https://github.com/disastrousDEVIL/freellm-chat-with-llama-and-llava), a 100% free, local chatbot powered by **LLaMA** and **LLaVA** using **Ollama** and **Flask**.  
No API keys. No cloud. Just chat.

---

## 🚀 Features

- 🔥 Clean and minimal chat UI
- 🧠 Works with both LLaMA (text) and LLaVA (vision) models
- 📸 Image upload support (auto-routes to vision model)
- 🧾 Chat history maintained during session
- ⚛️ Built with React + Create React App

---

## 📦 Tech Stack

- React (with Create React App)
- HTML/CSS
- Axios (for API calls)
- Runs on `localhost:3000`

---

## 🛠️ Getting Started

Make sure the **backend (Flask + Ollama)** is running at `http://localhost:5000`.

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Available Scripts

These come from Create React App:

- `npm start` – Start local server
- `npm test` – Run tests
- `npm run build` – Production build
- `npm run eject` – Eject from CRA (not recommended)

---

## 📁 Folder Structure (example)

```
llama-chat-frontend/
│
├── public/
├── src/
│   ├── components/
│   ├── App.js
│   ├── index.js
│
├── .gitignore
├── package.json
├── README.md  ← You are here
```

---

## 📝 Notes

- The frontend assumes the backend is running on port `5000`.
- No authentication or database is required.
- Keep session short – chat history is in-memory only.

---

Made with 💻 for local LLM lovers.
