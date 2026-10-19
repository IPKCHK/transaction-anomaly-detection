

# Machine Learning-Based Credit Card Fraud Detection System

A full-stack machine learning prototype that estimates the probability that a credit card transaction is fraudulent using a Random Forest classifier trained on a public, anonymized dataset.

**Important: What this system actually analyzes**

The model was trained on the public Credit Card Fraud Detection dataset, which contains `Time`, `Amount`, and 28 anonymized numerical features (`V1`–`V28`). These anonymized features do not have directly interpretable meanings in the dataset available to this project.

Consequently, this application demonstrates fraud prediction on transactions represented using the dataset's feature format. It does **not** directly analyze merchant names, transaction locations, cardholder identities, purchase descriptions, or other real-world transaction details. It cannot take an arbitrary transaction from a bank and reliably assess it unless that transaction can be represented using the same compatible input features.

The application integrates the trained model with a FastAPI prediction service, an Express backend, a React frontend, and PostgreSQL for authenticated transaction history and dashboard statistics.


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


## Limitations and Intended Use

- This is a machine learning demonstration, not a production banking fraud detection service.
- The model uses anonymized dataset features rather than directly interpretable transaction attributes.
- Arbitrary real-world transaction data cannot be supplied unless it is transformed into the compatible feature representation expected by the model.
- Predictions are estimates based on learned patterns, not proof that a transaction is fraudulent.
- Performance on the public dataset does not guarantee equivalent performance on new or real-world transactions.

