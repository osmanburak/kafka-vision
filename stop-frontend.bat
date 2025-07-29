@echo off
echo ======================================================
echo         Kafka Monitor Frontend Stopper
echo ======================================================
echo.

echo Stopping Kafka Monitor Frontend Server (Port 3000)...
echo.

:: Find and kill the frontend process running on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Found frontend process with PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Failed to stop process. It may require administrator privileges.
    ) else (
        echo Frontend server stopped successfully.
    )
)

:: Check if any process was found
netstat -aon | find ":3000" | find "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo No frontend server running on port 3000.
) 

echo.
echo Frontend stop process completed.
pause