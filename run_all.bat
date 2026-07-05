@echo off
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
