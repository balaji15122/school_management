#!/bin/bash
echo "===================================================="
echo " Starting School Management System"
echo "===================================================="

# 1. Start Backend in background
echo "[1/2] Starting Node.js Backend API on port 5050..."
cd "$(dirname "$0")/backend"
node server.js &
BACKEND_PID=$!
sleep 2

# 2. Start Flutter Web App
echo "[2/2] Starting Flutter App on Chrome (Port 3000)..."
cd "../flutter_app"
flutter run -d chrome --web-port 3000

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null

