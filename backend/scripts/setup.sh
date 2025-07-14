#!/bin/bash

echo "🚀 Setting up AI Mockup Platform Backend..."

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
prisma generate

# Check if database is accessible
echo "🔍 Checking database connection..."
python -c "
import asyncio
from app.config.database import init_db, close_db

async def test_db():
    try:
        await init_db()
        print('✅ Database connection successful')
        await close_db()
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        print('Please check your DATABASE_URL in .env file')

asyncio.run(test_db())
"

# Run database migrations (if schema has changed)
echo "🔄 Running database migrations..."
prisma db push

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'source venv/bin/activate' to activate virtual environment"
echo "3. Run 'uvicorn app.main:app --reload' to start the development server"
echo "4. Visit http://localhost:8000/docs to see the API documentation"