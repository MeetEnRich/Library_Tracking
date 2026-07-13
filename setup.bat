@echo off
echo =======================================================================
echo     Automated Student Library Usage Tracking System - Installation
echo =======================================================================
echo.

:: 1. Copy environment variables if missing
echo [Step 1/4] Configuring environment variables...
if not exist "backend\.env" (
    echo Creating backend\.env from template...
    copy "backend\.env.example" "backend\.env" >nul
) else (
    echo [Setup] backend\.env detected.
)

if not exist "cv-service\.env" (
    echo Creating cv-service\.env...
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
echo Environment files configured.
echo.

:: 2. Install Backend dependencies & initialize database
echo [Step 2/4] Setting up Backend Server and SQLite Database...
cd backend
echo Installing backend node modules...
call npm install
echo Running SQLite migrations and generating client...
call npx prisma migrate dev --name init
echo Seeding database with fresh demo logs using the CURRENT date...
call npm run prisma:seed
cd ..
echo Backend configuration complete.
echo.

:: 3. Install Frontend dependencies
echo [Step 3/4] Setting up Frontend Client...
cd frontend
echo Installing frontend node modules (bypassing peer-dependency checks)...
call npm install --legacy-peer-deps
cd ..
echo Frontend configuration complete.
echo.

:: 4. Verify Python CV Service requirements
echo [Step 4/4] Verifying Python CV Service Dependencies...
cd cv-service
echo Installing python requirements...
call pip install -r requirements.txt
cd ..
echo.
echo =======================================================================
echo     Setup Completed Successfully!
echo =======================================================================
echo.
echo You can now start all servers by double-clicking "run_all.bat".
echo.
pause
