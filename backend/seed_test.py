import os
os.environ["DATABASE_URL"] = "sqlite:///./astra_test.db"

from sqlalchemy import create_engine
from app.core.database import Base, SessionLocal
from app.models.asset import Asset

import uuid

engine_lite = create_engine("sqlite:///./astra_test.db")
Base.metadata.create_all(bind=engine_lite)

db = SessionLocal(bind=engine_lite)
if not db.query(Asset).first():
    db.add(Asset(
        asset_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        name="UGV-001", 
        type="UGV", 
        status="ACTIVE",
        capabilities={"camera": True, "lidar": True},
        make="AstraCorp",
        model="Explorer Pro",
        driver_version="1.0.0",
        firmware_version="2.1.4"
    ))
    db.commit()
db.close()
print("Seeded UGV-001.")
