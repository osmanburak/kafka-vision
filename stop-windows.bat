@echo off
echo ======================================================
echo         Kafka Monitor Shutdown Options
echo ======================================================
echo.
echo This script can stop Kafka Monitor services.
echo WARNING: Option 3 will stop ALL Node.js processes!
echo.
echo 1. Stop Backend only (Port 4001)
echo 2. Stop Frontend only (Port 3000)
echo 3. Stop ALL Node.js processes (dangerous!)
echo 4. Exit without stopping
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Stopping Backend Server...
    call stop-backend.bat
) else if "%choice%"=="2" (
    echo.
    echo Stopping Frontend Server...
    call stop-frontend.bat
) else if "%choice%"=="3" (
    echo.
    echo WARNING: Stopping ALL Node.js processes...
    echo.
    taskkill /F /IM node.exe /T 2>nul
    if %errorlevel% == 0 (
        echo Successfully stopped all Node.js processes.
    ) else (
        echo No Node.js processes were running.
    )
    echo.
    pause
) else if "%choice%"=="4" (
    echo.
    echo Exiting without stopping any services.
) else (
    echo.
    echo Invalid choice. Please run the script again.
)

echo.
echo Done.