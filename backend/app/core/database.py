import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

logger = logging.getLogger("onion_system.database")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    # Check if PostgreSQL is available, else fallback to SQLite for local standalone development
    if db_url.startswith("postgresql"):
        try:
            # Test pinging postgres with small timeout
            test_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 3},
                pool_pre_ping=True
            )
            with test_engine.connect() as conn:
                logger.info("Successfully connected to PostgreSQL database.")
            return test_engine
        except Exception as e:
            logger.warning(
                f"PostgreSQL at '{db_url}' is not reachable ({e}). "
                f"Falling back to local SQLite database: 'sqlite:///./onion_quality.db' for seamless execution."
            )
            sqlite_url = "sqlite:///./onion_quality.db"
            return create_engine(sqlite_url, connect_args={"check_same_thread": False})
    else:
        return create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models to ensure they are registered with Base.metadata
    from backend.app.models.inspection import Inspection
    from backend.app.models.defect import Defect
    from backend.app.models.report import Report
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")
