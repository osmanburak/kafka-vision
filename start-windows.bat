@echo off
echo Starting Kafka Status Monitor on Windows 11...
echo.

echo Starting Backend Server on port 4001...
start "Kafka Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server on port 3000...
start "Kafka Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting...
echo Backend API: http://localhost:4001
echo Frontend UI: http://localhost:3000
echo.
echo Waiting for servers to fully start...
timeout /t 5 /nobreak > nul

echo Opening frontend in your default browser...
start http://localhost:3000

echo.
echo Kafka Status Monitor is running!
echo Press any key to exit this window (servers will continue running)...
pause > nul