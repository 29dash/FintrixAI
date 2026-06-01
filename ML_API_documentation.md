# FintrixAI ML API

Base URL

http://localhost:8000

## GET /

Returns API status

Response

{
  "message": "FintrixAI ML API Running"
}

## POST /predict

Request

{
  "features": [30 values]
}

Response

{
  "risk_score": 78,
  "risk_level": "High",
  "default_probability": 0.72,
  "anomaly_detected": true,
  "reason": "High fraud probability detected"
}