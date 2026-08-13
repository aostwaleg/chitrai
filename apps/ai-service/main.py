import os
import base64
import io
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import cv2
from PIL import Image, ImageOps, ImageFilter

app = FastAPI(title="Chitrai AI Inference Service", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ColorizeRequest(BaseModel):
    image_b64: str = Field(..., description="Base64 encoded string of the user's sketch canvas")
    prompt: str = Field("a beautiful painting", description="Prompt describing the scene")
    style: str = Field("watercolor", description="Style: watercolor, anime, oil, pencil, crayon")

class OutlineRequest(BaseModel):
    prompt: str = Field(..., description="Story prompt to generate outline for")
    complexity: str = Field("learner", description="Skill tier: learner, junior, senior")

class AIResponse(BaseModel):
    status: str
    result_b64: str
    message: str

def decode_base64_image(b64_str: str) -> Image.Image:
    try:
        # Strip metadata header if present (e.g. data:image/png;base64,)
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        
        img_data = base64.b64decode(b64_str)
        return Image.open(io.BytesIO(img_data)).convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

def encode_image_to_base64(img: Image.Image) -> str:
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

def apply_colorize_pipeline(img: Image.Image, style: str, prompt: str) -> Image.Image:
    # 1. Convert PIL to OpenCV format
    img_np = np.array(img)
    
    h, w = img_np.shape[:2]
    
    # 2. Check if image has an alpha channel and extract it
    if img_np.shape[2] == 4:
        r, g, b, alpha = cv2.split(img_np)
        
        # Check if the canvas is completely blank (all transparent or white)
        if np.sum(alpha) == 0:
            # Create a blank white canvas
            canvas = np.ones((h, w, 3), dtype=np.uint8) * 255
            sketch_mask = np.zeros((h, w), dtype=np.uint8)
        else:
            # Create RGB image and paste a white background in transparent areas
            canvas = cv2.merge([r, g, b])
            # Wherever alpha is less than 255, we blend it with solid white
            alpha_mask = alpha.astype(float) / 255.0
            for c in range(3):
                canvas[:, :, c] = (canvas[:, :, c] * alpha_mask + 255 * (1.0 - alpha_mask)).astype(np.uint8)
            
            # Sketch strokes are exactly where the drawing is opaque (alpha > 10) AND dark (gray < 240)
            gray_canvas = cv2.cvtColor(canvas, cv2.COLOR_RGB2GRAY)
            _, dark_mask = cv2.threshold(gray_canvas, 240, 255, cv2.THRESH_BINARY_INV)
            _, opacity_mask = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
            sketch_mask = cv2.bitwise_and(dark_mask, opacity_mask)
    else:
        canvas = img_np
        # Fallback to standard grayscale thresholding for solid drawings
        gray_canvas = cv2.cvtColor(canvas, cv2.COLOR_RGB2GRAY)
        _, sketch_mask = cv2.threshold(gray_canvas, 240, 255, cv2.THRESH_BINARY_INV)
    
    # 3. Create a style background using gradients or colored filters
    style = style.lower()
    color_map = {
        "watercolor": ((120, 200, 255), (255, 180, 200)), # light blue to pastel pink
        "anime": ((255, 100, 150), (100, 200, 255)),      # vivid pink to bright cyan
        "oil": ((40, 60, 150), (100, 40, 80)),            # deep blue to rich purple
        "crayon": ((245, 230, 150), (150, 230, 200)),     # warm yellow to pastel green
    }
    
    c1, c2 = color_map.get(style, ((200, 200, 200), (255, 255, 255)))
    
    # Generate background gradient
    bg = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        alpha_val = y / h
        bg[y, :] = [
            int((1 - alpha_val) * c1[i] + alpha_val * c2[i])
            for i in range(3)
        ]
        
    # 4. Dilate lines slightly to make outline solid
    kernel = np.ones((2,2), dtype=np.uint8)
    sketch_mask = cv2.dilate(sketch_mask, kernel, iterations=1)
    
    # Apply stylization to the background (OpenCV filters)
    if style == "watercolor":
        bg = cv2.bilateralFilter(bg, 9, 75, 75)
        noise = np.random.normal(0, 10, bg.shape).astype(np.int16)
        bg = np.clip(bg.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    elif style == "anime":
        bg = cv2.stylization(bg, sigma_s=60, sigma_r=0.07)
    elif style == "oil":
        bg = cv2.xphoto.oilPainting(bg, 4, 1) if hasattr(cv2, 'xphoto') else cv2.medianBlur(bg, 15)
    elif style == "crayon":
        noise = np.random.normal(0, 25, bg.shape).astype(np.int16)
        bg = np.clip(bg.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # 5. Overlay user's sketch strokes back on the colored background
    deep_grey = np.array([40, 40, 40], dtype=np.uint8)
    for c in range(3):
        bg[:, :, c] = np.where(sketch_mask > 0, deep_grey[c], bg[:, :, c])
        
    # 6. Convert back to PIL Image
    colored_img = Image.fromarray(bg).convert("RGBA")
    return colored_img

def generate_mock_outline(prompt: str, complexity: str) -> Image.Image:
    # Set size
    w, h = 600, 400
    img = np.ones((h, w, 3), dtype=np.uint8) * 255
    complexity = complexity.lower()
    prompt = prompt.lower()
    
    # Draw simple shapes based on keywords in prompt
    color = (80, 80, 80) # Grey outline
    
    if "cat" in prompt or "animal" in prompt:
        # Draw a cute animal face outline
        cv2.circle(img, (300, 200), 100, color, 3) # Head
        cv2.circle(img, (260, 180), 10, color, -1) # Eye L
        cv2.circle(img, (340, 180), 10, color, -1) # Eye R
        # Ears (triangles)
        pts_l = np.array([[210, 150], [250, 110], [230, 200]], np.int32)
        pts_r = np.array([[390, 150], [350, 110], [370, 200]], np.int32)
        cv2.polylines(img, [pts_l], True, color, 3)
        cv2.polylines(img, [pts_r], True, color, 3)
        # Mouth
        cv2.ellipse(img, (300, 220), (20, 10), 0, 0, 180, color, 3)
    elif "castle" in prompt or "house" in prompt:
        # Draw a castle structure outline
        cv2.rectangle(img, (200, 200), (400, 380), color, 3) # Main base
        cv2.rectangle(img, (150, 150), (200, 380), color, 3) # Left tower
        cv2.rectangle(img, (400, 150), (450, 380), color, 3) # Right tower
        # Roofs (triangles)
        pts_l = np.array([[140, 150], [175, 90], [210, 150]], np.int32)
        pts_r = np.array([[390, 150], [425, 90], [460, 150]], np.int32)
        cv2.polylines(img, [pts_l], True, color, 3)
        cv2.polylines(img, [pts_r], True, color, 3)
        # Door
        cv2.rectangle(img, (275, 280), (325, 380), color, 3)
    elif "star" in prompt or "sky" in prompt:
        # Draw a beautiful star outline
        pts = np.array([[300, 80], [330, 170], [420, 170], [350, 220], [380, 310],
                        [300, 250], [220, 310], [250, 220], [180, 170], [270, 170]], np.int32)
        cv2.polylines(img, [pts], True, color, 3)
    else:
        # Default: Draw a landscape (mountains + sun)
        cv2.circle(img, (450, 120), 40, color, 3) # Sun
        # Mountains
        pts1 = np.array([[50, 380], [200, 180], [350, 380]], np.int32)
        pts2 = np.array([[250, 380], [400, 220], [550, 380]], np.int32)
        cv2.polylines(img, [pts1], True, color, 3)
        cv2.polylines(img, [pts2], True, color, 3)
        
    # If complexity is high, add secondary lines/details
    if complexity in ["junior", "senior"]:
        # Add ground/grass line
        cv2.line(img, (50, 380), (550, 380), color, 2)
        # Add some clouds
        cv2.ellipse(img, (150, 100), (30, 15), 0, 0, 360, color, 2)
        cv2.ellipse(img, (170, 100), (25, 12), 0, 0, 360, color, 2)
        
    if complexity == "senior":
        # Add detailed shading outlines (hatching lines)
        for i in range(5):
            cv2.line(img, (180 + i*6, 220 + i*4), (190 + i*6, 240 + i*4), color, 1)
            cv2.line(img, (400 + i*6, 240 + i*4), (410 + i*6, 260 + i*4), color, 1)

    # Convert to PIL
    pil_img = Image.fromarray(img).convert("RGBA")
    return pil_img

@app.get("/health")
def health():
    return {"status": "ok", "service": "chitrai-ai-service"}

@app.post("/api/v1/generate/color", response_model=AIResponse)
def api_generate_color(request: ColorizeRequest):
    try:
        # 1. Decode user sketch
        img = decode_base64_image(request.image_b64)
        
        # 2. Run stylization / colorization pipeline
        processed_img = apply_colorize_pipeline(img, request.style, request.prompt)
        
        # 3. Encode back to base64
        result_b64 = encode_image_to_base64(processed_img)
        
        return AIResponse(
            status="success",
            result_b64=result_b64,
            message=f"Colorized sketch in {request.style} style matching: '{request.prompt}'"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/v1/generate/outline", response_model=AIResponse)
def api_generate_outline(request: OutlineRequest):
    try:
        # 1. Render mock sketch template based on prompt & complexity
        outline_img = generate_mock_outline(request.prompt, request.complexity)
        
        # 2. Encode to base64
        result_b64 = encode_image_to_base64(outline_img)
        
        return AIResponse(
            status="success",
            result_b64=result_b64,
            message=f"Generated {request.complexity} outline for prompt: '{request.prompt}'"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outline generation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host=host, port=port)
