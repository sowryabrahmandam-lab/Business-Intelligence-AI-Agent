# Architecture & Technical Decision Log

## 1. Key Assumptions
- **Monday.com as Single Source of Truth**: All Deals and Work Orders are queried live from Monday.com boards via GraphQL API v2. No business records or static revenue metrics are hardcoded.
- **Dynamic Schema Discovery**: Column IDs in Monday.com are not fixed. The client fetches board metadata dynamically and maps column IDs to semantic titles (e.g. `Masked Deal value`, `Collected Amount in Rupees`).
- **Read-Only Guarantee**: Zero mutation operations are ever sent to Monday.com to guarantee complete data safety.

## 2. Architecture Decisions
- **Deterministic Backend Analytics**: Instead of asking an LLM to guess numerical totals, calculations (Pipeline totals, weighted expectations, collection efficiency, receivables) are computed purely in deterministic Python using Pandas. The LLM is used exclusively for executive explanation and contextual formatting.
- **FastAPI + Next.js**: FastAPI provides asynchronous speed, automatic OpenAPI documentation, and minimal footprint; Next.js + Tailwind CSS delivers a responsive, executive-level dashboard experience with zero latency.
- **Graceful Fallback Mechanism**: If the OpenAI API experiences rate limits or network issues, the system automatically falls back to deterministic template formatting so the executive always receives accurate numbers.

## 3. Data Cleaning Decisions
- **Missing Financials**: Strings like `N/A`, `-`, `*`, `null`, `nan` are treated as unpopulated without silently assuming ₹0 (to avoid distorting pipeline metrics).
- **Date Parsing & Normalization**: Formats such as `DD/MM/YYYY`, `MM/DD/YYYY`, and `YYYY-MM-DD` are normalized into ISO timestamps. Unparseable dates are preserved in raw format and reported in the Data Quality audit.
- **Sector Canonicalization**: Variations like `energy`, `ENERGY`, `Energy Sector` are mapped to canonical names (`Energy`) while preserving raw values for auditing.
- **Non-Destructive Duplicate Detection**: Duplicate records (identical deal names or work order serials) are flagged and reported in data quality metrics rather than silently dropped.

## 4. Analytics Definitions
- **Pipeline Value**: Sum of `deal_value` for all active (non-won, non-lost) deals.
- **Expected Revenue / Value**: Sum of `(deal_value * closure_probability)` for open deals.
- **Win Rate**: `Won Deals / (Won Deals + Lost Deals)`. If closed deals are zero, the system notes that win rate cannot be reliably calculated.
- **Collection Efficiency**: `(Collected Amount / Billed Value) * 100`.
- **Billing Progress**: `(Billed Value / Total Contract Value) * 100`.
- **Delayed Work Orders**: Work orders in active/in-progress status where the end date or delivery date is in the past.

## 5. Cross-Board Matching
- **Matching Identifier**: Matches Deals and Work Orders on `Deal Name` (normalized, case-insensitive) and client/customer codes where defensible.
- **Independence**: Operations and pipeline metrics can be analyzed either individually or synthesized into combined sector views.

## 6. Trade-Offs & Why this Architecture was Chosen
- **Trade-off**: Avoided heavy vector databases (RAG) and multi-agent frameworks (e.g., LangGraph) in favor of deterministic Python analytics with OpenAI Tool Calling.
- **Rationale**: For structured business intelligence and executive financial reporting, mathematical determinism and speed outweigh probabilistic retrieval.

## 7. What Would be Improved with More Time
- Implement webhook subscriptions on Monday.com for instant push-based cache invalidation.
- Add multi-quarter trend forecasting and Monte Carlo closure probability simulations.
- Implement granular role-based access control (RBAC) and exportable PDF executive briefings.
