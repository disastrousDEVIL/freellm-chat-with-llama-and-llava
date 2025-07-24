Sure! Here's **everything bundled into one complete `README.md`** in a single markdown block — ready to copy and paste into your GitHub root:

````markdown
# 🧠 FreeLLM Chat: LLaMA 3 + LLaVA Vision

A fully **local**, free-to-use chatbot that supports both **text and image-based queries**. Built with Flask, React, and powered by **LLaMA 3** and **LLaVA** via [Ollama](https://ollama.com/).

> 🆓 No OpenAI API keys. No internet needed after setup. Just pure LLM magic on your machine.

---

## ⚡ Features

- 💬 **Text chat** using LLaMA 3 (latest)
- 🖼️ **Image + prompt chat** using LLaVA (vision model)
- 🧠 **Smart model switch**:  
  → If user sends an image → uses **LLaVA**  
  → If only text → uses **LLaMA 3**
- 🔁 Maintains chat history during session
- 🌐 Frontend in **React**
- 🖥️ Backend in **Flask**
- 📦 Powered locally using **Ollama**

---

## 📦 Tech Stack

- **Frontend**: React + Axios
- **Backend**: Python + Flask
- **LLM Runtime**: Ollama (LLaMA 3 & LLaVA)
- **Vision Support**: LLaVA (image understanding)

---

## 🚀 Getting Started

### ✅ Prerequisites

- Python 3.9+
- Node.js and npm
- Ollama (download from [ollama.com](https://ollama.com/))

---

### 🔃 Pull Models with Ollama

```bash
ollama pull llama3
ollama pull llava
````

---

### 📁 Clone the Repo

```bash
git clone https://github.com/disastrousDEVIL/freellm-chat-with-llama-and-llava.git
cd freellm-chat-with-llama-and-llava
```

---

### 🧠 Start the Backend (Flask)

```bash
cd llama-chat-backend
python -m venv venv
venv\Scripts\activate     # On Windows
# OR
source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt
python app.py
```

Runs on: [http://localhost:5000](http://localhost:5000)

---

### 💻 Start the Frontend (React)

```bash
cd ../llama-chat-frontend
npm install
npm start
```

Runs on: [http://localhost:3000](http://localhost:3000)

---

## 🤖 Model Selection Logic

| User Input    | Model Used              |
| ------------- | ----------------------- |
| Text only     | LLaMA 3                 |
| Image + Text  | LLaVA                   |
| “Best” Option | Auto-detects best model |

---

## 🗂️ Folder Structure

```
freellm-chat-with-llama-and-llava/
├── llama-chat-backend/        # Flask API
│   ├── app.py
│   └── requirements.txt
│
├── llama-chat-frontend/       # React UI
│   ├── src/
│   ├── public/
│   └── README.md
│
├── .gitignore
├── README.md                  # ← You're here
└── LICENSE
```

---

## 📝 Notes

* ⚠️ If you see `llama-chat-frontend` being treated as a submodule, make sure to delete its `.git` folder and re-add it as a normal directory.
* 🧠 Chat history is retained in-session but resets on page reload.
* 🔧 Customize prompts or add role/system messages from the backend for smarter behavior.

---

## 🔐 License

Licensed under the [MIT License](LICENSE).

> You’re free to use, modify, and distribute — just include the original license & credits.

---

## 🙌 Credits

* [Meta AI](https://ai.meta.com/llama/) for LLaMA 3
* [LLaVA Vision Model](https://llava-vl.github.io/)
* [Ollama](https://ollama.com) for local model serving

---

### 🌟 Star the repo if this helped you go serverless with LLMs — no API bills ever again!

```

Let me know if you'd like badges, demo screenshots, or a video preview section added next!
```
