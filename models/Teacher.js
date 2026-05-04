import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    className: { type: String, required: true },
    subject: { type: String, required: true },
    imageUrl: { type: String, default: null },         // Cloudinary secure URL
    imagePublicId: { type: String, default: null },    // Cloudinary public_id for deletion
    role: { type: String, default: "teacher" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Teacher", teacherSchema);
