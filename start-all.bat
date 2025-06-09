@echo off
echo Starting backend...
cd backend
start cmd /k "npm start"

echo Starting frontend...
cd ../frontend  
start cmd /k "npm start"

echo Both applications are starting...
echo Backend will be available at http://localhost:3000
echo Frontend will be available at http://localhost:4200
pause
