from pydantic_settings import BaseSettings
from pydantic import Field
from typing import ClassVar, Dict, Any, List, Optional


class Settings(BaseSettings):
    # Application
    BASE_URL: str = Field(env="BASE_URL")
    APP_NAME: str = Field(default="AI Mockup Platform", env="APP_NAME")
    APP_VERSION: str = Field(default="1.0.0", env="APP_VERSION")
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="production", env="ENVIRONMENT")
    
    # Security
    SECRET_KEY: str = Field(env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Database
    DATABASE_URL: str = Field(env="DATABASE_URL")
    DIRECT_URL: str = Field(env="DIRECT_URL")
    SUPABASE_URL: str = Field(env="SUPABASE_URL")
    SUPABASE_ANON_KEY: str = Field(env="SUPABASE_ANON_KEY")
    
    # Redis (optional)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # AWS S3 (optional for local development)
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    AWS_S3_BUCKET: Optional[str] = Field(default=None, env="AWS_S3_BUCKET")
    
    # Payment Processing
    STRIPE_PUBLISHABLE_KEY: str = Field(env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_SECRET_KEY: str = Field(env="STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(env="STRIPE_WEBHOOK_SECRET")
    
    # AI/GPU Processing
    PIAPI_API_KEY: Optional[str] = Field(default=None, env="PIAPI_API_KEY")
    
    # Email (nodemailer-style configuration with Gmail)
    EMAIL_ADDRESS: Optional[str] = Field(default=None, env="EMAIL_ADDRESS")
    EMAIL_PASSWORD: Optional[str] = Field(default=None, env="EMAIL_PASSWORD")
    
    # Frontend URL for reset links
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["*"],
    )
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=3600, env="RATE_LIMIT_WINDOW")
    RATE_LIMIT_LOGIN_PER_MINUTE: int = Field(default=5, env="RATE_LIMIT_LOGIN_PER_MINUTE")
    RATE_LIMIT_REGISTER_PER_HOUR: int = Field(default=3, env="RATE_LIMIT_REGISTER_PER_HOUR")
    RATE_LIMIT_MOCKUP_GENERATION_PER_HOUR: int = Field(default=50, env="RATE_LIMIT_MOCKUP_GENERATION_PER_HOUR")
    RATE_LIMIT_PAYMENTS_PER_HOUR: int = Field(default=10, env="RATE_LIMIT_PAYMENTS_PER_HOUR")
    RATE_LIMIT_GENERAL_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_GENERAL_PER_MINUTE")
    
    # File Upload Limits
    MAX_FILE_SIZE: int = Field(default=10485760, env="MAX_FILE_SIZE")
    ALLOWED_IMAGE_EXTENSIONS: List[str] = Field(
        default=[".jpg", ".jpeg", ".png", ".webp"]
    )
    
    # Credit System
    FREE_CREDITS_ON_SIGNUP: int = Field(default=3, env="FREE_CREDITS_ON_SIGNUP")
    CREDIT_PRICES: ClassVar[Dict[int, float]] = {
        10: 9.99,
        20: 18.99,
        50: 44.99,
        100: 79.99
    }
    
    # Subscription Plans
    SUBSCRIPTION_PLANS: ClassVar[Dict[str, Dict[str, Any]]] = {
        "BASIC": {
            "name": "Basic",
            "price": 9.99,
            "credits_per_month": 10,
            "features": ["Standard techniques", "Basic support"]
        },
        "PRO": {
            "name": "Pro",
            "price": 24.99,
            "credits_per_month": 30,
            "features": ["All techniques", "PDF export", "Priority queue", "Email support"]
        },
        "PREMIUM": {
            "name": "Premium",
            "price": 79.99,
            "credits_per_month": 100,
            "features": ["All techniques", "Advanced editor", "Priority processing", "Phone support"]
        }
    }
    
    # Stripe Price IDs for subscription plans
    STRIPE_PRICE_ID_BASIC: str = Field(default="price_basic", env="STRIPE_PRICE_ID_BASIC")
    STRIPE_PRICE_ID_PRO: str = Field(default="price_pro", env="STRIPE_PRICE_ID_PRO")
    STRIPE_PRICE_ID_PREMIUM: str = Field(default="price_premium", env="STRIPE_PRICE_ID_PREMIUM")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra env vars for backward compatibility
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == 'ALLOWED_ORIGINS':
                return [origin.strip() for origin in raw_val.split(',')]
            if field_name == 'ALLOWED_IMAGE_EXTENSIONS':
                return [ext.strip() for ext in raw_val.split(',')]
            return cls.json_loads(raw_val)


# Create settings instance
settings = Settings()