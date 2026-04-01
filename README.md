# Risk Scoring AI System

A FastAPI-based AI system that evaluates business risk using financial, behavioral, and contextual signals, and generates explainable risk scores with AI-powered insights.

## Project Overview

This project simulates a real-world credit risk assessment system where businesses are evaluated based on multiple indicators such as payment behavior, financial stress, and profile strength. The system classifies businesses into risk categories (Low, Medium, High) and provides actionable recommendations.

The solution follows a hybrid approach:
- Rule-based feature engineering to derive meaningful risk signals
- Weighted scoring model to compute a normalized risk score (0–100)
- Explainability layer to highlight key contributing factors
- AI-generated explanations using LLaMA (via Groq API)

Key features:
- Real-time risk scoring API
- Batch scoring with timeout control and partial results handling
- Transparent and explainable outputs
- AI-enhanced risk interpretation
- Robust handling of missing and edge-case inputs

Tech stack:
- FastAPI (Backend API)
- Python (Core logic)
- Groq LLaMA API (AI explanations)
- Pytest (Testing)

## Installation and Setup

### 1. Clone the repository

```bash
git clone <your-repo-link>
cd risk-scoring-ai
```

---

## Create virtual environment

### 2. Create virtual environment

```bash
python -m venv venv
```

---

## Activate environment

### 3. Activate virtual environment

**Windows:**
```bash
venv\Scripts\activate
```
**Mac**
```bash
source venv/bin/activate
```

---

## Install dependencies

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

---

## Set environment variables

### 5. Set environment variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_api_key_here
```

## How to Run

### 1. Start the FastAPI server

```bash
uvicorn app.main:app --reload
```

---

## 2. Check server is running

### 2. Access the API

Once the server is running, open:

- API Base URL: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs

---

### 3. Test the API (Swagger UI)

- Open `/docs`
- Select `POST /api/v1/score`
- Click "Try it out"
- Provide input JSON
- Execute request

### 4. Example API Request (cURL)

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/score" \
-H "Content-Type: application/json" \
-d '{
  "business_id": "BUS-001",
  "gst_filing_delay_days_avg": 5,
  "num_payment_defaults_12m": 1,
  "total_overdue_amount_usd": 2000,
  "blocklist_flag": false,
  "legal_notice_count_12m": 0,
  "return_bounce_rate": 0.02,
  "business_age_months": 60,
  "annual_turnover_band": "10M-100M",
  "profile_completeness_score": 0.9,
  "geography_risk_index": 0.2,
  "sector_risk_index": 0.3
}'
```

## API Usage

### POST /api/v1/score

Scores a single business and returns risk assessment with explanation.

```json

{
    "input": {
        "business_id": "BUS-LOW-001",
        "gst_filing_delay_days_avg": 2,
        "num_payment_defaults_12m": 0,
        "total_overdue_amount_usd": 0,
        "blocklist_flag": false,
        "legal_notice_count_12m": 0,
        "return_bounce_rate": 0.01,
        "business_age_months": 120,
        "annual_turnover_band": ">100M",
        "profile_completeness_score": 0.95,
        "geography_risk_index": 0.2,
        "sector_risk_index": 0.3
    },
    "output":{
    "business_id": "BUS-LOW-001",
    "risk_score": 0,
    "risk_band": "Low",
    "confidence": 0.9,
    "top_factors": [
        {
        "factor": "Large business scale",
        "contribution": 9,
        "direction": "positive"
        },
        {
        "factor": "Established business with strong track record",
        "contribution": 5,
        "direction": "positive"
        },
        {
        "factor": "Strong profile completeness",
        "contribution": 5,
        "direction": "positive"
        }
    ],
    "ai_risk_analysis": "The business has been assigned a Low risk score due to its large business scale, which suggests a stable and established operation. The fact that it is an established business with a strong track record also contributes to this low risk assessment, as it indicates a proven ability to operate successfully over time. Additionally, the business has a strong profile completeness, which provides a clear understanding of its operations and reduces uncertainty. These factors combined contribute to a low risk profile, as they indicate a stable and well-established business. The large business scale and strong track record specifically suggest a low likelihood of unexpected disruptions or failures. Overall, the business's low risk score reflects its stable and established nature.",
    "recommended_action": "Approve",
    "timestamp": "2026-04-01T13:16:43.207148",
    "model_version": "1.0.0"
    }
}

```

#### Response Fields

- `risk_score`: Numeric score (0–100)
- `risk_band`: Risk category (Low / Medium / High)
- `confidence`: Confidence based on data completeness
- `top_factors`: Key contributors to the score
- `ai_risk_analysis`: AI-generated explanation
- `recommended_action`: Approve / Review / Reject

### POST /api/v1/score/batch

Scores multiple businesses in a single request.

#### Request Example

```json
{
  "businesses": [
    { "business_id": "B1", ... },
    { "business_id": "B2", ... }
  ]
}

{
  "results": [...],
  "failed": [],
  "summary": {
    "total": 2,
    "succeeded": 2,
    "failed": 0,
    "processing_time_ms": 200
  }
}
```

## Assumptions

- Missing numeric values are treated as 0 for scoring simplicity.
- Risk thresholds (Low, Medium, High) are defined based on heuristic calibration.
- Feature importance is manually assigned using domain-inspired weights.
- Turnover bands are mapped to numeric scores for modeling convenience.
- AI explanations are generated based only on derived features and not external data.

## Limitations

- The scoring model is rule-based and not trained on real-world labeled data.
- Weights are manually tuned and may not generalize across industries.
- AI explanations depend on LLM output and may vary slightly across runs.
- Batch processing includes limited AI calls to prevent latency issues.
- No persistent storage or historical tracking of business risk.

## Future Improvements

- Replace rule-based scoring with a trained ML model (e.g., XGBoost).
- Use real-world datasets to learn feature importance dynamically.
- Add caching for AI responses to improve performance.
- Implement async processing for faster batch scoring.
- Introduce monitoring and logging for production readiness.