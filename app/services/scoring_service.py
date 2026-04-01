weights = {
    "blocklist_flag": 40,

    "high_default_risk": 20,
    "moderate_default_risk": 12,

    "high_overdue_risk": 15,
    "moderate_overdue_risk": 10,

    "financial_stress": 10,

    "high_bounce_risk": 10,
    "moderate_bounce_risk": 6,

    "high_filing_delay": 5,

    "legal_risk": 10,

    "low_profile": 5,
    "high_geo_risk": 5,
    "high_sector_risk": 5,

    "young_business": 5,

    "mature_business": -5,
    "high_profile": -5,

    "turnover_score": -3
}



def calculate_score(d):

    # 1. HARD OVERRIDES (CRITICAL)
    if d.get("blocklist_flag") == 1:
        return 95  

    if d.get("high_default_risk") and d.get("high_overdue_risk"):
        return 90  # extreme financial stress


    # 2. BASE WEIGHTED SCORE
    score = 0

    for k, w in weights.items():
        score += d.get(k, 0) * w


    # 3. CONTINUOUS SIGNALS
    score += d["num_payment_defaults_12m"] * 5
    score += d["total_overdue_amount_usd"] / 1000
    score += d["return_bounce_rate"] * 80


    # 4. POSITIVE BALANCING
    positive_boost = 0

    if d.get("mature_business"):
        positive_boost += 5

    if d.get("high_profile"):
        positive_boost += 5

    if d.get("turnover_score", 0) >= 2:
        positive_boost += 5

    if score < 70:
        score -= positive_boost


    # 5. MINIMUM FLOOR FOR STRONG RISK
    if d.get("high_default_risk") and d.get("high_overdue_risk"):
        score = max(score, 80)

    if d.get("legal_risk") and d.get("moderate_default_risk"):
        score = max(score, 60)


    # 6. SOFT CAP
    if score > 100:
        score = 100 - (score - 100) * 0.5


    # 7. FINAL CLAMP 
    score = max(0, min(100, score))

    return round(score, 0)