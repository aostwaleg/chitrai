import React, { useRef, useState, useEffect } from "react";
import { 
  Palette, 
  Trash2, 
  Undo, 
  Sparkles, 
  Download, 
  Save, 
  BookOpen, 
  Layers, 
  Trophy, 
  Award,
  Zap,
  LogIn,
  User,
  FolderPlus,
  Edit3,
  Share2,
  Smile,
  X,
  Compass,
  Instagram,
  Facebook,
  Tv,
  CheckCircle2
} from "lucide-react";

interface UserProfile {
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillTier: "learner" | "junior" | "senior";
  badges: string[];
}

interface SavedDrawing {
  filename?: string;
  album: string;
  createdAt: string;
  image_b64: string;
}

const PRESET_COLORS = [
  "#1a1921", // Obsidian Dark
  "#ff2e93", // Neon Pink
  "#a200ff", // Neon Purple
  "#00e5ff", // Neon Cyan
  "#ffbc00", // Amber Yellow
  "#4caf50", // Jade Green
  "#ff5722", // Lava Orange
];

const SIMPLE_COLORS = [
  "#ff2e93", // Pink
  "#00e5ff", // Blue
  "#ffbc00", // Yellow
  "#4caf50", // Green
  "#ff5722", // Orange
  "#1a1921", // Black
];

const PRESET_AVATARS = ["🦊", "🐼", "🦁", "🐨", "🦄", "🎨", "🚀"];

// Hand-drawn SVG Outlines for local tracing
const TEMPLATE_OUTLINES = [
  {
    id: "puppy",
    name: "🐶 Cute Puppy",
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#bbbbbb";
      ctx.lineWidth = 3;
      // Head
      ctx.beginPath();
      ctx.arc(250, 180, 75, 0, Math.PI * 2);
      ctx.stroke();
      // Ears
      ctx.beginPath();
      ctx.ellipse(165, 150, 20, 50, Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(335, 150, 20, 50, -Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
      // Snout
      ctx.beginPath();
      ctx.ellipse(250, 200, 25, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = "#888888";
      ctx.beginPath();
      ctx.arc(220, 165, 8, 0, Math.PI * 2);
      ctx.arc(280, 165, 8, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.fillStyle = "#444444";
      ctx.beginPath();
      ctx.arc(250, 195, 8, 0, Math.PI * 2);
      ctx.fill();
      // Tongue / Mouth
      ctx.beginPath();
      ctx.arc(250, 215, 10, 0, Math.PI);
      ctx.stroke();
    }
  },
  {
    id: "rocket",
    name: "🚀 Space Rocket",
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#bbbbbb";
      ctx.lineWidth = 3;
      // Body
      ctx.beginPath();
      ctx.moveTo(250, 80);
      ctx.quadraticCurveTo(280, 150, 280, 260);
      ctx.lineTo(220, 260);
      ctx.quadraticCurveTo(220, 150, 250, 80);
      ctx.stroke();
      // Fins
      ctx.beginPath();
      ctx.moveTo(220, 220);
      ctx.lineTo(180, 270);
      ctx.lineTo(220, 260);
      ctx.moveTo(280, 220);
      ctx.lineTo(320, 270);
      ctx.lineTo(280, 260);
      ctx.stroke();
      // Window
      ctx.beginPath();
      ctx.arc(250, 160, 20, 0, Math.PI * 2);
      ctx.stroke();
      // Flame
      ctx.beginPath();
      ctx.moveTo(235, 265);
      ctx.lineTo(250, 310);
      ctx.lineTo(265, 265);
      ctx.stroke();
    }
  },
  {
    id: "tulip",
    name: "🌷 Tulip Flower",
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#bbbbbb";
      ctx.lineWidth = 3;
      // Stem
      ctx.beginPath();
      ctx.moveTo(250, 220);
      ctx.quadraticCurveTo(240, 280, 250, 340);
      ctx.stroke();
      // Leaves
      ctx.beginPath();
      ctx.moveTo(245, 290);
      ctx.quadraticCurveTo(200, 260, 220, 230);
      ctx.quadraticCurveTo(230, 270, 246, 292);
      ctx.moveTo(248, 310);
      ctx.quadraticCurveTo(300, 280, 280, 240);
      ctx.quadraticCurveTo(265, 280, 249, 308);
      ctx.stroke();
      // Flower head (Tulip cup)
      ctx.beginPath();
      ctx.moveTo(220, 160);
      ctx.quadraticCurveTo(210, 220, 250, 220);
      ctx.quadraticCurveTo(290, 220, 280, 160);
      ctx.lineTo(265, 180);
      ctx.lineTo(250, 150);
      ctx.lineTo(235, 180);
      ctx.closePath();
      ctx.stroke();
    }
  },
  {
    id: "castle",
    name: "🏰 Fairytale Castle",
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#bbbbbb";
      ctx.lineWidth = 3;
      // Main Center Wall
      ctx.strokeRect(200, 200, 100, 100);
      // Left Tower
      ctx.strokeRect(160, 150, 40, 150);
      // Right Tower
      ctx.strokeRect(300, 150, 40, 150);
      // Tower Roofs
      ctx.beginPath();
      ctx.moveTo(160, 150); ctx.lineTo(180, 90); ctx.lineTo(200, 150);
      ctx.moveTo(300, 150); ctx.lineTo(320, 90); ctx.lineTo(340, 150);
      ctx.stroke();
      // Gate
      ctx.beginPath();
      ctx.rect(230, 250, 40, 50);
      ctx.stroke();
    }
  },
  {
    id: "star",
    name: "⭐ Magic Star",
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#bbbbbb";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(250, 80);
      ctx.lineTo(280, 160);
      ctx.lineTo(360, 160);
      ctx.lineTo(295, 210);
      ctx.lineTo(320, 290);
      ctx.lineTo(250, 240);
      ctx.lineTo(180, 290);
      ctx.lineTo(205, 210);
      ctx.lineTo(140, 160);
      ctx.lineTo(220, 160);
      ctx.closePath();
      ctx.stroke();
    }
  }
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Custom Modes
  const [simpleMode, setSimpleMode] = useState(false); // Kid/Senior simple mode toggler
  
  // Brush settings
  const [color, setColor] = useState("#ff2e93");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  
  // History for Undo
  const [history, setHistory] = useState<string[]>([]);
  
  // Gamification & User Stats
  const [profile, setProfile] = useState<UserProfile>({
    username: "BuddingArtist123",
    level: 1,
    xp: 40,
    xpToNextLevel: 100,
    skillTier: "learner",
    badges: ["Starter Canvas"],
  });
  
  // AI Settings
  const [prompt, setPrompt] = useState("a cute cat face");
  const [style, setStyle] = useState("watercolor");
  const [loading, setLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Albums & Save Management
  const [albums, setAlbums] = useState<string[]>(["Default Album"]);
  const [selectedAlbum, setSelectedAlbum] = useState("Default Album");
  const [gallery, setGallery] = useState<SavedDrawing[]>([]);
  
  // Modals & Drawers Toggles
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  
  // User Profile Editing state
  const [editUsername, setEditUsername] = useState(profile.username);
  const [editAvatar, setEditAvatar] = useState("🦊");
  
  // Social Account Linking Simulation
  const [linkedSocials, setLinkedSocials] = useState<Record<string, boolean>>({
    instagram: false,
    facebook: false,
    tiktok: false
  });
  
  // XP notification trigger
  const [xpNotification, setXpNotification] = useState<{show: boolean, amount: number, levelUp: boolean} | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // Initialize Canvas
  useEffect(() => {
    initCanvas();
    fetchProfile();
    fetchAlbums();
  }, []);

  // Fetch gallery when selected album changes
  useEffect(() => {
    fetchGallery();
  }, [selectedAlbum]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.scale(2, 2);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;
    
    clearCanvas();
  };

  // Sync brush state
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      contextRef.current.lineWidth = simpleMode ? (tool === "eraser" ? 25 : 10) : brushSize;
    }
  }, [color, brushSize, tool, simpleMode]);

  // Fetch stats from backend
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditUsername(data.username);
      }
    } catch (e) {
      console.warn("Express backend offline, utilizing local client-state profile.");
    }
  };

  // Fetch albums
  const fetchAlbums = async () => {
    try {
      const res = await fetch(`${API_URL}/api/albums`);
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } catch (e) {
      console.warn("Express backend offline, utilizing local albums list.");
    }
  };

  // Fetch gallery
  const fetchGallery = async () => {
    try {
      const res = await fetch(`${API_URL}/api/canvas/list?album=${encodeURIComponent(selectedAlbum)}`);
      if (res.ok) {
        const data = await res.json();
        setGallery(data);
      }
    } catch (e) {
      console.warn("Express backend offline, using in-memory local gallery.");
    }
  };

  const handleXpReward = (amount: number, levelUp: boolean, updatedProfile?: UserProfile) => {
    setXpNotification({ show: true, amount, levelUp });
    if (updatedProfile) {
      setProfile(updatedProfile);
    } else {
      setProfile(prev => {
        let newXp = prev.xp + amount;
        let newLvl = prev.level;
        let nextXp = prev.xpToNextLevel;
        let localLevelUp = false;
        
        if (newXp >= nextXp) {
          newXp -= nextXp;
          newLvl += 1;
          nextXp = Math.floor(nextXp * 1.2);
          localLevelUp = true;
        }
        
        const tier = newLvl >= 30 ? "senior" : newLvl >= 10 ? "junior" : "learner";
        return {
          ...prev,
          level: newLvl,
          xp: newXp,
          xpToNextLevel: nextXp,
          skillTier: tier
        };
      });
    }

    setTimeout(() => {
      setXpNotification(null);
    }, 4000);
  };

  // Canvas drawing handlers
  const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    setHistory(prev => [...prev, canvas.toDataURL()]);

    const { offsetX, offsetY } = getCoordinates(nativeEvent, canvas);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent, canvasRef.current);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (event: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if (event.touches && event.touches.length > 0) {
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top,
      };
    }
    return {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    const context = contextRef.current;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setActiveTemplate(null);
  };

  const undo = () => {
    if (history.length === 0 || !canvasRef.current || !contextRef.current) return;
    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));

    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    };
  };

  // Tracing selected local template
  const loadTraceTemplate = (templateId: string) => {
    const template = TEMPLATE_OUTLINES.find(t => t.id === templateId);
    if (!template || !contextRef.current) return;
    
    clearCanvas();
    template.draw(contextRef.current);
    setActiveTemplate(template.name);
    setShowTemplateModal(false);
  };

  // AI - Generate Outline
  const handleGenerateOutline = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/outline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          complexity: profile.skillTier
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const img = new Image();
        img.src = data.result_b64;
        img.onload = () => {
          if (contextRef.current && canvasRef.current) {
            clearCanvas();
            contextRef.current.drawImage(img, 0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
            setActiveTemplate(`AI Outlines: ${prompt}`);
          }
        };
      } else {
        throw new Error("Failed outline response");
      }
    } catch (e) {
      alert("AI Service is offline. Please try selecting a template from our local Trace Outlines library!");
      setShowTemplateModal(true);
    } finally {
      setLoading(false);
    }
  };

  // AI - Colorize Drawing
  const handleColorize = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setLoading(true);
    const image_b64 = canvas.toDataURL("image/png");
    
    try {
      const res = await fetch(`${API_URL}/api/ai/color`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_b64,
          prompt,
          style
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        const img = new Image();
        img.src = data.result_b64;
        img.onload = () => {
          if (contextRef.current) {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
            contextRef.current.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
          }
        };
        
        handleXpReward(data.xpAwarded || 50, data.leveledUp, data.profile);
        fetchGallery();
      } else {
        throw new Error("Colorization request failed");
      }
    } catch (e) {
      // Local Mock Filter blend
      if (contextRef.current) {
        const ctx = contextRef.current;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        const grad = ctx.createLinearGradient(0, 0, canvas.width/2, canvas.height/2);
        grad.addColorStop(0, "#ffdde1");
        grad.addColorStop(1, "#ee9ca7");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
        ctx.restore();
      }
      
      handleXpReward(50, false);
      
      // Save locally
      const mockSaved: SavedDrawing = {
        album: selectedAlbum,
        createdAt: new Date().toISOString(),
        image_b64: canvas.toDataURL()
      };
      setGallery(prev => [mockSaved, ...prev]);
      alert("AI Service is starting up. Blended a local colorful overlay onto your sketch!");
    } finally {
      setLoading(false);
    }
  };

  // Save drawing directly
  const handleSaveDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const image_b64 = canvas.toDataURL("image/png");
    try {
      const res = await fetch(`${API_URL}/api/canvas/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prompt || "Masterpiece",
          image_b64,
          album: selectedAlbum
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        handleXpReward(data.xpAwarded || 25, data.leveledUp, data.profile);
        fetchGallery();
        alert(`Masterpiece saved to album folder: "${selectedAlbum}"`);
      } else {
        throw new Error("Save request failed");
      }
    } catch (e) {
      const mockSaved: SavedDrawing = {
        album: selectedAlbum,
        createdAt: new Date().toISOString(),
        image_b64
      };
      setGallery(prev => [mockSaved, ...prev]);
      handleXpReward(25, false);
      alert(`Saved locally under album: "${selectedAlbum}"`);
    }
  };

  // Album creation
  const handleCreateAlbum = async () => {
    const name = prompt("Enter a name for your new Art Album:");
    if (!name) return;
    
    try {
      const res = await fetch(`${API_URL}/api/albums/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums);
        setSelectedAlbum(name);
      }
    } catch (e) {
      setAlbums(prev => [...prev, name]);
      setSelectedAlbum(name);
    }
  };

  // Album renaming
  const handleRenameAlbum = async () => {
    const newName = prompt(`Enter new name for album "${selectedAlbum}":`);
    if (!newName) return;
    
    try {
      const res = await fetch(`${API_URL}/api/albums/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: selectedAlbum, newName })
      });
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums);
        setSelectedAlbum(newName);
      }
    } catch (e) {
      setAlbums(prev => prev.map(a => a === selectedAlbum ? newName : a));
      setSelectedAlbum(newName);
    }
  };

  // Profile Save
  const handleSaveProfile = () => {
    setProfile(prev => ({
      ...prev,
      username: editUsername,
      badges: prev.badges.includes("Avatar Art Custom") ? prev.badges : [...prev.badges, "Avatar Art Custom"]
    }));
    setShowProfileDrawer(false);
  };

  // Social account linking mock
  const toggleSocialLink = (platform: string) => {
    setLinkedSocials(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  return (
    <div className="app-container">
      {/* Sidebar HUD */}
      <aside className="sidebar glass">
        <div className="profile-card glass">
          <div className="avatar" style={{ fontSize: "3.5rem" }}>{editAvatar}</div>
          <h3 style={{ margin: "10px 0 5px 0" }}>{profile.username}</h3>
          
          <div className={`level-badge ${xpNotification?.levelUp ? 'pop-animation' : ''}`} style={{ marginBottom: "15px" }}>
            Lvl {profile.level}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#8a87b1" }}>
            <span>XP: {profile.xp} / {profile.xpToNextLevel}</span>
            <span className={`tier-pill tier-${profile.skillTier}`}>{profile.skillTier}</span>
          </div>
          
          <div className="xp-bar-container" style={{ marginBottom: "16px" }}>
            <div 
              className="xp-bar-fill" 
              style={{ width: `${(profile.xp / profile.xpToNextLevel) * 100}%` }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="tool-button" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowProfileDrawer(true)}>
              <User size={14} />
              Edit Profile
            </button>
            <button className="tool-button" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => setShowLoginModal(true)}>
              <LogIn size={14} />
              Log In
            </button>
          </div>
        </div>

        {/* Local Album Controller */}
        <div className="glass" style={{ padding: "18px" }}>
          <h4 style={{ margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <Palette size={16} color="#00e5ff" />
            Albums Manager
          </h4>
          <select 
            value={selectedAlbum} 
            onChange={(e) => setSelectedAlbum(e.target.value)}
            style={{ 
              width: "100%", 
              background: "rgba(0,0,0,0.3)", 
              border: "1px solid rgba(255,255,255,0.1)", 
              color: "#fff", 
              padding: "10px", 
              borderRadius: "10px", 
              marginBottom: "12px",
              fontSize: "0.9rem",
              fontFamily: "inherit"
            }}
          >
            {albums.map((album, idx) => (
              <option key={idx} value={album} style={{ background: "#1c1b29" }}>{album}</option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button className="tool-button" style={{ fontSize: "0.75rem", padding: "6px" }} onClick={handleCreateAlbum}>
              <FolderPlus size={12} />
              Create
            </button>
            <button className="tool-button" style={{ fontSize: "0.75rem", padding: "6px" }} onClick={handleRenameAlbum}>
              <Edit3 size={12} />
              Rename
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="glass" style={{ padding: "16px" }}>
          <h4 style={{ margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <Trophy size={16} color="#ffbc00" />
            Achievements
          </h4>
          <div className="badges-container">
            {profile.badges.map((badge, idx) => (
              <span key={idx} className="badge">
                <Award size={12} color="#00e5ff" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Rules info */}
        <div className="glass" style={{ padding: "16px", flexGrow: 1 }}>
          <h4 style={{ margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <BookOpen size={16} color="#ff2e93" />
            Rules & Levels
          </h4>
          <div style={{ fontSize: "0.8rem", color: "#8a87b1", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ margin: 0 }}><strong>Lvl 1-9 Learner:</strong> Basic outline overlays, trace tasks.</p>
            <p style={{ margin: 0 }}><strong>Lvl 10-29 Junior:</strong> Freehand prompts & custom styling.</p>
            <p style={{ margin: 0 }}><strong>Lvl 30+ Expert:</strong> Custom AI models, complex layers.</p>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {/* Header HUD */}
        <header className="canvas-header glass">
          <div>
            <h2 style={{ margin: 0, background: "linear-gradient(90deg, #ff2e93, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Chitrai Art Playground
            </h2>
            <span style={{ fontSize: "0.85rem", color: "#8a87b1" }}>A gamified sketching space suited for ages 5 to 95+</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Simple mode switch */}
            <div className="glass" style={{ display: "flex", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)" }}>
              <button 
                onClick={() => setSimpleMode(true)}
                className={`tool-button ${simpleMode ? "active" : ""}`}
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem" }}
              >
                👶 Kids Mode
              </button>
              <button 
                onClick={() => setSimpleMode(false)}
                className={`tool-button ${!simpleMode ? "active" : ""}`}
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem" }}
              >
                ⚡ Advanced Mode
              </button>
            </div>
          </div>
        </header>

        {/* Drawing Canvas */}
        <div className="canvas-card glass">
          {xpNotification && (
            <div 
              className="glass" 
              style={{
                position: "absolute",
                top: "20px",
                zIndex: 10,
                background: "rgba(10, 230, 150, 0.95)",
                color: "#000",
                fontWeight: "bold",
                padding: "12px 24px",
                borderRadius: "30px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 20px rgba(10, 230, 150, 0.4)",
              }}
            >
              <Zap size={18} fill="#000" />
              <span>+{xpNotification.amount} XP Unlocked! {xpNotification.levelUp && "Leveled Up! 🎉"}</span>
            </div>
          )}

          {activeTemplate && (
            <div style={{ position: "absolute", top: "20px", left: "20px", background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: "8px", fontSize: "0.8rem", color: "#00e5ff", border: "1px solid rgba(0, 229, 255, 0.3)" }}>
              Template: {activeTemplate}
            </div>
          )}

          <div 
            className="canvas-wrapper" 
            style={{ 
              width: "100%", 
              maxWidth: "700px", 
              height: "400px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
            }}
          >
            <canvas
              ref={canvasRef}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Simple / Kids Mode Controls */}
          {simpleMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "700px", marginTop: "15px" }}>
              {/* Massive brush colors */}
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                {SIMPLE_COLORS.map(c => (
                  <div 
                    key={c}
                    className={`color-dot ${color === c && tool === "pencil" ? "selected" : ""}`}
                    style={{ backgroundColor: c, width: "42px", height: "42px", border: "3px solid transparent" }}
                    onClick={() => {
                      setColor(c);
                      setTool("pencil");
                    }}
                  />
                ))}
                
                <div style={{ width: "2px", height: "30px", background: "rgba(255,255,255,0.15)" }} />

                <button 
                  className={`tool-button ${tool === "pencil" ? "active" : ""}`} 
                  style={{ padding: "12px 20px", fontSize: "1.1rem" }}
                  onClick={() => setTool("pencil")}
                >
                  ✏️ Drawing Brush
                </button>
                <button 
                  className={`tool-button ${tool === "eraser" ? "active" : ""}`} 
                  style={{ padding: "12px 20px", fontSize: "1.1rem" }}
                  onClick={() => setTool("eraser")}
                >
                  🧽 Eraser
                </button>
              </div>

              {/* Action Buttons for Kids/Seniors */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", width: "100%" }}>
                <button className="tool-button" style={{ padding: "12px 20px" }} onClick={() => setShowTemplateModal(true)}>
                  <Compass size={18} />
                  Choose a Sketch Guide
                </button>
                <button className="tool-button" style={{ padding: "12px 20px" }} onClick={undo} disabled={history.length === 0}>
                  <Undo size={18} />
                  Undo
                </button>
                <button className="tool-button" style={{ padding: "12px 20px" }} onClick={clearCanvas}>
                  <Trash2 size={18} />
                  Start Over
                </button>
              </div>
            </div>
          ) : (
            /* Expert/Advanced Mode controls */
            <div className="toolbar" style={{ width: "100%", maxWidth: "700px" }}>
              <button 
                className={`tool-button ${tool === "pencil" ? "active" : ""}`}
                onClick={() => setTool("pencil")}
              >
                Pencil
              </button>
              <button 
                className={`tool-button ${tool === "eraser" ? "active" : ""}`}
                onClick={() => setTool("eraser")}
              >
                Eraser
              </button>
              
              <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.15)", margin: "0 10px" }} />

              {/* Color Preset Palette */}
              {PRESET_COLORS.map(c => (
                <div 
                  key={c}
                  className={`color-dot ${color === c && tool === "pencil" ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setColor(c);
                    setTool("pencil");
                  }}
                />
              ))}

              <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.15)", margin: "0 10px" }} />

              {/* Brush Size */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#8a87b1" }}>
                <span>Size:</span>
                <input 
                  type="range" 
                  min="1" 
                  max="25" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{ width: "80px", accentColor: "#ff2e93" }}
                />
              </div>

              <div style={{ flexGrow: 1 }} />

              {/* Local tracing loader shortcut */}
              <button className="tool-button" style={{ padding: "8px 12px" }} onClick={() => setShowTemplateModal(true)}>
                <Compass size={16} />
                Trace Guides
              </button>
              <button className="tool-button" onClick={undo} disabled={history.length === 0} title="Undo stroke">
                <Undo size={16} />
              </button>
              <button className="tool-button" onClick={clearCanvas} title="Clear canvas">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* AI Command Center */}
        <section className="ai-panel glass">
          <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={20} color="#00e5ff" />
            AI Painter & Coloring Engine
          </h3>
          
          <div className="ai-grid">
            <div className="form-group">
              <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>What would you like the AI to generate? (Story/Drawing Prompt)</label>
              <input 
                type="text" 
                className="styled-input"
                placeholder="e.g. Castle, puppy, star, space rocket, landscape..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              {!simpleMode && (
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button 
                    className="tool-button" 
                    onClick={handleGenerateOutline}
                    disabled={loading}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <BookOpen size={14} />
                    Get AI Outline Guide
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Choose Painting Style</label>
              <div className="style-selector">
                {["watercolor", "anime", "oil", "crayon"].map(s => (
                  <div 
                    key={s}
                    className={`style-pill ${style === s ? "selected" : ""}`}
                    style={{
                      padding: simpleMode ? "14px 10px" : "10px",
                      fontSize: simpleMode ? "1rem" : "0.9rem"
                    }}
                    onClick={() => setStyle(s)}
                  >
                    {s.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
            <button className="tool-button" onClick={handleSaveDrawing} disabled={loading}>
              <Save size={18} />
              Save to Album
            </button>
            <button className="tool-button" onClick={() => setShowSocialModal(true)} disabled={loading}>
              <Share2 size={18} />
              Share Art
            </button>
            
            <button className="neon-button" style={{ minWidth: "180px" }} onClick={handleColorize} disabled={loading || !prompt}>
              {loading ? (
                <div className="loader" />
              ) : (
                <>
                  <Sparkles size={18} />
                  AI Colorize Sketch!
                </>
              )}
            </button>
          </div>
        </section>

        {/* Gallery */}
        <section className="glass" style={{ padding: "24px" }}>
          <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Palette size={20} color="#ff2e93" />
            My Creative Album ({selectedAlbum})
          </h3>
          
          {gallery.length === 0 ? (
            <p style={{ color: "#8a87b1", fontSize: "0.9rem" }}>No drawings saved in this album yet. Draw on the canvas and click "Save to Album"!</p>
          ) : (
            <div className="gallery-section">
              {gallery.map((draw, idx) => (
                <div key={idx} className="gallery-item glass">
                  <div className="gallery-preview">
                    <img src={draw.image_b64} alt="Creative drawing" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#8a87b1" }}>
                    <span>{new Date(draw.createdAt).toLocaleDateString()}</span>
                    <a 
                      href={draw.image_b64} 
                      download={`chitrai-art-${idx}.png`} 
                      style={{ color: "#00e5ff", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}
                    >
                      <Download size={12} />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="glass" style={{ width: "90%", maxWidth: "400px", padding: "30px", position: "relative" }}>
            <button style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: "#8a87b1" }} onClick={() => setShowLoginModal(false)}>
              <X size={20} />
            </button>
            <h2 style={{ marginTop: 0, background: "linear-gradient(90deg, #ff2e93, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Join Chitrai Art
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#8a87b1", marginBottom: "24px" }}>Log in to sync drawings online and unlock expert challenges.</p>
            
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.85rem" }}>Email or Phone Number</label>
              <input type="text" className="styled-input" placeholder="e.g. artist@example.com" />
            </div>
            
            <button className="neon-button" style={{ width: "100%", marginBottom: "16px" }} onClick={() => {
              setShowLoginModal(false);
              alert("Logged in successfully! Synced online account: BuddingArtist123");
            }}>
              Continue
            </button>

            <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#8a87b1", margin: "12px 0" }}>or</div>

            <button className="tool-button" style={{ width: "100%", justifyContent: "center" }} onClick={() => {
              setShowLoginModal(false);
              alert("Connected via Google OAuth successfully.");
            }}>
              Continue with Google Account
            </button>
          </div>
        </div>
      )}

      {/* PROFILE EDIT DRAWER */}
      {showProfileDrawer && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
          <div className="glass" style={{ width: "100%", maxWidth: "350px", height: "100%", padding: "30px", borderLeft: "1px solid rgba(255,255,255,0.12)", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0 }}>My Artist Profile</h3>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#8a87b1" }} onClick={() => setShowProfileDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.85rem" }}>Artist Username</label>
              <input 
                type="text" 
                className="styled-input" 
                value={editUsername} 
                onChange={(e) => setEditUsername(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "8px" }}>Select Avatar Emoji</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {PRESET_AVATARS.map(avatar => (
                  <button 
                    key={avatar}
                    style={{ 
                      fontSize: "1.8rem", 
                      padding: "8px", 
                      background: editAvatar === avatar ? "rgba(255,46,147,0.15)" : "rgba(255,255,255,0.03)", 
                      border: editAvatar === avatar ? "2px solid #ff2e93" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "transform 0.1s"
                    }}
                    onClick={() => setEditAvatar(avatar)}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Social Linking Panel */}
            <div className="glass" style={{ padding: "16px", marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem" }}>Linked Social Profiles</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}><Instagram size={14} color="#ff2e93" /> Instagram</span>
                  <button 
                    onClick={() => toggleSocialLink("instagram")}
                    className="tool-button" 
                    style={{ padding: "4px 10px", fontSize: "0.75rem", borderColor: linkedSocials.instagram ? "#00e5ff" : "rgba(255,255,255,0.1)" }}
                  >
                    {linkedSocials.instagram ? "Linked ✓" : "Link Account"}
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}><Facebook size={14} color="#00e5ff" /> Facebook Meta</span>
                  <button 
                    onClick={() => toggleSocialLink("facebook")}
                    className="tool-button" 
                    style={{ padding: "4px 10px", fontSize: "0.75rem", borderColor: linkedSocials.facebook ? "#00e5ff" : "rgba(255,255,255,0.1)" }}
                  >
                    {linkedSocials.facebook ? "Linked ✓" : "Link Account"}
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}><Tv size={14} color="#a200ff" /> TikTok Studio</span>
                  <button 
                    onClick={() => toggleSocialLink("tiktok")}
                    className="tool-button" 
                    style={{ padding: "4px 10px", fontSize: "0.75rem", borderColor: linkedSocials.tiktok ? "#00e5ff" : "rgba(255,255,255,0.1)" }}
                  >
                    {linkedSocials.tiktok ? "Linked ✓" : "Link Account"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ flexGrow: 1 }} />
            <button className="neon-button" style={{ width: "100%" }} onClick={handleSaveProfile}>
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* LOCAL SVG TRACE TEMPLATES MODAL */}
      {showTemplateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="glass" style={{ width: "90%", maxWidth: "600px", padding: "30px", position: "relative" }}>
            <button style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: "#8a87b1" }} onClick={() => setShowTemplateModal(false)}>
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, background: "linear-gradient(90deg, #ff2e93, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Trace Guides Library
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#8a87b1", marginBottom: "20px" }}>Select a shape. We will sketch its outline on the board so you can trace or paint colors over it.</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", maxHeight: "350px", overflowY: "auto", padding: "6px" }}>
              {TEMPLATE_OUTLINES.map(temp => (
                <div 
                  key={temp.id} 
                  className="gallery-item glass" 
                  style={{ cursor: "pointer", padding: "10px", textAlign: "center" }}
                  onClick={() => loadTraceTemplate(temp.id)}
                >
                  <div style={{ height: "80px", background: "#fcfcff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <span style={{ fontSize: "2rem" }}>🎨</span>
                  </div>
                  <h4 style={{ margin: "10px 0 0 0", fontSize: "0.95rem" }}>{temp.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL SHARING MODAL */}
      {showSocialModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="glass" style={{ width: "90%", maxWidth: "420px", padding: "30px", position: "relative" }}>
            <button style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: "#8a87b1" }} onClick={() => setShowSocialModal(false)}>
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Share2 size={20} color="#ff2e93" />
              Post Artwork
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#8a87b1", marginBottom: "20px" }}>Share this artwork directly to your linked social media feed.</p>
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button 
                onClick={() => toggleSocialLink("instagram")}
                className={`tool-button ${linkedSocials.instagram ? "active" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Instagram size={16} />
                Instagram
              </button>
              <button 
                onClick={() => toggleSocialLink("facebook")}
                className={`tool-button ${linkedSocials.facebook ? "active" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Facebook size={16} />
                Facebook
              </button>
              <button 
                onClick={() => toggleSocialLink("tiktok")}
                className={`tool-button ${linkedSocials.tiktok ? "active" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Tv size={16} />
                TikTok
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.85rem" }}>Caption / Description</label>
              <textarea 
                className="styled-input" 
                rows={3} 
                placeholder="Share your inspiration..." 
                style={{ resize: "none", fontFamily: "inherit" }}
                defaultValue={`Just finished painting "${prompt}" on #Chitrai! Check out my design! 🎨✨`}
              />
            </div>

            <button 
              className="neon-button" 
              style={{ width: "100%" }}
              onClick={() => {
                setShowSocialModal(false);
                alert("Successfully posted to feed! Earned +10 social bonus XP!");
                handleXpReward(10, false);
              }}
            >
              Post Now!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
