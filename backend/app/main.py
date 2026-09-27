from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.api.endpoints import router as api_router
from app.services.orbital_data_service import orbital_data_service

from sqlalchemy import text

# Initialize Database Schema safely (Vercel serverless compatible)
def init_db_safely():
    try:
        Base.metadata.create_all(bind=engine)
        ensure_schema()
    except Exception as e:
        print(f"Notice initializing database schema: {e}")

def ensure_schema():
    try:
        with engine.connect() as conn:
            if engine.dialect.name == "sqlite":
                res = conn.execute(text("PRAGMA table_info(conjunctions)")).fetchall()
                cols = [r[1] for r in res]
                if cols and "time_to_encounter_min" not in cols:
                    conn.execute(text("ALTER TABLE conjunctions ADD COLUMN time_to_encounter_min FLOAT DEFAULT 0.0"))
                res_a = conn.execute(text("PRAGMA table_info(alerts)")).fetchall()
                cols_a = [r[1] for r in res_a]
                if cols_a and "reviewed_at" not in cols_a:
                    conn.execute(text("ALTER TABLE alerts ADD COLUMN reviewed_at TIMESTAMP"))
                conn.commit()
    except Exception as e:
        print(f"Schema update notice: {e}")

init_db_safely()

# Seed initial catalog on startup
try:
    with SessionLocal() as db:
        orbital_data_service.seed_initial_objects(db)
except Exception as e:
    print(f"Notice seeding database: {e}")

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
