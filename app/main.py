
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field

# Load the saved model
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "fraud_model.joblib"

artifact = joblib.load(MODEL_PATH)
model = artifact["model"]
threshold = artifact["threshold"]
features = artifact["features"]

app = FastAPI(
    title="Transaction Anomaly Detection API",
    description="Detect potentially fraudulent credit card transactions.",
    version="1.0.0",
)


class Transaction(BaseModel):
    Time: float = Field(ge=0)
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float
    Amount: float = Field(ge=0)


@app.get("/")
def home():
    return {"message": "Transaction Anomaly Detection API is running"}


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.post("/predict")
def predict(transaction: Transaction):
    transaction_data = pd.DataFrame(
        [transaction.model_dump()],
        columns=features,
    )

    probability = float(model.predict_proba(transaction_data)[0, 1])
    prediction = int(probability >= threshold)

    return {
        "prediction": prediction,
        "label": "fraud" if prediction == 1 else "legitimate",
        "fraud_probability": round(probability, 6),
        "threshold": threshold,
    }
