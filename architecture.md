# Architecture Overview

The system is designed as a modular risk scoring pipeline exposed via FastAPI.

It consists of:

1. API Layer (FastAPI)
2. Feature Engineering Layer
3. Scoring Engine
4. Explainability Layer
5. AI Explanation Layer (Groq LLaMA)

## Data Flow

1. User sends request to `/api/v1/score`
2. Input is validated using Pydantic schemas
3. Feature Engineering transforms raw input into risk features
4. Scoring Service computes risk score using weighted logic
5. Confidence Service calculates confidence score
6. Factor Service identifies top contributing factors
7. AI Service generates explanation using LLaMA (Groq API)
8. Final response is returned to the user


## System Flow Diagram

[Client]
   ↓
[FastAPI Routes]
   ↓
[Feature Engineering]
   ↓
[Scoring Service]
   ↓
[Confidence + Factor Services]
   ↓
[AI Service (Groq LLaMA)]
   ↓
[Response JSON]


## Key Design Decisions

- Modular service-based architecture for scalability and maintainability
- Separation of feature engineering and scoring logic for flexibility
- Rule-based scoring instead of ML due to limited dataset
- AI explanations added as a separate layer to avoid affecting core scoring
- Timeout and rate control implemented to prevent API overload
- Batch processing supports partial results for robustness