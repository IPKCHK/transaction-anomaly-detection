
# Transaction Fraud Detection System

A full-stack machine learning application that predicts potentially fraudulent credit card transactions using a Random Forest classifier. It provides transaction-level predictions, CSV batch analysis, prediction history, and dashboard statistics.

## Features

- Fraud probability prediction using a trained Random Forest model.
- Configurable classification threshold selected using validation data.
- CSV upload for analyzing multiple transactions.
- Transaction history and fraud statistics.
- User authentication and per-user transaction isolation.
- React frontend, Express API, FastAPI ML service, and PostgreSQL database.

## Machine Learning

- **Model:** Random Forest Classifier
- **Dataset:** Credit Card Fraud Detection dataset
- **Features:** Time, Amount, and anonymized features V1–V28
- **Class imbalance:** `class_weight="balanced_subsample"`
- **Threshold selection:** Validation set
- **Evaluation:** Average Precision, precision, recall, F1-score, and confusion matrix

Final test metrics will be added after evaluation.

## Tech Stack

- Python, pandas, scikit-learn, joblib
- FastAPI
- Node.js, Express
- React, Vite, CSS
- PostgreSQL

## Project Structure

```text
transaction-anomaly-detection/
├── app/              # FastAPI ML service
├── frontend/         # React + Vite application
├── backend/          # Express API and authentication
├── data/             # Dataset files
├── models/           # Saved ML model
├── notebooks/        # Training and evaluation notebooks
├── src/              # Additional source code
├── venv/             # Python virtual environment (do not upload)
├── requirements.txt  # Python dependencies
└── README.md         # Project documentation
```

## Local Setup

Run the ML service, backend, and frontend in separate terminals.

### 1. ML service

Activate your Python virtual environment and run:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Configure the required environment variables in local `.env` files. Never commit secrets or database credentials.

## Dataset

The dataset contains anonymized transaction features. V1–V28 are transformed features and do not represent ordinary user-entered transaction details.

## Limitations

Predictions are estimates, not proof of fraud. The model is trained on a particular dataset, and performance may differ on real-world transactions.
