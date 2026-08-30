import os
import json
import logging
from typing import Dict, List, Any, Optional
import pandas as pd

from services.analytics import AnalyticsEngine

logger = logging.getLogger(__name__)

TOOLS_DEFINITION = [
    {
        "type": "function",
        "function": {
            "name": "pipeline_health",
            "description": "Calculates pipeline health, deal stages, open/won/lost deals, total pipeline value, weighted expected value, and win rates.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quarter": {
                        "type": "string",
                        "description": "Optional period filter like 'this quarter', 'last quarter', 'Q1 2024', 'this year', or 'all time'."
                    },
                    "sector": {
                        "type": "string",
                        "description": "Optional sector filter such as 'Energy', 'Mining', 'Infrastructure', 'Agriculture', 'Telecom', etc."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "revenue_analysis",
            "description": "Calculates closed won deal value, expected pipeline revenue, work order contract totals, billed amounts, cash collected, and amount receivables.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quarter": {
                        "type": "string",
                        "description": "Optional period filter like 'this quarter', 'last quarter', 'Q1', etc."
                    },
                    "sector": {
                        "type": "string",
                        "description": "Optional sector filter like 'Energy', 'Mining', etc."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "sector_analysis",
            "description": "Performs cross-sector comparative analysis on deals pipeline, work order contract amounts, billed/collected amounts, and active project counts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quarter": {
                        "type": "string",
                        "description": "Optional quarter filter like 'this quarter', 'last quarter', etc."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "work_order_analysis",
            "description": "Analyzes operational execution of work orders, active vs completed projects, delays, execution/billing/collection breakdowns, and project receivables.",
            "parameters": {
                "type": "object",
                "properties": {
                    "quarter": {
                        "type": "string",
                        "description": "Optional quarter filter like 'this quarter', 'last quarter', etc."
                    },
                    "sector": {
                        "type": "string",
                        "description": "Optional sector filter like 'Energy', 'Mining', etc."
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "quarter_analysis",
            "description": "Compares performance across quarters (e.g. this quarter vs last quarter) across pipeline, revenue, and work order operations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "The target quarter or period such as 'this quarter', 'last quarter', 'Q1 2024', etc."
                    }
                },
                "required": ["period"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "data_quality_report",
            "description": "Returns comprehensive data quality metrics including missing critical fields, date format anomalies, potential duplicates, and data warnings.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "leadership_summary",
            "description": "Generates a full executive leadership briefing covering high-level revenue, pipeline health, operations, sector highlights, key business risks, and recommendations.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]

SYSTEM_PROMPT = """You are an elite AI Business Intelligence & Strategy Advisor for the executive leadership and founders of Skylark Drones.

Your goal is to answer founder questions using live, deterministic business analytics retrieved from monday.com boards (Deals and Work Orders).

CRITICAL RULES:
1. ALWAYS use the provided deterministic calculations. DO NOT invent, hallucinate, or guess numbers.
2. monday.com is the single source of truth. All calculations are executed deterministically by Python.
3. Structure your response in a crisp, founder-level executive format:
   - Executive Summary
   - Key Metrics (with exact counts and currency in INR format ₹)
   - Insights
   - Risks & Bottlenecks
   - Data Quality / Forecast Confidence
   - Recommended Actions
4. For Leadership Update queries, strictly format as:
   # Leadership Update
   ## Executive Summary
   ## Revenue
   ## Pipeline
   ## Sector Performance
   ## Operations
   ## Risks
   ## Data Quality
   ## Recommended Actions
5. Clearly distinguish between Deal Pipeline (forward-looking/expected value), Billed Revenue, Cash Collected, and Receivables.
"""

class BIAgent:
    def __init__(self, analytics: AnalyticsEngine):
        self.analytics = analytics

    def execute_tool(self, tool_name: str, args: Dict[str, Any], deals_df: pd.DataFrame, wo_df: pd.DataFrame, dq_report: Dict[str, Any]) -> Dict[str, Any]:
        """Executes the Python deterministic tool function matching the tool_name."""
        if tool_name == "pipeline_health":
            return self.analytics.pipeline_health(deals_df, quarter=args.get("quarter"), sector=args.get("sector"))
        elif tool_name == "revenue_analysis":
            return self.analytics.revenue_analysis(deals_df, wo_df, quarter=args.get("quarter"), sector=args.get("sector"))
        elif tool_name == "sector_analysis":
            return self.analytics.sector_analysis(deals_df, wo_df, quarter=args.get("quarter"))
        elif tool_name == "work_order_analysis":
            return self.analytics.work_order_analysis(wo_df, quarter=args.get("quarter"), sector=args.get("sector"))
        elif tool_name == "quarter_analysis":
            return self.analytics.quarter_analysis(deals_df, wo_df, period=args.get("period", "this quarter"))
        elif tool_name == "data_quality_report":
            return dq_report
        elif tool_name == "leadership_summary":
            return self.analytics.leadership_summary(deals_df, wo_df)
        else:
            return {"error": f"Unknown tool: {tool_name}"}

    def _select_tool_heuristically(self, msg: str) -> str:
        msg_lower = msg.lower()
        if "leader" in msg_lower or "executive" in msg_lower or "summary" in msg_lower or "risk" in msg_lower:
            return "leadership_summary"
        elif "work order" in msg_lower or "delay" in msg_lower or "operation" in msg_lower:
            return "work_order_analysis"
        elif "which sector" in msg_lower or "sector performance" in msg_lower or "compare sector" in msg_lower:
            return "sector_analysis"
        elif "sector" in msg_lower and ("pipeline" in msg_lower or "deal" in msg_lower):
            return "pipeline_health"
        elif "revenue" in msg_lower or "receivable" in msg_lower or "collect" in msg_lower or "bill" in msg_lower:
            return "revenue_analysis"
        elif "quality" in msg_lower or "duplicate" in msg_lower or "warning" in msg_lower:
            return "data_quality_report"
        elif "quarter" in msg_lower or "q1" in msg_lower or "q2" in msg_lower or "q3" in msg_lower or "q4" in msg_lower:
            return "quarter_analysis"
        else:
            return "pipeline_health"

    def generate_deterministic_fallback(self, query: str, tool_name: str, tool_result: Dict[str, Any], dq_report: Dict[str, Any], deals_df: Optional[pd.DataFrame] = None) -> str:
        """Deterministic response generator providing executive-ready formatted answers."""
        if tool_name == "pipeline_health":
            total = tool_result.get("total_deals", 0)
            open_count = tool_result.get("open_deals_count", 0)
            pipe_val = tool_result.get("total_pipeline_value", 0.0)
            exp_val = tool_result.get("expected_pipeline_value", 0.0)
            win_note = tool_result.get("win_rate_note", "N/A")
            return f"""### Executive Summary
Pipeline analysis for **{tool_result.get('period', 'All Time')}** across **{tool_result.get('sector_filter', 'All')}** sectors.

### Key Metrics
- **Total Deals**: {total}
- **Active / Open Deals**: {open_count}
- **Total Pipeline Value**: ₹{pipe_val:,.2f}
- **Expected (Weighted) Value**: ₹{exp_val:,.2f}
- **Win Rate**: {win_note}

### Insights
- Active pipeline stands at ₹{pipe_val:,.2f} with probability-weighted expectation of ₹{exp_val:,.2f}.

### Risks
- Deals with unpopulated target close dates require account team attention.

### Recommended Actions
- Focus on accelerating late-stage deals in highest pipeline sectors.
"""
        elif tool_name == "quarter_analysis":
            p_label = tool_result.get("period_label", "Quarter")
            d_range = tool_result.get("date_range", "")
            pipe = tool_result.get("pipeline", {})
            rev = tool_result.get("revenue", {})
            ops = tool_result.get("operations", {})

            pipe_val = pipe.get("total_pipeline_value", 0.0)
            exp_val = pipe.get("expected_pipeline_value", 0.0)
            open_cnt = pipe.get("open_deals_count", 0)

            return f"""### Executive Summary
Quarterly performance overview for **{p_label}** ({d_range}).

### Key Metrics
- **Active Pipeline Deals ({p_label})**: {open_cnt}
- **Quarter Pipeline Value**: ₹{pipe_val:,.2f}
- **Quarter Expected Value**: ₹{exp_val:,.2f}
- **Billed Value**: ₹{rev.get('billed_value_excl_gst', 0):,.2f}
- **Cash Collected**: ₹{rev.get('collected_amount', 0):,.2f}
- **Active Work Orders**: {ops.get('active_work_orders', 0)}
- **Delayed Work Orders**: {ops.get('delayed_work_orders_count', 0)}

### Insights
- Performance for {p_label} reflects active work execution and commercial pipeline movement.

### Data Quality
- Forecast confidence is governed by deals with active close dates recorded in monday.com.
"""
        elif tool_name == "revenue_analysis":
            rev = tool_result
            return f"""### Executive Summary
Revenue and cash flow analysis across active deals and executed work orders.

### Key Metrics
- **Closed Won Deal Value**: ₹{rev.get('closed_won_deal_value', 0):,.2f}
- **Billed Value (Excl GST)**: ₹{rev.get('billed_value_excl_gst', 0):,.2f}
- **Cash Collected**: ₹{rev.get('collected_amount', 0):,.2f}
- **Outstanding Receivables**: ₹{rev.get('amount_receivable', 0):,.2f}
- **Unbilled Contract Value**: ₹{rev.get('amount_to_be_billed', 0):,.2f}
- **Collection Efficiency**: {rev.get('collection_efficiency_pct', 'N/A')}%

### Insights
- Total collections stand at ₹{rev.get('collected_amount', 0):,.2f} with a collection efficiency of {rev.get('collection_efficiency_pct', 'N/A')}%.

### Risks
- Outstanding receivables of ₹{rev.get('amount_receivable', 0):,.2f} need immediate collection focus.

### Recommended Actions
- Prioritize high-value accounts with outstanding receivables.
"""
        elif tool_name == "work_order_analysis":
            ops = tool_result
            delayed = ops.get('delayed_work_orders', [])
            delayed_str = "\n".join([f"- **{d['serial_no']}** ({d['deal_name']} - {d['sector']}): Due {d['target_end_date']}" for d in delayed[:5]])
            return f"""### Executive Summary
Operational analysis of work order execution, completion rates, and delivery delays.

### Key Metrics
- **Total Work Orders**: {ops.get('total_work_orders', 0)}
- **Active / Ongoing Projects**: {ops.get('active_work_orders', 0)}
- **Completed Projects**: {ops.get('completed_work_orders', 0)}
- **Delayed Work Orders**: {ops.get('delayed_work_orders_count', 0)}

### Key Delays
{delayed_str if delayed else '- No delayed orders detected.'}

### Insights
- Operational throughput has successfully delivered {ops.get('completed_work_orders', 0)} projects, with {ops.get('active_work_orders', 0)} projects actively in progress.

### Recommended Actions
- Unblock critical paths for the {ops.get('delayed_work_orders_count', 0)} delayed projects.
"""
        elif tool_name == "sector_analysis":
            sec_dict = tool_result.get("sectors", {})
            rows = []
            for name, d in list(sec_dict.items())[:6]:
                rows.append(f"- **{name}**: Pipeline ₹{d['pipeline_value']:,.2f} | Billed ₹{d['billed_amount']:,.2f} | Active WOs: {d['active_projects']}")
            return f"""### Executive Summary
Cross-sector comparison across commercial deal pipeline and operational execution.

### Key Metrics
- **Top Pipeline Sector**: {tool_result.get('top_pipeline_sector', 'N/A')}
- **Top Revenue Sector**: {tool_result.get('top_revenue_sector', 'N/A')}

### Sector Highlights
{chr(10).join(rows)}

### Recommended Actions
- Scale resource allocation for top-performing pipeline sectors.
"""
        elif tool_name == "data_quality_report":
            deals_dq = tool_result.get("deals", {})
            wo_dq = tool_result.get("work_orders", {})
            warnings = tool_result.get("warnings", [])
            return f"""### Executive Summary
Data Quality & System Integrity Audit across monday.com boards.

### Deals Board Audit
- **Total Records Ingested**: {deals_dq.get('total_records', 0)}
- **Missing Deal Values**: {deals_dq.get('missing_deal_value_count', 0)}
- **Missing / Ambiguous Dates**: {deals_dq.get('missing_effective_dates_count', 0)}
- **Potential Duplicate Deals**: {deals_dq.get('potential_duplicates_count', 0)}

### Work Orders Board Audit
- **Total Records Ingested**: {wo_dq.get('total_records', 0)}
- **Missing Receivables**: {wo_dq.get('missing_receivables_count', 0)}
- **Missing Collections**: {wo_dq.get('missing_collected_count', 0)}
- **Potential Duplicate Orders**: {wo_dq.get('potential_duplicates_count', 0)}

### Impact on Insights
- Active pipeline figures are computed accurately, with warnings logged for incomplete close dates.
"""
        elif tool_name == "leadership_summary":
            pipe = tool_result.get("pipeline", {})
            rev = tool_result.get("revenue", {})
            ops = tool_result.get("operations", {})
            return f"""# Leadership Update

## Executive Summary
Comprehensive business intelligence overview across Deals and Work Orders boards.

## Revenue
- **Closed Won Deals**: ₹{rev.get('closed_won_deal_value', 0):,.2f}
- **Billed Value (Excl GST)**: ₹{rev.get('billed_value_excl_gst', 0):,.2f}
- **Cash Collected**: ₹{rev.get('collected_amount', 0):,.2f}
- **Receivables**: ₹{rev.get('amount_receivable', 0):,.2f}
- **Unbilled Contract Value**: ₹{rev.get('amount_to_be_billed', 0):,.2f}

## Pipeline
- **Active Deals**: {pipe.get('open_deals_count', 0)}
- **Total Pipeline Value**: ₹{pipe.get('total_pipeline_value', 0):,.2f}
- **Expected Value**: ₹{pipe.get('expected_pipeline_value', 0):,.2f}

## Sector Performance
- **Top Sector by Pipeline**: {tool_result.get('top_pipeline_sector', 'N/A')}

## Operations
- **Total Work Orders**: {ops.get('total_work_orders', 0)}
- **Active Work Orders**: {ops.get('active_work_orders', 0)}
- **Delayed Work Orders**: {ops.get('delayed_work_orders_count', 0)}

## Risks
{chr(10).join(['- ' + r for r in tool_result.get('key_risks', [])]) if tool_result.get('key_risks') else '- No critical risks detected.'}

## Recommended Actions
- Accelerate follow-up on outstanding receivables.
- Review operational bottlenecks for any delayed work orders.
"""
        else:
            return f"### Analytical Report\n\n```json\n{json.dumps(tool_result, indent=2)}\n```"

    def _call_gemini(self, prompt: str, tool_name: str, tool_data: Dict[str, Any], api_key: str) -> Optional[str]:
        """Calls Google Gemini with deterministic analytics data to generate founder insights."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            full_prompt = f"""{SYSTEM_PROMPT}

User Question: {prompt}

Live monday.com Deterministic Analytics Data:
```json
{json.dumps(tool_data, indent=2)}
```

Generate the founder-level response strictly based on this data without inventing numbers.
"""
            response = model.generate_content(full_prompt)
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Gemini LLM call failed ({e}), falling back to deterministic template.")
        return None

    def _call_openai(self, prompt: str, deals_df: pd.DataFrame, wo_df: pd.DataFrame, dq_report: Dict[str, Any], api_key: str) -> Optional[Dict[str, Any]]:
        """Calls OpenAI with function calling."""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=TOOLS_DEFINITION,
                tool_choice="auto",
                temperature=0.2
            )
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            sources = []
            if tool_calls:
                messages.append(response_message)
                for tool_call in tool_calls:
                    fn_name = tool_call.function.name
                    fn_args = json.loads(tool_call.function.arguments or "{}")
                    sources.append("Deals" if "deal" in fn_name or "pipe" in fn_name else "Work Orders")
                    tool_output = self.execute_tool(fn_name, fn_args, deals_df, wo_df, dq_report)
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": fn_name,
                        "content": json.dumps(tool_output)
                    })
                second_response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.2
                )
                return {
                    "answer": second_response.choices[0].message.content,
                    "sources": list(set(sources)) or ["Deals", "Work Orders"]
                }
        except Exception as e:
            logger.warning(f"OpenAI call failed: {e}")
        return None

    def answer_question(self, user_message: str, deals_df: pd.DataFrame, wo_df: pd.DataFrame, dq_report: Dict[str, Any]) -> Dict[str, Any]:
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

        tool_name = self._select_tool_heuristically(user_message)
        
        # Sector specific extraction
        args: Dict[str, Any] = {}
        msg_lower = user_message.lower()
        for sec in ["energy", "mining", "infrastructure", "agriculture", "telecom", "utilities", "defense", "powerline", "railways"]:
            if sec in msg_lower:
                args["sector"] = sec
                break

        sources = ["Deals"] if tool_name == "pipeline_health" else (["Work Orders"] if tool_name == "work_order_analysis" else ["Deals", "Work Orders"])
        tool_res = self.execute_tool(tool_name, args, deals_df, wo_df, dq_report)

        # 1. Try OpenAI if key is valid
        if openai_key and openai_key.startswith("sk-"):
            oa_res = self._call_openai(user_message, deals_df, wo_df, dq_report, openai_key)
            if oa_res and oa_res.get("answer"):
                return {
                    "answer": oa_res["answer"],
                    "sources": oa_res.get("sources", sources),
                    "data_quality": dq_report.get("warnings", [])
                }

        # 2. Try Gemini if key is provided
        if gemini_key:
            gem_text = self._call_gemini(user_message, tool_name, tool_res, gemini_key)
            if gem_text:
                return {
                    "answer": gem_text,
                    "sources": sources,
                    "data_quality": dq_report.get("warnings", [])
                }

        # 3. Deterministic template fallback
        fallback_ans = self.generate_deterministic_fallback(user_message, tool_name, tool_res, dq_report, deals_df=deals_df)
        return {
            "answer": fallback_ans,
            "sources": sources,
            "data_quality": dq_report.get("warnings", [])
        }
