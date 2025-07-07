@echo off
REM Development start script for Docker Registry Browser
REM Usage: start-dev.bat [registry_host] [protocol]

REM Set default values
set REGISTRY_HOST=%1
set REGISTRY_PROTOCOL=%2

if "%REGISTRY_HOST%"=="" set REGISTRY_HOST=localhost:5000
if "%REGISTRY_PROTOCOL%"=="" set REGISTRY_PROTOCOL=http

echo Starting Docker Registry Browser development server...
echo Registry: %REGISTRY_PROTOCOL%://%REGISTRY_HOST%
echo.

REM Check if .env file exists and load it
if exist ".env" (
    echo Loading environment from .env file...
    for /f "delims== tokens=1,2" %%a in (.env) do (
        if not "%%a"=="" if not "%%b"=="" (
            set %%a=%%b
        )
    )
)

REM Generate proxy configuration and start server
npm run start

pause
