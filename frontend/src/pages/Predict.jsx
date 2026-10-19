
import { useState } from "react";
import "./Predict.css";
import { apiFetch } from "../auth";

const API = "http://localhost:3000/api";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 500;
const CONCURRENCY = 4;

const FEATURE_NAMES = Array.from(
  { length: 28 },
  (_, i) => `V${i + 1}`
);

const REQUIRED_COLUMNS = ["Time", ...FEATURE_NAMES, "Amount"];

const initialValues = {
  Time: "0",
  Amount: "0",
  ...Object.fromEntries(FEATURE_NAMES.map((name) => [name, "0"])),
};

// Handles quoted CSV values, commas inside quotes, and escaped quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  text = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === "") {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;

      row.push(field);

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) {
    throw new Error("The CSV contains an unclosed quoted field.");
  }

  row.push(field);

  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function escapeCSV(value) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadCSV(rows) {
  if (!rows.length) return;

  const headers = [
    ...REQUIRED_COLUMNS,
    "Prediction",
    "Fraud Probability (%)",
    "Threshold (%)",
    "Transaction ID",
    "Error",
  ];

  const content = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "fraud-predictions.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function requestPrediction(payload) {
  const response = await apiFetch(`${API}/fraud/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Prediction failed."
    );
  }

  return data;
}

function Predict() {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [csvRows, setCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvResults, setCsvResults] = useState([]);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvLoading, setCsvLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        Number(value),
      ])
    );

    if (
      Object.values(payload).some(
        (value) => !Number.isFinite(value)
      )
    ) {
      setError("Please enter valid numbers in every field.");
      setLoading(false);
      return;
    }

    try {
      const data = await requestPrediction(payload);
      setResult(data);
    } catch (err) {
      setError(
        `${err.message} Check that the backend and ML service are running.`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCSVChange(event) {
    const file = event.target.files?.[0];

    setCsvRows([]);
    setCsvResults([]);
    setCsvFileName("");
    setCsvError("");
    setCsvProgress(0);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Please select a .csv file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setCsvError("The maximum CSV file size is 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length < 2) {
        throw new Error(
          "The CSV must contain a header and at least one data row."
        );
      }

      const headers = parsed[0].map((header) =>
        header.trim().toLowerCase()
      );

      if (new Set(headers).size !== headers.length) {
        throw new Error("The CSV contains duplicate column names.");
      }

      const missing = REQUIRED_COLUMNS.filter(
        (name) => !headers.includes(name.toLowerCase())
      );

      if (missing.length) {
        throw new Error(
          `Missing required columns: ${missing.join(", ")}.`
        );
      }

      const columnIndexes = Object.fromEntries(
        headers.map((header, index) => [header, index])
      );

      const dataRows = parsed.slice(1);

      if (dataRows.length > MAX_ROWS) {
        throw new Error(
          `Maximum ${MAX_ROWS} transactions per upload.`
        );
      }

      const validatedRows = dataRows.map((row, index) => {
        if (row.length !== headers.length) {
          throw new Error(
            `Row ${index + 2} has ${row.length} fields; expected ${headers.length}.`
          );
        }

        const payload = {};

        for (const name of REQUIRED_COLUMNS) {
          const raw = row[columnIndexes[name.toLowerCase()]].trim();

          if (raw === "") {
            throw new Error(
              `Row ${index + 2}: ${name} cannot be empty.`
            );
          }

          const value = Number(raw);

          if (!Number.isFinite(value)) {
            throw new Error(
              `Row ${index + 2}: ${name} must be a valid number.`
            );
          }

          if (name === "Amount" && value < 0) {
            throw new Error(
              `Row ${index + 2}: Amount cannot be negative.`
            );
          }

          payload[name] = value;
        }

        return payload;
      });

      setCsvRows(validatedRows);
      setCsvFileName(file.name);
    } catch (err) {
      setCsvError(err.message || "Unable to read this CSV.");
      event.target.value = "";
    }
  }

  async function handleCSVSubmit() {
    if (!csvRows.length || csvLoading) return;

    setCsvLoading(true);
    setCsvError("");
    setCsvResults([]);
    setCsvProgress(0);

    const results = new Array(csvRows.length);
    let nextIndex = 0;
    let completed = 0;

    async function worker() {
      while (true) {
        const index = nextIndex++;

        if (index >= csvRows.length) return;

        const payload = csvRows[index];

        try {
          const data = await requestPrediction(payload);

          results[index] = {
            ...payload,
            Prediction: data.label ?? "Unknown",
            "Fraud Probability (%)":
              Number.isFinite(Number(data.fraud_probability))
                ? (Number(data.fraud_probability) * 100).toFixed(2)
                : "Unavailable",
            "Threshold (%)":
              Number.isFinite(Number(data.threshold))
                ? (Number(data.threshold) * 100).toFixed(2)
                : "Unavailable",
            "Transaction ID": data.transaction_id ?? "",
            Error: "",
          };
        } catch (err) {
          results[index] = {
            ...payload,
            Prediction: "Failed",
            "Fraud Probability (%)": "",
            "Threshold (%)": "",
            "Transaction ID": "",
            Error: err.message || "Prediction failed.",
          };
        }

        completed++;
        setCsvProgress(completed);
        setCsvResults(results.filter(Boolean));
      }
    }

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(CONCURRENCY, csvRows.length) },
          () => worker()
        )
      );
    } finally {
      setCsvLoading(false);
    }
  }

  const successfulCount = csvResults.filter(
    (row) => !row.Error
  ).length;

  const failedCount = csvResults.filter(
    (row) => Boolean(row.Error)
  ).length;

  return (
    <section className="predict-page">
      <div>
        <h1>Transaction Fraud Detection</h1>
        <p className="predict-description">
          Estimate potential fraud using your trained Random Forest model.
        </p>
      </div>

      <div className="prediction-notice">
        <strong>Research prototype:</strong> This model uses anonymized
        PCA-transformed features V1–V28. It is not a production banking
        system, and its predictions should not be treated as proof of fraud.
      </div>

      <section className="csv-panel">
        <h2>Analyze Transactions from CSV</h2>
        <p className="predict-description">
          Upload a CSV containing Time, V1–V28, and Amount.
          Column order does not matter. Maximum 500 rows and 5 MB per file.
        </p>

        <div className="form-field">
          <label htmlFor="csvFile">Transaction CSV file</label>
          <input
            id="csvFile"
            type="file"
            accept=".csv,text/csv"
            onChange={handleCSVChange}
            disabled={csvLoading}
          />
        </div>

        {csvFileName && (
          <p className="csv-status">
            Selected: <strong>{csvFileName}</strong>
            {" — "}
            {csvRows.length} transactions validated.
          </p>
        )}

        {csvError && <p className="error">{csvError}</p>}

      <div style={{ marginTop: "30px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={handleCSVSubmit}
          disabled={!csvRows.length || csvLoading}
        >
          {csvLoading
            ? `Analyzing ${csvProgress}/${csvRows.length}...`
            : `Analyze ${csvRows.length || ""} CSV Transactions`}
        </button>
      </div>

        {csvLoading && (
          <progress
            className="csv-progress"
            value={csvProgress}
            max={csvRows.length}
          />
        )}

        {csvResults.length > 0 && (
          <div className="csv-results" aria-live="polite">
            <h3>Batch Prediction Results</h3>

            <p>
              Completed: {csvProgress}/{csvRows.length}
              {" · "}
              Successful: {successfulCount}
              {" · "}
              Failed: {failedCount}
            </p>

            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => downloadCSV(csvResults)}
              >
                Download Results CSV
              </button>
            </div>

            <div className="csv-result-cards">
              {csvResults.map((row, index) => (
                <div className="predict-result" key={index}>
                  <h3>Prediction Result — Row {index + 1}</h3>

                  {row.Error ? (
                    <>
                      <p>
                        Classification: <strong>Failed</strong>
                      </p>
                      <p>
                        Error: <strong>{row.Error}</strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Classification:{" "}
                        <strong>{row.Prediction}</strong>
                      </p>

                      <p>
                        Fraud probability:{" "}
                        <strong>
                          {row["Fraud Probability (%)"] === "Unavailable"
                            ? "Unavailable"
                            : `${row["Fraud Probability (%)"]}%`}
                        </strong>
                      </p>

                      <p>
                        Threshold:{" "}
                        {row["Threshold (%)"] === "Unavailable"
                          ? "Unavailable"
                          : `${row["Threshold (%)"]}%`}
                      </p>

                      {row["Transaction ID"] !== "" && (
                        <p>
                          Saved transaction ID: {row["Transaction ID"]}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <details className="manual-prediction">
        <summary>Or enter a single transaction manually</summary>

        <div className="prediction-notice">
          The V1–V28 fields are anonymized research features. Their
          values are not ordinary transaction details.
        </div>

        <form className="predict-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="Time">Time</label>
            <input
              id="Time"
              name="Time"
              type="number"
              step="any"
              value={values.Time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="Amount">Amount</label>
            <input
              id="Amount"
              name="Amount"
              type="number"
              min="0"
              step="any"
              value={values.Amount}
              onChange={handleChange}
              required
            />
          </div>

          <h3>Model Features</h3>

          <div className="feature-grid">
            {FEATURE_NAMES.map((name) => (
              <div className="form-field" key={name}>
                <label htmlFor={name}>{name}</label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  step="any"
                  value={values[name]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Transaction"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="predict-result" aria-live="polite">
            <h3>Prediction Result</h3>
            <p>
              Classification: <strong>{result.label}</strong>
            </p>
            <p>
              Fraud probability:{" "}
              <strong>
                {(Number(result.fraud_probability) * 100).toFixed(2)}%
              </strong>
            </p>
            <p>
              Threshold:{" "}
              {(Number(result.threshold) * 100).toFixed(2)}%
            </p>
            {result.transaction_id != null && (
              <p>Saved transaction ID: {result.transaction_id}</p>
            )}
          </div>
        )}
      </details>
    </section>
  );
}

export default Predict;
