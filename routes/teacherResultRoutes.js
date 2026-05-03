import express from "express";
import {
  teacherUploadResult,
  getMyUploadedResults,
  teacherDeleteResult,
} from "../controllers/teacherResultController.js";
import { protectTeacher } from "../middleware/authMiddleware.js";
import { uploadPdf } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", protectTeacher, uploadPdf.single("resultPdf"), teacherUploadResult);
router.get("/my-results", protectTeacher, getMyUploadedResults);
router.delete("/:resultId", protectTeacher, teacherDeleteResult);

export default router;
