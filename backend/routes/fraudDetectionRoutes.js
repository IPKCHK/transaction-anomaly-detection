import { Router } from "express";
import { detectFraud } from "../controllers/fraudDetectionControllers.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateTransaction } from "../middleware/validateTransaction.js";

const router = Router();

router.post("/predict", authenticate, validateTransaction, detectFraud);

export default router;