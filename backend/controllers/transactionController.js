import { sql } from "../config/db.js";

export async function getTransactions(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const prediction =
      req.query.prediction === "0" || req.query.prediction === "1"
        ? Number(req.query.prediction)
        : null;

    const sort =
      req.query.sort === "probability" ? "probability" : "newest";

    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const rows = await sql`
      SELECT
        id,
        transaction_time,
        amount,
        fraud_probability,
        prediction,
        label,
        threshold,
        created_at
      FROM transactions
      WHERE user_id = ${userId}
        AND (${prediction}::INTEGER IS NULL OR prediction = ${prediction})
      ORDER BY
        CASE WHEN ${sort} = 'probability'
          THEN fraud_probability
        END DESC NULLS LAST,
        CASE WHEN ${sort} = 'newest'
          THEN created_at
        END DESC NULLS LAST,
        id DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*) AS total
      FROM transactions
      WHERE user_id = ${userId}
        AND (${prediction}::INTEGER IS NULL OR prediction = ${prediction})
    `;

    const total = Number(countRows[0].total);

    res.status(200).json({
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      transactions: rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTransactionStats(req, res, next) {
  try {
    const userId = req.user.id;

    const rows = await sql`
      SELECT
        COUNT(*) AS total_transactions,
        COUNT(*) FILTER (WHERE prediction = 1) AS fraud_transactions,
        COUNT(*) FILTER (WHERE prediction = 0) AS legitimate_transactions,
        COALESCE(
          SUM(amount) FILTER (WHERE prediction = 1), 0
        ) AS total_fraud_amount,
        COALESCE(AVG(fraud_probability), 0) AS average_fraud_probability
      FROM transactions
      WHERE user_id = ${userId}
    `;

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
}