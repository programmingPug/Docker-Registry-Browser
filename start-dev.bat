@echo off
echo 🐳 Docker Registry Browser - Quick Start
echo ========================================

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install Node.js and npm first.
    pause
    exit /b 1
)

REM Check if Angular CLI is installed globally
ng version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Angular CLI globally...
    npm install -g @angular/cli
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Start the development server
echo 🚀 Starting development server...
echo The application will be available at http://localhost:4200
npm start

pause