import jwt from "jsonwebtoken";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import { cloudinary } from "../config/cloudinaryConfig.js";

// ===============================
// UPLOAD RESULT (Cloudinary)
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
      // Delete uploaded file from Cloudinary since student doesn't exist
      await cloudinary.uploader.destroy(req.file.filename, {
        resource_type: "raw",
      });
      return res.status(404).json({ message: "Student not found" });
    }

    const result = await Result.create({
      studentId,
      className,
      term,
      session,
      filePath: req.file.path,         // Cloudinary secure URL
      cloudinaryId: req.file.filename, // Cloudinary public_id for deletion
      uploadedBy: req.admin.id,
      uploadedByRole: "Admin",
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
// DELETE RESULT (DB + Cloudinary)
// ===============================
export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Delete PDF from Cloudinary
    if (result.cloudinaryId) {
      await cloudinary.uploader.destroy(result.cloudinaryId, {
        resource_type: "raw",
      });
    }

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
// Redirects to Cloudinary URL
// ===============================
export const viewResultPdf = async (req, res) => {
  try {
    const { token } = req.params;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const result = await Result.findById(decoded.resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Redirect to Cloudinary secure URL
    return res.redirect(result.filePath);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
