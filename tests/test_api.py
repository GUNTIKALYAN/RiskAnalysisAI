from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_score_api():
    payload = {
        "business_id": "TEST-API",
        "gst_filing_delay_days_avg": 5,
        "num_payment_defaults_12m": 1,
        "total_overdue_amount_usd": 2000,
        "blocklist_flag": False,
        "legal_notice_count_12m": 0,
        "return_bounce_rate": 0.02,
        "business_age_months": 60,
        "annual_turnover_band": "10M-100M",
        "profile_completeness_score": 0.9,
        "geography_risk_index": 0.2,
        "sector_risk_index": 0.3
    }

    response = client.post("/api/v1/score", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert "risk_score" in data
    assert "risk_band" in data
    assert "recommended_action" in data