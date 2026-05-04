import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── PDF Storage (for result uploads) ──
const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "result-checker/results",
    resource_type: "raw",
    format: "pdf",
    public_id: (req, file) =>
      `result_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  },
});

// ── Image Storage (for teacher profile photos) ──
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "result-checker/teachers",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    public_id: (req, file) =>
      `teacher_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
  },
});

// ── PDF filter ──
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

// ── Image filter ──
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

// ── PDF upload instance ──
export const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ── Image upload instance ──
export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export { cloudinary };
export default uploadPdf;
