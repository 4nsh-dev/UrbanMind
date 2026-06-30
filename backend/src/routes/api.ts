import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { authenticateToken, restrictToRoles } from "../middleware/auth.js";
import { parseSingleImage, uploadToFirebase } from "../middleware/upload.js";
import {
  createIssue,
  getAllIssues,
  getIssueById,
  voteIssue,
  addComment,
  updateIssueStatus
} from "../controllers/issueController.js";
import { getDashboardStats, getCityHealthScore } from "../controllers/dashboardController.js";

const router = Router();

// ==========================================
// 1. JWT AUTHENTICATION ENDPOINTS
// ==========================================

// Citizen Registration
router.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name, avatarUrl } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required profile credentials." });
    }

    const emailReg = email.toLowerCase().trim();
    const existing = await User.findOne({ email: emailReg });
    
    if (existing) {
      return res.status(400).json({ error: "Email is already registered on Community Hero." });
    }

    // Hash secret passwords using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      email: emailReg,
      passwordHash,
      name: name.trim(),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
      role: "citizen", // initial fallback role
      reputationPoints: 100, // starting gift XP!
    });

    await user.save();

    return res.status(201).json({
      message: "Citizen profile synchronized successfully! +100 XP awarded.",
      userId: user._id,
    });
  } catch (error: any) {
    console.error("Signup validation issue:", error);
    return res.status(500).json({ error: error.message });
  }
});

// User Sign in
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email/password context." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: "Invalid authentication credentials." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid authentication credentials." });
    }

    const secret = process.env.JWT_SECRET || "fallback_local_secret";
    const expire = process.env.JWT_EXPIRE_IN || "7d";

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: expire }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        xp: user.reputationPoints,
        level: user.level,
      },
    });
  } catch (error: any) {
    console.error("Login verification issue:", error);
    return res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 2. CIVIC ISSUES CRUD & VOTES (Protected via JWT)
// ==========================================

// Create a new issue (supports single image upload + Firebase streaming)
router.post(
  "/issues",
  authenticateToken as any,
  parseSingleImage,
  uploadToFirebase,
  createIssue as any
);

// Get all issues (supports geospatial querying, category sorting, status filtering)
router.get("/issues", getAllIssues as any);

// Get issue by MongoDB document ID
router.get("/issues/:id", getIssueById as any);

// Verify/Vote on report (increase credibility ratings + scale levels)
router.post("/issues/:id/vote", authenticateToken as any, voteIssue as any);

// Comment on issue timeline discussion forums
router.post("/issues/:id/comments", authenticateToken as any, addComment as any);

// Triage transition states (Limited to authorities: city workers/admin)
router.put(
  "/issues/:id/status",
  authenticateToken as any,
  restrictToRoles(["city_authority", "admin"]) as any,
  updateIssueStatus as any
);


// ==========================================
// 3. ANALYTICS & CITY INTEGRITY STATUS (Public)
// ==========================================

// Gather summary group counts & leaderboard standings
router.get("/dashboard/stats", getDashboardStats);

// Calculate overall municipal integrity coefficient
router.get("/dashboard/health-score", getCityHealthScore);

export default router;
