import bcrypt from "bcrypt";
import crypto from "crypto";

import Student from "../models/Student.js";
import Result from "../models/Result.js";
import AccessLog from "../models/AccessLog.js";
import ViewToken from "../models/ViewToken.js";

export const checkStudentResult = async (req, res) => {
  try {
    const { studentId, pin } = req.body;

    if (!studentId || !pin) {
      return res.status(400).json({ message: "Student ID and PIN are required" });
    }

    const student = await Student.findOne({ studentId });

    // Always log failed attempts — but use a generic message to the client
    // to avoid leaking whether the student ID exists or not
    if (!student) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "Student not found",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return res.status(404).json({ message: "Invalid Student ID or PIN" });
    }

    // Check if PIN is still active
    if (!student.isPinActive || student.pinUsageCount >= student.pinUsageLimit) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "PIN expired",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        remainingPinUses: 0,
      });
      return res.status(403).json({ message: "PIN has expired. Please contact admin." });
    }

    // Verify PIN
    const isMatch = await bcrypt.compare(pin, student.pinHash);
    if (!isMatch) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "Wrong PIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        remainingPinUses: student.pinUsageLimit - student.pinUsageCount,
      });
      return res.status(401).json({ message: "Invalid Student ID or PIN" });
    }

    // Deduct PIN usage count
    student.pinUsageCount += 1;
    if (student.pinUsageCount >= student.pinUsageLimit) {
      student.isPinActive = false;
    }
    await student.save();

    const remainingUses = student.pinUsageLimit - student.pinUsageCount;

    // Get the latest uploaded result for this student
    const result = await Result.findOne({ studentId }).sort({ createdAt: -1 });
    if (!result) {
      await AccessLog.create({
        studentId,
        status: "failed",
        reason: "Result not uploaded yet",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        remainingPinUses: remainingUses,
      });
      return res.status(404).json({ message: "Result not found. Please contact admin." });
    }

    // Generate a secure random one-time view token
    const token = crypto.randomBytes(32).toString("hex");

    // Token expires in 2 minutes
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await ViewToken.create({
      token,
      studentId,
      resultId: result._id,
      expiresAt,
      used: false,
    });

    // Log successful access
    await AccessLog.create({
      studentId,
      status: "success",
      reason: "Result checked successfully",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      remainingPinUses: remainingUses,
    });

    res.status(200).json({
      message: "Result access granted",
      student: {
        studentId: student.studentId,
        fullName: student.fullName,
        className: student.className,
      },
      remainingPinUses: remainingUses,
      result: {
        term: result.term,
        session: result.session,
      },
      viewToken: token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
