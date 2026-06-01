from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(
    title="FintrixAI ML Engine",
    description="Loan Risk Prediction API",
    version="2.0"
)

# Load Models
xgb_model = joblib.load("../models/xgboost_model.pkl")
scaler = joblib.load("../models/scaler.pkl")
encoders = joblib.load("../models/label_encoders.pkl")


class PredictionRequest(BaseModel):

    loan_amnt: float
    term: int
    int_rate: float
    grade: str
    emp_length: str
    home_ownership: str
    annual_inc: float
    verification_status: str
    purpose: str
    dti: float
    fico_score: float
    open_acc: int
    revol_bal: float
    revol_util: float
    total_acc: int


def generate_risk_score(probability):

    score = int(probability * 100)

    if score >= 80:
        level = "High"
    elif score >= 50:
        level = "Medium"
    else:
        level = "Low"

    return score, level


@app.get("/")
def home():

    return {
        "message": "FintrixAI ML API Running"
    }


@app.get("/health")
def health():

    return {
        "status": "running"
    }


@app.post("/predict")

def predict(data: PredictionRequest):

    # Encode categorical fields
    print("TERM RECEIVED:", data.term)
    print("FULL DATA:", data)

    term_encoded = encoders["term"].transform(
        [f" {data.term} months"]
    )[0]

    grade_encoded = encoders["grade"].transform(
        [data.grade]
    )[0]

    emp_length_encoded = encoders["emp_length"].transform(
        [data.emp_length]
    )[0]

    home_encoded = encoders["home_ownership"].transform(
        [data.home_ownership]
    )[0]

    verification_encoded = encoders[
        "verification_status"
    ].transform(
        [data.verification_status]
    )[0]

    purpose_encoded = encoders["purpose"].transform(
        [data.purpose]
    )[0]

    fico_low = data.fico_score
    fico_high = data.fico_score

    features = np.array([[
        data.loan_amnt,
        term_encoded,
        data.int_rate,
        grade_encoded,
        emp_length_encoded,
        home_encoded,
        data.annual_inc,
        verification_encoded,
        purpose_encoded,
        data.dti,
        fico_low,
        fico_high,
        data.open_acc,
        data.revol_bal,
        data.revol_util,
        data.total_acc
    ]])

    scaled_features = scaler.transform(
        features
    )

    probability = xgb_model.predict_proba(
        scaled_features
    )[0][1]

    risk_score, risk_level = (
        generate_risk_score(
            probability
        )
    )

    explanations = []

    # FICO
    if data.fico_score >= 700:
        explanations.append(
            f"FICO score of {data.fico_score} indicates strong credit health."
        )
    elif data.fico_score < 650:
        explanations.append(
            f"FICO score of {data.fico_score} increases default risk."
        )

    # DTI
    if data.dti < 20:
        explanations.append(
            f"Debt-to-Income ratio of {data.dti}% is healthy."
        )
    elif data.dti > 35:
        explanations.append(
            f"Debt-to-Income ratio of {data.dti}% is relatively high."
        )

    # Credit Utilization
    if data.revol_util < 30:
        explanations.append(
            f"Credit utilization of {data.revol_util}% is low."
        )
    elif data.revol_util > 70:
        explanations.append(
            f"Credit utilization of {data.revol_util}% is high."
        )

    # Income Verification
    if data.verification_status == "Verified":
        explanations.append(
            "Income has been verified."
        )

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "default_probability": round(
            float(probability),
            4
        ),
        "explanation": explanations
    }