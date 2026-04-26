from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

import os

from app.api.routes import router

app = FastAPI(title="Risk Scoring API")

app.include_router(router, prefix="/api/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# frontend Absolute Path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_PATH = os.path.join(BASE_DIR, "..", "frontend")
FRONTEND_PATH = os.path.abspath(FRONTEND_PATH)

# Mounting file css, js
app.mount("/static", StaticFiles(directory=FRONTEND_PATH), name="static")

@app.get("/")
def serve_ui():
    return FileResponse(os.path.join(FRONTEND_PATH, "index.html"))

