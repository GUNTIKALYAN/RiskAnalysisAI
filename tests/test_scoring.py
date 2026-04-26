def base_input():
    return {
        "business_id": "TEST",
        "gst_filing_delay_days_avg": 5,
        "num_payment_defaults_12m": 0,
        "total_overdue_amount_usd": 0,
        "blocklist_flag": False,
        "legal_notice_count_12m": 0,
        "return_bounce_rate": 0.0,
        "business_age_months": 60,
        "annual_turnover_band": "10M-100M",
        "profile_completeness_score": 0.9,
        "geography_risk_index": 0.2,
        "sector_risk_index": 0.3
    }

def test_low_risk():
    data = base_input()

    from backend.app.services.feature_engineering import engineer_features
    from backend.app.services.scoring_service import calculate_score

    features = engineer_features(data)
    score = calculate_score(features)

    assert score < 35

def test_high_risk():
    data = base_input()
    data.update({
        "num_payment_defaults_12m": 5,
        "total_overdue_amount_usd": 50000,
        "return_bounce_rate": 0.3,
        "blocklist_flag": True
    })

    from backend.app.services.feature_engineering import engineer_features
    from backend.app.services.scoring_service import calculate_score

    features = engineer_features(data)
    score = calculate_score(features)

    assert score > 70

def test_medium_risk():
    data = base_input()
    data.update({
        "num_payment_defaults_12m": 2,
        "total_overdue_amount_usd": 7000,
        "return_bounce_rate": 0.1
    })

    from backend.app.services.feature_engineering import engineer_features
    from backend.app.services.scoring_service import calculate_score

    features = engineer_features(data)
    score = calculate_score(features)

    assert 35 <= score <= 70