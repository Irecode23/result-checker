import express from "express";
import { checkStudentResult } from "../controllers/studentCheckController.js";

const router = express.Router();

// Student checks their result using Student ID + PIN (Public)
router.post("/check-result", checkStudentResult);

export default router;
