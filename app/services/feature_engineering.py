def engineer_features(data: dict):
    d = data.copy()

    # Handle missing values
    for key, value in d.items():
        if value is None:
            d[key] = 0

    # HIGH RISK FEATURES
    d["high_default_risk"] = int(d["num_payment_defaults_12m"] > 2)
    d["high_overdue_risk"] = int(d["total_overdue_amount_usd"] > 10000)
    d["high_filing_delay"] = int(d["gst_filing_delay_days_avg"] > 15)
    d["high_bounce_risk"] = int(d["return_bounce_rate"] > 0.15)

    # MODERATE RISK FEATURES
    d["moderate_default_risk"] = int(2 <= d["num_payment_defaults_12m"] <= 2)
    d["moderate_overdue_risk"] = int(5000 <= d["total_overdue_amount_usd"] <= 10000)
    d["moderate_bounce_risk"] = int(0.05 <= d["return_bounce_rate"] <= 0.15)

    # LEGAL
    d["legal_risk"] = int(d["legal_notice_count_12m"] > 0)

    # BUSINESS STRENGTH
    d["young_business"] = int(d["business_age_months"] < 24)
    d["mature_business"] = int(d["business_age_months"] > 60)

    d["low_profile"] = int(d["profile_completeness_score"] < 0.6)
    d["high_profile"] = int(d["profile_completeness_score"] > 0.9)

    d["high_geo_risk"] = int(d["geography_risk_index"] > 0.6)
    d["high_sector_risk"] = int(d["sector_risk_index"] > 0.6)

    # TURNOVER
    turnover_map = {"<1M": 0, "1M-10M": 1, "10M-100M": 2, ">100M": 3}
    d["turnover_score"] = turnover_map.get(d["annual_turnover_band"], 1)

    # COMBINED FEATURE
    d["financial_stress"] = int(
        d["high_default_risk"] and d["high_overdue_risk"]
    )

    return d