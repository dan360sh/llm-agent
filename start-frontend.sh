#!/bin/bash

echo "🚀 Starting LLM Agent Application..."

# Check if backend is running
if ! curl -s http://localhost:3000/api/llm > /dev/null; then
    echo "❌ Backend not running. Please start backend first:"
    echo "   cd backend && npm start"
    exit 1
fi

echo "✅ Backend is running on port 3000"

# Start frontend
echo "🔄 Starting frontend..."
cd frontend
npm start

echo "🎉 Frontend will be available at http://localhost:4200"
