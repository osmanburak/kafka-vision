#!/bin/bash

echo "======================================================"
echo "         Kafka Monitor Frontend Stopper"
echo "======================================================"
echo

echo "Stopping Kafka Monitor Frontend Server (Port 3000)..."
echo

# Find and kill the frontend process running on port 3000
PID=$(lsof -ti:3000)

if [ -z "$PID" ]; then
    echo "No frontend server running on port 3000."
else
    echo "Found frontend process with PID: $PID"
    kill -9 $PID 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "Frontend server stopped successfully."
    else
        echo "Failed to stop process. You may need to run with sudo."
    fi
fi

echo
echo "Frontend stop process completed."