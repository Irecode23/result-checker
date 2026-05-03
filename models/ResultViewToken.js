import mongoose from "mongoose";

const resultViewTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },

    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Result",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ResultViewToken", resultViewTokenSchema);