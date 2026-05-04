import bcrypt from "bcrypt";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import { cloudinary } from "../config/cloudinaryConfig.js";

const generatePin = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// ── UPLOAD RESULT (Teacher — auto-generates new PIN) ──
export const teacherUploadResult = async (req, res) => {
  try {
    const { studentId, term, session } = req.body;

    if (!studentId || !term || !session) {
      return res.status(400).json({ message: "Student ID, term, and session are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const teacher = await Teacher.findById(req.teacher.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Student must belong to teacher's class
    const student = await Student.findOne({ studentId, className: teacher.className });
    if (!student) {
      // Clean up Cloudinary upload since student not found
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: "raw" });
      return res.status(404).json({ message: "Student not found in your class" });
    }

    // ── Auto-generate new PIN for this result ──
    const plainPin = generatePin();
    const pinHash = await bcrypt.hash(plainPin, 10);

    student.pinHash = pinHash;
    student.pinUsageCount = 0;
    student.pinUsageLimit = 5;
    student.isPinActive = true;
    student.currentPin = plainPin;
    await student.save();

    // ── Save result ──
    const result = await Result.create({
      studentId,
      className: teacher.className,
      term,
      session,
      filePath: req.file.path,         // Cloudinary secure URL
      cloudinaryId: req.file.filename, // Cloudinary public_id
      uploadedBy: teacher._id,
      uploadedByRole: "Teacher",
    });

    res.status(201).json({
      message: "Result uploaded successfully. Student PIN has been updated.",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET MY UPLOADED RESULTS ──
export const getMyUploadedResults = async (req, res) => {
  try {
    const results = await Result.find({ uploadedBy: req.teacher.id }).sort({ createdAt: -1 });
    res.status(200).json({
      message: "Results retrieved successfully",
      total: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── DELETE RESULT (Teacher owns it) ──
export const teacherDeleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: "Result not found" });

    if (result.uploadedBy.toString() !== req.teacher.id) {
      return res.status(403).json({ message: "You can only delete results you uploaded" });
    }

    // Delete from Cloudinary
    if (result.cloudinaryId) {
      await cloudinary.uploader.destroy(result.cloudinaryId, { resource_type: "raw" });
    }

    await Result.findByIdAndDelete(resultId);

    res.status(200).json({ message: "Result deleted successfully", resultId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
