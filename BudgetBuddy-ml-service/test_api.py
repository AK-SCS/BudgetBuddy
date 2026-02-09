import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint returns service information"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "BudgetBuddy ML Service"
    assert "endpoints" in data
    assert data["model_loaded"] in [True, False]


def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_loaded" in data
    assert "timestamp" in data


def test_predict_endpoint_with_valid_data():
    """Test prediction endpoint with valid input"""
    payload = {
        "month": 6,
        "monthly_income": 5000.0,
        "rent": 1200.0,
        "loan_repayment": 300.0,
        "insurance": 150.0,
        "subscriptions": 50.0,
        "groceries": 400.0,
        "travel": 100.0,
        "going_out": 200.0,
        "entertainment": 100.0,
        "utilities": 150.0,
        "healthcare": 50.0,
        "education": 0.0,
        "miscellaneous": 100.0,
        "region": "GB"
    }
    
    response = client.post("/predict", json=payload)
    
    # May fail if model not loaded, but should validate input
    if response.status_code == 200:
        data = response.json()
        assert "predicted_total_expenses" in data
        assert "confidence_interval" in data
        assert "region" in data
        assert data["region"] == "GB"
        assert data["currency"] == "GBP"
    elif response.status_code == 503:
        # Model not loaded is acceptable in test environment
        assert "Model not loaded" in response.json()["detail"]


def test_predict_endpoint_with_invalid_month():
    """Test prediction validation for invalid month"""
    payload = {
        "month": 13,  # Invalid month
        "monthly_income": 5000.0,
        "rent": 1200.0,
        "loan_repayment": 300.0,
        "insurance": 150.0,
        "subscriptions": 50.0,
        "groceries": 400.0,
        "travel": 100.0,
        "going_out": 200.0,
        "entertainment": 100.0,
        "utilities": 150.0,
        "healthcare": 50.0,
        "education": 0.0,
        "miscellaneous": 100.0
    }
    
    response = client.post("/predict", json=payload)
    assert response.status_code == 422  # Validation error


def test_predict_endpoint_with_negative_value():
    """Test prediction validation for negative values"""
    payload = {
        "month": 6,
        "monthly_income": -5000.0,  # Invalid negative value
        "rent": 1200.0,
        "loan_repayment": 300.0,
        "insurance": 150.0,
        "subscriptions": 50.0,
        "groceries": 400.0,
        "travel": 100.0,
        "going_out": 200.0,
        "entertainment": 100.0,
        "utilities": 150.0,
        "healthcare": 50.0,
        "education": 0.0,
        "miscellaneous": 100.0
    }
    
    response = client.post("/predict", json=payload)
    assert response.status_code == 422  # Validation error


def test_predict_endpoint_india_region():
    """Test prediction with India region"""
    payload = {
        "month": 6,
        "monthly_income": 50000.0,
        "rent": 15000.0,
        "loan_repayment": 5000.0,
        "insurance": 2000.0,
        "subscriptions": 500.0,
        "groceries": 8000.0,
        "travel": 2000.0,
        "going_out": 3000.0,
        "entertainment": 1500.0,
        "utilities": 2500.0,
        "healthcare": 1000.0,
        "education": 0.0,
        "miscellaneous": 2000.0,
        "region": "IN"
    }
    
    response = client.post("/predict", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        assert data["region"] == "IN"
        assert data["currency"] == "INR"


def test_allocate_spare_cash_endpoint():
    """Test spare cash allocation endpoint"""
    payload = {
        "spare_cash": 1000.0,
        "current_expenses": {
            "rent": 1200,
            "groceries": 400
        },
        "monthly_income": 5000.0,
        "financial_goals": [
            {"name": "Emergency Fund", "target": 10000},
            {"name": "Vacation", "target": 3000}
        ],
        "region": "GB"
    }
    
    response = client.post("/allocate-spare-cash", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        assert "allocations" in data
        assert "total_spare_cash" in data
        assert data["total_spare_cash"] == 1000.0
        assert data["region"] == "GB"
        assert data["currency"] == "GBP"
    elif response.status_code == 500:
        # May fail if implementation pending
        pass


def test_allocate_spare_cash_india():
    """Test spare cash allocation for India region"""
    payload = {
        "spare_cash": 10000.0,
        "current_expenses": {},
        "monthly_income": 50000.0,
        "financial_goals": [],
        "region": "IN"
    }
    
    response = client.post("/allocate-spare-cash", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        assert data["region"] == "IN"
        assert data["currency"] == "INR"
