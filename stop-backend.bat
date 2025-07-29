@echo off
echo ======================================================
echo         KafkaVision Backend Stopper
echo ======================================================
echo.

echo Stopping KafkaVision Backend Server (Port 4001)...
echo.

:: Find and kill the backend process running on port 4001
for /f "tokens=5" %%a in ('netstat -aon ^| find ":4001" ^| find "LISTENING"') do (
    echo Found backend process with PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Failed to stop process. It may require administrator privileges.
    ) else (
        echo Backend server stopped successfully.
    )
)

:: Check if any process was found
netstat -aon | find ":4001" | find "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo No backend server running on port 4001.
) 

echo.
echo Backend stop process completed.
pause