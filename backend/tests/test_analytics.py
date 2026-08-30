import pytest
import pandas as pd
from services.analytics import AnalyticsEngine, get_quarter_bounds

def test_quarter_bounds():
    start, end, label = get_quarter_bounds("Q1 2024")
    assert label == "Q1 2024"
    assert start.strftime("%Y-%m-%d") == "2024-01-01"
    assert end.strftime("%Y-%m-%d") == "2024-03-31"

def test_pipeline_and_revenue_analytics():
    engine = AnalyticsEngine()
    
    deals_data = [
        {"deal_name": "D1", "deal_status": "Won", "deal_stage": "Won", "sector": "Energy", "deal_value": 100000.0, "closure_probability": 1.0, "expected_value": 100000.0, "effective_date": pd.Timestamp("2024-02-01")},
        {"deal_name": "D2", "deal_status": "Lost", "deal_stage": "Closed Lost", "sector": "Mining", "deal_value": 50000.0, "closure_probability": 0.0, "expected_value": 0.0, "effective_date": pd.Timestamp("2024-02-10")},
        {"deal_name": "D3", "deal_status": "Proposal Sent", "deal_stage": "Proposal", "sector": "Energy", "deal_value": 200000.0, "closure_probability": 0.5, "expected_value": 100000.0, "effective_date": pd.Timestamp("2024-03-15")}
    ]
    deals_df = pd.DataFrame(deals_data)

    wo_data = [
        {
            "serial_no": "WO-1",
            "deal_name": "D1",
            "sector": "Energy",
            "execution_status": "Completed",
            "invoice_status": "Billed",
            "collection_status": "Collected",
            "amount_excl_gst": 100000.0,
            "amount_incl_gst": 118000.0,
            "billed_value_excl_gst": 100000.0,
            "billed_value_incl_gst": 118000.0,
            "collected_amount": 118000.0,
            "amount_receivable": 0.0,
            "amount_to_be_billed": 0.0,
            "is_delayed": False,
            "po_date": pd.Timestamp("2024-02-05")
        },
        {
            "serial_no": "WO-2",
            "deal_name": "D3",
            "sector": "Energy",
            "execution_status": "In Progress",
            "invoice_status": "Unbilled",
            "collection_status": "Pending",
            "amount_excl_gst": 200000.0,
            "amount_incl_gst": 236000.0,
            "billed_value_excl_gst": 50000.0,
            "billed_value_incl_gst": 59000.0,
            "collected_amount": 0.0,
            "amount_receivable": 59000.0,
            "amount_to_be_billed": 150000.0,
            "is_delayed": True,
            "po_date": pd.Timestamp("2024-03-01")
        }
    ]
    wo_df = pd.DataFrame(wo_data)

    # Test Pipeline
    pipe = engine.pipeline_health(deals_df)
    assert pipe["total_deals"] == 3
    assert pipe["open_deals_count"] == 1
    assert pipe["won_deals_count"] == 1
    assert pipe["lost_deals_count"] == 1
    assert pipe["win_rate_pct"] == 50.0  # 1 won / (1 won + 1 lost)
    assert pipe["total_pipeline_value"] == 200000.0
    assert pipe["expected_pipeline_value"] == 100000.0

    # Test Revenue
    rev = engine.revenue_analysis(deals_df, wo_df)
    assert rev["closed_won_deal_value"] == 100000.0
    assert rev["amount_receivable"] == 59000.0
    assert rev["collected_amount"] == 118000.0

    # Test Operations
    ops = engine.work_order_analysis(wo_df)
    assert ops["total_work_orders"] == 2
    assert ops["delayed_work_orders_count"] == 1

    # Test Leadership summary
    summary = engine.leadership_summary(deals_df, wo_df)
    assert len(summary["key_risks"]) >= 1
