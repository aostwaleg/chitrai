import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Ensure data folder for saving drawings exists
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory User Session for gamification
interface UserProfile {
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillTier: "learner" | "junior" | "senior";
  badges: string[];
}

let mockUser: UserProfile = {
  username: "BuddingArtist123",
  level: 1,
  xp: 40,
  xpToNextLevel: 100,
  skillTier: "learner",
  badges: ["Starter Canvas"],
};

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Helper to update user XP and handle level-ups
function awardXP(amount: number): { xpAdded: number; leveledUp: boolean } {
  mockUser.xp += amount;
  let leveledUp = false;
  
  while (mockUser.xp >= mockUser.xpToNextLevel) {
    mockUser.xp -= mockUser.xpToNextLevel;
    mockUser.level += 1;
    mockUser.xpToNextLevel = Math.floor(mockUser.xpToNextLevel * 1.2); // scale level complexity
    leveledUp = true;
    
    // Add custom badges at level milestones
    if (mockUser.level === 5 && !mockUser.badges.includes("Sketch Apprentice")) {
      mockUser.badges.push("Sketch Apprentice");
    }
    if (mockUser.level === 10 && !mockUser.badges.includes("Color Harmonizer")) {
      mockUser.badges.push("Color Harmonizer");
    }
  }

  // Auto-upgrade skill tiers based on levels
  if (mockUser.level >= 10 && mockUser.level < 30) {
    mockUser.skillTier = "junior";
  } else if (mockUser.level >= 30) {
    mockUser.skillTier = "senior";
  }

  return { xpAdded: amount, leveledUp };
}

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// 1. Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "chitrai-backend" });
});

// 2. Get user profile and gamification progress
app.get("/api/user/profile", (req: Request, res: Response) => {
  res.json(mockUser);
});

// 3. Save drawing
app.post("/api/canvas/save", (req: Request, res: Response) => {
  const { title, image_b64 } = req.body;
  if (!image_b64) {
    return res.status(400).json({ error: "Missing canvas image data" });
  }

  try {
    const filename = `${Date.now()}-${(title || "untitled").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
    const filepath = path.join(DATA_DIR, filename);
    
    // Strip header if present
    const base64Data = image_b64.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(filepath, base64Data, "base64");

    // Award user some XP for completing and saving a drawing!
    const xpResult = awardXP(25);

    res.json({
      status: "success",
      filename,
      message: "Drawing saved successfully!",
      xpAwarded: xpResult.xpAdded,
      leveledUp: xpResult.leveledUp,
      profile: mockUser
    });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to save file: ${error.message}` });
  }
});

// 4. Retrieve saved drawing list
app.get("/api/canvas/list", (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(DATA_DIR);
    const drawings = files
      .filter(file => file.endsWith(".png"))
      .map(file => {
        const stats = fs.statSync(path.join(DATA_DIR, file));
        return {
          filename: file,
          createdAt: stats.birthtime,
          // Read file content as base64 to serve to frontend
          image_b64: `data:image/png;base64,${fs.readFileSync(path.join(DATA_DIR, file), "base64")}`
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
    res.json(drawings);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to retrieve drawings: ${error.message}` });
  }
});

// 5. Proxy Colorization Request to AI Microservice
app.post("/api/ai/color", async (req: Request, res: Response) => {
  const { image_b64, prompt, style } = req.body;

  if (!image_b64) {
    return res.status(400).json({ error: "Missing canvas image data" });
  }

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/generate/color`, {
      image_b64,
      prompt: prompt || "beautiful colorful painting",
      style: style || "watercolor"
    }, {
      headers: { "Content-Type": "application/json" },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Award more XP for utilizing AI colorizer
    const xpResult = awardXP(50);

    res.json({
      ...response.data,
      xpAwarded: xpResult.xpAdded,
      leveledUp: xpResult.leveledUp,
      profile: mockUser
    });
  } catch (error: any) {
    console.error("AI service error:", error.message);
    res.status(500).json({
      error: `Failed to connect with AI service: ${error.response?.data?.detail || error.message}`
    });
  }
});

// 6. Proxy Outline Request to AI Microservice
app.post("/api/ai/outline", async (req: Request, res: Response) => {
  const { prompt, complexity } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt query" });
  }

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/generate/outline`, {
      prompt,
      complexity: complexity || mockUser.skillTier
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("AI service error:", error.message);
    res.status(500).json({
      error: `Failed to retrieve outline: ${error.response?.data?.detail || error.message}`
    });
  }
});

app.listen(PORT, () => {
  console.log(`Chitrai Backend running on http://localhost:${PORT}`);
  console.log(`Connected to AI Service at ${AI_SERVICE_URL}`);
});
