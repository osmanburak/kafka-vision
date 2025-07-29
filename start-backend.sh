#!/bin/bash
echo "Starting Kafka Status Monitor Backend..."
echo ""

echo "Checking for backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Backend dependencies not found. Installing..."
    cd backend
    npm install
    cd ..
fi

echo "Backend Server will start on port 4001"
echo ""
cd backend
npm run dev