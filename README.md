# Autonomous B2B Lead Generation & Enrichment Agent

An enterprise-grade, autonomous B2B lead generation and qualification system powered by **FastAPI**, **LangChain**, **Groq (Llama-3.3-70b)**, and a **React (Vite + Tailwind CSS)** frontend. 

The system automates web prospecting, company website analysis, Ideal Customer Profile (ICP) scoring, personalized 3-step cold email sequencing, and historical session management.

---

## 🚀 Key Features

* **Autonomous Web Prospecting & Scraping:** Dynamically searches and parses target industries and regions to build structured lead lists.
* **AI-Powered ICP Qualification:** Automatically evaluates companies, assigns ICP fit scores out of 10, and generates professional qualification reasoning.
* **Customizable Cold Email Sequencer:** Generates multi-tone 3-step cold outreach sequences (*Professional & Consultative, Aggressive & Direct, Casual & Friendly, Executive & Formal*).
* **Live AI Hook Regeneration:** Instantly re-generates fresh, high-converting outreach angles for individual leads with built-in timeout safeguards.
* **Direct Mailto Client Integration:** Instantly launches your default mail client pre-populated with subject lines and tailored sequence bodies.
* **Persistent Search History & Database:** Built-in SQLite database backed by SQLAlchemy to store, view, reload, or delete past search sessions and leads.
* **Advanced Management Toolkit:** Includes batch status tracking, multi-select bulk copy, and CSV data exports.

---

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, SQLAlchemy, SQLite, LangChain, Groq API (`llama-3.3-70b-versatile`), Uvicorn, Asyncio.
* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons.

---

## 📂 Project Architecture

```text
lead-gen-ai-agent/
├── backend/
│   ├── app/
│   │   ├── agent.py         # LangChain Groq agent orchestration & pipelines
│   │   ├── database.py      # SQLite configuration and SQLAlchemy models
│   │   ├── main.py          # FastAPI application & API endpoints
│   │   └── schemas.py       # Pydantic data validation models
│   ├── leads.db             # Local SQLite database
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (Groq API keys)
└── frontend/
    ├── src/
    │   └── App.jsx          # Complete React dashboard interface
    ├── package.json         # Frontend packages & scripts
    └── vite.config.js       # Vite configuration
```
## Try this system @ lead-gen-ai-agent-two.vercel.app
