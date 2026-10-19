const featureNames = [
  "Time",
  ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`),
  "Amount",
];

export function validateTransaction(req, res, next) {
  const transaction = req.body;

  if (
    !transaction ||
    typeof transaction !== "object" ||
    Array.isArray(transaction)
  ) {
    return res.status(400).json({
      error: "Request body must be a JSON object.",
    });
  }

  const missingFeatures = featureNames.filter(
    (name) =>
      !Object.prototype.hasOwnProperty.call(transaction, name)
  );

  if (missingFeatures.length > 0) {
    return res.status(400).json({
      error: "Missing required transaction features.",
      missing_features: missingFeatures,
    });
  }

  const invalidFeatures = featureNames.filter(
    (name) =>
      typeof transaction[name] !== "number" ||
      !Number.isFinite(transaction[name])
  );

  if (invalidFeatures.length > 0) {
    return res.status(400).json({
      error: "All transaction features must be finite numbers.",
      invalid_features: invalidFeatures,
    });
  }

  if (transaction.Amount < 0) {
    return res.status(400).json({
      error: "Amount cannot be negative.",
    });
  }

  next();
}