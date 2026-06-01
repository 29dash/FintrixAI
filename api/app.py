from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(
    title="FintrixAI ML Engine",
    description="Fraud Detection and Risk Scoring API",
    version="1.0"
)

# Load Models
log_model = joblib.load("../models/logistic_model.pkl")
iso_model = joblib.load("../models/isolation_model.pkl")
scaler = joblib.load("../models/scaler.pkl")


class PredictionRequest(BaseModel):
    features: list[float]


def generate_risk_score(probability):
    risk_score = int(probability * 100)

    if risk_score >= 80:
        risk_level = "High"
    elif risk_score >= 50:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return risk_score, risk_level


def generate_reason(risk_level, anomaly_detected):

    if anomaly_detected:
        return "Irregular transaction pattern detected"

    if risk_level == "High":
        return "High repayment and transaction risk identified"

    elif risk_level == "Medium":
        return "Moderate financial risk detected"

    else:
        return "Normal transaction behavior"


@app.get("/")
def home():
    return {
        "message": "FintrixAI ML API Running"
    }


@app.get("/health")
def health():
    return {
        "status": "running",
        "module": "FintrixAI ML Engine"
    }


@app.post("/predict")
def predict(data: PredictionRequest):

    features = np.array(data.features).reshape(1, -1)

    scaled_features = scaler.transform(features)

    fraud_probability = log_model.predict_proba(
        scaled_features
    )[0][1]

    anomaly = iso_model.predict(
        scaled_features
    )[0]

    anomaly_detected = anomaly == -1

    risk_score, risk_level = generate_risk_score(
        fraud_probability
    )

    reason = generate_reason(
        risk_level,
        anomaly_detected
    )

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "default_probability": round(
            float(fraud_probability),
            4
        ),
        "anomaly_detected": bool(anomaly_detected),
        "reason": reason
    }