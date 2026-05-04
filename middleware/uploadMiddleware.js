// Production upload middleware uses Cloudinary
// All upload logic is handled in config/cloudinaryConfig.js
export { uploadPdf, uploadImage, cloudinary } from "../config/cloudinaryConfig.js";
export { uploadPdf as default } from "../config/cloudinaryConfig.js";
