import os
import logging
from typing import Dict, List, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pandas as pd

# Load environment variables
load_dotenv(override=True)

from services.monday_client import MondayClient, MondayAPIError
from services.data_cleaner import DataCleaner
from services.analytics import AnalyticsEngine
from services.llm_agent import BIAgent

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# State cache for fast queries
class AppState:
    raw_deals: List[Dict[str, Any]] = []
    raw_work_orders: List[Dict[str, Any]] = []
    deals_df: pd.DataFrame = pd.DataFrame()
    wo_df: pd.DataFrame = pd.DataFrame()
    deals_dq: Dict[str, Any] = {}
    wo_dq: Dict[str, Any] = {}
    last_synced: Optional[str] = None
    is_syncing: bool = False

state = AppState()

# Services
monday_client = MondayClient()
data_cleaner = DataCleaner()
analytics_engine = AnalyticsEngine()
bi_agent = BIAgent(analytics_engine)

def refresh_data():
    """Fetches data from Monday.com and cleans/normalizes it."""
    load_dotenv(override=True)
    deals_board_id = os.getenv("MONDAY_DEALS_BOARD_ID", "")
    wo_board_id = os.getenv("MONDAY_WORK_ORDERS_BOARD_ID", "")
    api_token = os.getenv("MONDAY_API_TOKEN", "")

    monday_client.api_token = api_token
    monday_client.headers["Authorization"] = api_token

    logger.info(f"Syncing monday data. Deals Board: {deals_board_id}, WO Board: {wo_board_id}")

    # Fetch Deals
    if deals_board_id and api_token:
        try:
            _, raw_d = monday_client.get_board_data(deals_board_id)
            state.raw_deals = raw_d
            state.deals_df, state.deals_dq = data_cleaner.clean_deals(raw_d)
            logger.info(f"Successfully retrieved and cleaned {len(state.deals_df)} Deals.")
        except Exception as e:
            logger.error(f"Error syncing Deals board: {e}")
            state.deals_dq = {"error": str(e), "total_records": 0, "warnings": [f"Deals sync error: {str(e)}"]}

    # Fetch Work Orders
    if wo_board_id and api_token:
        try:
            _, raw_w = monday_client.get_board_data(wo_board_id)
            state.raw_work_orders = raw_w
            state.wo_df, state.wo_dq = data_cleaner.clean_work_orders(raw_w)
            logger.info(f"Successfully retrieved and cleaned {len(state.wo_df)} Work Orders.")
        except Exception as e:
            logger.error(f"Error syncing Work Orders board: {e}")
            state.wo_dq = {"error": str(e), "total_records": 0, "warnings": [f"Work Orders sync error: {str(e)}"]}

    from datetime import datetime
    state.last_synced = datetime.now().isoformat()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt initial sync if credentials are set
    try:
        refresh_data()
    except Exception as e:
        logger.warning(f"Initial sync skipped or failed: {e}")
    yield

app = FastAPI(
    title="Skylark Drones Monday.com BI Agent",
    description="AI-powered Business Intelligence Agent querying live Deals & Work Orders boards from monday.com",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    data_quality: List[str]

class ConfigUpdateRequest(BaseModel):
    monday_api_token: Optional[str] = None
    monday_deals_board_id: Optional[str] = None
    monday_work_orders_board_id: Optional[str] = None
    openai_api_key: Optional[str] = None

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": "Skylark Monday.com BI Agent",
        "deals_count": len(state.deals_df),
        "work_orders_count": len(state.wo_df),
        "last_synced": state.last_synced
    }

@app.get("/monday/test")
def test_monday_connection():
    load_dotenv(override=True)
    deals_board_id = os.getenv("MONDAY_DEALS_BOARD_ID", "")
    wo_board_id = os.getenv("MONDAY_WORK_ORDERS_BOARD_ID", "")
    api_token = os.getenv("MONDAY_API_TOKEN", "")

    monday_client.api_token = api_token
    monday_client.headers["Authorization"] = api_token

    deals_res = monday_client.test_connection(deals_board_id)
    wo_res = monday_client.test_connection(wo_board_id)

    return {
        "deals": deals_res,
        "work_orders": wo_res
    }

@app.post("/sync-monday")
def sync_monday_data():
    try:
        refresh_data()
        return {
            "success": True,
            "message": "Data synchronized successfully from monday.com",
            "deals_count": len(state.deals_df),
            "work_orders_count": len(state.wo_df),
            "last_synced": state.last_synced
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data-quality")
def get_data_quality_report():
    combined_warnings = []
    combined_warnings.extend(state.deals_dq.get("warnings", []))
    combined_warnings.extend(state.wo_dq.get("warnings", []))

    return {
        "deals": state.deals_dq,
        "work_orders": state.wo_dq,
        "combined_warnings": combined_warnings,
        "last_synced": state.last_synced
    }

@app.get("/metrics")
def get_dashboard_metrics():
    """Returns top-level dynamic KPI metrics for executive dashboard cards."""
    # Ensure fresh sync if empty
    if state.deals_df.empty and state.wo_df.empty:
        refresh_data()

    pipe = analytics_engine.pipeline_health(state.deals_df)
    rev = analytics_engine.revenue_analysis(state.deals_df, state.wo_df)
    ops = analytics_engine.work_order_analysis(state.wo_df)

    return {
        "total_pipeline_value": pipe.get("total_pipeline_value", 0.0),
        "expected_revenue": pipe.get("expected_pipeline_value", 0.0),
        "active_deals": pipe.get("open_deals_count", 0),
        "active_work_orders": ops.get("active_work_orders", 0),
        "amount_receivable": rev.get("amount_receivable", 0.0),
        "delayed_work_orders": ops.get("delayed_work_orders_count", 0)
    }

@app.get("/charts-data")
def get_charts_data():
    """Returns structured datasets for visual analytics (Funnel, Composed, Ring, Bar charts)."""
    if state.deals_df.empty and state.wo_df.empty:
        refresh_data()

    pipe = analytics_engine.pipeline_health(state.deals_df)
    rev = analytics_engine.revenue_analysis(state.deals_df, state.wo_df)
    sec_data = analytics_engine.sector_analysis(state.deals_df, state.wo_df)
    ops = analytics_engine.work_order_analysis(state.wo_df)

    # 1. Funnel Data: Deal Pipeline -> Won -> Billed -> Collected -> Receivables
    funnel = [
        {"stage": "Total Pipeline", "value": pipe.get("total_pipeline_value", 0.0), "fill": "#3b82f6"},
        {"stage": "Expected Value", "value": pipe.get("expected_pipeline_value", 0.0), "fill": "#6366f1"},
        {"stage": "Closed Won", "value": rev.get("closed_won_deal_value", 0.0), "fill": "#10b981"},
        {"stage": "Billed Value", "value": rev.get("billed_value_excl_gst", 0.0), "fill": "#8b5cf6"},
        {"stage": "Cash Collected", "value": rev.get("collected_amount", 0.0), "fill": "#06b6d4"},
        {"stage": "Receivables", "value": rev.get("amount_receivable", 0.0), "fill": "#f59e0b"},
    ]

    # 2. Composed Sector Data: Top 7 sectors by pipeline + billed
    sectors_list = []
    for s_name, s_val in sec_data.get("sectors", {}).items():
        if s_name in ["Unknown / Unspecified"] and s_val["pipeline_value"] == 0:
            continue
        sectors_list.append({
            "sector": s_name,
            "pipeline": s_val.get("pipeline_value", 0.0),
            "expected": s_val.get("expected_pipeline_value", 0.0),
            "billed": s_val.get("billed_amount", 0.0),
            "collected": s_val.get("collected_amount", 0.0),
            "activeProjects": s_val.get("active_projects", 0),
            "delayedProjects": s_val.get("delayed_projects", 0)
        })
    sectors_list.sort(key=lambda x: x["pipeline"], reverse=True)
    top_sectors = sectors_list[:7]

    # 3. Execution Status Ring / Pie Data
    exec_colors = {
        "Completed": "#10b981",
        "Ongoing": "#3b82f6",
        "In Progress": "#6366f1",
        "Executed until current month": "#06b6d4",
        "Not Started": "#94a3b8",
        "Pause / struck": "#ef4444",
        "Pending": "#f59e0b",
        "Partial Completed": "#8b5cf6"
    }
    execution_pie = []
    for st_name, st_cnt in ops.get("execution_status_breakdown", {}).items():
        execution_pie.append({
            "name": st_name,
            "value": st_cnt,
            "fill": exec_colors.get(st_name, "#64748b")
        })

    # 4. Top Accounts with Highest Receivables
    top_ar_accounts = []
    if not state.wo_df.empty and "amount_receivable" in state.wo_df:
        wo_ar = state.wo_df[state.wo_df["amount_receivable"] > 0]
        for cust, grp in wo_ar.groupby("customer_code"):
            top_ar_accounts.append({
                "account": cust,
                "receivable": float(grp["amount_receivable"].sum()),
                "sector": grp["sector"].iloc[0] if "sector" in grp else "N/A",
                "orders_count": len(grp)
            })
        top_ar_accounts.sort(key=lambda x: x["receivable"], reverse=True)
        top_ar_accounts = top_ar_accounts[:6]

    # 5. Efficiency KPI Metrics
    collection_eff = rev.get("collection_efficiency_pct") or 0.0
    total_wo = ops.get("total_work_orders", 0)
    completed_wo = ops.get("completed_work_orders", 0)
    delivery_rate = round((completed_wo / total_wo * 100.0), 1) if total_wo > 0 else 0.0

    return {
        "funnel": funnel,
        "sectors": top_sectors,
        "execution_breakdown": execution_pie,
        "top_ar_accounts": top_ar_accounts,
        "gauges": {
            "collection_efficiency_pct": collection_eff,
            "delivery_rate_pct": delivery_rate,
            "delayed_count": ops.get("delayed_work_orders_count", 0),
            "active_count": ops.get("active_work_orders", 0)
        }
    }

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty query provided.")

    # Refresh data if not yet loaded
    if state.deals_df.empty and state.wo_df.empty:
        refresh_data()

    combined_dq = {
        "deals": state.deals_dq,
        "work_orders": state.wo_dq,
        "warnings": state.deals_dq.get("warnings", []) + state.wo_dq.get("warnings", [])
    }

    result = bi_agent.answer_question(
        user_message=req.message,
        deals_df=state.deals_df,
        wo_df=state.wo_df,
        dq_report=combined_dq
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        data_quality=result["data_quality"]
    )

@app.post("/config")
def update_config(cfg: ConfigUpdateRequest):
    """Allows securely providing or updating credentials at runtime."""
    env_lines = []
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    
    current_vals = {}
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                if "=" in line:
                    k, v = line.strip().split("=", 1)
                    current_vals[k] = v

    if cfg.monday_api_token is not None: current_vals["MONDAY_API_TOKEN"] = cfg.monday_api_token
    if cfg.monday_deals_board_id is not None: current_vals["MONDAY_DEALS_BOARD_ID"] = cfg.monday_deals_board_id
    if cfg.monday_work_orders_board_id is not None: current_vals["MONDAY_WORK_ORDERS_BOARD_ID"] = cfg.monday_work_orders_board_id
    if cfg.openai_api_key is not None: current_vals["OPENAI_API_KEY"] = cfg.openai_api_key

    with open(env_file, "w") as f:
        for k, v in current_vals.items():
            f.write(f"{k}={v}\n")

    load_dotenv(env_file, override=True)
    refresh_data()
    return {"success": True, "message": "Configuration updated and data refreshed."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
