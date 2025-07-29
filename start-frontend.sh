#!/bin/bash
echo "Starting Kafka Status Monitor Frontend..."
echo ""

echo "Checking for frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Frontend dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
fi

echo "Frontend Server will start on port 3000"
echo "Make sure Backend is running on port 4001"
echo ""
cd frontend
npm run dev