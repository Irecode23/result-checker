import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

import Result from "../models/Result.js";
import Student from "../models/Student.js";

// ===============================
// UPLOAD RESULT
// ===============================
export const uploadResult = async (req, res) => {
  try {
    const { studentId, className, term, session } = req.body;

    if (!studentId || !className || !term || !session) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      // Clean up uploaded file if student doesn't exist
      fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Student not found" });
    }

    const result = await Result.create({
      studentId,
      className,
      term,
      session,
      filePath: req.file.path,
      uploadedBy: req.admin.id,
    });

    res.status(201).json({
      message: "Result uploaded successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===============================
// DELETE RESULT (DB + PDF FILE)
// ===============================
export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Build full absolute path and delete the PDF file
    const filePath = path.join(process.cwd(), result.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete result from database
    await Result.findByIdAndDelete(resultId);

    res.status(200).json({
      message: "Result deleted successfully",
      resultId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===============================
// GENERATE TEMP VIEW TOKEN (ADMIN)
// ===============================
export const generateViewToken = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Token valid for 5 minutes
    const token = jwt.sign(
      { resultId: result._id },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    const viewUrl = `${req.protocol}://${req.get("host")}/api/results/view/${token}`;

    res.status(200).json({
      message: "View token generated successfully",
      viewUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===============================
// VIEW PDF USING TOKEN (PUBLIC)
// ===============================
export const viewResultPdf = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const result = await Result.findById(decoded.resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    const filePath = path.join(process.cwd(), result.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF file not found on server" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
