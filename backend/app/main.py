from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.api.endpoints import router as api_router
from app.services.orbital_data_service import orbital_data_service

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

# Seed initial catalog on startup
try:
    with SessionLocal() as db:
        orbital_data_service.seed_initial_objects(db)
except Exception as e:
    print(f"Warning seeding database: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Space Debris Collision Monitoring & Avoidance System (SSA Prototype API)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler to avoid raw stacktraces leaking
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal aerospace calculation or system error occurred. Please verify telemetry inputs."}
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
