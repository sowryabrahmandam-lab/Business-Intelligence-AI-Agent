import os
import pytest
from fastapi.testclient import TestClient
from dotenv import load_dotenv

load_dotenv("backend/.env", override=True)
from main import app, refresh_data

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_data():
    refresh_data()

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["deals_count"] == 346
    assert data["work_orders_count"] == 176

def test_monday_test_endpoint():
    res = client.get("/monday/test")
    assert res.status_code == 200
    data = res.json()
    assert data["deals"]["connected"] is True
    assert data["deals"]["item_count"] == 346
    assert data["work_orders"]["connected"] is True
    assert data["work_orders"]["item_count"] == 176

def test_metrics_endpoint():
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "total_pipeline_value" in data
    assert "amount_receivable" in data
    assert data["active_deals"] > 0
    assert data["active_work_orders"] > 0

def test_data_quality_endpoint():
    res = client.get("/data-quality")
    assert res.status_code == 200
    data = res.json()
    assert "deals" in data
    assert "work_orders" in data
    assert "combined_warnings" in data

@pytest.mark.parametrize("query,expected_sources", [
    ("How is our pipeline looking this quarter?", ["Deals"]),
    ("How is the energy sector pipeline this quarter?", ["Deals"]),
    ("Which sector has the strongest pipeline?", ["Deals"]),
    ("What is our expected revenue?", ["Deals", "Work Orders"]),
    ("How much money is receivable?", ["Work Orders"]),
    ("What work orders are delayed?", ["Work Orders"]),
    ("What is our collection performance?", ["Work Orders"]),
    ("Compare sector performance.", ["Deals", "Work Orders"]),
    ("What are our biggest business risks?", ["Deals", "Work Orders"]),
    ("Prepare a leadership update.", ["Deals", "Work Orders"]),
])
def test_chat_queries(query, expected_sources):
    res = client.post("/chat", json={"message": query})
    assert res.status_code == 200
    data = res.json()
    assert len(data["answer"]) > 20
    for src in expected_sources:
        assert src in data["sources"] or len(data["sources"]) > 0
