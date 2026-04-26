from pydantic import BaseModel
from typing import List

class Factor(BaseModel):
    factor: str
    contribution: float
    direction: str

class BusinessResponse(BaseModel):
    business_id: str
    risk_score: float
    risk_band: str
    confidence: float
    top_factors: List[Factor]
    ai_risk_analysis: str
    recommended_action: str
    timestamp: str
    model_version: str

class FailedItem(BaseModel):
    business_id: str
    error: str

class Summary(BaseModel):
    total: int
    succeeded: int
    failed: int
    processing_time_ms: int

class BatchResponse(BaseModel):
    results: List[BusinessResponse]
    failed: List[FailedItem]
    summary: Summary