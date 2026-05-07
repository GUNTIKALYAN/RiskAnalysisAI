factor_map = {
    "blocklist_flag": "Business is on regulatory blocklist",

    "high_default_risk": "Multiple payment defaults",
    "moderate_default_risk": "Moderate payment defaults observed",

    "high_overdue_risk": "High overdue amount",
    "moderate_overdue_risk": "Moderate overdue financial obligations",

    "financial_stress": "Combined financial stress",

    "high_bounce_risk": "High cheque bounce rate",
    "moderate_bounce_risk": "Moderate cheque bounce rate",

    "high_filing_delay": "Frequent filing delays",

    "legal_risk": "Presence of legal notices",

    "low_profile": "Low profile completeness",
    "high_profile": "Strong profile completeness",

    "high_geo_risk": "High geography risk",
    "high_sector_risk": "High sector risk",

    "young_business": "New business",
    "mature_business": "Established business with strong track record",

    "turnover_score": "Large business scale"
}


# def get_top_factors(d, weights):
#     factors = []

#     for k, w in weights.items():
#         value = d.get(k, 0)

#         if value != 0:
#             contribution = abs(value * w)

#             if contribution >= 5:  # filter noise
#                 factors.append({
#                     "factor": factor_map.get(k, k),
#                     "contribution": contribution,
#                     "direction": "negative" if w > 0 else "positive"
#                 })

#     return sorted(factors, key=lambda x: x["contribution"], reverse=True)[:4]

def get_top_factors(d, weights):
    contributions = []

    # 🔹 Step 1: compute raw contributions
    for k, w in weights.items():
        value = d.get(k, 0)

        if value != 0:
            raw_contribution = abs(value * w)

            contributions.append({
                "feature": k,
                "factor": factor_map.get(k, k),
                "raw_contribution": raw_contribution,
                "direction": "negative" if w > 0 else "positive"
            })

    # 🔹 Step 2: handle empty case
    if not contributions:
        return []

    # 🔹 Step 3: normalize
    total = sum(c["raw_contribution"] for c in contributions)

    for c in contributions:
        c["contribution"] = round(c["raw_contribution"] / total, 4)  # 0–1 scale

    # 🔹 Step 4: filter noise AFTER normalization
    contributions = [c for c in contributions if c["contribution"] >= 0.05]  # ≥5%

    # 🔹 Step 5: sort & take top 4
    contributions = sorted(contributions, key=lambda x: x["contribution"], reverse=True)[:4]

    # 🔹 Step 6: remove raw field (clean output)
    for c in contributions:
        del c["raw_contribution"]

    return contributions