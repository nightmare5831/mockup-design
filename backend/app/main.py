from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging

# Import torch for cleanup (with fallback)
try:
    import torch
except ImportError:
    torch = None

from app.config.settings import settings
from app.config.database import init_db
from app.core.exceptions import CustomException
from app.api.v1 import auth, users, mockups, products, credits, subscriptions, payments, admin, simulation_history
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up AI Mockup Platform backend...")
    await init_db()
    logger.info("Database initialized successfully")
    
    # Initialize AI models (only in production or if explicitly enabled)
    try:
        from app.services.ai_service import AIService
        ai_service = AIService()
        await ai_service.initialize_models()
        logger.info("AI models initialized successfully")
        # Store in app state for reuse
        app.state.ai_service = ai_service
    except Exception as e:
        logger.error(f"Failed to initialize AI models: {e}")
        logger.info("AI models will be initialized on first use")

    yield
    
    # Shutdown
    logger.info("Shutting down AI Mockup Platform backend...")
    if hasattr(app.state, 'ai_service'):
        # Cleanup GPU memory if needed
        if hasattr(app.state.ai_service, 'pipeline') and app.state.ai_service.pipeline:
            del app.state.ai_service.pipeline
            del app.state.ai_service.controlnet
            if torch and torch.cuda.is_available():
                torch.cuda.empty_cache()
        logger.info("AI models cleaned up")


class StaticFilesCORSMiddleware(BaseHTTPMiddleware):
    """Custom middleware to add CORS headers to static file responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add CORS headers for static files
        if request.url.path.startswith("/uploads/"):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "86400"
        
        return response



# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## FastLeopard Mockups API
    
    AI-powered promotional product mockup generation platform using Stable Diffusion and ControlNet.
    
    ### Features
    - **AI Mockup Generation**: Create realistic product mockups with custom logos
    - **Credit System**: Pay-per-use credit system with subscription options
    - **Multiple Marking Techniques**: Support for 18+ marking techniques (screen printing, embroidery, laser engraving, etc.)
    - **Payment Processing**: Stripe integration for secure payments
    - **User Management**: Complete authentication and authorization system
    - **Background Processing**: Celery-based task queue for AI generation
    
    ### Authentication
    This API uses JWT tokens for authentication. Include the token in the Authorization header:
    ```
    Authorization: Bearer <your_jwt_token>
    ```
    
    ### Rate Limiting
    API endpoints are rate limited. Check response headers for rate limit information.
    """,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,  # Use lifespan instead of on_event
    swagger_ui_parameters={
        "deepLinking": True,
        "displayRequestDuration": True,
        "filter": True,
        "tryItOutEnabled": True,
        "syntaxHighlight.theme": "monokai",
    },
    openapi_tags=[
        {
            "name": "Authentication", 
            "description": "User authentication and authorization endpoints including login, registration, password reset, and token refresh."
        },
        {
            "name": "Users", 
            "description": "User profile management endpoints for viewing and updating user information."
        },
        {
            "name": "Mockups", 
            "description": "AI-powered mockup generation endpoints. Upload product and logo images to create realistic mockups with various marking techniques."
        },
        {
            "name": "Products", 
            "description": "Product catalog management endpoints for uploading and managing product images."
        },
        {
            "name": "Credits", 
            "description": "Credit system endpoints for purchasing, managing, and tracking credit usage for mockup generation."
        },
        {
            "name": "Subscriptions", 
            "description": "Subscription management endpoints for creating and managing monthly subscription plans."
        },
        {
            "name": "Payments", 
            "description": "Payment processing endpoints with Stripe integration for credits, subscriptions, and webhook handling."
        },
        {
            "name": "Admin", 
            "description": "Administrative endpoints for system management, user management, and platform analytics."
        },
        {
            "name": "Simulation History", 
            "description": "Simulation history tracking endpoints for monitoring and analyzing mockup generation processes."
        }            
    ],
    contact={
        "name": "FastLeopard Support",
        "email": "support@fastleopard.com",
        "url": "https://fastleopard.com/support",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    servers=[
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.fastleopard.com",
            "description": "Production server"
        }
    ]
)

# Add CORS middleware for static files
app.add_middleware(StaticFilesCORSMiddleware)

if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
else:
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    
# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]
    )




# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# API Routes
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(mockups.router, prefix="/api/v1", tags=["Mockups"])
app.include_router(products.router, prefix="/api/v1", tags=["Products"])
app.include_router(credits.router, prefix="/api/v1", tags=["Credits"])
app.include_router(subscriptions.router, prefix="/api/v1", tags=["Subscriptions"])
app.include_router(payments.router, prefix="/api/v1", tags=["Payments"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(simulation_history.router, prefix="/api/v1/simulation-history", tags=["Simulation History"])


# Root endpoint
@app.get("/")
async def root():               
    return {
        "message": "Welcome to AI Mockup Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else None
    }