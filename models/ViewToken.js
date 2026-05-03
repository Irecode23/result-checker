import mongoose from "mongoose";

const viewTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: "Result", required: true },

    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("ViewToken", viewTokenSchema);