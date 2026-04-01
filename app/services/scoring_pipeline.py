from datetime import datetime, timezone

from app.services.feature_engineering import engineer_features
from app.services.scoring_service import calculate_score, weights
from app.services.factor_service import get_top_factors
from app.services.ai_service import generate_ai_analysis
from app.services.confidence_service import calculate_confidence
from app.core.config import MODEL_VERSION


def process_single_business(raw: dict, use_ai=True):
    features = engineer_features(raw)
    score = calculate_score(features)

    # risk band
    if score <= 35:
        band = "Low"
    elif score <= 70:
        band = "Medium"
    else:
        band = "High"

    factors = get_top_factors(features, weights)
    if use_ai:
        ai_text = generate_ai_analysis(score, band, factors)
    else:
        ai_text = "AI explanation disabled for batch processing"
    
    confidence = calculate_confidence(raw)

    if band == "Low":
        action = "Approve"
    elif band == "Medium":
        action = "Review"
    else:
        action = "Reject"

    return {
        "business_id": raw["business_id"],
        "risk_score": score,
        "risk_band": band,
        "confidence": confidence,
        "top_factors": factors,
        "ai_risk_analysis": ai_text,
        "recommended_action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_version": MODEL_VERSION
    }