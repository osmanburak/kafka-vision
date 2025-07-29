@echo off
echo Starting KafkaVision (Both Backend + Frontend)...
echo.

echo Checking for dependencies...
if not exist "backend\node_modules" (
    echo Backend dependencies not found. Installing...
    cd backend
    call npm install
    cd ..
)
if not exist "frontend\node_modules" (
    echo Frontend dependencies not found. Installing...
    cd frontend
    call npm install
    cd ..
)

echo.
echo For separate startup, use:
echo   start-backend.bat  (Backend only)
echo   start-frontend.bat (Frontend only)
echo.

echo Starting Backend Server...
start cmd /k "cd backend && npm start"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:4001
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the frontend in your browser...
pause > nul
start http://localhost:3000