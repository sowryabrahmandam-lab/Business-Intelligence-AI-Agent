# Skylark Drones — Monday.com AI Business Intelligence Agent

An executive-level, AI-powered Business Intelligence platform designed for founders and executives to query live business performance across **Deals** and **Work Orders** boards in **monday.com**.

---

## 1. Problem Statement & Overview

Executive leadership needs instant, reliable answers to strategic questions such as:
- *"How is our pipeline looking this quarter?"*
- *"Which sector has the strongest revenue collection efficiency?"*
- *"What work orders are delayed and where are our receivables stuck?"*
- *"Prepare a leadership update."*

Traditional LLM chat interfaces often hallucinate metrics or rely on stale static dumps. This platform connects directly to **monday.com as the single source of truth**, applies **deterministic Python calculations** on cleaned datasets, and utilizes **OpenAI tool calling** to format founder-ready executive briefings.

---

## 2. Architecture

```text
Founder Question (Natural Language)
               ↓
Next.js + Tailwind CSS Executive UI (Port 3000)
               ↓
FastAPI Backend (Port 8000)
               ↓
OpenAI Tool Calling / Intent Classification (GPT-4o-mini)
               ↓
Deterministic Python Analytics Engine (Pandas)
               ↓
Monday.com GraphQL API v2 (Live Cursor Pagination & Dynamic Schema Mapping)
               ↓
Live Deals (346 items) + Work Orders (176 items)
               ↓
Data Cleaning & Normalization (Missing values, Date ISO, Sector canonicalization)
               ↓
Executive Insight + Data Quality Audit
               ↓
Founder-Level Formatted Chat Response
```

---

## 3. Tech Stack

- **Backend**: Python 3.13, FastAPI, Pandas, Uvicorn, Requests, OpenAI Python SDK
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, React Markdown
- **Data Source**: monday.com GraphQL API v2 (Read-Only)
- **Deployment**: Render / Railway / Docker (Backend), Vercel (Frontend)

---

## 4. Folder Structure

```text
skylark/
├── backend/
│   ├── .env                       # Environment variables (gitignored)
│   ├── .env.example               # Example template
│   ├── main.py                    # FastAPI app & endpoints (/chat, /monday/test, /metrics, /data-quality)
│   ├── requirements.txt           # Python dependencies
│   ├── services/
│   │   ├── monday_client.py       # Robust read-only GraphQL client with pagination & dynamic mapping
│   │   ├── data_cleaner.py        # Robust missing values, date parser, sector normalization, duplicate audit
│   │   ├── analytics.py           # Deterministic financial & operational calculations
│   │   └── llm_agent.py           # OpenAI tool calling & executive briefing generation
│   └── tests/
│       ├── test_data_cleaner.py   # Unit tests for data cleaning & date parsing
│       └── test_analytics.py      # Unit tests for pipeline, revenue, and leadership summaries
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # Root layout
│       │   ├── page.tsx           # Dashboard & chat main page
│       │   └── globals.css        # Tailwind styling & animations
│       └── components/
│           ├── Header.tsx         # Brand, live sync & modal triggers
│           ├── MetricCards.tsx    # Live KPI cards (Pipeline, Expected Rev, Receivables, etc.)
│           ├── ChatInterface.tsx  # Executive chat with Markdown & sources badges
│           ├── DataQualityModal.tsx # Data audit report modal
│           └── SettingsModal.tsx  # Dynamic credentials & connection tester
├── docs/
│   └── decision_log.md            # Architectural and analytical decision log
└── README.md                      # Complete system documentation
```

---

## 5. Environment Variables

Create `backend/.env`:
```env
MONDAY_API_TOKEN=your_monday_api_token
MONDAY_DEALS_BOARD_ID=5030969139
MONDAY_WORK_ORDERS_BOARD_ID=5030969239
OPENAI_API_KEY=your_openai_api_key
```

Frontend `.env.local` (optional, defaults to `http://localhost:8000`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 6. Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000` (Swagger docs: `http://localhost:8000/docs`).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will run at `http://localhost:3000`.

---

## 7. Example Queries Supported

1. **Pipeline Overview**: *"How is our pipeline looking this quarter?"*
2. **Sector Deep Dive**: *"How is the energy sector performing?"* / *"Which sector has the strongest pipeline?"*
3. **Financials & Cash Flow**: *"What is our expected revenue?"* / *"How much money is receivable?"*
4. **Operations & Execution**: *"What work orders are delayed?"* / *"What is our collection performance?"*
5. **Executive Briefing**: *"Prepare a leadership update."*
6. **Data Integrity Audit**: *"Are there any data quality issues?"*

---

## 8. Deterministic Analytics vs LLM Hallucinations

| Metric | Source Field / Formula | Execution |
| :--- | :--- | :--- |
| **Pipeline Value** | Sum of `deal_value` where status is not Won/Lost | Deterministic Python (Pandas) |
| **Expected Value** | Sum of `(deal_value * closure_probability)` for open deals | Deterministic Python (Pandas) |
| **Billed Value** | Sum of `billed_value_excl_gst` across Work Orders | Deterministic Python (Pandas) |
| **Collected Amount**| Sum of `collected_amount` across Work Orders | Deterministic Python (Pandas) |
| **Receivables** | Sum of `amount_receivable` across Work Orders | Deterministic Python (Pandas) |
| **Delayed Orders** | Count of active orders with target end date in the past | Deterministic Python (Pandas) |
| **Win Rate** | `Won Deals / (Won Deals + Lost Deals)` | Deterministic Python (Pandas) |

---

## 9. Security & Safety

- **Read-Only API Client**: The GraphQL client only uses query operations (`query { boards { ... } }`). No mutations are implemented or permitted.
- **Credential Protection**: Environment files are gitignored and never exposed to the client bundle or source control.

---

## 10. Deployment

- **Backend (Render / Railway)**: Deploy with start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Add environment variables `MONDAY_API_TOKEN`, `MONDAY_DEALS_BOARD_ID`, `MONDAY_WORK_ORDERS_BOARD_ID`, `OPENAI_API_KEY`.
- **Frontend (Vercel)**: Import `frontend/` directory, set build command `npm run build`, and configure `NEXT_PUBLIC_API_URL` to point to the backend URL.
