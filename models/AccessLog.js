import mongoose from "mongoose";

const accessLogSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    status: { type: String, enum: ["success", "failed"], required: true },
    reason: { type: String },

    ipAddress: { type: String },
    userAgent: { type: String },

    remainingPinUses: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("AccessLog", accessLogSchema);