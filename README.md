# Skylark Drones — Monday.com AI Business Intelligence Agent

An executive-level, AI-powered Business Intelligence platform designed for founders and executives to query live business performance across **Deals** and **Work Orders** boards in **monday.com**.

---

## 🌐 Live Hosted Prototype & Deployments

* **Live Backend API**: [https://business-intelligence-ai-agent-production.up.railway.app](https://business-intelligence-ai-agent-production.up.railway.app)
* **Interactive Swagger API Docs**: [https://business-intelligence-ai-agent-production.up.railway.app/docs](https://business-intelligence-ai-agent-production.up.railway.app/docs)
* **Live Health Check**: [https://business-intelligence-ai-agent-production.up.railway.app/health](https://business-intelligence-ai-agent-production.up.railway.app/health)
* **Frontend Repository**: [https://github.com/sowryabrahmandam-lab/Business-Intelligence-AI-Agent](https://github.com/sowryabrahmandam-lab/Business-Intelligence-AI-Agent)

---

## 1. Problem Statement & Architecture

Executive leadership needs instant, reliable answers to strategic questions such as:
- *"How is our pipeline looking this quarter?"*
- *"Which sector has the strongest revenue collection efficiency?"*
- *"What work orders are delayed and where are our receivables stuck?"*
- *"Prepare a leadership update."*

Traditional LLM chat interfaces often hallucinate metrics or rely on stale static dumps. This platform connects directly to **monday.com as the single source of truth**, applies **deterministic Python calculations** on cleaned datasets, and utilizes **AI tool calling (Gemini & OpenAI)** to format founder-ready executive briefings.

```text
Founder Question (Natural Language)
               ↓
Next.js 14 + Tailwind CSS + Framer Motion Obsidian Executive UI
               ↓
FastAPI Backend (Railway / Local Port 8000)
               ↓
AI Tool Calling / Intent Classification (Gemini 1.5 Flash / GPT-4o-mini)
               ↓
Deterministic Python Analytics Engine (Pandas)
               ↓
Monday.com GraphQL API v2 (Live Cursor Pagination & Dynamic Schema Mapping)
               ↓
Live Deals (346 items) + Work Orders (176 items)
               ↓
Data Cleaning & Normalization (Missing values, Date ISO, Sector canonicalization)
               ↓
Executive Insight + Data Quality Audit Modal + Visual BI Charts
               ↓
Founder-Level Formatted Chat Response & Exportable Markdown Briefings
```

---

## 2. Key Features

1. **Deterministic Analytics Engine**:
   - Computes total pipeline value, probability-weighted expected revenue, closed-won totals, billed values, collected cash, and outstanding receivables.
   - Audits work orders execution (completed, in-progress, delayed past target date).
2. **Interactive Visual Intelligence Dashboard**:
   - **Composed Chart (SeriesBar + Line)**: Sector pipeline vs. billed revenue vs. active projects.
   - **Revenue & Cash Conversion Funnel**: Multi-stage deal-to-cash lifecycle.
   - **Operations Ring Chart**: Segmented breakdown of work order statuses.
   - **Overdue Receivables Bar Chart**: Top accounts with highest unpaid exposure.
3. **Data Quality & Hygiene Audit**:
   - Dynamic audit report tracking unpopulated financial values, ambiguous date strings, and potential duplicate records without silently altering records.
4. **Obsidian Glassmorphism Theme with Framer Motion**:
   - Ambient glow palette, micro-interactions, smooth spring-animated tab switches, and responsive layouts.
5. **Export Briefing (`.md`)**:
   - 1-click export of structured executive briefings for board presentations.

---

## 3. Tech Stack

- **Backend**: Python 3.13, FastAPI, Pandas, Uvicorn, Requests, Google Generative AI, OpenAI SDK, Pytest
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Framer Motion, Lucide React, React Markdown
- **Data Source**: monday.com GraphQL API v2 (Read-Only)
- **Deployment**: Railway (Backend), Vercel (Frontend), Docker

---

## 4. Local Quickstart

### Prerequisites
* Python 3.10+
* Node.js 18+

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 5. Environment Variables

Create `backend/.env`:
```env
MONDAY_API_TOKEN=your_monday_api_token
MONDAY_DEALS_BOARD_ID=5030969139
MONDAY_WORK_ORDERS_BOARD_ID=5030969239
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional fallback
```

---

## 6. Running Automated Tests

Run the full unit and integration test suite:
```powershell
$env:PYTHONPATH = "$PWD\backend"
python -m pytest backend/tests -v
```
*(All 20 tests pass with 100% test coverage across endpoints, data cleaning, and deterministic calculations).*

---

## 7. Deliverables & Documentation

* **Technical Decision Log**: [`docs/decision_log.md`](docs/decision_log.md)
* **Clean Source Code Archive**: `Skylark_BI_Agent_Source_Code.zip`
