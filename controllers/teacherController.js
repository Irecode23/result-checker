import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Result from "../models/Result.js";

// ── CREATE TEACHER (Admin only) ──
export const createTeacher = async (req, res) => {
  try {
    const { firstName, lastName, email, password, className, subject } = req.body;

    if (!firstName || !lastName || !email || !password || !className || !subject) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(400).json({ message: "Teacher with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    // Build local image URL if photo was uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `http://localhost:${process.env.PORT || 5000}/uploads/teachers/${req.file.filename}`;
    }

    const teacher = await Teacher.create({
      firstName, lastName, email, passwordHash,
      className, subject, imageUrl,
      createdBy: req.admin.id,
    });

    res.status(201).json({
      message: "Teacher created successfully",
      teacher: {
        id: teacher._id, firstName: teacher.firstName, lastName: teacher.lastName,
        email: teacher.email, className: teacher.className,
        subject: teacher.subject, imageUrl: teacher.imageUrl, isActive: teacher.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET ALL TEACHERS (Admin only) ──
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().select("-passwordHash").sort({ createdAt: -1 });
    res.status(200).json({
      message: "Teachers retrieved successfully",
      total: teachers.length,
      teachers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── UPDATE TEACHER (Admin only) ──
export const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { firstName, lastName, email, password, className, subject, isActive } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    if (firstName) teacher.firstName = firstName;
    if (lastName) teacher.lastName = lastName;
    if (email) teacher.email = email;
    if (className) teacher.className = className;
    if (subject) teacher.subject = subject;
    if (typeof isActive !== "undefined") teacher.isActive = isActive;
    if (password) teacher.passwordHash = await bcrypt.hash(password, 10);

    // Replace image if new one uploaded
    if (req.file) {
      if (teacher.imageUrl) {
        const oldFilename = teacher.imageUrl.split("/uploads/teachers/")[1];
        if (oldFilename) {
          const oldPath = path.join(process.cwd(), "uploads/teachers", oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }
      teacher.imageUrl = `http://localhost:${process.env.PORT || 5000}/uploads/teachers/${req.file.filename}`;
    }

    await teacher.save();

    res.status(200).json({
      message: "Teacher updated successfully",
      teacher: {
        id: teacher._id, firstName: teacher.firstName, lastName: teacher.lastName,
        email: teacher.email, className: teacher.className,
        subject: teacher.subject, imageUrl: teacher.imageUrl, isActive: teacher.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── DELETE TEACHER (Admin only) ──
export const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Delete photo from disk
    if (teacher.imageUrl) {
      const filename = teacher.imageUrl.split("/uploads/teachers/")[1];
      if (filename) {
        const filePath = path.join(process.cwd(), "uploads/teachers", filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    await Teacher.findByIdAndDelete(teacherId);
    res.status(200).json({ message: "Teacher deleted successfully", teacherId });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── TEACHER LOGIN ──
export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(400).json({ message: "Invalid credentials" });

    if (!teacher.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact admin." });
    }

    const isMatch = await bcrypt.compare(password, teacher.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    teacher.lastLogin = new Date();
    await teacher.save();

    const token = jwt.sign(
      { id: teacher._id, email: teacher.email, role: "teacher", className: teacher.className },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      teacher: {
        id: teacher._id, firstName: teacher.firstName, lastName: teacher.lastName,
        email: teacher.email, className: teacher.className,
        subject: teacher.subject, imageUrl: teacher.imageUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET TEACHER PROFILE ──
export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id).select("-passwordHash");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const students = await Student.find({ className: teacher.className })
      .select("studentId fullName className").sort({ fullName: 1 });

    const results = await Result.find({ uploadedBy: teacher._id }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Profile retrieved successfully",
      teacher, students,
      totalStudents: students.length,
      totalResultsUploaded: results.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET STUDENTS IN MY CLASS (Teacher) ──
export const getMyClassStudents = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const students = await Student.find({ className: teacher.className })
      .select("studentId fullName className")  // NO pin info
      .sort({ fullName: 1 });

    res.status(200).json({
      message: "Students retrieved successfully",
      className: teacher.className,
      total: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET STUDENT BY ID (Teacher — for upload verification) ──
export const getStudentById = async (req, res) => {
  try {
    const studentId = decodeURIComponent(req.params.studentId);
    const teacher = await Teacher.findById(req.teacher.id);

    // Only find student if they belong to teacher's class
    const student = await Student.findOne({ studentId, className: teacher.className })
      .select("studentId fullName className"); // NO pin info

    if (!student) return res.status(404).json({ message: "Student not found in your class" });

    res.status(200).json({ message: "Student found", student });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
