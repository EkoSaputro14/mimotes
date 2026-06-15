#!/bin/bash

# Mimotes Database Setup Script
# This script sets up PostgreSQL with pgvector extension and runs Prisma migrations

echo "🤖 Mimotes Database Setup"
echo "========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please copy .env.example to .env.local and configure it."
    exit 1
fi

# Source .env.local
export $(cat .env.local | grep -v '^#' | xargs)

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.local"
    exit 1
fi

echo "📦 Running Prisma migrations..."
npx prisma migrate dev --name init

echo "🌱 Seeding admin user..."
npx tsx scripts/seed-admin.ts

echo ""
echo "✅ Database setup complete!"
echo "   You can now run 'npm run dev' to start the application."
