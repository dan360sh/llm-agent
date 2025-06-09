@echo off
echo 🚀 Starting LLM Agent Application...

echo Checking backend...
curl -s http://localhost:3000/api/llm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend not running. Please start backend first:
    echo    cd backend ^&^& npm start
    exit /b 1
)

echo ✅ Backend is running on port 3000
echo 🔄 Starting frontend...

cd frontend
npm start

echo 🎉 Frontend will be available at http://localhost:4200
