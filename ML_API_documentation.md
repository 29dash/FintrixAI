# FintrixAI ML API

Start from the repository root:

```bash
npm run setup:ml
cd Fintrix-Ml/api
../venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

The API requires these files in `Fintrix-Ml/models/`:

- `xgboost_model.pkl`
- `scaler.pkl`
- `label_encoders.pkl`

## GET /health

Returns the service and model feature status.

## POST /predict

Send the named fields below. `term` must be `36` or `60` months.

```json
{
  "loan_amnt": 30000,
  "term": 60,
  "int_rate": 22,
  "grade": "E",
  "emp_length": "< 1 year",
  "home_ownership": "RENT",
  "annual_inc": 35000,
  "verification_status": "Not Verified",
  "purpose": "credit_card",
  "dti": 40,
  "fico_score": 620,
  "open_acc": 4,
  "revol_bal": 14000,
  "revol_util": 80,
  "total_acc": 8
}
```

Successful responses contain `risk_score`, `risk_level`, `default_probability`, and `explanation`. Invalid numeric or categorical values return HTTP 422 with a field-specific error.