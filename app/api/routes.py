from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from app.schemas.request import BusinessInput, BatchRequest
from app.schemas.response import BusinessResponse, FailedItem, Summary, BatchResponse

from app.services.feature_engineering import engineer_features
from app.services.scoring_service import calculate_score, weights
from app.services.confidence_service import calculate_confidence
from app.services.factor_service import get_top_factors
from app.services.ai_service import generate_ai_analysis
from app.services.scoring_pipeline import process_single_business
import time

from app.core.config import MODEL_VERSION

router = APIRouter()

MAX_AI_CALLS = 5
TIMEOUT_SECONDS = 30


@router.get("/api/v1/health",status_code=200)
def health_check():
    return {
        "status": "healthy",
        "model_version": MODEL_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/api/v1/score", response_model=BusinessResponse)
def score_business(data: BusinessInput):
    raw = data.model_dump()
    return process_single_business(raw)


@router.post("/api/v1/score/batch", response_model=BatchResponse)
def score_batch(request: BatchRequest):

    start_time = time.time()
    businesses = request.businesses

    if len(businesses) > 100:
        raise HTTPException(status_code=400, detail="Max 100 business allowed per request")
    
    results = []
    failed = []

    for idx, item in enumerate(businesses):

        if (time.time() - start_time) > TIMEOUT_SECONDS:
            failed.append({
                "business_id": "BATCH_TIMEOUT",
                "error": "Processing stopped due to timeout (30s exceeded)"
            })
            break
        
        try:
            raw = item.model_dump()
            use_ai = idx < MAX_AI_CALLS
            result = process_single_business(raw, use_ai=use_ai)
            results.append(result)

        except Exception as e:
            failed.append({
                "business_id": item.business_id,
                "error": str(e)
            })

    end_time = time.time()

    summary = {
        "total": len(businesses),
        "succeeded": len(results),
        "failed": len(failed),
        "processing_time_ms": int((end_time - start_time) * 1000)
    }

    return {
        "results": results,
        "failed": failed,
        "summary": summary
    }