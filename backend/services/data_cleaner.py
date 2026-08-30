import re
import math
import logging
import warnings
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

MISSING_STRINGS = {"", "null", "none", "n/a", "na", "-", "--", "*", "**", "unknown", "nan", "nil", "undefined"}

SECTOR_CANONICAL_MAP = {
    "energy": "Energy",
    "energy sector": "Energy",
    "power": "Energy",
    "renewables": "Energy",
    "solar": "Energy",
    "wind": "Energy",
    "oil & gas": "Oil & Gas",
    "oil and gas": "Oil & Gas",
    "mining": "Mining",
    "mining sector": "Mining",
    "infra": "Infrastructure",
    "infrastructure": "Infrastructure",
    "roads": "Infrastructure",
    "highways": "Infrastructure",
    "construction": "Infrastructure",
    "agriculture": "Agriculture",
    "agri": "Agriculture",
    "farming": "Agriculture",
    "forestry": "Forestry",
    "telecom": "Telecom",
    "telecommunications": "Telecom",
    "utilities": "Utilities",
    "utility": "Utilities",
    "government": "Government",
    "defence": "Defense",
    "defense": "Defense",
    "enterprise": "Enterprise",
    "security": "Security",
    "survey": "Survey & Mapping",
    "mapping": "Survey & Mapping",
}

class DataCleaner:
    def __init__(self):
        pass

    @staticmethod
    def is_missing(val: Any) -> bool:
        """Returns True if the value represents a missing or invalid placeholder."""
        if val is None:
            return True
        if isinstance(val, float) and (np.isnan(val) or math.isnan(val)):
            return True
        s = str(val).strip().lower()
        return s in MISSING_STRINGS

    @classmethod
    def clean_numeric(cls, val: Any) -> Tuple[Optional[float], Optional[str]]:
        """
        Parses numeric strings, currency symbols (₹, $, Rs), commas, and spaces.
        Returns (parsed_float_or_None, error_note_if_any).
        """
        if cls.is_missing(val):
            return None, None

        if isinstance(val, (int, float)):
            if np.isnan(val):
                return None, None
            return float(val), None

        s = str(val).strip()
        # Remove currency markers and spaces
        cleaned = re.sub(r"[₹\$,\s]|(Rs\.?)|(INR)", "", s, flags=re.IGNORECASE)
        
        # Check percentage
        is_pct = False
        if cleaned.endswith("%"):
            is_pct = True
            cleaned = cleaned[:-1].strip()

        try:
            num = float(cleaned)
            if is_pct:
                num = num / 100.0 if num > 1.0 else num
            return num, None
        except ValueError:
            return None, f"Could not parse numeric value: '{val}'"

    @classmethod
    def clean_date(cls, val: Any) -> Tuple[Optional[pd.Timestamp], Optional[str], Optional[str]]:
        """
        Parses dates in formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, ISO, etc.
        Returns (timestamp_or_None, formatted_str_or_None, error_note_if_any).
        """
        if cls.is_missing(val):
            return None, None, None

        if isinstance(val, (pd.Timestamp, np.datetime64)):
            ts = pd.to_datetime(val)
            return ts, ts.strftime("%Y-%m-%d"), None

        s = str(val).strip()
        # Handle Excel date numbers if applicable
        if s.isdigit() and len(s) == 5:
            try:
                ts = pd.to_datetime("1899-12-30") + pd.to_timedelta(int(s), unit="D")
                return ts, ts.strftime("%Y-%m-%d"), None
            except Exception:
                pass

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # If ISO YYYY-MM-DD format
            if re.match(r"^\d{4}-\d{2}-\d{2}", s):
                try:
                    ts = pd.to_datetime(s, dayfirst=False, errors="raise")
                    return ts, ts.strftime("%Y-%m-%d"), None
                except Exception:
                    pass
            try:
                ts = pd.to_datetime(s, dayfirst=True, errors="raise")
                return ts, ts.strftime("%Y-%m-%d"), None
            except Exception:
                try:
                    ts = pd.to_datetime(s, errors="raise")
                    return ts, ts.strftime("%Y-%m-%d"), None
                except Exception:
                    return None, None, f"Invalid date string: '{val}'"

    @classmethod
    def normalize_sector(cls, val: Any) -> Tuple[str, Optional[str]]:
        """Normalizes sector text to a canonical name while preserving original."""
        if cls.is_missing(val):
            return "Unknown / Unspecified", None

        s = str(val).strip()
        key = s.lower()
        if key in SECTOR_CANONICAL_MAP:
            return SECTOR_CANONICAL_MAP[key], None

        # Clean punctuation and extra spaces
        cleaned_key = re.sub(r"[^\w\s]", " ", key)
        cleaned_key = re.sub(r"\s+", " ", cleaned_key).strip()
        for k, canonical in SECTOR_CANONICAL_MAP.items():
            if k == cleaned_key or k in cleaned_key.split():
                return canonical, None

        # Capitalize nicely if not mapped
        return s.title(), f"Unrecognized sector format mapped to '{s.title()}'"

    @classmethod
    def find_column(cls, df_columns: List[str], candidates: List[str]) -> Optional[str]:
        """Finds a column in df_columns matching any of the candidate names case-insensitively."""
        col_lookup = {c.lower().strip(): c for c in df_columns}
        for cand in candidates:
            cand_lower = cand.lower().strip()
            if cand_lower in col_lookup:
                return col_lookup[cand_lower]
            # Partial match
            for cl, orig in col_lookup.items():
                if cand_lower in cl or cl in cand_lower:
                    return orig
        return None

    def clean_deals(self, raw_deals: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Cleans Deals records, normalizes numeric values, dates, sectors, stages, probabilities.
        Returns cleaned DataFrame and data quality report for Deals.
        """
        if not raw_deals:
            return pd.DataFrame(), {
                "total_records": 0,
                "missing_deal_value_count": 0,
                "missing_effective_dates_count": 0,
                "invalid_dates": [],
                "potential_duplicates_count": 0,
                "potential_duplicates": [],
                "warnings": ["No Deals records retrieved from monday.com."]
            }

        df = pd.DataFrame(raw_deals)
        quality_warnings = []
        invalid_dates = []

        cols = list(df.columns)
        deal_name_col = self.find_column(cols, ["Deal Name", "Name", "Deal name masked"])
        owner_col = self.find_column(cols, ["Owner code", "Owner", "BD/KAM"])
        client_col = self.find_column(cols, ["Client Code", "Client", "Customer Name Code"])
        status_col = self.find_column(cols, ["Deal Status", "Status"])
        close_date_col = self.find_column(cols, ["Close Date (A)", "Close Date", "Actual Close Date"])
        prob_close_date_col = self.find_column(cols, ["Tentative Close Date", "Probable Close Date", "Expected Close Date"])
        prob_col = self.find_column(cols, ["Closure Probability", "Probability", "Win Probability"])
        val_col = self.find_column(cols, ["Masked Deal value", "Deal value", "Deal Value", "Amount in Rupees", "Value"])
        stage_col = self.find_column(cols, ["Deal Stage", "Stage"])
        sector_col = self.find_column(cols, ["Sector/service", "Sector", "Service"])
        created_date_col = self.find_column(cols, ["Created Date", "Date of Creation", "Created"])

        cleaned_records = []
        for idx, row in df.iterrows():
            item_id = row.get("_item_id", f"deal_{idx}")
            name = str(row.get(deal_name_col, "")).strip() if deal_name_col else f"Deal {idx+1}"
            owner = str(row.get(owner_col, "")).strip() if owner_col and not self.is_missing(row.get(owner_col)) else "Unassigned"
            client = str(row.get(client_col, "")).strip() if client_col and not self.is_missing(row.get(client_col)) else "Unknown"
            status = str(row.get(status_col, "")).strip() if status_col and not self.is_missing(row.get(status_col)) else "Open"
            stage = str(row.get(stage_col, "")).strip() if stage_col and not self.is_missing(row.get(stage_col)) else "Unknown Stage"

            # Clean Sector
            raw_sector = row.get(sector_col) if sector_col else None
            norm_sector, _ = self.normalize_sector(raw_sector)

            # Clean Value
            raw_val = row.get(val_col) if val_col else None
            deal_val, val_err = self.clean_numeric(raw_val)
            if val_err:
                quality_warnings.append(f"Deal '{name}' (ID: {item_id}): {val_err}")

            # Clean Probability
            raw_prob = row.get(prob_col) if prob_col else None
            prob_val, prob_err = self.clean_numeric(raw_prob)
            if prob_val is not None:
                if prob_val > 1.0:
                    prob_val = prob_val / 100.0
                prob_val = max(0.0, min(1.0, prob_val))
            else:
                prob_val = 0.5  # default neutral probability for pipeline calculation if unknown

            # Clean Close Date
            raw_close_date = row.get(close_date_col) if close_date_col else None
            close_ts, close_str, close_err = self.clean_date(raw_close_date)
            if close_err and raw_close_date is not None:
                invalid_dates.append(f"Deal '{name}' Close Date: {close_err}")

            # Clean Tentative / Probable Close Date
            raw_tent_date = row.get(prob_close_date_col) if prob_close_date_col else None
            tent_ts, tent_str, tent_err = self.clean_date(raw_tent_date)
            if tent_err and raw_tent_date is not None:
                invalid_dates.append(f"Deal '{name}' Tentative Close Date: {tent_err}")

            effective_date = close_ts if close_ts is not None else tent_ts

            expected_val = (deal_val * prob_val) if (deal_val is not None and prob_val is not None) else None

            cleaned_records.append({
                "_item_id": item_id,
                "deal_name": name,
                "owner": owner,
                "client_code": client,
                "deal_status": status,
                "deal_stage": stage,
                "sector_raw": raw_sector,
                "sector": norm_sector,
                "deal_value": deal_val,
                "closure_probability": prob_val,
                "expected_value": expected_val,
                "close_date": close_ts,
                "close_date_str": close_str,
                "tentative_close_date": tent_ts,
                "tentative_close_date_str": tent_str,
                "effective_date": effective_date,
            })

        clean_df = pd.DataFrame(cleaned_records)

        # Duplicate detection
        duplicates = []
        if not clean_df.empty:
            dup_mask = clean_df.duplicated(subset=["deal_name", "client_code"], keep=False)
            dup_df = clean_df[dup_mask]
            if not dup_df.empty:
                for name, group in dup_df.groupby("deal_name"):
                    duplicates.append({
                        "deal_name": name,
                        "count": len(group),
                        "item_ids": group["_item_id"].tolist()
                    })

        missing_vals_count = int(clean_df["deal_value"].isna().sum()) if not clean_df.empty else 0
        missing_dates_count = int(clean_df["effective_date"].isna().sum()) if not clean_df.empty else 0

        dq_report = {
            "total_records": len(clean_df),
            "missing_deal_value_count": missing_vals_count,
            "missing_effective_dates_count": missing_dates_count,
            "invalid_dates": invalid_dates,
            "potential_duplicates_count": len(duplicates),
            "potential_duplicates": duplicates,
            "warnings": quality_warnings
        }

        return clean_df, dq_report

    def clean_work_orders(self, raw_wo: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Cleans Work Order records, normalizes financials, dates, statuses, execution progress.
        Returns cleaned DataFrame and data quality report for Work Orders.
        """
        if not raw_wo:
            return pd.DataFrame(), {
                "total_records": 0,
                "missing_receivables_count": 0,
                "missing_collected_count": 0,
                "invalid_dates": [],
                "potential_duplicates_count": 0,
                "potential_duplicates": [],
                "warnings": ["No Work Orders records retrieved from monday.com."]
            }

        df = pd.DataFrame(raw_wo)
        quality_warnings = []
        invalid_dates = []

        cols = list(df.columns)
        deal_name_col = self.find_column(cols, ["Deal name masked", "Deal Name", "Name"])
        serial_col = self.find_column(cols, ["Serial #", "Serial", "WO Number", "ID"])
        cust_col = self.find_column(cols, ["Customer Name Code", "Customer", "Client Code"])
        exec_status_col = self.find_column(cols, ["Execution Status", "Execution", "Ops Status"])
        sector_col = self.find_column(cols, ["Sector", "Sector/service"])
        type_work_col = self.find_column(cols, ["Type of Work", "Nature of Work"])
        
        # Financial columns
        amt_excl_col = self.find_column(cols, ["Amount in Rupees (Excl of GST) (Masked)", "Amount in Rupees (Excl of GST)", "Amount Excl GST"])
        amt_incl_col = self.find_column(cols, ["Amount in Rupees (Incl of GST) (Masked)", "Amount in Rupees (Incl of GST)", "Amount Incl GST"])
        billed_excl_col = self.find_column(cols, ["Billed Value in Rupees (Excl of GST.) (Masked)", "Billed Value in Rupees (Excl of GST)", "Billed Excl GST"])
        billed_incl_col = self.find_column(cols, ["Billed Value in Rupees (Incl of GST.) (Masked)", "Billed Value in Rupees (Incl of GST)", "Billed Incl GST"])
        collected_col = self.find_column(cols, ["Collected Amount in Rupees (Incl. of GST) (Masked)", "Collected Amount in Rupees (Incl. of GST)", "Collected Amount"])
        receivable_col = self.find_column(cols, ["Amount Receivable (Masked)", "Amount Receivable", "Receivables"])
        to_bill_col = self.find_column(cols, ["Amount to be billed in Rs. (Exl. of GST) (Masked)", "Amount to be billed in Rs. (Incl. of GST) (Masked)", "Amount to be billed"])
        
        # Status columns
        invoice_status_col = self.find_column(cols, ["Invoice Status", "Billing Status", "WO Status (billed)"])
        collection_status_col = self.find_column(cols, ["Collection status", "Collection Status"])
        
        # Dates
        delivery_date_col = self.find_column(cols, ["Data Delivery Date", "Delivery Date"])
        po_date_col = self.find_column(cols, ["Date of PO/LOI", "PO Date", "PO/LOI Date"])
        start_date_col = self.find_column(cols, ["Probable Start Date", "Start Date"])
        end_date_col = self.find_column(cols, ["Probable End Date", "End Date"])

        cleaned_records = []
        for idx, row in df.iterrows():
            item_id = row.get("_item_id", f"wo_{idx}")
            serial = str(row.get(serial_col, f"WO-{idx+1}")).strip() if serial_col else f"WO-{idx+1}"
            deal_name = str(row.get(deal_name_col, "")).strip() if deal_name_col else "Unknown Deal"
            cust_code = str(row.get(cust_col, "")).strip() if cust_col and not self.is_missing(row.get(cust_col)) else "Unknown Customer"
            exec_status = str(row.get(exec_status_col, "")).strip() if exec_status_col and not self.is_missing(row.get(exec_status_col)) else "Pending"
            inv_status = str(row.get(invoice_status_col, "")).strip() if invoice_status_col and not self.is_missing(row.get(invoice_status_col)) else "Unbilled"
            col_status = str(row.get(collection_status_col, "")).strip() if collection_status_col and not self.is_missing(row.get(collection_status_col)) else "Pending"
            type_work = str(row.get(type_work_col, "")).strip() if type_work_col and not self.is_missing(row.get(type_work_col)) else "Services"

            # Clean Sector
            raw_sector = row.get(sector_col) if sector_col else None
            norm_sector, _ = self.normalize_sector(raw_sector)

            # Clean Financials
            amt_excl, _ = self.clean_numeric(row.get(amt_excl_col) if amt_excl_col else None)
            amt_incl, _ = self.clean_numeric(row.get(amt_incl_col) if amt_incl_col else None)
            billed_excl, _ = self.clean_numeric(row.get(billed_excl_col) if billed_excl_col else None)
            billed_incl, _ = self.clean_numeric(row.get(billed_incl_col) if billed_incl_col else None)
            collected, _ = self.clean_numeric(row.get(collected_col) if collected_col else None)
            receivable, _ = self.clean_numeric(row.get(receivable_col) if receivable_col else None)
            to_bill, _ = self.clean_numeric(row.get(to_bill_col) if to_bill_col else None)

            # Clean Dates
            po_ts, po_str, po_err = self.clean_date(row.get(po_date_col) if po_date_col else None)
            start_ts, start_str, start_err = self.clean_date(row.get(start_date_col) if start_date_col else None)
            end_ts, end_str, end_err = self.clean_date(row.get(end_date_col) if end_date_col else None)
            delivery_ts, delivery_str, delivery_err = self.clean_date(row.get(delivery_date_col) if delivery_date_col else None)

            if po_err: invalid_dates.append(f"WO '{serial}' PO Date: {po_err}")
            if delivery_err: invalid_dates.append(f"WO '{serial}' Delivery Date: {delivery_err}")

            # Check delay status
            is_delayed = False
            today = pd.Timestamp.now().normalize()
            if exec_status.lower() in ["in progress", "ongoing", "started", "pending"]:
                if end_ts is not None and end_ts < today:
                    is_delayed = True
                elif delivery_ts is not None and delivery_ts < today:
                    is_delayed = True

            cleaned_records.append({
                "_item_id": item_id,
                "serial_no": serial,
                "deal_name": deal_name,
                "customer_code": cust_code,
                "execution_status": exec_status,
                "invoice_status": inv_status,
                "collection_status": col_status,
                "type_of_work": type_work,
                "sector_raw": raw_sector,
                "sector": norm_sector,
                "amount_excl_gst": amt_excl,
                "amount_incl_gst": amt_incl,
                "billed_value_excl_gst": billed_excl,
                "billed_value_incl_gst": billed_incl,
                "collected_amount": collected,
                "amount_receivable": receivable,
                "amount_to_be_billed": to_bill,
                "po_date": po_ts,
                "po_date_str": po_str,
                "start_date": start_ts,
                "start_date_str": start_str,
                "end_date": end_ts,
                "end_date_str": end_str,
                "delivery_date": delivery_ts,
                "delivery_date_str": delivery_str,
                "is_delayed": is_delayed
            })

        clean_df = pd.DataFrame(cleaned_records)

        # Duplicate detection
        duplicates = []
        if not clean_df.empty:
            dup_mask = clean_df.duplicated(subset=["serial_no"], keep=False)
            dup_df = clean_df[dup_mask]
            if not dup_df.empty:
                for s_no, group in dup_df.groupby("serial_no"):
                    duplicates.append({
                        "serial_no": s_no,
                        "count": len(group),
                        "item_ids": group["_item_id"].tolist()
                    })

        missing_rec_count = int(clean_df["amount_receivable"].isna().sum()) if not clean_df.empty else 0
        missing_collected_count = int(clean_df["collected_amount"].isna().sum()) if not clean_df.empty else 0

        dq_report = {
            "total_records": len(clean_df),
            "missing_receivables_count": missing_rec_count,
            "missing_collected_count": missing_collected_count,
            "invalid_dates": invalid_dates,
            "potential_duplicates_count": len(duplicates),
            "potential_duplicates": duplicates,
            "warnings": quality_warnings
        }

        return clean_df, dq_report
