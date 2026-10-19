import { Router } from "express";
import {
  getTransactions,
  getTransactionStats,
} from "../controllers/transactionController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getTransactions);
router.get("/stats", getTransactionStats);

export default router;