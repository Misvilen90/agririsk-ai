
from pathlib import Path

from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone

# Store the database in the backend folder.
DATABASE_PATH = Path(__file__).resolve().parent / "agririsk.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    crop_type = Column(String(50), nullable=False)
    growth_stage = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    waterlogging_score = Column(Float, nullable=True)
    disease_score = Column(Float, nullable=True)
    heat_stress_score = Column(Float, nullable=True)

    # Keep the complete response/advisory as text for future frontend use.
    generated_advisory = Column(Text, nullable=True)


def init_db():
    Base.metadata.create_all(bind=engine)
