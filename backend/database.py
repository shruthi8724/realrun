import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = os.environ.get(
    "REALRUN_DB_PATH",
    os.path.join(os.path.dirname(__file__), "realrun.db"),
)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_schema():
    Base.metadata.create_all(bind=engine)
    columns = {column["name"] for column in inspect(engine).get_columns("disruptions")}
    if "status" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE disruptions ADD COLUMN status VARCHAR NOT NULL DEFAULT 'ACTIVE'"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
