import path from "path";
import fs from "fs";
import ViewToken from "../models/ViewToken.js";
import Result from "../models/Result.js";

export const viewResultPdf = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const viewToken = await ViewToken.findOne({ token });

    if (!viewToken) {
      return res.status(404).json({ message: "Invalid or expired link" });
    }

    // Check if token has already been used
    if (viewToken.used) {
      return res.status(403).json({ message: "This link has already been used. Please check your result again." });
    }

    // Check if token has expired
    if (new Date() > viewToken.expiresAt) {
      return res.status(403).json({ message: "This link has expired. Please check your result again." });
    }

    const result = await Result.findById(viewToken.resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Mark token as used BEFORE sending file (prevents race condition)
    viewToken.used = true;
    await viewToken.save();

    const filePath = path.join(process.cwd(), result.filePath);

    // Confirm the PDF file physically exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF file not found on server. Contact admin." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=result.pdf");

    return res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
