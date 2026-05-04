import "./config/env.js"; // MUST be first — loads dotenv before anything else

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
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

const app = express();

// ── CORS ──
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ── Body Parsers ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ──
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkResultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", generalLimiter);
app.use("/api/student/check-result", checkResultLimiter);
app.use("/api/admin/login", loginLimiter);
app.use("/api/teacher/login", loginLimiter);

// ── Serve Frontend HTML files ──
app.use(express.static("public"));

// ── Connect Database ──
connectDB();

// ── Health Check ──
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Result Checker API is running ✅" });
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

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
