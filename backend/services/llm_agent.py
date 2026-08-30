import os
import json
import logging
from typing import Dict, List, Any, Optional
import pandas as pd
from openai import OpenAI

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
1. ALWAYS use the provided tool functions to compute deterministic numbers. DO NOT invent, hallucinate, or guess numbers.
2. monday.com is the single source of truth. All calculations are executed deterministically by Python.
3. Structure your response in a crisp, founder-level executive format:
   - Executive Summary
   - Key Metrics (with currency format ₹ and exact counts)
   - Insights
   - Risks & Bottlenecks
   - Data Quality / Forecast Confidence (mention any missing dates/values that affect confidence)
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
5. If the user asks an ambiguous question (e.g., 'How are sales doing?'), provide a concise high-level synthesis across pipeline and revenue, and offer targeted follow-up areas.
6. Clearly distinguish between Deal Pipeline (forward-looking/expected value), Billed Revenue, Cash Collected, and Receivables.
"""

class BIAgent:
    def __init__(self, analytics: AnalyticsEngine, api_key: Optional[str] = None):
        self.analytics = analytics
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

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

    def generate_deterministic_fallback(self, query: str, tool_name: str, tool_result: Dict[str, Any], dq_report: Dict[str, Any]) -> str:
        """Fallback deterministic response generator if OpenAI API is unavailable or unconfigured."""
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
- Active pipeline stands at ₹{pipe_val:,.2f} with weighted probability-adjusted expectation of ₹{exp_val:,.2f}.

### Data Quality
- Deals with missing value/dates are monitored in the data quality logs.
"""
        elif tool_name == "leadership_summary":
            pipe = tool_result.get("pipeline", {})
            rev = tool_result.get("revenue", {})
            ops = tool_result.get("operations", {})
            return f"""# Leadership Update

## Executive Summary
Comprehensive business intelligence overview across Deals and Work Orders.

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
            return f"### Analytical Summary\n\nLive Results:\n```json\n{json.dumps(tool_result, indent=2)}\n```"

    def answer_question(self, user_message: str, deals_df: pd.DataFrame, wo_df: pd.DataFrame, dq_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main method to process a user query: selects tool -> executes deterministic calculation -> generates LLM response.
        """
        # Re-check API key if changed dynamically
        current_api_key = os.getenv("OPENAI_API_KEY", self.api_key)
        if current_api_key and (not self.client or self.api_key != current_api_key):
            self.api_key = current_api_key
            self.client = OpenAI(api_key=self.api_key)

        sources = []
        data_quality_warnings = []
        
        # If OpenAI client is not initialized, choose tool by keyword matching and return deterministic fallback
        if not self.client or not self.api_key:
            msg_lower = user_message.lower()
            if "leader" in msg_lower or "executive" in msg_lower or "summary" in msg_lower:
                tool_name = "leadership_summary"
                sources = ["Deals", "Work Orders"]
            elif "work order" in msg_lower or "delay" in msg_lower or "operation" in msg_lower:
                tool_name = "work_order_analysis"
                sources = ["Work Orders"]
            elif "sector" in msg_lower:
                tool_name = "sector_analysis"
                sources = ["Deals", "Work Orders"]
            elif "revenue" in msg_lower or "receivable" in msg_lower or "collect" in msg_lower or "bill" in msg_lower:
                tool_name = "revenue_analysis"
                sources = ["Work Orders", "Deals"]
            elif "quality" in msg_lower or "duplicate" in msg_lower:
                tool_name = "data_quality_report"
                sources = ["Deals", "Work Orders"]
            elif "quarter" in msg_lower or "q1" in msg_lower or "q2" in msg_lower or "q3" in msg_lower or "q4" in msg_lower:
                tool_name = "quarter_analysis"
                sources = ["Deals", "Work Orders"]
            else:
                tool_name = "pipeline_health"
                sources = ["Deals"]

            tool_res = self.execute_tool(tool_name, {}, deals_df, wo_df, dq_report)
            answer_text = self.generate_deterministic_fallback(user_message, tool_name, tool_res, dq_report)
            return {
                "answer": answer_text,
                "sources": sources,
                "data_quality": dq_report.get("warnings", [])
            }

        # Use OpenAI tool calling
        try:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=TOOLS_DEFINITION,
                tool_choice="auto",
                temperature=0.2
            )

            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls

            if tool_calls:
                messages.append(response_message)
                for tool_call in tool_calls:
                    fn_name = tool_call.function.name
                    fn_args = json.loads(tool_call.function.arguments or "{}")

                    # Map sources
                    if fn_name in ["pipeline_health"]:
                        sources.append("Deals")
                    elif fn_name in ["work_order_analysis"]:
                        sources.append("Work Orders")
                    else:
                        sources.extend(["Deals", "Work Orders"])

                    tool_output = self.execute_tool(fn_name, fn_args, deals_df, wo_df, dq_report)

                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": fn_name,
                        "content": json.dumps(tool_output)
                    })

                # Second completion to formulate response
                second_response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.2
                )
                final_answer = second_response.choices[0].message.content
                return {
                    "answer": final_answer,
                    "sources": list(set(sources)),
                    "data_quality": dq_report.get("warnings", [])
                }
            else:
                return {
                    "answer": response_message.content,
                    "sources": ["Deals", "Work Orders"],
                    "data_quality": dq_report.get("warnings", [])
                }

        except Exception as e:
            logger.error(f"OpenAI agent error: {e}")
            # Fallback to deterministic generator
            tool_name = "pipeline_health"
            if "leader" in user_message.lower():
                tool_name = "leadership_summary"
            elif "revenue" in user_message.lower() or "receivable" in user_message.lower():
                tool_name = "revenue_analysis"
            tool_res = self.execute_tool(tool_name, {}, deals_df, wo_df, dq_report)
            fallback_ans = self.generate_deterministic_fallback(user_message, tool_name, tool_res, dq_report)
            return {
                "answer": fallback_ans + f"\n\n*(Note: Generated via deterministic analytics engine due to LLM interface notice: {str(e)})*",
                "sources": ["Deals", "Work Orders"],
                "data_quality": dq_report.get("warnings", [])
            }
