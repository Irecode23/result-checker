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

    if (viewToken.used) {
      return res.status(403).json({ message: "This link has already been used. Please check your result again." });
    }

    if (new Date() > viewToken.expiresAt) {
      return res.status(403).json({ message: "This link has expired. Please check your result again." });
    }

    const result = await Result.findById(viewToken.resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Mark token as used BEFORE redirecting
    viewToken.used = true;
    await viewToken.save();

    // Redirect student to Cloudinary PDF URL
    return res.redirect(result.filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
