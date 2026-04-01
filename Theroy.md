Missing Value Strategy
📌 Theory (1-liners you can use)
Median → robust to outliers
Mean → sensitive to extreme values ❌
Interpolation → not suitable (no time-series here) ❌
Mode → best for categorical
Flagging missing → improves explainability

Outliers
IQR capping is used to limit extreme outliers while preserving the original scale and interpretability of features.

IQR
Limits extreme values
Keeps distribution shape mostly same

Log Trnasformation
Compresses large values
Reduces skewness
Example:

100 → 2
10000 → 4