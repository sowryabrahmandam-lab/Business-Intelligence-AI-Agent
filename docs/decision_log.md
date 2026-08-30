# Architecture & Technical Decision Log
*Skylark Drones — Monday.com AI Business Intelligence Agent*

---

## 1. Key Assumptions Made
* **Monday.com as Single Source of Truth**: All Deals (346 items) and Work Orders (176 items) are dynamically ingested via Monday.com GraphQL API v2. No static datasets or hardcoded metrics are used.
* **Dynamic Schema Discovery**: Column IDs in Monday.com vary between accounts. The client queries board metadata dynamically and maps arbitrary column IDs to semantic fields (e.g. `Masked Deal value`, `Collected Amount in Rupees`, `Status`).
* **Financial Value Integrity**: Missing or messy values (`N/A`, `-`, `*`, `null`, `nan`) are preserved as unpopulated rather than silently assumed to be `₹0`, avoiding downward distortion of commercial pipeline averages.
* **Date Normalization**: Inconsistent date patterns (`DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`) are normalized to ISO standard. Unparseable dates are surfaced in the Data Quality audit.
* **Read-Only Safety**: Zero mutation operations are ever sent to Monday.com, guaranteeing 100% data safety.

---

## 2. Trade-Offs Chosen & Rationale
| Architecture Choice | Alternative Considered | Why this Trade-Off Was Chosen |
| :--- | :--- | :--- |
| **Deterministic Python Analytics Engine** | Pure LLM math generation / Text-to-SQL | For executive financial reporting, mathematical accuracy must be 100% deterministic. The LLM explains and summarizes Python-calculated facts rather than hallucinating numbers. |
| **Tool-Calling Architecture** | Heavy RAG / Multi-Agent Frameworks (LangGraph, AutoGen) | Lightweight tool calling is sub-second, highly predictable, and eliminates complex multi-agent loop failures under tight latency constraints. |
| **Dual AI Support (Gemini + OpenAI + Deterministic Fallback)** | Single Model Dependency | Guarantees 100% uptime: if API quotas or network timeouts occur, deterministic executive templates immediately handle the briefing. |
| **Non-Destructive Data Quality Audit** | Silently dropping duplicate/messy rows | Executive trust requires transparency. Messy records and potential duplicates are audited and reported to the executive in an audit modal rather than silently removed. |

---

## 3. How We Interpreted "Leadership Updates"
An executive leadership update is **not a raw data dump**; it is an action-oriented briefing designed for founders and VP-level executives. We structured all leadership updates around five core pillars:
1. **Executive Summary**: High-level pulse of business health across commercial pipeline and operational execution.
2. **Revenue & Cash Flow**: Closed won deal value, actual billed revenue (excl GST), cash collected, and outstanding receivables (AR exposure).
3. **Pipeline Health & Forward Visibility**: Total pipeline value, probability-weighted expected revenue, and active deal count.
4. **Operations & Execution Risk**: Active work orders, completion rates, and specific callouts of **delayed projects past their target completion dates**.
5. **Actionable Recommendations**: Specific, prioritized next steps (e.g. *"Accelerate collections on ₹36.29M overdue receivables"*, *"Address operational bottlenecks on 24 delayed work orders in Energy and Mining"*).

---

## 4. What We Would Do Differently With More Time
1. **Live Webhook Listeners**: Implement real-time Monday.com webhook endpoints (`POST /webhooks/monday`) for instant push-based cache invalidation whenever a sales rep edits a column.
2. **Automated PDF Export & Slack/Email Dispatch**: Generate pixel-perfect branded PDF executive reports and schedule automated weekly briefings to Slack channels or founder emails.
3. **Monte Carlo Closure Probability Simulations**: Build statistical predictive modeling on historical stage durations to forecast quarterly revenue ranges (P10, P50, P90).
4. **Cross-Board Entity Resolution**: Implement probabilistic entity matching to link disparate customer names across boards with fuzzy string matching.

---

## 5. Summary Matrix of Live Assignment Metrics
* **Total Deals Ingested**: 346
* **Active Pipeline Value**: ₹1,225,246,546.13 (138 Open Deals)
* **Expected Weighted Revenue**: ₹612,623,273.07
* **Closed Won Revenue**: ₹97,730,418.98
* **Billed Revenue (Excl GST)**: ₹107,389,776.59
* **Collected Cash**: ₹90,428,187.50 (71.36% Collection Efficiency)
* **Outstanding Receivables**: ₹36,291,748.87
* **Work Orders Executed**: 176 Total (117 Completed, 29 Active, 24 Delayed past target date)
