# Autonomous B2B Lead Generation & Enrichment Agent

An enterprise-grade, autonomous B2B lead generation, qualification, and CRM-ready pipeline powered by **FastAPI**, **LangChain**, **Groq (Llama-3.3-70b/Llama-3.1-8b)**, and a **React (Vite + Tailwind CSS)** frontend. 

The system automates web prospecting, company website analysis, Ideal Customer Profile (ICP) scoring, external CSV list enrichment, personalized multi-tone cold email sequencing, multi-CRM export formatting, and historical session management.

---

## 🚀 Key Features

* **Autonomous Web Prospecting & Scraping:** Dynamically searches and parses target industries and regions to build structured lead lists with robust timeout safeguards.
* **External CSV List Upload & Enrichment:** Upload any raw CSV list of companies to automatically score, enrich, and generate custom outreach hooks for external data.
* **AI-Powered ICP Qualification:** Automatically evaluates companies, assigns ICP fit scores out of 10, and generates professional qualification reasoning.
* **Multi-CRM Ready Data Export:** Instant one-click CSV exports formatted with pre-mapped headers for **HubSpot, Zoho CRM, Salesforce,** and generic pipelines to eliminate manual column mapping friction.
* **Customizable Cold Email Sequencer:** Generates multi-tone 3-step cold outreach sequences (*Professional & Consultative, Aggressive & Direct, Casual & Friendly, Executive & Formal*).
* **Live AI Hook Regeneration:** Instantly re-generates fresh, high-converting outreach angles for individual leads with built-in timeout safeguards.
* **Direct Mailto Client Integration:** Instantly launches your default mail client pre-populated with subject lines and tailored sequence bodies.
* **Persistent Search History & Database:** Built-in SQLite database backed by SQLAlchemy to store, view, reload, or delete past search sessions and leads.
* **Secure Authentication & Account Settings:** Full user registration, token-based authentication (OAuth2 / JWT), and an interactive account management modal to update profile details securely.
* **Advanced Management Toolkit:** Includes batch status tracking, multi-select bulk copy, and bulk deletion tools.

---

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, SQLAlchemy, SQLite, LangChain, Groq API, Uvicorn, Asyncio, Pydantic, Passlib (Bcrypt).
* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons.

---

## 📂 Project Architecture

```text
lead-gen-ai-agent/
├── backend/
│   ├── app/
│   │   ├── agent.py         # LangChain Groq agent orchestration & pipelines
│   │   ├── auth.py          # JWT token generation & password hashing
│   │   ├── database.py      # SQLite configuration and SQLAlchemy models
│   │   ├── main.py          # FastAPI application & API endpoints
│   │   └── schemas.py       # Pydantic data validation models
│   ├── leads.db             # Local SQLite database
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (Groq API keys)
└── frontend/
    ├── src/
    │   └── App.jsx          # Complete React dashboard interface & Auth flow
    ├── package.json         # Frontend packages & scripts
    └── vite.config.js       # Vite configuration
```
#Live System Deployments

Frontend Dashboard (Vercel): Access Live App

Backend API (Render): API Health Check

Developer Portfolio: Dagmawit Andargachew


    
