@echo off
title HR Manager Launcher (Std6730251468)
echo ========================================================
echo Starting HR Manager ^& Salary Analytics System...
echo Student ID: 6730251468
echo ========================================================

set "PATH=C:\Program Files\nodejs;C:\Users\Admin\AppData\Local\Programs\Git\cmd;%PATH%"

cd /d "%~dp0backend"
start "Backend Express Server (Port 5000)" cmd /k "node server.js"

timeout /t 2 /nobreak > nul

cd /d "%~dp0frontend"
start "Frontend React Native (Expo Web)" cmd /k "npm run web"

echo.
echo ========================================================
echo Both servers have been launched!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8081
echo ========================================================
