import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    className: { type: String, required: true },

    pinHash: { type: String, required: true },
    pinUsageLimit: { type: Number, default: 5 },
    pinUsageCount: { type: Number, default: 0 },
    isPinActive: { type: Boolean, default: true },

    // Plain PIN stored so super admin can view it in dashboard
    // This is intentional — admin needs to hand it to student physically
    currentPin: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
