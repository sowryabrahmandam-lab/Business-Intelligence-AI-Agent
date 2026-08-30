import pytest
import pandas as pd
from services.data_cleaner import DataCleaner

def test_clean_numeric():
    cleaner = DataCleaner()
    # Currency symbols & commas
    val, err = cleaner.clean_numeric("₹1,500,000.50")
    assert val == 1500000.50
    assert err is None

    # Percentage
    val, err = cleaner.clean_numeric("75%")
    assert val == 0.75

    # String N/A
    val, err = cleaner.clean_numeric("N/A")
    assert val is None

def test_clean_date():
    cleaner = DataCleaner()
    # DD/MM/YYYY
    ts, s, err = cleaner.clean_date("15/04/2024")
    assert s == "2024-04-15"
    assert err is None

    # YYYY-MM-DD
    ts, s, err = cleaner.clean_date("2024-06-30")
    assert s == "2024-06-30"

    # Missing
    ts, s, err = cleaner.clean_date("-")
    assert ts is None

def test_normalize_sector():
    cleaner = DataCleaner()
    sec, _ = cleaner.normalize_sector("ENERGY")
    assert sec == "Energy"

    sec, _ = cleaner.normalize_sector("Mining Sector")
    assert sec == "Mining"

    sec, _ = cleaner.normalize_sector(None)
    assert sec == "Unknown / Unspecified"

def test_clean_deals_and_wo():
    cleaner = DataCleaner()
    raw_deals = [
        {
            "Deal Name": "Solar Project Alpha",
            "Owner code": "OWN01",
            "Client Code": "CLI100",
            "Deal Status": "Won",
            "Masked Deal value": "₹5,000,000",
            "Closure Probability": "100%",
            "Sector/service": "Energy Sector",
            "Close Date (A)": "2024-02-15"
        },
        {
            "Deal Name": "Coal Mine Survey",
            "Owner code": "OWN02",
            "Client Code": "CLI200",
            "Deal Status": "In Pipeline",
            "Masked Deal value": "3,000,000",
            "Closure Probability": "60%",
            "Sector/service": "Mining",
            "Tentative Close Date": "2024-08-30"
        }
    ]
    df, dq = cleaner.clean_deals(raw_deals)
    assert len(df) == 2
    assert df.iloc[0]["sector"] == "Energy"
    assert df.iloc[0]["deal_value"] == 5000000.0
    assert df.iloc[1]["expected_value"] == 1800000.0
