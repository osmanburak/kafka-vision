#!/bin/bash

echo "======================================================"
echo "         Kafka Monitor Backend Stopper"
echo "======================================================"
echo

echo "Stopping Kafka Monitor Backend Server (Port 4001)..."
echo

# Find and kill the backend process running on port 4001
PID=$(lsof -ti:4001)

if [ -z "$PID" ]; then
    echo "No backend server running on port 4001."
else
    echo "Found backend process with PID: $PID"
    kill -9 $PID 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "Backend server stopped successfully."
    else
        echo "Failed to stop process. You may need to run with sudo."
    fi
fi

echo
echo "Backend stop process completed."