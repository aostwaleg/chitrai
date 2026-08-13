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

// Helper to get all albums (directories inside DATA_DIR)
function getAlbumsList(): string[] {
  try {
    const items = fs.readdirSync(DATA_DIR);
    const albums = items.filter(item => {
      const isDir = fs.statSync(path.join(DATA_DIR, item)).isDirectory();
      return isDir && !item.startsWith(".");
    });
    
    if (albums.length === 0) {
      const defaultAlbum = "Default Album";
      fs.mkdirSync(path.join(DATA_DIR, defaultAlbum), { recursive: true });
      return [defaultAlbum];
    }
    return albums;
  } catch (error) {
    return ["Default Album"];
  }
}

// Ensure at least one default album folder is initialized
getAlbumsList();

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

// Albums APIs
app.get("/api/albums", (req: Request, res: Response) => {
  res.json(getAlbumsList());
});

app.post("/api/albums/create", (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Missing album name" });
  }
  
  const cleanName = name.replace(/[^a-z0-9\s_-]/gi, "").trim();
  if (!cleanName) {
    return res.status(400).json({ error: "Invalid album name" });
  }

  try {
    const albumPath = path.join(DATA_DIR, cleanName);
    if (!fs.existsSync(albumPath)) {
      fs.mkdirSync(albumPath, { recursive: true });
    }
    res.json({ status: "success", albums: getAlbumsList() });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create album: ${error.message}` });
  }
});

app.post("/api/albums/rename", (req: Request, res: Response) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const cleanNewName = newName.replace(/[^a-z0-9\s_-]/gi, "").trim();
  if (!cleanNewName) {
    return res.status(400).json({ error: "Invalid new name" });
  }

  try {
    const oldPath = path.join(DATA_DIR, oldName);
    const newPath = path.join(DATA_DIR, cleanNewName);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      res.json({ status: "success", albums: getAlbumsList() });
    } else {
      res.status(404).json({ error: "Album not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: `Failed to rename album: ${error.message}` });
  }
});

// 3. Save drawing
app.post("/api/canvas/save", (req: Request, res: Response) => {
  const { title, image_b64, album } = req.body;
  if (!image_b64) {
    return res.status(400).json({ error: "Missing canvas image data" });
  }

  const targetAlbum = (album || "Default Album").replace(/[^a-z0-9\s_-]/gi, "").trim();

  try {
    const albumDir = path.join(DATA_DIR, targetAlbum);
    if (!fs.existsSync(albumDir)) {
      fs.mkdirSync(albumDir, { recursive: true });
    }

    const filename = `${Date.now()}-${(title || "untitled").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
    const filepath = path.join(albumDir, filename);
    
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
  const { album } = req.query;
  try {
    let drawings: any[] = [];
    const albums = getAlbumsList();

    // If a specific album is requested, only scan that folder
    if (album && typeof album === "string" && albums.includes(album)) {
      const albumDir = path.join(DATA_DIR, album);
      const files = fs.readdirSync(albumDir);
      drawings = files
        .filter(file => file.endsWith(".png"))
        .map(file => {
          const stats = fs.statSync(path.join(albumDir, file));
          return {
            filename: file,
            album,
            createdAt: stats.birthtime,
            image_b64: `data:image/png;base64,${fs.readFileSync(path.join(albumDir, file), "base64")}`
          };
        });
    } else {
      // Scan all albums folders recursively
      albums.forEach(currentAlbum => {
        const albumDir = path.join(DATA_DIR, currentAlbum);
        const files = fs.readdirSync(albumDir);
        const albumDrawings = files
          .filter(file => file.endsWith(".png"))
          .map(file => {
            const stats = fs.statSync(path.join(albumDir, file));
            return {
              filename: file,
              album: currentAlbum,
              createdAt: stats.birthtime,
              image_b64: `data:image/png;base64,${fs.readFileSync(path.join(albumDir, file), "base64")}`
            };
          });
        drawings = drawings.concat(albumDrawings);
      });
    }

    drawings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
