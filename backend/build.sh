#!/bin/bash

echo "🚀 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
prisma generate

# Fetch Prisma binaries
echo "⬇️ Fetching Prisma binaries..."
prisma py fetch --force

# Set up directories
echo "📁 Creating required directories..."
mkdir -p uploads/products
mkdir -p uploads/logos
mkdir -p uploads/mockups
mkdir -p static/dist

echo "✅ Build completed successfully!"