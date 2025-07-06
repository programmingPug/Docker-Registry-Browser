#!/bin/bash

echo "🐳 Docker Registry Browser - Quick Start"
echo "========================================"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if Angular CLI is installed globally
if ! command -v ng &> /dev/null; then
    echo "📦 Installing Angular CLI globally..."
    npm install -g @angular/cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the development server
echo "🚀 Starting development server..."
echo "The application will be available at http://localhost:4200"
npm start