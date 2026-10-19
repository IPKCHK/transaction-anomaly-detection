import { sql } from "../config/db.js";
import { predictFraud } from "../services/fraudDetectionService.js";

export async function detectFraud(req, res, next) {
  try {
    const result = await predictFraud(req.body);

    const rows = await sql`
      INSERT INTO transactions (
        user_id,
        transaction_time,
        amount,
        fraud_probability,
        prediction,
        label,
        threshold
      )
      VALUES (
        ${req.user.id},
        ${req.body.Time},
        ${req.body.Amount},
        ${result.fraud_probability},
        ${result.prediction},
        ${result.label},
        ${result.threshold}
      )
      RETURNING id, created_at
    `;

    res.status(200).json({
      ...result,
      transaction_id: rows[0].id,
      recorded_at: rows[0].created_at,
    });
  } catch (error) {
    next(error);
  }
}