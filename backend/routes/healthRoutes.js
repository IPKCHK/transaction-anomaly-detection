import express from "express";
import { getHealth, getHome } from "../controllers/healthControllers.js";

const router=express.Router();

router.get("/",getHome);
router.get("/health",getHealth);

export default router;