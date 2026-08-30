import math
import logging
from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

def safe_float(val: Any) -> float:
    if val is None or (isinstance(val, float) and (np.isnan(val) or math.isnan(val))):
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0

def get_quarter_bounds(period_str: str, base_date: Optional[datetime] = None) -> Tuple[pd.Timestamp, pd.Timestamp, str]:
    """
    Parses natural language quarter/year strings into (start_timestamp, end_timestamp, period_label).
    Supports: "this quarter", "last quarter", "Q1", "Q2", "Q3", "Q4", "this year", "last year", etc.
    """
    now = base_date or datetime.now()
    year = now.year
    curr_q = (now.month - 1) // 3 + 1
    
    p = period_str.strip().lower() if period_str else "all time"
    
    if "this quarter" in p or "current quarter" in p:
        q = curr_q
        q_start = pd.Timestamp(year, (q - 1) * 3 + 1, 1)
        # End of quarter
        if q == 4:
            q_end = pd.Timestamp(year, 12, 31, 23, 59, 59)
        else:
            q_end = pd.Timestamp(year, q * 3 + 1, 1) - pd.Timedelta(seconds=1)
        return q_start, q_end, f"Q{q} {year}"

    elif "last quarter" in p or "previous quarter" in p:
        q = curr_q - 1
        q_year = year
        if q == 0:
            q = 4
            q_year -= 1
        q_start = pd.Timestamp(q_year, (q - 1) * 3 + 1, 1)
        if q == 4:
            q_end = pd.Timestamp(q_year, 12, 31, 23, 59, 59)
        else:
            q_end = pd.Timestamp(q_year, q * 3 + 1, 1) - pd.Timedelta(seconds=1)
        return q_start, q_end, f"Q{q} {q_year}"

    elif "this year" in p or "current year" in p:
        return pd.Timestamp(year, 1, 1), pd.Timestamp(year, 12, 31, 23, 59, 59), f"{year}"

    elif "last year" in p or "previous year" in p:
        return pd.Timestamp(year - 1, 1, 1), pd.Timestamp(year - 1, 12, 31, 23, 59, 59), f"{year - 1}"

    # Specific quarter search, e.g. "q1 2024" or "q2"
    for q_num in range(1, 5):
        if f"q{q_num}" in p:
            # Check for year
            import re
            year_match = re.search(r"20\d\d", p)
            target_year = int(year_match.group(0)) if year_match else year
            q_start = pd.Timestamp(target_year, (q_num - 1) * 3 + 1, 1)
            if q_num == 4:
                q_end = pd.Timestamp(target_year, 12, 31, 23, 59, 59)
            else:
                q_end = pd.Timestamp(target_year, q_num * 3 + 1, 1) - pd.Timedelta(seconds=1)
            return q_start, q_end, f"Q{q_num} {target_year}"

    # Default to all-time
    return pd.Timestamp("1970-01-01"), pd.Timestamp("2099-12-31"), "All Time"

class AnalyticsEngine:
    def __init__(self):
        pass

    def filter_deals(self, deals_df: pd.DataFrame, quarter: Optional[str] = None, sector: Optional[str] = None) -> pd.DataFrame:
        """Filters deals dataframe by quarter and sector if provided."""
        if deals_df.empty:
            return deals_df
        df = deals_df.copy()
        if sector and sector.lower() not in ["all", "all sectors"]:
            sec_lower = sector.strip().lower()
            df = df[df["sector"].str.lower().str.contains(sec_lower, na=False) | (df["sector"].str.lower() == sec_lower)]
        
        if quarter and quarter.lower() not in ["all", "all time"]:
            start_ts, end_ts, _ = get_quarter_bounds(quarter)
            # Filter by effective_date or close_date or tentative_close_date
            mask = (df["effective_date"] >= start_ts) & (df["effective_date"] <= end_ts)
            df = df[mask]
        return df

    def filter_work_orders(self, wo_df: pd.DataFrame, quarter: Optional[str] = None, sector: Optional[str] = None) -> pd.DataFrame:
        """Filters work orders dataframe by quarter and sector if provided."""
        if wo_df.empty:
            return wo_df
        df = wo_df.copy()
        if sector and sector.lower() not in ["all", "all sectors"]:
            sec_lower = sector.strip().lower()
            df = df[df["sector"].str.lower().str.contains(sec_lower, na=False) | (df["sector"].str.lower() == sec_lower)]

        if quarter and quarter.lower() not in ["all", "all time"]:
            start_ts, end_ts, _ = get_quarter_bounds(quarter)
            # Filter by po_date or delivery_date or end_date
            date_col = "po_date" if "po_date" in df.columns and df["po_date"].notna().any() else "delivery_date"
            if date_col in df.columns:
                mask = (df[date_col] >= start_ts) & (df[date_col] <= end_ts)
                df = df[mask]
        return df

    def pipeline_health(self, deals_df: pd.DataFrame, quarter: Optional[str] = None, sector: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates pipeline health metrics including total pipeline value, weighted expected value,
        stage distribution, sector distribution, and win rate.
        """
        filtered_df = self.filter_deals(deals_df, quarter=quarter, sector=sector)
        if filtered_df.empty:
            return {
                "period": quarter or "All Time",
                "sector_filter": sector or "All",
                "total_deals": 0,
                "open_deals_count": 0,
                "won_deals_count": 0,
                "lost_deals_count": 0,
                "total_pipeline_value": 0.0,
                "expected_pipeline_value": 0.0,
                "win_rate_pct": None,
                "win_rate_note": "No deals matching the criteria.",
                "stages": {},
                "sectors": {},
                "upcoming_deals": []
            }

        total_deals = len(filtered_df)
        
        # Categorize deal status
        status_s = filtered_df["deal_status"].str.lower().fillna("")
        stage_s = filtered_df["deal_stage"].str.lower().fillna("")

        won_mask = status_s.str.contains("won|closed won|win", regex=True) | stage_s.str.contains("won|closed won|win", regex=True)
        lost_mask = status_s.str.contains("lost|closed lost|dropped", regex=True) | stage_s.str.contains("lost|closed lost", regex=True)
        open_mask = (~won_mask) & (~lost_mask)

        won_deals_count = int(won_mask.sum())
        lost_deals_count = int(lost_mask.sum())
        open_deals_count = int(open_mask.sum())

        # Financials for open deals
        open_deals = filtered_df[open_mask]
        total_pipeline_val = float(open_deals["deal_value"].dropna().sum())
        expected_pipeline_val = float(open_deals["expected_value"].dropna().sum())
        
        # Total won value
        won_deals = filtered_df[won_mask]
        won_value = float(won_deals["deal_value"].dropna().sum())

        # Win rate calculation: Won Deals / (Won Deals + Lost Deals)
        closed_deals_count = won_deals_count + lost_deals_count
        if closed_deals_count > 0:
            win_rate_pct = round((won_deals_count / closed_deals_count) * 100.0, 2)
            win_rate_note = f"Win Rate = Won ({won_deals_count}) / Closed Deals ({closed_deals_count}) = {win_rate_pct}%"
        else:
            win_rate_pct = None
            win_rate_note = "Win rate cannot be calculated reliably because there are no closed deals in this view."

        # Deals by stage
        stages_summary = {}
        for stg, grp in filtered_df.groupby("deal_stage"):
            stages_summary[stg] = {
                "count": len(grp),
                "total_value": float(grp["deal_value"].dropna().sum()),
                "expected_value": float(grp["expected_value"].dropna().sum())
            }

        # Deals by sector
        sectors_summary = {}
        for sec, grp in filtered_df.groupby("sector"):
            sectors_summary[sec] = {
                "count": len(grp),
                "open_count": int((~grp["deal_status"].str.lower().str.contains("won|lost", na=False)).sum()),
                "total_pipeline_value": float(grp[~grp["deal_status"].str.lower().str.contains("won|lost", na=False)]["deal_value"].dropna().sum()),
                "expected_value": float(grp["expected_value"].dropna().sum())
            }

        # Upcoming deals
        upcoming = []
        open_with_dates = open_deals.sort_values(by="effective_date", ascending=True)
        for _, row in open_with_dates.head(5).iterrows():
            upcoming.append({
                "deal_name": row.get("deal_name"),
                "sector": row.get("sector"),
                "value": row.get("deal_value"),
                "closure_probability": row.get("closure_probability"),
                "target_close_date": row.get("tentative_close_date_str") or row.get("close_date_str") or "Not set"
            })

        return {
            "period": quarter or "All Time",
            "sector_filter": sector or "All",
            "total_deals": total_deals,
            "open_deals_count": open_deals_count,
            "won_deals_count": won_deals_count,
            "lost_deals_count": lost_deals_count,
            "won_value": won_value,
            "total_pipeline_value": total_pipeline_val,
            "expected_pipeline_value": round(expected_pipeline_val, 2),
            "win_rate_pct": win_rate_pct,
            "win_rate_note": win_rate_note,
            "stages": stages_summary,
            "sectors": sectors_summary,
            "upcoming_deals": upcoming
        }

    def revenue_analysis(self, deals_df: pd.DataFrame, wo_df: pd.DataFrame, quarter: Optional[str] = None, sector: Optional[str] = None) -> Dict[str, Any]:
        """
        Distinguishes Deal Value, Expected Value, Contract Amount, Billed Value, Collected Amount,
        Receivables, and Amount to be Billed.
        """
        f_deals = self.filter_deals(deals_df, quarter=quarter, sector=sector)
        f_wo = self.filter_work_orders(wo_df, quarter=quarter, sector=sector)

        # Deals metrics
        won_deals_val = 0.0
        expected_pipe_val = 0.0
        if not f_deals.empty:
            won_mask = f_deals["deal_status"].str.lower().str.contains("won|win", na=False) | f_deals["deal_stage"].str.lower().str.contains("won|win", na=False)
            won_deals_val = float(f_deals[won_mask]["deal_value"].dropna().sum())
            open_mask = ~f_deals["deal_status"].str.lower().str.contains("won|lost", na=False)
            expected_pipe_val = float(f_deals[open_mask]["expected_value"].dropna().sum())

        # Work orders metrics
        wo_contract_excl_gst = float(f_wo["amount_excl_gst"].dropna().sum()) if not f_wo.empty and "amount_excl_gst" in f_wo else 0.0
        wo_contract_incl_gst = float(f_wo["amount_incl_gst"].dropna().sum()) if not f_wo.empty and "amount_incl_gst" in f_wo else 0.0
        billed_excl_gst = float(f_wo["billed_value_excl_gst"].dropna().sum()) if not f_wo.empty and "billed_value_excl_gst" in f_wo else 0.0
        billed_incl_gst = float(f_wo["billed_value_incl_gst"].dropna().sum()) if not f_wo.empty and "billed_value_incl_gst" in f_wo else 0.0
        collected_amount = float(f_wo["collected_amount"].dropna().sum()) if not f_wo.empty and "collected_amount" in f_wo else 0.0
        amount_receivable = float(f_wo["amount_receivable"].dropna().sum()) if not f_wo.empty and "amount_receivable" in f_wo else 0.0
        amount_to_be_billed = float(f_wo["amount_to_be_billed"].dropna().sum()) if not f_wo.empty and "amount_to_be_billed" in f_wo else 0.0

        # Collection efficiency: collected / billed (incl GST)
        ref_billed = billed_incl_gst if billed_incl_gst > 0 else billed_excl_gst
        collection_efficiency_pct = round((collected_amount / ref_billed) * 100.0, 2) if ref_billed > 0 else None

        # Billing progress: billed / contract amount
        ref_contract = wo_contract_excl_gst if wo_contract_excl_gst > 0 else wo_contract_incl_gst
        ref_billed_prog = billed_excl_gst if wo_contract_excl_gst > 0 else billed_incl_gst
        billing_progress_pct = round((ref_billed_prog / ref_contract) * 100.0, 2) if ref_contract > 0 else None

        return {
            "period": quarter or "All Time",
            "sector_filter": sector or "All",
            "closed_won_deal_value": won_deals_val,
            "expected_pipeline_revenue": round(expected_pipe_val, 2),
            "work_order_total_contract_excl_gst": wo_contract_excl_gst,
            "work_order_total_contract_incl_gst": wo_contract_incl_gst,
            "billed_value_excl_gst": billed_excl_gst,
            "billed_value_incl_gst": billed_incl_gst,
            "collected_amount": collected_amount,
            "amount_receivable": amount_receivable,
            "amount_to_be_billed": amount_to_be_billed,
            "collection_efficiency_pct": collection_efficiency_pct,
            "billing_progress_pct": billing_progress_pct
        }

    def sector_analysis(self, deals_df: pd.DataFrame, wo_df: pd.DataFrame, quarter: Optional[str] = None) -> Dict[str, Any]:
        """
        Cross-sector analytical comparison integrating Deals pipeline and Work Orders execution.
        """
        f_deals = self.filter_deals(deals_df, quarter=quarter)
        f_wo = self.filter_work_orders(wo_df, quarter=quarter)

        all_sectors = set()
        if not f_deals.empty and "sector" in f_deals:
            all_sectors.update(f_deals["sector"].dropna().unique())
        if not f_wo.empty and "sector" in f_wo:
            all_sectors.update(f_wo["sector"].dropna().unique())

        sector_data = {}
        for sec in sorted(all_sectors):
            d_sub = f_deals[f_deals["sector"] == sec] if not f_deals.empty else pd.DataFrame()
            w_sub = f_wo[f_wo["sector"] == sec] if not f_wo.empty else pd.DataFrame()

            # Deals metrics
            d_count = len(d_sub)
            d_open_mask = ~d_sub["deal_status"].str.lower().str.contains("won|lost", na=False) if not d_sub.empty else pd.Series(dtype=bool)
            d_pipeline_val = float(d_sub[d_open_mask]["deal_value"].dropna().sum()) if not d_sub.empty else 0.0
            d_expected_val = float(d_sub[d_open_mask]["expected_value"].dropna().sum()) if not d_sub.empty else 0.0
            d_won_val = float(d_sub[d_sub["deal_status"].str.lower().str.contains("won", na=False)]["deal_value"].dropna().sum()) if not d_sub.empty else 0.0

            # WO metrics
            w_count = len(w_sub)
            w_billed = float(w_sub["billed_value_excl_gst"].dropna().sum()) if not w_sub.empty and "billed_value_excl_gst" in w_sub else 0.0
            w_collected = float(w_sub["collected_amount"].dropna().sum()) if not w_sub.empty and "collected_amount" in w_sub else 0.0
            w_receivable = float(w_sub["amount_receivable"].dropna().sum()) if not w_sub.empty and "amount_receivable" in w_sub else 0.0
            w_delayed = int(w_sub["is_delayed"].sum()) if not w_sub.empty and "is_delayed" in w_sub else 0
            w_active = int(w_sub["execution_status"].str.lower().isin(["in progress", "ongoing", "started", "pending"]).sum()) if not w_sub.empty else 0

            sector_data[sec] = {
                "deals_count": d_count,
                "pipeline_value": d_pipeline_val,
                "expected_pipeline_value": round(d_expected_val, 2),
                "won_deal_value": d_won_val,
                "work_orders_count": w_count,
                "active_projects": w_active,
                "delayed_projects": w_delayed,
                "billed_amount": w_billed,
                "collected_amount": w_collected,
                "receivables": w_receivable
            }

        # Rankings
        sorted_by_pipe = sorted(sector_data.items(), key=lambda x: x[1]["pipeline_value"], reverse=True)
        top_pipe_sector = sorted_by_pipe[0][0] if sorted_by_pipe else "None"

        sorted_by_rev = sorted(sector_data.items(), key=lambda x: x[1]["collected_amount"], reverse=True)
        top_rev_sector = sorted_by_rev[0][0] if sorted_by_rev else "None"

        return {
            "period": quarter or "All Time",
            "sectors": sector_data,
            "top_pipeline_sector": top_pipe_sector,
            "top_revenue_sector": top_rev_sector
        }

    def work_order_analysis(self, wo_df: pd.DataFrame, quarter: Optional[str] = None, sector: Optional[str] = None) -> Dict[str, Any]:
        """
        Detailed operational work order analytics: status breakdowns, delays, delivery performance.
        """
        f_wo = self.filter_work_orders(wo_df, quarter=quarter, sector=sector)
        if f_wo.empty:
            return {
                "period": quarter or "All Time",
                "sector_filter": sector or "All",
                "total_work_orders": 0,
                "active_work_orders": 0,
                "completed_work_orders": 0,
                "delayed_work_orders_count": 0,
                "delayed_work_orders": [],
                "financial_totals": {
                    "contract_amount_excl_gst": 0.0,
                    "billed_amount_excl_gst": 0.0,
                    "collected_amount": 0.0,
                    "amount_receivable": 0.0,
                    "amount_to_be_billed": 0.0
                },
                "execution_status_breakdown": {},
                "invoice_status_breakdown": {},
                "collection_status_breakdown": {}
            }

        total_wo = len(f_wo)
        exec_s = f_wo["execution_status"].str.lower().fillna("")
        
        active_count = int(exec_s.isin(["in progress", "ongoing", "started", "pending"]).sum())
        completed_count = int(exec_s.isin(["completed", "delivered", "done", "closed"]).sum())
        delayed_mask = f_wo["is_delayed"] == True
        delayed_count = int(delayed_mask.sum())

        delayed_list = []
        for _, row in f_wo[delayed_mask].iterrows():
            delayed_list.append({
                "serial_no": row.get("serial_no"),
                "deal_name": row.get("deal_name"),
                "customer": row.get("customer_code"),
                "sector": row.get("sector"),
                "execution_status": row.get("execution_status"),
                "target_end_date": row.get("end_date_str") or row.get("delivery_date_str") or "Unknown",
                "amount_receivable": row.get("amount_receivable")
            })

        exec_breakdown = f_wo["execution_status"].value_counts().to_dict()
        inv_breakdown = f_wo["invoice_status"].value_counts().to_dict()
        col_breakdown = f_wo["collection_status"].value_counts().to_dict()

        return {
            "period": quarter or "All Time",
            "sector_filter": sector or "All",
            "total_work_orders": total_wo,
            "active_work_orders": active_count,
            "completed_work_orders": completed_count,
            "delayed_work_orders_count": delayed_count,
            "delayed_work_orders": delayed_list,
            "financial_totals": {
                "contract_amount_excl_gst": float(f_wo["amount_excl_gst"].dropna().sum()) if "amount_excl_gst" in f_wo else 0.0,
                "billed_amount_excl_gst": float(f_wo["billed_value_excl_gst"].dropna().sum()) if "billed_value_excl_gst" in f_wo else 0.0,
                "collected_amount": float(f_wo["collected_amount"].dropna().sum()) if "collected_amount" in f_wo else 0.0,
                "amount_receivable": float(f_wo["amount_receivable"].dropna().sum()) if "amount_receivable" in f_wo else 0.0,
                "amount_to_be_billed": float(f_wo["amount_to_be_billed"].dropna().sum()) if "amount_to_be_billed" in f_wo else 0.0
            },
            "execution_status_breakdown": exec_breakdown,
            "invoice_status_breakdown": inv_breakdown,
            "collection_status_breakdown": col_breakdown
        }

    def quarter_analysis(self, deals_df: pd.DataFrame, wo_df: pd.DataFrame, period: str = "this quarter") -> Dict[str, Any]:
        """
        Calculates quarterly comparative performance for both Deals and Work Orders.
        """
        start_ts, end_ts, label = get_quarter_bounds(period)
        
        # Quarter slice
        q_deals = self.filter_deals(deals_df, quarter=period)
        q_wo = self.filter_work_orders(wo_df, quarter=period)

        pipe = self.pipeline_health(deals_df, quarter=period)
        rev = self.revenue_analysis(deals_df, wo_df, quarter=period)
        wo_ops = self.work_order_analysis(wo_df, quarter=period)

        return {
            "period_label": label,
            "date_range": f"{start_ts.strftime('%Y-%m-%d')} to {end_ts.strftime('%Y-%m-%d')}",
            "pipeline": pipe,
            "revenue": rev,
            "operations": wo_ops
        }

    def leadership_summary(self, deals_df: pd.DataFrame, wo_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Produces an aggregated, executive briefing data structure for high-level leadership updates.
        """
        pipe = self.pipeline_health(deals_df)
        rev = self.revenue_analysis(deals_df, wo_df)
        sectors = self.sector_analysis(deals_df, wo_df)
        wo_ops = self.work_order_analysis(wo_df)

        # Identify key business risks
        risks = []
        if rev["amount_receivable"] > 0:
            rec_str = f"Rs. {rev['amount_receivable']:,.2f}" if rev['amount_receivable'] > 0 else "0"
            risks.append(f"Outstanding receivables of {rec_str} need collection acceleration.")
        if wo_ops["delayed_work_orders_count"] > 0:
            risks.append(f"{wo_ops['delayed_work_orders_count']} work orders are past target completion date and need operational intervention.")
        if pipe["open_deals_count"] > 0 and pipe["total_pipeline_value"] == 0:
            risks.append("Multiple active pipeline deals have unpopulated deal values in monday.com.")

        # Identify top growth sector
        top_sector = sectors.get("top_pipeline_sector", "N/A")

        return {
            "timestamp": datetime.now().isoformat(),
            "pipeline": pipe,
            "revenue": rev,
            "sectors": sectors,
            "operations": wo_ops,
            "key_risks": risks,
            "top_pipeline_sector": top_sector
        }
