import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import studentCheckRoutes from "./routes/studentCheckRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import viewResultRoutes from "./routes/viewResultRoutes.js";
import resultAdminRoutes from "./routes/resultAdminRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import teacherResultRoutes from "./routes/teacherResultRoutes.js";

dotenv.config();

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve frontend HTML files from public/ ──
app.use(express.static("public"));

// ── Serve uploaded files (PDFs + teacher images) ──
app.use("/uploads", express.static("uploads"));

// ── Connect DB ──
connectDB();

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running ✅" });
});

// ── Routes ──
app.use("/api/admin", adminRoutes);
app.use("/api/admin/logs", logRoutes);
app.use("/api/admin/results", resultAdminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/student", studentCheckRoutes);
app.use("/api/student", viewResultRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher/results", teacherResultRoutes);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// ── Start ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔵 Admin    → http://localhost:${PORT}/admin-login.html`);
  console.log(`🟢 Teacher  → http://localhost:${PORT}/teacher-login.html`);
  console.log(`🎓 Student  → http://localhost:${PORT}/student.html`);
});
