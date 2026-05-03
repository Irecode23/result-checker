import Result from "../models/Result.js";
import Student from "../models/Student.js";

// ── GET ALL RESULTS (with optional filters) ──
export const getAllResults = async (req, res) => {
  try {
    const { className, studentId, term, session } = req.query;

    const filter = {};
    if (className) filter.className = className;
    if (studentId) filter.studentId = { $regex: studentId, $options: "i" };
    if (term) filter.term = term;
    if (session) filter.session = { $regex: session, $options: "i" };

    const results = await Result.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Results retrieved successfully",
      total: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET RESULTS BY STUDENT ID ──
export const getResultsByStudent = async (req, res) => {
  try {
    const studentId = decodeURIComponent(req.params.studentId);

    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const results = await Result.find({ studentId }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Results retrieved successfully",
      total: results.length,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
