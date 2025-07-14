#!/bin/bash

# AI Mockup Platform Database Migration Script
set -e

echo "🗄️ Starting database migration..."

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

# Check if .env file exists
if [ ! -f .env ]; then
    log_error ".env file not found. Please create it from .env.example"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not set in .env file"
    exit 1
fi

# Backup database before migration (optional)
create_backup() {
    log_info "Creating database backup..."
    
    # Create backup directory
    mkdir -p backups
    
    # Create backup filename with timestamp
    BACKUP_FILE="backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create database backup if PostgreSQL
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

# Generate Prisma client
generate_client() {
    log_info "Generating Prisma client..."
    prisma generate
    log_info "Prisma client generated successfully"
}

# Apply migrations
apply_migrations() {
    log_info "Applying database migrations..."
    
    # Check if this is the first migration
    if prisma db push --accept-data-loss --help | grep -q "preview"; then
        log_info "Using db push for schema changes..."
        prisma db push --accept-data-loss
    else
        log_info "Using migrate deploy for production..."
        prisma migrate deploy
    fi
    
    log_info "Database migrations applied successfully"
}

# Seed database with initial data
seed_database() {
    log_info "Seeding database with initial data..."
    
    python -c "
import asyncio
from app.config.database import seed_database

async def run_seed():
    try:
        await seed_database()
        print('✅ Database seeded successfully')
    except Exception as e:
        print(f'❌ Error seeding database: {e}')

asyncio.run(run_seed())
"
}

# Verify migrations
verify_migrations() {
    log_info "Verifying database connection and structure..."
    
    python -c "
import asyncio
from app.config.database import get_database_info

async def verify():
    try:
        info = await get_database_info()
        if info['status'] == 'connected':
            print('✅ Database verification successful')
            print(f'Tables: {info[\"table_counts\"]}')
        else:
            print(f'❌ Database verification failed: {info.get(\"error\", \"Unknown error\")}')
            exit(1)
    except Exception as e:
        print(f'❌ Database verification failed: {e}')
        exit(1)

asyncio.run(verify())
"
}

# Main migration process
run_migration() {
    log_info "Starting migration process..."
    
    # Create backup if in production
    if [ "$ENVIRONMENT" = "production" ]; then
        read -p "Create database backup before migration? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_backup
        fi
    fi
    
    # Generate Prisma client
    generate_client
    
    # Apply migrations
    apply_migrations
    
    # Seed database if needed
    read -p "Seed database with initial data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        seed_database
    fi
    
    # Verify migrations
    verify_migrations
    
    log_info "Migration completed successfully! 🎉"
}

# Handle different migration scenarios
case "${1:-}" in
    "dev")
        log_info "Running development migration..."
        ENVIRONMENT="development"
        run_migration
        ;;
    "prod")
        log_info "Running production migration..."
        ENVIRONMENT="production"
        run_migration
        ;;
    "reset")
        log_warn "Resetting database (this will delete all data)..."
        read -p "Are you sure you want to reset the database? (yes/no): " -r
        if [ "$REPLY" = "yes" ]; then
            prisma db push --force-reset
            log_info "Database reset completed"
            seed_database
        else
            log_info "Database reset cancelled"
        fi
        ;;
    "status")
        log_info "Checking migration status..."
        prisma migrate status
        ;;
    "seed")
        log_info "Seeding database..."
        seed_database
        ;;
    "backup")
        log_info "Creating database backup..."
        create_backup
        ;;
    *)
        echo "Usage: $0 {dev|prod|reset|status|seed|backup}"
        echo ""
        echo "Commands:"
        echo "  dev     - Run development migration"
        echo "  prod    - Run production migration"
        echo "  reset   - Reset database (WARNING: deletes all data)"
        echo "  status  - Check migration status"
        echo "  seed    - Seed database with initial data"
        echo "  backup  - Create database backup"
        exit 1
        ;;
esac