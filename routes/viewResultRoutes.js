import express from "express";
import { viewResultPdf } from "../controllers/viewResultController.js";

const router = express.Router();

// One-time view token access for students (Public — token-protected)
router.get("/view/:token", viewResultPdf);

export default router;
