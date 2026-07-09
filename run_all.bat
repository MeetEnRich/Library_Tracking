@echo off
echo Checking environment configuration files...
echo.

:: Auto-create backend .env if missing
if not exist "backend\.env" (
    echo [Setup] Creating backend\.env from template...
    copy "backend\.env.example" "backend\.env" >nul
) else (
    echo [Setup] backend\.env detected.
)

:: Auto-create cv-service .env if missing
if not exist "cv-service\.env" (
    echo [Setup] Creating cv-service\.env...
    (
        echo BACKEND_URL="http://localhost:5000/api"
        echo CV_SERVICE_SECRET="fulafia_cv_shared_secret_key"
        echo ZONE_ID=3
        echo CV_UPLOAD_INTERVAL=3
        echo PORT=8000
        echo FORCE_SIMULATION=true
    ) > "cv-service\.env"
) else (
    echo [Setup] cv-service\.env detected.
)

echo.
echo Starting Library Tracking System Services...
echo.

echo Launching Backend Server...
start "Library Tracker - Backend" cmd /k "cd backend && npm run dev"

echo Launching Frontend Client...
start "Library Tracker - Frontend" cmd /k "cd frontend && npm run dev"

echo Launching Python CV Service...
start "Library Tracker - CV Service" cmd /k "cd cv-service && python main.py"

echo.
echo All services have been launched in separate terminal windows.
echo Please keep those terminal windows open while using the application.
echo.
pause
