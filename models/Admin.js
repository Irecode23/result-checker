import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "admin" },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);