@echo off
title PharmaCare - All Services Launcher
echo =======================================================
echo          Starting PharmaCare Medical System
echo =======================================================
echo.

:: 1. Check if MongoDB is running on port 27017
netstat -ano | findstr ":27017" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/3] MongoDB is not running. Starting local MongoDB instance...
    if not exist "%USERPROFILE%\data\db" mkdir "%USERPROFILE%\data\db"
    start "PharmaCare - MongoDB" "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%USERPROFILE%\data\db" --port 27017 --wiredTigerCacheSizeGB 0.25 --setParameter diagnosticDataCollectionEnabled=false
    timeout /t 3 /nobreak >nul
) else (
    echo [1/3] MongoDB is already running on port 27017.
)

:: 2. Start Backend Server
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [2/3] Starting Backend Server (Port 5000)...
    start "PharmaCare - Backend API" cmd /k "cd /d %~dp0backend && npm run dev"
    timeout /t 2 /nobreak >nul
) else (
    echo [2/3] Backend is already running on port 5000.
)

:: 3. Start Frontend Server
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [3/3] Starting Frontend Server (Port 3000)...
    start "PharmaCare - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
) else (
    echo [3/3] Frontend is already running on port 3000.
)

echo.
echo =======================================================
echo  PharmaCare is running!
echo  Frontend : http://localhost:3000
echo  Backend  : http://localhost:5000
echo =======================================================
pause
