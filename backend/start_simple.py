#!/usr/bin/env python3
"""
Simple startup script for FastLeopard Mockups without Celery/Redis dependencies
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

def main():
    """Start the FastAPI application with minimal dependencies"""
    
    # Set default environment variables for local development
    os.environ.setdefault("DEBUG", "true")
    os.environ.setdefault("ENVIRONMENT", "development")
    os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production")
    os.environ.setdefault("DATABASE_URL", "postgresql://user:password@localhost:5432/fastleopard")
    os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
    
    # Optional settings
    os.environ.setdefault("STRIPE_PUBLISHABLE_KEY", "pk_test_dummy")
    os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_dummy")
    os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_dummy")
    os.environ.setdefault("HUGGINGFACE_TOKEN", "dummy")
    
    # Email settings (optional)
    os.environ.setdefault("SMTP_HOST", "smtp.gmail.com")
    os.environ.setdefault("SMTP_PORT", "587")
    os.environ.setdefault("SMTP_USERNAME", "dummy@gmail.com")
    os.environ.setdefault("SMTP_PASSWORD", "dummy")
    os.environ.setdefault("FROM_EMAIL", "noreply@fastleopard.com")
    
    # Create uploads directory
    uploads_dir = Path(__file__).parent / "uploads"
    uploads_dir.mkdir(exist_ok=True)
    (uploads_dir / "logos").mkdir(exist_ok=True)
    (uploads_dir / "products").mkdir(exist_ok=True)
    (uploads_dir / "mockups").mkdir(exist_ok=True)
    
    print("🚀 Starting FastLeopard Mockups API...")
    print("📝 Documentation will be available at: http://localhost:8000/docs")
    print("🎯 API endpoints at: http://localhost:8000/api/v1/")
    print("\n⚠️  Note: This is running without Celery/Redis for quick development")
    print("   AI model generation will be synchronous (may be slower)")
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

if __name__ == "__main__":
    main()