#!/bin/bash

echo "======================================================"
echo "    Kafka Monitor - Automatic Dependency Installer"
echo "======================================================"
echo

echo "Checking and installing dependencies..."
echo

echo "[1/2] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi
echo "Backend dependencies installed successfully!"
echo

echo "[2/2] Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    exit 1
fi
echo "Frontend dependencies installed successfully!"
echo

cd ..
echo "======================================================"
echo "All dependencies have been installed successfully!"
echo "You can now run the start scripts to launch the application."
echo "======================================================"