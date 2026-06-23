"""
Database configuration and session management module using SQLAlchemy 2.x and SQLite.
Optimized for safety, resource cleanup, and multi-threaded concurrency using Write-Ahead Logging.
"""

import re
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, declared_attr, sessionmaker, Session

from settings import get_settings

# Retrieve validated settings configuration
settings = get_settings()

# Prepare engine parameters.
# For SQLite, multi-threaded FastAPI execution requires disabling connection thread checking.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Instantiate the SQLAlchemy Core Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False  # Set to True for detailed SQL query logging
)

# -----------------------------------------------------------------------------
# SQLite Write-Ahead Logging (WAL) & Performance Overlays
# -----------------------------------------------------------------------------
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def configure_sqlite_connection(dbapi_connection, connection_record) -> None:
        """
        Enables SQLite Write-Ahead Logging (WAL) mode and configures custom synchronous
        tolerances to allow safe concurrent reading/writing and prevent locking bottlenecks.
        """
        cursor = dbapi_connection.cursor()
        
        # Enable WAL mode - reads bypass write transactions cleanly in parallel memory areas
        if settings.SQLITE_WAL_MODE:
            cursor.execute("PRAGMA journal_mode=WAL;")
            
        # Tune transaction commit flush behaviors:
        # 'NORMAL' is the developer sweet spot when using WAL, ensuring fast operations and crash protection.
        cursor.execute(f"PRAGMA synchronous={settings.SQLITE_SYNCHRONOUS_MODE};")
        
        cursor.close()


# -----------------------------------------------------------------------------
# Declarative Base Mapping Class (SQLAlchemy 2.0 Style)
# -----------------------------------------------------------------------------
class Base(DeclarativeBase):
    """
    Base class for all relational database models using SQLAlchemy Declarative.
    
    Automatically generates Table names using a regex conversion from standard
    CamelCase/PascalCase model names to snake_case table names (e.g. TaskNote -> task_note).
    """
    
    @declared_attr
    def __tablename__(cls) -> str:
        # Matches uppercase boundaries to map CamelCase class declarations to snake_case SQL tables
        return re.sub(r'(?<!^)(?=[A-Z])', '_', cls.__name__).lower()


# -----------------------------------------------------------------------------
# Session Factories
# -----------------------------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# -----------------------------------------------------------------------------
# FastAPI Dependency Injection Yielders
# -----------------------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency injection helper yielding an active, thread-safe SQLAlchemy Session.
    Guarantees cleanup and connection return to the pool by closing the session under
    all outcome scenarios (normal execution completion or raised exceptions).
    
    Usage in active REST routes:
        @app.get("/tasks")
        def list_tasks(db: Session = Depends(get_db)):
            return db.query(Task).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
