# AI Mockup Platform Backend

A comprehensive FastAPI backend for an AI-powered promotional product mockup platform. This platform allows users to upload product and logo images and generate realistic mockups using advanced AI techniques.

## Features

### 🤖 AI-Powered Mockup Generation
- **Stable Diffusion + ControlNet** integration for realistic mockup generation
- **18+ marking techniques** simulation (embroidery, laser engraving, screen printing, etc.)
- **Automatic texture application** based on selected technique
- **Real-time processing status** tracking

### 👥 User Management
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (Visitor, Registered, Subscribed, Admin)
- **User profiles** with comprehensive statistics
- **Password reset** functionality

### 💳 Payment & Subscription System
- **Stripe integration** for secure payments
- **Credit-based system** with flexible packages
- **Subscription plans** (Basic, Pro, Premium)
- **Automatic billing** and invoice generation

### 📁 File Management
- **AWS S3 integration** for scalable file storage
- **Image validation** and optimization
- **Automatic cleanup** of old files

### ⚡ Background Processing
- **Celery + Redis** for asynchronous task processing
- **Automatic retries** for failed generations
- **Health monitoring** and stuck task recovery

### 📊 Admin Dashboard
- **Comprehensive analytics** (users, revenue, mockups)
- **System health monitoring**
- **User and content management**

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Prisma** - Type-safe database ORM
- **Supabase PostgreSQL** - Cloud database
- **Redis** - Caching and message broker
- **Celery** - Distributed task queue
- **Stripe** - Payment processing
- **AWS S3** - File storage
- **Stable Diffusion** - AI image generation
- **Docker** - Containerization

## Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL (or Supabase account)
- Redis server
- AWS S3 bucket
- Stripe account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-mockup-platform-backend
   ```

2. **Run setup script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```
   apt install python3
   python3 -m venv venv
   source venv/bin/activate
   pip intall -r requiremets.txt

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Development
   uvicorn app.main:app --reload
   
   # With Docker
   docker-compose up
   ```

### Environment Configuration

Key environment variables to configure:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Redis
REDIS_URL="redis://localhost:6379/0"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token

#### Mockups
- `POST /api/v1/mockups/upload` - Upload images
- `POST /api/v1/mockups` - Create mockup generation request
- `GET /api/v1/mockups` - List user mockups
- `GET /api/v1/mockups/{id}/status` - Check generation status

#### Credits & Payments
- `GET /api/v1/credits/packages` - Available credit packages
- `POST /api/v1/credits/purchase` - Purchase credits
- `GET /api/v1/credits/balance` - Current balance

#### Subscriptions
- `GET /api/v1/subscriptions/plans` - Available plans
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions/current` - Current subscription

## Architecture

### Database Schema

The application uses a well-structured PostgreSQL schema with:

- **Users** - Authentication and profile management
- **Credits** - Credit system with expiration
- **Subscriptions** - Subscription management
- **Mockups** - Mockup generation tracking
- **Products** - Product catalog
- **Payments** - Payment transaction history

### Background Tasks

Celery workers handle:
- **AI mockup generation** - Computationally intensive operations
- **Email notifications** - User communications
- **Cleanup tasks** - Maintenance operations
- **Webhook processing** - Payment events

### AI Pipeline

1. **Image Preprocessing** - Validation, resizing, enhancement
2. **ControlNet Preparation** - Edge detection for better control
3. **Stable Diffusion Generation** - AI-powered realistic rendering
4. **Post-processing** - Quality enhancement and optimization
5. **Storage** - Upload to cloud storage

## Deployment

### Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# Scale workers
docker-compose up --scale worker=3
```

### Production Considerations

1. **Database**: Use managed PostgreSQL (Supabase recommended)
2. **Redis**: Use managed Redis service
3. **File Storage**: Configure AWS S3 with CDN
4. **AI Processing**: Use GPU instances for faster generation
5. **Monitoring**: Implement logging and monitoring
6. **Security**: Configure proper CORS, rate limiting, and SSL

## Monitoring

### Health Checks
- `GET /health` - Application health
- `GET /api/v1/admin/system/health` - Detailed system status

### Celery Monitoring
- **Flower UI**: `http://localhost:5555` (in development)
- Task status and worker monitoring

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_mockups.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact: support@aimockup.com
- Documentation: https://docs.aimockup.com

---

Built with ❤️ using FastAPI, Prisma, and Stable Diffusion