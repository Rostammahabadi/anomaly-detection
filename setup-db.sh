#!/bin/bash

# Database Setup Script for Anomaly Detection App
# Run this script to set up PostgreSQL database

echo "🗄️  Setting up PostgreSQL database for Anomaly Detection..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql"
    echo "   On Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    echo "   On Windows: Start PostgreSQL from Services panel"
    exit 1
fi

# Create database
echo "📦 Creating database 'anomaly_detection'..."
createdb anomaly_detection 2>/dev/null || echo "Database might already exist"

# Set up user and permissions (adjust password as needed)
echo "👤 Setting up database user..."
psql -d anomaly_detection -c "CREATE USER IF NOT EXISTS postgres WITH PASSWORD 'password';" 2>/dev/null
psql -d anomaly_detection -c "GRANT ALL PRIVILEGES ON DATABASE anomaly_detection TO postgres;" 2>/dev/null

echo "✅ Database setup complete!"
echo "🔧 Database URL: postgresql://postgres:password@localhost:5432/anomaly_detection"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npx prisma migrate dev --name init"
echo "3. Run: npx prisma db seed"
