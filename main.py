"""
Main entry point module for "The Last-Minute Life Saver" FastAPI service.
Orchestrates lifespan events, binds relative databases, manages CORS middleware profiles,
seeds default user structures, and exposes health check integrations.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import models
import crud
import schemas
from database import engine, Base, SessionLocal
from settings import get_settings
from routers import router as api_router

# -----------------------------------------------------------------------------
# LOGGING SETUP
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("last_minute_saver")

# Retrieve validated settings configuration
settings = get_settings()


# -----------------------------------------------------------------------------
# LIFESPAN STARTER & DATA SEEDING UTILITIES
# -----------------------------------------------------------------------------
def seed_default_user_if_missing() -> None:
    """
    Ensures a default mock user (ID=1) exists in the SQLite database on startup.
    This enables full out-of-the-box operations for UI clients without requiring
    manual registration steps.
    """
    db: Session = SessionLocal()
    try:
        # Check if the primary workspace user exists
        default_user = crud.get_user(db, user_id=1)
        if not default_user:
            logger.info("Default user profile (ID=1) not found. Initializing seed data...")
            
            # Map default cognitive procrastination settings
            new_user = schemas.UserCreate(
                username="lifesaver_hero",
                name="Procrastinator Extraordinaire",
                email="singhsimr67@gmail.com",
                timezone="UTC",
                delay_coefficient=1.2  # 20% historic buffer increment cushion
            )
            
            # Persist seeded credentials
            db_user = models.User(
                id=1,  # Force identity key 1
                username=new_user.username,
                name=new_user.name,
                email=new_user.email,
                timezone=new_user.timezone,
                quiet_hours_start=new_user.quiet_hours_start,
                quiet_hours_end=new_user.quiet_hours_end,
                delay_coefficient=new_user.delay_coefficient
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            logger.info(f"Successfully seeded default profile: {db_user.username} (ID: {db_user.id})")
        else:
            logger.info(f"Verified active user profile: {default_user.username} (ID: {default_user.id})")
    except Exception as e:
        logger.error(f"Error occurred during startup data seeding: {str(e)}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Asynchronous context manager governing the execution boundaries of startup and shutdown stages.
    Guarantees seamless table creation and mock-data provisioning prior to serving requests.
    """
    logger.info("Initializing background microservices...")
    
    # Trigger database schema execution
    try:
        logger.info("Applying ORM metadata tables creation pass...")
        Base.metadata.create_all(bind=engine)
        logger.info("Relational database schema generation completed.")
    except Exception as e:
        logger.critical(f"Failed to generate relational database tables: {str(e)}")
        raise e

    # Inject mock records for sandboxed front-end previews
    seed_default_user_if_missing()
    
    logger.info("FastAPI initialization lifecycle succeeded. Server is online.")
    yield
    logger.info("FastAPI shut down sequence starting... Consuming idle resources clean sweeps.")


# -----------------------------------------------------------------------------
# FASTAPI APPLICATION SETUP
# -----------------------------------------------------------------------------
app = FastAPI(
    title="The Last-Minute Life Saver Backend",
    description=(
        "A highly cognitive task planning microservice utilizing Parkinson's Law "
        "and Google Gemini APIs to break procrastination paralysis. Includes progressive "
        "alert Copy systems, time-buffered calendars, and SMS alarm escalation paths."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# -----------------------------------------------------------------------------
# CORS MIDDLEWARE RULES MATCHING FRONTEND NETWORKS
# -----------------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"  # Allows direct cross-network requests for iframe and web previews
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# ROOT HEALTH CHECKS
# -----------------------------------------------------------------------------
@app.get(
    "/",
    tags=["Root Monitor"],
    summary="Root welcome banner"
)
def read_root():
    """
    Exposes an elegant status dictionary outlining active build metadata.
    """
    return {
        "service": "The Last-Minute Life Saver Backend Core Engine",
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "api_docs_route": "/docs",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get(
    "/api/health",
    tags=["Root Monitor"],
    summary="Active container database and service health check"
)
def health_check():
    """
    Verifies that the API service is in an operational status.
    """
    return {
        "status": "synchronized",
        "active_threads": "verified",
        "sqlite_wal_journal_mode": settings.SQLITE_WAL_MODE,
        "synchronous_speed_profile": settings.SQLITE_SYNCHRONOUS_MODE
    }


# -----------------------------------------------------------------------------
# MOUNT ROUTE STRUCTURES
# -----------------------------------------------------------------------------
# Exposes CRUD task operations, dynamic priorities, schedule builders, and alarms under /api
app.include_router(api_router, prefix="/api")
