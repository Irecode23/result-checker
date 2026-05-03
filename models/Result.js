import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    className: { type: String, required: true },
    term: { type: String, required: true },
    session: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "uploadedByRole",
    },
    uploadedByRole: {
      type: String,
      enum: ["Admin", "Teacher"],
      default: "Teacher",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Result", resultSchema);
