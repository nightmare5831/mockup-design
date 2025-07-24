from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
from fastapi import UploadFile
from typing import Tuple, Optional
import io
import magic
from app.config.settings import settings
from app.core.exceptions import FileUploadError
import logging

logger = logging.getLogger(__name__)


def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check file size
    if file.size > settings.MAX_FILE_SIZE:
        raise FileUploadError(f"File size too large. Maximum {settings.MAX_FILE_SIZE} bytes allowed.")
    
    # Check file extension
    file_extension = None
    if file.filename:
        file_extension = f".{file.filename.split('.')[-1].lower()}"
        if file_extension not in settings.ALLOWED_IMAGE_EXTENSIONS:
            raise FileUploadError(f"Invalid file type. Allowed types: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}")
    
    # Read file content for validation
    try:
        file.file.seek(0)
        content = file.file.read(1024)  # Read first 1KB
        file.file.seek(0)  # Reset pointer
        
        # Check MIME type
        mime_type = magic.from_buffer(content, mime=True)
        if not mime_type.startswith('image/'):
            raise FileUploadError("File is not a valid image")
            
    except Exception as e:
        raise FileUploadError(f"Invalid image file: {str(e)}")


async def upload_image(file: UploadFile, folder: str = "images") -> str:
    """Upload and validate image"""
    validate_image(file)
    
    from app.services.storage_service import StorageService
    storage = StorageService()
    
    # Generate unique filename
    import uuid
    import os
    file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
    unique_filename = f"{folder}/{uuid.uuid4()}{file_extension}"
    
    # Upload to S3
    url = await storage.upload_file(file, unique_filename)
    return url


def resize_image(image: Image.Image, max_size: Tuple[int, int] = (2048, 2048)) -> Image.Image:
    """Resize image while maintaining aspect ratio"""
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    return image


def enhance_image(image: Image.Image, brightness: float = 1.0, contrast: float = 1.0, sharpness: float = 1.0) -> Image.Image:
    """Apply image enhancements"""
    if brightness != 1.0:
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(brightness)
    
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(contrast)
    
    if sharpness != 1.0:
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(sharpness)
    
    return image







def image_to_bytes(image: Image.Image, format: str = 'PNG') -> bytes:
    """Convert PIL Image to bytes"""
    bio = io.BytesIO()
    image.save(bio, format=format)
    return bio.getvalue()