from database import Base, engine, SessionLocal
from models import Vehicle
import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
from sqlalchemy import create_engine
engine_lite = create_engine("sqlite:///./test.db")
Base.metadata.create_all(bind=engine_lite)

db = SessionLocal(bind=engine_lite)
if not db.query(Vehicle).first():
    db.add(Vehicle(vehicle_id="V-001", vehicle_type="UGV", display_name="Explorer Alpha", status="ACTIVE"))
    db.add(Vehicle(vehicle_id="V-002", vehicle_type="UAV", display_name="Scout One", status="STANDBY"))
    db.commit()
db.close()
print("Seeded.")
