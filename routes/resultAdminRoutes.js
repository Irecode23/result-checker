import express from "express";
import { protectAdmin } from "../middleware/authMiddleware.js";
import { getAllResults, getResultsByStudent } from "../controllers/resultAdminController.js";

const router = express.Router();

router.get("/all", protectAdmin, getAllResults);
router.get("/student/:studentId", protectAdmin, getResultsByStudent);

export default router;
