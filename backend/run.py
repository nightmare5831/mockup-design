import uvicorn
from app.config.settings import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5371,
        reload=settings.DEBUG,  # Only reload in debug mode
        log_level="info"
    )