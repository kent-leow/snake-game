#!/bin/bash

# Docker MongoDB Setup Validation Script
# This script validates the Docker configuration files and environment setup

echo "🔍 Validating Docker MongoDB Setup..."
echo

# Check if Docker Compose files exist
echo "✅ Checking Docker Compose files..."
if [[ -f "docker-compose.yml" ]]; then
    echo "  ✓ docker-compose.yml exists"
else
    echo "  ✗ docker-compose.yml missing"
    exit 1
fi

if [[ -f "docker-compose.dev.yml" ]]; then
    echo "  ✓ docker-compose.dev.yml exists"
else
    echo "  ✗ docker-compose.dev.yml missing"
    exit 1
fi

# Check environment files
echo
echo "✅ Checking environment files..."
if [[ -f ".env.example" ]]; then
    echo "  ✓ .env.example exists"
else
    echo "  ✗ .env.example missing"
    exit 1
fi

if [[ -f ".env.local" ]]; then
    echo "  ✓ .env.local exists"
else
    echo "  ✗ .env.local missing"
    exit 1
fi

# Check database scripts
echo
echo "✅ Checking database scripts..."
if [[ -f "scripts/init-db.js" ]]; then
    echo "  ✓ init-db.js exists"
else
    echo "  ✗ init-db.js missing"
    exit 1
fi

# Check database connection utility
echo
echo "✅ Checking database utilities..."
if [[ -f "src/lib/database/connection.ts" ]]; then
    echo "  ✓ connection.ts exists"
else
    echo "  ✗ connection.ts missing"
    exit 1
fi

if [[ -f "src/lib/database/models/index.ts" ]]; then
    echo "  ✓ models/index.ts exists"
else
    echo "  ✗ models/index.ts missing"
    exit 1
fi

# Check if mongoose is installed
echo
echo "✅ Checking dependencies..."
if npm list mongoose &>/dev/null; then
    echo "  ✓ mongoose is installed"
else
    echo "  ✗ mongoose not installed"
    exit 1
fi

# Validate Docker Compose syntax
echo
echo "✅ Validating Docker Compose syntax..."
if command -v docker-compose &>/dev/null; then
    if docker-compose config &>/dev/null; then
        echo "  ✓ docker-compose.yml syntax is valid"
    else
        echo "  ✗ docker-compose.yml has syntax errors"
        exit 1
    fi
else
    echo "  ⚠️  Docker Compose not available - skipping syntax validation"
fi

# Check package.json scripts
echo
echo "✅ Checking package.json scripts..."
if npm run | grep -q "db:up"; then
    echo "  ✓ Database scripts are configured"
else
    echo "  ✗ Database scripts missing from package.json"
    exit 1
fi

echo
echo "🎉 Docker MongoDB setup validation completed successfully!"
echo
echo "📋 Next steps (when Docker is available):"
echo "  1. npm run db:up     - Start MongoDB container"
echo "  2. npm run db:logs   - Check container logs"
echo "  3. npm run db:shell  - Connect to MongoDB shell"
echo "  4. npm run db:down   - Stop MongoDB container"
echo