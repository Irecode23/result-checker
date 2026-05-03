import path from "path";
import fs from "fs";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import bcrypt from "bcrypt";
import AccessLog from "../models/AccessLog.js";

export const downloadResultPdf = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "Student not found (download attempt)",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return res.status(404).json({ message: "Student not found" });
    }

    // Check PIN is still valid
    if (!student.isPinActive || student.pinUsageCount >= student.pinUsageLimit) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "PIN expired (download attempt)",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        remainingPinUses: 0,
      });
      return res.status(403).json({ message: "PIN has expired. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(pin, student.pinHash);
    if (!isMatch) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "Wrong PIN (download attempt)",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        remainingPinUses: student.pinUsageLimit - student.pinUsageCount,
      });
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // Deduct PIN usage
    student.pinUsageCount += 1;
    if (student.pinUsageCount >= student.pinUsageLimit) {
      student.isPinActive = false;
    }
    await student.save();

    const remainingUses = student.pinUsageLimit - student.pinUsageCount;

    // Get the latest result
    const result = await Result.findOne({ studentId }).sort({ createdAt: -1 });
    if (!result) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "Result not found (download attempt)",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        remainingPinUses: remainingUses,
      });
      return res.status(404).json({ message: "Result not found" });
    }

    const filePath = path.join(process.cwd(), result.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF file not found on server. Contact admin." });
    }

    // Log success
    await AccessLog.create({
      studentId,
      status: "success",
      reason: "Result downloaded successfully",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      remainingPinUses: remainingUses,
    });

    // Send file as download attachment
    res.setHeader("Content-Disposition", `attachment; filename=result_${studentId}.pdf`);
    return res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
