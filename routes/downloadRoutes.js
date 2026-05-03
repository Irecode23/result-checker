import express from "express";
import { downloadResultPdf } from "../controllers/downloadController.js";

const router = express.Router();

// Student downloads their result PDF securely using PIN (Public — PIN-protected)
router.post("/download/:studentId", downloadResultPdf);

export default router;
