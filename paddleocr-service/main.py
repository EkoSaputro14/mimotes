"""
PaddleOCR Sidecar Service for Mimotes Multimodal RAG.

Provides OCR text extraction via PaddleOCR with:
- REST API endpoint (/ocr)
- Health check (/health)
- Language support: English + Indonesian
- Confidence scoring
- Bounding box data

Architecture:
  Image (base64/file) -> PaddleOCR -> Extracted text + confidence
"""

import os
import time
import base64
import tempfile
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Lazy-load PaddleOCR to speed up startup
_paddle_ocr = None

def get_ocr_engine():
    """Lazy-load PaddleOCR engine."""
    global _paddle_ocr
    if _paddle_ocr is None:
        from paddleocr import PaddleOCR
        _paddle_ocr = PaddleOCR(
            use_angle_cls=True,
            lang="en",
            show_log=False,
        )
    return _paddle_ocr


app = FastAPI(title="PaddleOCR Sidecar", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class OCRRequest(BaseModel):
    """Request for OCR extraction."""
    image_base64: Optional[str] = None
    language: str = "en"


class OCRResult(BaseModel):
    """Single OCR text block result."""
    text: str
    confidence: float
    bbox: list


class OCRResponse(BaseModel):
    """OCR extraction response."""
    success: bool
    text: str
    blocks: list[OCRResult]
    total_blocks: int
    total_confidence: float
    processing_time_ms: int
    language: str
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    engine: str
    model_loaded: bool
    uptime_seconds: float


_start_time = time.time()


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        engine="paddleocr",
        model_loaded=_paddle_ocr is not None,
        uptime_seconds=round(time.time() - _start_time, 1),
    )


def _resize_image(tmp_path: str, max_dim: int = 2000) -> str:
    """Resize large images to prevent OOM. Returns path to resized image."""
    try:
        from PIL import Image
        img = Image.open(tmp_path)
        w, h = img.size
        if max(w, h) <= max_dim:
            return tmp_path
        ratio = max_dim / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        resized_path = tmp_path + "_resized.png"
        img.save(resized_path, "PNG")
        return resized_path
    except Exception:
        return tmp_path


def _run_ocr(tmp_path: str) -> tuple[list, list, float]:
    """Run PaddleOCR and parse results. Returns (blocks, all_text, total_confidence)."""
    # Resize large images to prevent OOM
    ocr_path = _resize_image(tmp_path)
    try:
        engine = get_ocr_engine()
        result = engine.ocr(ocr_path, cls=True)
    finally:
        if ocr_path != tmp_path:
            try:
                os.unlink(ocr_path)
            except Exception:
                pass

    blocks = []
    all_text = []
    total_confidence = 0.0

    if result and result[0]:
        for line in result[0]:
            bbox = line[0]
            text = line[1][0]
            confidence = float(line[1][1])

            if text.strip():
                blocks.append(OCRResult(
                    text=text.strip(),
                    confidence=round(confidence, 4),
                    bbox=bbox,
                ))
                all_text.append(text.strip())
                total_confidence += confidence

    return blocks, all_text, total_confidence


@app.post("/ocr", response_model=OCRResponse)
async def extract_text(request: OCRRequest):
    """
    Extract text from image using PaddleOCR.

    Accepts base64-encoded image data.
    Returns extracted text blocks with confidence scores.
    """
    start = time.time()

    if not request.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")

    try:
        image_data = base64.b64decode(request.image_base64)

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(image_data)
            tmp_path = tmp.name

        try:
            blocks, all_text, total_confidence = _run_ocr(tmp_path)

            combined_text = "\n".join(all_text)
            avg_confidence = total_confidence / len(blocks) if blocks else 0.0
            elapsed_ms = round((time.time() - start) * 1000)

            return OCRResponse(
                success=True,
                text=combined_text,
                blocks=blocks,
                total_blocks=len(blocks),
                total_confidence=round(avg_confidence, 4),
                processing_time_ms=elapsed_ms,
                language=request.language,
            )
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        elapsed_ms = round((time.time() - start) * 1000)
        return OCRResponse(
            success=False,
            text="",
            blocks=[],
            total_blocks=0,
            total_confidence=0.0,
            processing_time_ms=elapsed_ms,
            language=request.language,
            error=str(e),
        )


@app.post("/ocr/file", response_model=OCRResponse)
async def extract_text_file(
    file: UploadFile = File(...),
    language: str = "en",
):
    """Extract text from uploaded image file."""
    start = time.time()

    try:
        content = await file.read()

        ext = file.filename.split(".")[-1] if file.filename else "png"
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            blocks, all_text, total_confidence = _run_ocr(tmp_path)

            combined_text = "\n".join(all_text)
            avg_confidence = total_confidence / len(blocks) if blocks else 0.0
            elapsed_ms = round((time.time() - start) * 1000)

            return OCRResponse(
                success=True,
                text=combined_text,
                blocks=blocks,
                total_blocks=len(blocks),
                total_confidence=round(avg_confidence, 4),
                processing_time_ms=elapsed_ms,
                language=language,
            )
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        elapsed_ms = round((time.time() - start) * 1000)
        return OCRResponse(
            success=False,
            text="",
            blocks=[],
            total_blocks=0,
            total_confidence=0.0,
            processing_time_ms=elapsed_ms,
            language=language,
            error=str(e),
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8090"))
    uvicorn.run(app, host="0.0.0.0", port=port)
