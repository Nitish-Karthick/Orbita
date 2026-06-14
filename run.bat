@echo off
echo Starting Project ORBITA...

echo Starting FastAPI Backend...
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo Starting React Frontend...
start cmd /k "cd frontend && npm run dev"

echo Done! Both servers are starting up in new windows.
