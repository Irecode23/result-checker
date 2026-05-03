import express from "express";
import {
  teacherLogin,
  createTeacher,
  getAllTeachers,
  updateTeacher,
  deleteTeacher,
  getTeacherProfile,
  getMyClassStudents,
  getStudentById,
} from "../controllers/teacherController.js";
import { protectAdmin, protectTeacher } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ── Public ──
router.post("/login", teacherLogin);

// ── Admin only ──
router.post("/create", protectAdmin, uploadImage.single("image"), createTeacher);
router.get("/all", protectAdmin, getAllTeachers);
router.put("/:teacherId", protectAdmin, uploadImage.single("image"), updateTeacher);
router.delete("/:teacherId", protectAdmin, deleteTeacher);

// ── Teacher only ──
router.get("/profile", protectTeacher, getTeacherProfile);
router.get("/my-class/students", protectTeacher, getMyClassStudents);
router.get("/student/:studentId", protectTeacher, getStudentById);

export default router;
