
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router

app = FastAPI(
    title="Airtech Management API",
    description="Backend API for Airtech business management",
    version="0.1.0",
)

# Allow requests from the local frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register versioned API routes.
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Health"])
def home():
    return {
        "message": "Airtech API is running",
        "status": "success",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
    }
