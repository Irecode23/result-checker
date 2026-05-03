import express from "express";
import { getAccessLogs } from "../controllers/logController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get access logs with optional filters (Admin only)
router.get("/", protectAdmin, getAccessLogs);

export default router;
