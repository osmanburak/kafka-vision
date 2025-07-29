@echo off
echo ======================================================
echo     Kafka Monitor - Automatic Dependency Installer
echo ======================================================
echo.

echo Checking and installing dependencies...
echo.

echo [1/2] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo [2/2] Installing frontend dependencies...
cd ../frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

cd ..
echo ======================================================
echo All dependencies have been installed successfully!
echo You can now run start.bat to launch the application.
echo ======================================================
pause