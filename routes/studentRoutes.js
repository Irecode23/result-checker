import express from "express";
import {
  createStudent,
  getAllStudents,
  updateStudent,
  resetStudentPin,
  deleteStudent,
} from "../controllers/studentController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protectAdmin, createStudent);
router.get("/all", protectAdmin, getAllStudents);
router.put("/update/:studentId", protectAdmin, updateStudent);
router.put("/reset-pin/:studentId", protectAdmin, resetStudentPin);
router.delete("/:studentId", protectAdmin, deleteStudent);

export default router;
