#!/bin/bash

# AI Mockup Platform Backend Deployment Script
set -e

echo "🚀 Starting deployment of AI Mockup Platform Backend..."

# Configuration
APP_NAME="ai-mockup-platform"
DOCKER_IMAGE="${APP_NAME}:latest"
WORKER_IMAGE="${APP_NAME}-worker:latest"
CONTAINER_NAME="${APP_NAME}-api"
WORKER_CONTAINER_NAME="${APP_NAME}-worker"
NETWORK_NAME="${APP_NAME}-network"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        log_error ".env file not found. Please create it from .env.example"
        exit 1
    fi
    
    log_info "Requirements check passed ✅"
}

backup_database() {
    log_info "Creating database backup..."
    
    # Load environment variables
    source .env
    
    # Create backup directory
    mkdir -p backups
    
    # Create backup filename with timestamp
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create database backup (adjust based on your database setup)
    if [[ $DATABASE_URL == *"postgresql"* ]]; then
        log_info "Creating PostgreSQL backup..."
        if command -v pg_dump &> /dev/null; then
            pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
            log_info "Database backup created: $BACKUP_FILE"
        else
            log_warn "pg_dump not found. Skipping backup."
        fi
    else
        log_warn "Database backup not implemented for this database type"
    fi
}

build_images() {
    log_info "Building Docker images..."
    
    # Build main application image
    log_info "Building main application image..."
    docker build -f docker/Dockerfile -t $DOCKER_IMAGE .
    
    # Build worker image
    log_info "Building worker image..."
    docker build -f docker/Dockerfile.worker -t $WORKER_IMAGE .
    
    log_info "Docker images built successfully ✅"
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Run migrations using a temporary container
    docker run --rm \
        --env-file .env \
        --network $NETWORK_NAME \
        $DOCKER_IMAGE \
        sh -c "prisma generate && prisma db push"
    
    log_info "Database migrations completed ✅"
}

deploy_services() {
    log_info "Deploying services..."
    
    # Create network if it doesn't exist
    docker network create $NETWORK_NAME 2>/dev/null || true
    
    # Stop and remove existing containers
    log_info "Stopping existing containers..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker stop $WORKER_CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    docker rm $WORKER_CONTAINER_NAME 2>/dev/null || true
    
    # Start the main application
    log_info "Starting main application container..."
    docker run -d \
        --name $CONTAINER_NAME \
        --env-file .env \
        --network $NETWORK_NAME \
        -p 8000:8000 \
        --restart unless-stopped \
        $DOCKER_IMAGE
    
    # Start the worker
    log_info "Starting worker container..."
    docker run -d \
        --name $WORKER_CONTAINER_NAME \
        --env-file .env \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        $WORKER_IMAGE \
        celery -A app.workers.celery_app worker --loglevel=info
    
    log_info "Services deployed successfully ✅"
}

health_check() {
    log_info "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if main application is responding
    for i in {1..30}; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            log_info "Application health check passed ✅"
            return 0
        fi
        log_info "Waiting for application to start... ($i/30)"
        sleep 2
    done
    
    log_error "Application health check failed ❌"
    log_info "Checking application logs..."
    docker logs $CONTAINER_NAME --tail 50
    exit 1
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions of our images (keep last 3)
    docker images $APP_NAME --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | \
    tail -n +2 | sort -k3 -r | tail -n +4 | awk '{print $2}' | xargs -r docker rmi
    
    log_info "Cleanup completed ✅"
}

setup_ssl_cert() {
    log_info "Setting up SSL certificate..."
    
    # Check if certbot is available
    if command -v certbot &> /dev/null; then
        read -p "Enter your domain name: " DOMAIN_NAME
        if [ ! -z "$DOMAIN_NAME" ]; then
            # Generate SSL certificate using Let's Encrypt
            certbot certonly --webroot -w /var/www/html -d $DOMAIN_NAME
            log_info "SSL certificate generated for $DOMAIN_NAME"
        fi
    else
        log_warn "Certbot not found. Please install certbot for SSL certificate generation"
    fi
}

setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Start Flower for Celery monitoring
    docker run -d \
        --name "${APP_NAME}-flower" \
        --env-file .env \
        --network $NETWORK_NAME \
        -p 5555:5555 \
        --restart unless-stopped \
        $WORKER_IMAGE \
        celery -A app.workers.celery_app flower --port=5555
    
    log_info "Flower monitoring started on port 5555"
}

setup_nginx() {
    log_info "Setting up Nginx reverse proxy..."
    
    # Create nginx configuration
    cat > nginx.conf << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /flower/ {
        proxy_pass http://localhost:5555/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Start Nginx container
    docker run -d \
        --name "${APP_NAME}-nginx" \
        --network $NETWORK_NAME \
        -p 80:80 \
        -p 443:443 \
        -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf \
        --restart unless-stopped \
        nginx:alpine
    
    log_info "Nginx reverse proxy configured"
}

# Deployment types
deploy_production() {
    log_info "🏭 Production deployment starting..."
    
    check_requirements
    backup_database
    build_images
    run_database_migrations
    deploy_services
    health_check
    cleanup_old_images
    setup_monitoring
    setup_nginx
    
    log_info "🎉 Production deployment completed successfully!"
    log_info "Application is running at: http://localhost"
    log_info "API documentation: http://localhost/docs"
    log_info "Flower monitoring: http://localhost/flower"
}

deploy_staging() {
    log_info "🧪 Staging deployment starting..."
    
    check_requirements
    build_images
    run_database_migrations
    deploy_services
    health_check
    setup_monitoring
    
    log_info "🎉 Staging deployment completed successfully!"
    log_info "Application is running at: http://localhost:8000"
    log_info "Flower monitoring: http://localhost:5555"
}

deploy_docker_compose() {
    log_info "🐳 Docker Compose deployment starting..."
    
    check_requirements
    
    # Use docker-compose for deployment
    docker-compose -f docker/docker-compose.yml down
    docker-compose -f docker/docker-compose.yml up --build -d
    
    # Wait for services to start
    sleep 15
    
    # Run health check
    health_check
    
    log_info "🎉 Docker Compose deployment completed successfully!"
    log_info "Application is running at: http://localhost:8000"
    log_info "Flower monitoring: http://localhost:5555"
}

deploy_development() {
    log_info "🔧 Development deployment starting..."
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Generate Prisma client
    prisma generate
    
    # Run migrations
    ./scripts/migrate.sh dev
    
    log_info "🎉 Development environment ready!"
    log_info "Run 'uvicorn app.main:app --reload' to start the development server"
}

rollback_deployment() {
    log_info "🔄 Rolling back deployment..."
    
    # Stop current containers
    docker stop $CONTAINER_NAME $WORKER_CONTAINER_NAME 2>/dev/null || true
    
    # Get previous image version
    PREVIOUS_IMAGE=$(docker images $APP_NAME --format "table {{.Repository}}:{{.Tag}}" | head -2 | tail -1)
    
    if [ ! -z "$PREVIOUS_IMAGE" ]; then
        # Start with previous image
        docker run -d \
            --name $CONTAINER_NAME \
            --env-file .env \
            --network $NETWORK_NAME \
            -p 8000:8000 \
            --restart unless-stopped \
            $PREVIOUS_IMAGE
        
        log_info "Rollback completed to: $PREVIOUS_IMAGE"
    else
        log_error "No previous image found for rollback"
        exit 1
    fi
}

show_logs() {
    log_info "Showing application logs..."
    docker logs -f $CONTAINER_NAME
}

show_status() {
    log_info "Deployment status:"
    echo ""
    echo "🐳 Containers:"
    docker ps --filter "name=$APP_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📊 Images:"
    docker images $APP_NAME --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    echo "🌐 Health Check:"
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application is not responding"
    fi
}

# Main script logic
case "${1:-}" in
    "prod")
        deploy_production
        ;;
    "staging")
        deploy_staging
        ;;
    "dev")
        deploy_development
        ;;
    "compose")
        deploy_docker_compose
        ;;
    "rollback")
        rollback_deployment
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        log_info "Stopping all services..."
        docker stop $CONTAINER_NAME $WORKER_CONTAINER_NAME 2>/dev/null || true
        docker-compose -f docker/docker-compose.yml down 2>/dev/null || true
        log_info "All services stopped"
        ;;
    *)
        echo "Usage: $0 {prod|staging|dev|compose|rollback|logs|status|stop}"
        echo ""
        echo "Commands:"
        echo "  prod     - Deploy to production with full setup"
        echo "  staging  - Deploy to staging environment"
        echo "  dev      - Setup development environment"
        echo "  compose  - Deploy using Docker Compose"
        echo "  rollback - Rollback to previous version"
        echo "  logs     - Show application logs"
        echo "  status   - Show deployment status"
        echo "  stop     - Stop all services"
        exit 1
        ;;
esac