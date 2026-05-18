from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()

log_model = joblib.load("../models/logistic_model.pkl")
iso_model = joblib.load("../models/isolation_model.pkl")
scaler = joblib.load("../models/scaler.pkl")


def generate_risk_score(probability):
    risk_score = int(probability * 100)
    if risk_score >= 80:
        risk_level = "High"
    elif risk_score >= 50:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    return risk_score, risk_level

@app.get("/")
def home():
    return {"message": "FintrixAI ML API Running"}


@app.post("/predict")
def predict(data: dict):

    features = np.array(data["features"]).reshape(1, -1)
    scaled_features = scaler.transform(features)
    fraud_probability = log_model.predict_proba(scaled_features)[0][1]
    anomaly = iso_model.predict(scaled_features)[0]
    anomaly_detected = True if anomaly == -1 else False
    risk_score, risk_level = generate_risk_score(fraud_probability)
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "default_probability": round(float(fraud_probability), 4),
        "anomaly_detected": anomaly_detected,
        "reason": "High fraud probability detected"
        if anomaly_detected
        else "Normal transaction behavior"
    }
