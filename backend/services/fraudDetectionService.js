
const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export async function predictFraud(transaction) {
  let response;

  try {
    console.log("Calling ML service:", `${ML_SERVICE_URL}/predict`);

    response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error("ML connection error:", error);
    const serviceError = new Error(
      `Could not connect to the ML prediction service: ${error.message}`
    );
    serviceError.status = 503;
    throw serviceError;
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("ML service response:", response.status, body);

    const serviceError = new Error(
      `ML service returned HTTP ${response.status}`
    );
    serviceError.status = 502;
    throw serviceError;
  }

  return response.json();
}
