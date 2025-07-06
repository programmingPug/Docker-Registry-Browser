@echo off
REM Docker Registry Browser - Build and Deploy Script for Windows
REM Usage: build.bat [tag] [registry]

setlocal enabledelayedexpansion

REM Configuration
set IMAGE_NAME=docker-registry-browser
set DEFAULT_TAG=latest
set DEFAULT_REGISTRY=

REM Parse arguments
if "%1"=="" (
    set TAG=%DEFAULT_TAG%
) else (
    set TAG=%1
)

if "%2"=="" (
    set REGISTRY=%DEFAULT_REGISTRY%
) else (
    set REGISTRY=%2
)

REM Build the full image name
if "%REGISTRY%"=="" (
    set FULL_IMAGE_NAME=%IMAGE_NAME%:%TAG%
) else (
    set FULL_IMAGE_NAME=%REGISTRY%/%IMAGE_NAME%:%TAG%
)

echo Building Docker Registry Browser...
echo Image: %FULL_IMAGE_NAME%
echo.

REM Build the Docker image
echo Building Docker image...
docker build -t "%FULL_IMAGE_NAME%" .

if %ERRORLEVEL% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo To run the container:
echo docker run -d --name docker-registry-browser -p 8080:80 --add-host=host.docker.internal:host-gateway %FULL_IMAGE_NAME%
echo.
echo To push to registry (if configured):
if "%REGISTRY%"=="" (
    echo Please specify a registry: build.bat %TAG% your-registry.com
) else (
    echo docker push %FULL_IMAGE_NAME%
)
echo.

REM Optional: Run the container immediately
set /p REPLY="Do you want to run the container now? (y/N): "
if /i "%REPLY%"=="y" (
    echo Starting container...
    docker run -d --name docker-registry-browser -p 8080:80 --add-host=host.docker.internal:host-gateway -e REGISTRY_HOST=localhost:5000 -e REGISTRY_PROTOCOL=http "%FULL_IMAGE_NAME%"
    
    if %ERRORLEVEL% equ 0 (
        echo.
        echo Container started successfully!
        echo Access the application at: http://localhost:8080
        echo View container logs: docker logs docker-registry-browser
        echo Stop container: docker stop docker-registry-browser
    ) else (
        echo Failed to start container!
    )
)

pause
