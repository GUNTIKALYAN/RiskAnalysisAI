## Model / Approach

The system uses a hybrid risk scoring approach combining rule-based feature engineering, weighted scoring, and AI-based explanation generation.

The pipeline consists of the following steps:

1. Feature Engineering  
   Raw business inputs are transformed into meaningful risk indicators (e.g., high default risk, financial stress, profile strength).

2. Weighted Scoring Model  
   Each derived feature is assigned a weight based on its relative importance.  
   A cumulative risk score (0–100) is computed using both:
   - Discrete risk flags (e.g., blocklist, legal risk)
   - Continuous signals (e.g., overdue amount, bounce rate)

3. Risk Band Classification  
   The final score is mapped into:
   - Low Risk (≤ 35)
   - Medium Risk (36–70)
   - High Risk (> 70)

4. Explainability Layer  
   Top contributing factors are extracted based on their weighted impact on the score.

5. AI Explanation  
   A large language model (LLaMA via Groq API) generates a natural language explanation grounded in the identified risk factors.


This approach was chosen because:

- The dataset is small and not suitable for training a reliable ML model.
- A rule-based system provides full control and interpretability of risk decisions.
- Weighted scoring allows flexible calibration of risk sensitivity.
- AI-generated explanations improve usability and transparency for end users.

## Features Included

### Raw Features

The model uses the following input features:

- gst_filing_delay_days_avg (filing behavior)
- num_payment_defaults_12m (payment reliability)
- total_overdue_amount_usd (financial stress)
- blocklist_flag (regulatory risk)
- legal_notice_count_12m (legal risk)
- return_bounce_rate (transaction reliability)
- business_age_months (business stability)
- annual_turnover_band (business scale)
- profile_completeness_score (data quality / trust)
- geography_risk_index (regional risk)
- sector_risk_index (industry risk)

### Engineered Features

Additional features are derived to capture nonlinear risk patterns:

- Missing indicators  
  Flags such as `*_missing` to capture data uncertainty

- Risk flags  
  Binary indicators like:
  - high_default_risk
  - high_overdue_risk
  - high_bounce_risk
  - high_filing_delay

- Business maturity  
  - young_business
  - mature_business

- Profile strength  
  - low_profile
  - high_profile

- External risk  
  - high_geo_risk
  - high_sector_risk

### Derived Risk Signals

Composite features are created to summarize risk:

- turnover_score  
  Numeric encoding of business scale

- total_risk_flags  
  Aggregation of all risk indicators

- financial_stress  
  Combined signal from defaults, overdue amount, and bounce rate

- total_missing_flags  
  Captures overall data completeness

Feature engineering is used to convert raw business data into interpretable and high-signal risk indicators that improve scoring reliability.

## Performance / Logic Rationale

### Scoring Logic

The risk score is computed using a weighted aggregation of multiple risk signals.

Each feature contributes positively or negatively based on its impact:
- High-risk indicators (e.g., defaults, overdue amounts, blocklist) increase the score
- Positive indicators (e.g., business scale, profile strength) reduce the score

The final score is normalized to a range of 0–100.

### Weight Assignment Rationale

Weights are assigned based on domain-inspired importance:

- Critical risk factors (e.g., blocklist, multiple defaults) are given higher weights  
  because they strongly indicate financial instability.

- Moderate risk factors (e.g., overdue amounts, bounce rate, legal notices) are assigned medium weights  
  as they indicate emerging risk patterns.

- Stability indicators (e.g., business age, profile completeness, turnover) are assigned positive weights  
  to reduce risk score when strong.

This ensures that severe signals dominate the score, while supportive signals moderate it.

### Risk Band Thresholds

The risk score is mapped into categories:

- Low Risk (≤ 35): Minimal financial or behavioral risk  
- Medium Risk (36–70): Moderate risk requiring review  
- High Risk (> 70): Significant risk indicating likely default or instability  

These thresholds are heuristically calibrated to separate safe, borderline, and risky profiles.

### Explainability

The system provides interpretability by:

- Identifying top contributing factors based on weighted impact  
- Providing structured factor contributions (positive/negative)  
- Generating AI-based explanations grounded in these factors  

This ensures transparency and makes the scoring system auditable.

### Confidence Calculation

Confidence is derived based on data completeness:

- Higher missing values → lower confidence  
- Complete and consistent inputs → higher confidence  

The system prioritizes interpretability and controlled decision-making over black-box optimization.

### Data Limitations

- The dataset is small and synthetic, limiting the ability to generalize.
- No labeled ground truth is available to validate predictive performance.

### Model Limitations

- The scoring system is rule-based and not trained on real-world data.
- Feature weights are manually assigned and may not reflect true statistical importance.
- Thresholds are heuristically defined and not optimized using validation techniques.

### AI Explanation Limitations

- AI-generated explanations depend on prompt quality and may vary slightly across runs.
- The LLM does not have access to external validation data and relies only on provided inputs.

### System Limitations

- Batch processing limits AI calls to control latency, which may skip explanations for large inputs.
- No persistent storage or historical tracking is implemented.
- The system is not optimized for high-throughput production environments.