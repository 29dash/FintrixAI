from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

app = FastAPI(
    title="FintrixAI ML Engine",
    description="Loan Risk Prediction API",
    version="2.0"
)

# Resolve model files from this source file so the API can be started from any directory.
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
xgb_model = joblib.load(MODEL_DIR / "xgboost_model.pkl")
scaler = joblib.load(MODEL_DIR / "scaler.pkl")
encoders = joblib.load(MODEL_DIR / "label_encoders.pkl")


class PredictionRequest(BaseModel):

    loan_amnt: float = Field(gt=0)
    term: int = Field(gt=0)
    int_rate: float = Field(gt=0, le=100)
    grade: str = Field(min_length=1)
    emp_length: str = Field(min_length=1)
    home_ownership: str = Field(min_length=1)
    annual_inc: float = Field(gt=0)
    verification_status: str = Field(min_length=1)
    purpose: str = Field(min_length=1)
    dti: float = Field(ge=0, le=100)
    fico_score: float = Field(ge=300, le=850)
    open_acc: int = Field(ge=0)
    revol_bal: float = Field(ge=0)
    revol_util: float = Field(ge=0, le=100)
    total_acc: int = Field(ge=0)

    @field_validator(
        "grade",
        "emp_length",
        "home_ownership",
        "verification_status",
        "purpose",
    )
    @classmethod
    def strip_text(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("must not be empty")
        return value


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
        "status": "running",
        "model_features": getattr(xgb_model, "n_features_in_", None),
        "scaler_features": getattr(scaler, "n_features_in_", None),
    }


@app.post("/predict")

def predict(data: PredictionRequest):

    term_label = f" {data.term} months"

    def encode_category(name, value):
        encoder = encoders[name]
        if value not in encoder.classes_:
            allowed = ", ".join(str(item) for item in encoder.classes_)
            raise HTTPException(
                status_code=422,
                detail=f"Unsupported {name}: {value}. Allowed values: {allowed}",
            )
        return encoder.transform([value])[0]

    term_encoded = encode_category("term", term_label)
    grade_encoded = encode_category("grade", data.grade)
    emp_length_encoded = encode_category("emp_length", data.emp_length)
    home_encoded = encode_category("home_ownership", data.home_ownership)
    verification_encoded = encode_category(
        "verification_status", data.verification_status
    )
    purpose_encoded = encode_category("purpose", data.purpose)

    fico_low = data.fico_score
    fico_high = data.fico_score

    feature_values = [[
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
    ]]

    feature_names = getattr(scaler, "feature_names_in_", None)
    if feature_names is not None:
        features = pd.DataFrame(feature_values, columns=feature_names)
    else:
        features = np.array(feature_values)

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