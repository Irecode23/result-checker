import express from "express";
import {
  uploadResult,
  deleteResult,
  generateViewToken,
  viewResultPdf,
} from "../controllers/resultController.js";

import { protectAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Upload PDF result (Admin only)
router.post("/upload", protectAdmin, upload.single("resultPdf"), uploadResult);

// Generate temp view token for admin to preview PDF (Admin only)
router.get("/generate-view-token/:resultId", protectAdmin, generateViewToken);

// View PDF using JWT token (Public — token-protected)
router.get("/view/:token", viewResultPdf);

// Delete a result (Admin only)
router.delete("/:resultId", protectAdmin, deleteResult);

export default router;
