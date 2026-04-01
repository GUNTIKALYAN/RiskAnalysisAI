from pydantic import BaseModel
from typing import Optional, List


class BusinessInput(BaseModel):
    business_id: str
    gst_filing_delay_days_avg: Optional[float]
    num_payment_defaults_12m: Optional[float]
    total_overdue_amount_usd: Optional[float]
    blocklist_flag: bool
    legal_notice_count_12m: Optional[int]
    return_bounce_rate: Optional[float]
    business_age_months: Optional[int]
    annual_turnover_band: Optional[str]
    profile_completeness_score: Optional[float]
    geography_risk_index: Optional[float]
    sector_risk_index: Optional[float]


class BatchRequest(BaseModel):
    businesses: List[BusinessInput]