import express from "express";
import { adminLogin, registerAdmin } from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", adminLogin);

export default router;
