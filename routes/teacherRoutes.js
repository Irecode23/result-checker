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

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ message: err.message || "Image upload failed" });
    }
    next();
  });
};

// ── Public ──
router.post("/login", teacherLogin);

// ── Admin only ──
router.post("/create", protectAdmin, handleUpload, createTeacher);
router.get("/all", protectAdmin, getAllTeachers);
router.put("/:teacherId", protectAdmin, handleUpload, updateTeacher);
router.delete("/:teacherId", protectAdmin, deleteTeacher);

// ── Teacher only ──
router.get("/profile", protectTeacher, getTeacherProfile);
router.get("/my-class/students", protectTeacher, getMyClassStudents);
router.get("/student/:studentId", protectTeacher, getStudentById);

export default router;
