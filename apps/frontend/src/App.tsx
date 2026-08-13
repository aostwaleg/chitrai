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
  Zap
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

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Brush settings
  const [color, setColor] = useState("#1a1921");
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
  const [outlineImage, setOutlineImage] = useState<string | null>(null);
  
  // Gallery
  const [gallery, setGallery] = useState<SavedDrawing[]>([]);
  
  // XP notification trigger
  const [xpNotification, setXpNotification] = useState<{show: boolean, amount: number, levelUp: boolean} | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Support high DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;
    
    // Clear canvas to white background
    clearCanvas();
    fetchProfile();
    fetchGallery();
  }, []);

  // Sync brush state
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, tool]);

  // Fetch stats from backend
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.warn("Express backend offline, utilizing local client-state profile.");
    }
  };

  // Fetch gallery
  const fetchGallery = async () => {
    try {
      const res = await fetch(`${API_URL}/api/canvas/list`);
      if (res.ok) {
        const data = await res.json();
        setGallery(data);
      }
    } catch (e) {
      console.warn("Express backend offline, utilizing local in-memory gallery.");
    }
  };

  const handleXpReward = (amount: number, levelUp: boolean, updatedProfile?: UserProfile) => {
    setXpNotification({ show: true, amount, levelUp });
    if (updatedProfile) {
      setProfile(updatedProfile);
    } else {
      // client-side level up calculation fallback
      setProfile(prev => {
        let newXp = prev.xp + amount;
        let newLvl = prev.level;
        let nextXp = prev.xpToNextLevel;
        let upgraded = false;
        
        if (newXp >= nextXp) {
          newXp -= nextXp;
          newLvl += 1;
          nextXp = Math.floor(nextXp * 1.2);
          upgraded = true;
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
    
    // Save state for undo before drawing
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
    setOutlineImage(null);
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
      // We scale scaling factor back to draw correctly
      context.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    };
  };

  // AI - Generate Outline/Template
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
        setOutlineImage(data.result_b64);
        // Clear canvas but keep outline transparent overlay visible
        clearCanvas();
      } else {
        throw new Error("Failed response from AI Service");
      }
    } catch (e) {
      alert("AI Service is currently loading/offline. Using a client-side mock template outline.");
      // Client-side mock outline generator
      const mockOutlines: Record<string, string> = {
        cat: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' stroke='%23bbb' stroke-width='1.5' fill='none'><circle cx='50' cy='50' r='30'/><circle cx='40' cy='45' r='3' fill='%23999'/><circle cx='60' cy='45' r='3' fill='%23999'/><path d='M 45,55 Q 50,60 55,55' stroke-width='2'/></svg>",
        castle: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' stroke='%23bbb' stroke-width='1.5' fill='none'><rect x='30' y='50' width='40' height='35'/><rect x='20' y='35' width='10' height='50'/><rect x='70' y='35' width='10' height='50'/><polygon points='20,35 25,25 30,35'/><polygon points='70,35 75,25 80,35'/></svg>",
        star: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' stroke='%23bbb' stroke-width='1.5' fill='none'><polygon points='50,15 62,38 88,38 68,54 75,80 50,65 25,80 32,54 12,38 38,38'/></svg>",
      };
      const key = Object.keys(mockOutlines).find(k => prompt.toLowerCase().includes(k)) || "default";
      setOutlineImage(mockOutlines[key] || mockOutlines["star"]);
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
        
        // Draw the colorized result back on the canvas
        const img = new Image();
        img.src = data.result_b64;
        img.onload = () => {
          if (contextRef.current) {
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
            contextRef.current.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
          }
        };
        
        // Remove outline guide overlay since painting is fully colored now
        setOutlineImage(null);

        // Award XP and show progress celebration
        handleXpReward(data.xpAwarded || 50, data.leveledUp, data.profile);
        fetchGallery();
      } else {
        throw new Error("Colorization request failed");
      }
    } catch (e) {
      alert("AI Microservice is offline/starting up. Running local mock canvas blend.");
      
      // Local Mock Filter (Watercolor-ish Blend on Client)
      if (contextRef.current) {
        const ctx = contextRef.current;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        // Create pastel colored gradient background
        const grad = ctx.createRadialGradient(250, 175, 50, 250, 175, 250);
        grad.addColorStop(0, "#e0f7fa");
        grad.addColorStop(0.5, "#fce4ec");
        grad.addColorStop(1, "#fff3e0");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
        ctx.restore();
      }
      
      // Award baseline reward
      handleXpReward(50, false);
      
      // Add fake drawing to local gallery
      setGallery(prev => [
        {
          createdAt: new Date().toISOString(),
          image_b64: canvas.toDataURL()
        },
        ...prev
      ]);
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
          title: prompt || "My Masterpiece",
          image_b64
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        handleXpReward(data.xpAwarded || 25, data.leveledUp, data.profile);
        fetchGallery();
        alert("Awesome! Sketch saved successfully to your Art Album.");
      } else {
        throw new Error("Save request failed");
      }
    } catch (e) {
      alert("Saved locally! (Backend server offline)");
      setGallery(prev => [
        {
          createdAt: new Date().toISOString(),
          image_b64
        },
        ...prev
      ]);
      handleXpReward(25, false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar HUD */}
      <aside className="sidebar glass">
        <div className="profile-card glass">
          <div className="avatar">🎨</div>
          <h3>{profile.username}</h3>
          
          <div className={`level-badge ${xpNotification?.levelUp ? 'pop-animation' : ''}`}>
            Lvl {profile.level}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#8a87b1" }}>
            <span>XP: {profile.xp} / {profile.xpToNextLevel}</span>
            <span className={`tier-pill tier-${profile.skillTier}`}>{profile.skillTier}</span>
          </div>
          
          <div className="xp-bar-container">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${(profile.xp / profile.xpToNextLevel) * 100}%` }}
            />
          </div>
        </div>

        <div className="glass" style={{ padding: "16px" }}>
          <h4 style={{ margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <Trophy size={16} color="#ffbc00" />
            Badges Unlocked
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

        {/* Dynamic Level Rules HUD */}
        <div className="glass" style={{ padding: "16px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <h4 style={{ margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <BookOpen size={16} color="#ff2e93" />
            Skill Level Rules
          </h4>
          <div style={{ fontSize: "0.85rem", color: "#8a87b1", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p>
              <strong>Learner (Lvl 1-9):</strong> Guided tracing prompts. Focus on filling simple outlines.
            </p>
            <p>
              <strong>Junior (Lvl 10-29):</strong> Generate complex templates or draw freehand.
            </p>
            <p>
              <strong>Senior (Lvl 30+):</strong> Master full canvases, apply custom AI styles & high-res coloring models.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {/* Header HUD */}
        <header className="canvas-header glass">
          <div>
            <h2 style={{ margin: 0, background: "linear-gradient(90deg, #ff2e93, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Chitrai Creative Canvas
            </h2>
            <span style={{ fontSize: "0.85rem", color: "#8a87b1" }}>Play to learn drawing and painting with AI assistant</span>
          </div>
          
          <div className="badge tier-junior" style={{ padding: "8px 16px", borderRadius: "10px" }}>
            <Layers size={14} style={{ marginRight: "6px" }} />
            Active Mode: {profile.skillTier.toUpperCase()}
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
                background: "rgba(10, 230, 150, 0.9)",
                color: "#000",
                fontWeight: "bold",
                padding: "10px 20px",
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

          <div className="canvas-wrapper" style={{ width: "100%", maxWidth: "700px", height: "400px" }}>
            {outlineImage && (
              <img 
                src={outlineImage} 
                className="canvas-overlay-image" 
                alt="Guide Template" 
              />
            )}
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

          {/* Tools toolbar */}
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

            {/* Presets */}
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

            {/* Utility actions */}
            <button className="tool-button" onClick={undo} disabled={history.length === 0} title="Undo stroke">
              <Undo size={16} />
            </button>
            <button className="tool-button" onClick={clearCanvas} title="Clear canvas">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* AI Command Center */}
        <section className="ai-panel glass">
          <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={20} color="#00e5ff" />
            AI Painter & Outline Assistant
          </h3>
          
          <div className="ai-grid">
            <div className="form-group">
              <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>1. What should we draw/color? (Story Prompt)</label>
              <input 
                type="text" 
                className="styled-input"
                placeholder="e.g. A friendly cat, a medieval castle, an astronaut in space..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
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
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>2. Choose Art Style</label>
              <div className="style-selector">
                {["watercolor", "anime", "oil", "crayon"].map(s => (
                  <div 
                    key={s}
                    className={`style-pill ${style === s ? "selected" : ""}`}
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
            
            <button className="neon-button" onClick={handleColorize} disabled={loading || !prompt}>
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
            My Creative Album
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
    </div>
  );
}
