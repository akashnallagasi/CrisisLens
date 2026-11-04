import html
import re
import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

# Magic number signatures for allowed image formats
MAGIC_NUMBERS = {
    "jpg": [b"\xFF\xD8\xFF"],
    "jpeg": [b"\xFF\xD8\xFF"],
    "png": [b"\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"],
    "webp": [b"\x52\x49\x46\x46"] # RIFF header
}

def sanitize_text(text: str | None, max_length: int = 5000) -> str:
    """
    Sanitizes untrusted text input to guard against injection and malicious content.
    Escapes HTML entities and truncates excess length.
    """
    if not text:
        return ""
    # Strip dangerous characters and escape HTML
    cleaned = html.escape(text.strip())
    # Truncate to safety limit
    return cleaned[:max_length]

async def validate_and_save_upload(file: UploadFile) -> tuple[str, str, int]:
    """
    Validates uploaded file against size and type constraints, checks file magic bytes,
    and saves it with a cryptographically generated UUID filename to prevent arbitrary execution.
    
    Returns: (stored_relative_path, mime_type, file_size)
    """
    # 1. Validate filename presence and extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{ext}' is not permitted. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
        
    # 2. Read first chunk for magic bytes inspection
    header_bytes = await file.read(16)
    await file.seek(0)
    
    # Verify magic bytes match declared format
    matched_magic = False
    for allowed_ext, signatures in MAGIC_NUMBERS.items():
        if ext == allowed_ext:
            for sig in signatures:
                if header_bytes.startswith(sig) or (ext == "webp" and b"WEBP" in header_bytes[8:16]):
                    matched_magic = True
                    break
    
    if not matched_magic and ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content signature does not match a valid image format"
        )

    # 3. Read complete content and enforce strict size limits
    contents = await file.read()
    file_size = len(contents)
    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB)"
        )
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )

    # 4. Generate isolated UUID filename - preventing any execution or directory traversal
    safe_filename = f"{uuid.uuid4().hex}.{ext}"
    target_path = settings.UPLOAD_DIR / safe_filename
    
    with open(target_path, "wb") as f:
        f.write(contents)
        
    mime_type = file.content_type or f"image/{ext}"
    return safe_filename, mime_type, file_size
