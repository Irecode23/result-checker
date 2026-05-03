import bcrypt from "bcrypt";
import Student from "../models/Student.js";
import Result from "../models/Result.js";
import AccessLog from "../models/AccessLog.js";
import ViewToken from "../models/ViewToken.js";

const generatePin = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// ── CREATE STUDENT ──
export const createStudent = async (req, res) => {
  try {
    const { studentId, fullName, className } = req.body;

    if (!studentId || !fullName || !className) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const studentExists = await Student.findOne({ studentId });
    if (studentExists) {
      return res.status(400).json({ message: "Student ID already exists" });
    }

    const plainPin = generatePin();
    const pinHash = await bcrypt.hash(plainPin, 10);

    const student = await Student.create({
      studentId, fullName, className,
      pinHash,
      pinUsageLimit: 5,
      pinUsageCount: 0,
      isPinActive: true,
      currentPin: plainPin, // Admin can see this in dashboard
    });

    res.status(201).json({
      message: "Student created successfully",
      student: {
        id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
        pinUsageLimit: student.pinUsageLimit,
        pinUsageCount: student.pinUsageCount,
        isPinActive: student.isPinActive,
        currentPin: student.currentPin,
      },
      generatedPin: plainPin,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET ALL STUDENTS (with class filter + search) ──
// Returns currentPin so admin can display it in the dashboard
export const getAllStudents = async (req, res) => {
  try {
    const { className, search } = req.query;

    const filter = {};
    if (className) filter.className = className;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    // NOTE: We exclude pinHash but KEEP currentPin for admin view
    const students = await Student.find(filter)
      .select("-pinHash")
      .sort({ className: 1, fullName: 1 });

    res.status(200).json({
      message: "Students retrieved successfully",
      total: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── UPDATE STUDENT ──
export const updateStudent = async (req, res) => {
  try {
    const studentId = decodeURIComponent(req.params.studentId);
    const { fullName, className } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (fullName) student.fullName = fullName;
    if (className) student.className = className;
    await student.save();

    res.status(200).json({
      message: "Student updated successfully",
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
        isPinActive: student.isPinActive,
        currentPin: student.currentPin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── RESET STUDENT PIN (Admin manually resets) ──
export const resetStudentPin = async (req, res) => {
  try {
    const studentId = decodeURIComponent(req.params.studentId);

    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const plainPin = generatePin();
    const pinHash = await bcrypt.hash(plainPin, 10);

    student.pinHash = pinHash;
    student.pinUsageCount = 0;
    student.pinUsageLimit = 5;
    student.isPinActive = true;
    student.currentPin = plainPin; // Update visible PIN for admin

    await student.save();

    res.status(200).json({
      message: "PIN reset successfully",
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
        pinUsageLimit: student.pinUsageLimit,
        pinUsageCount: student.pinUsageCount,
        isPinActive: student.isPinActive,
        currentPin: student.currentPin,
      },
      newPin: plainPin,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── DELETE STUDENT ──
export const deleteStudent = async (req, res) => {
  try {
    const studentId = decodeURIComponent(req.params.studentId);

    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Promise.all([
      Result.deleteMany({ studentId }),
      AccessLog.deleteMany({ studentId }),
      ViewToken.deleteMany({ studentId }),
    ]);

    await Student.deleteOne({ studentId });

    res.status(200).json({ message: "Student deleted successfully", studentId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
