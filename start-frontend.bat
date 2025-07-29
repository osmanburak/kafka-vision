@echo off
echo Starting KafkaVision Frontend...
echo.

echo Checking for frontend dependencies...
if not exist "frontend\node_modules" (
    echo Frontend dependencies not found. Installing...
    cd frontend
    call npm install
    cd ..
)

echo Frontend Server will start on port 3000
echo Make sure Backend is running on port 4001
echo.
cd frontend
npm run dev