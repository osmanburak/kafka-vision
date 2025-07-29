@echo off
echo Starting KafkaVision Backend...
echo.

echo Checking for backend dependencies...
if not exist "backend\node_modules" (
    echo Backend dependencies not found. Installing...
    cd backend
    call npm install
    cd ..
)

echo Backend Server will start on port 4001
echo.
cd backend
npm start