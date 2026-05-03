import AccessLog from "../models/AccessLog.js";

export const getAccessLogs = async (req, res) => {
  try {
    const { studentId, status, startDate, endDate } = req.query;

    const filter = {};

    if (studentId) {
      filter.studentId = studentId;
    }

    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate + "T00:00:00.000Z");
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const logs = await AccessLog.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Access logs retrieved successfully",
      total: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
