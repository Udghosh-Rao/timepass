"""
main_dev.py — Development-only FastAPI entry point using SQLite.

This file is used only when PostgreSQL/PostGIS is not available (e.g. local dev without Docker).
For production, use main.py with a real PostgreSQL/PostGIS connection.

Run with:
    python seed_dev.py
    uvicorn main_dev:app --host 0.0.0.0 --port 8000
"""
import sqlite3
import uuid
from datetime import datetime
from typing import Optional, Any, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = "astra_dev.db"

app = FastAPI(title="AstraOS Backend (Dev)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------------------------------------------------
# Pydantic schemas (duplicated here to avoid importing PostGIS models)
# ---------------------------------------------------------------------------

class AssetCreate(BaseModel):
    name: str
    type: str
    status: str
    capabilities: Optional[Any] = None
    make: Optional[str] = None
    model: Optional[str] = None
    driver_version: Optional[str] = None
    firmware_version: Optional[str] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    capabilities: Optional[Any] = None


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AstraOS Backend (Dev Mode)"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------

@app.get("/api/v1/assets")
def get_assets():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM assets").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/v1/assets/{asset_id}")
def get_asset(asset_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM assets WHERE asset_id = ?", (asset_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    return dict(row)


@app.post("/api/v1/assets", status_code=201)
def create_asset(asset_in: AssetCreate):
    asset_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = get_conn()
    conn.execute(
        """INSERT INTO assets
           (asset_id, name, type, status, make, model, driver_version, firmware_version, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (asset_id, asset_in.name, asset_in.type, asset_in.status,
         asset_in.make, asset_in.model, asset_in.driver_version,
         asset_in.firmware_version, now)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM assets WHERE asset_id = ?", (asset_id,)).fetchone()
    conn.close()
    return dict(row)


@app.patch("/api/v1/assets/{asset_id}")
def update_asset(asset_id: str, asset_in: AssetUpdate):
    conn = get_conn()
    existing = conn.execute("SELECT * FROM assets WHERE asset_id = ?", (asset_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Asset not found")

    updates = asset_in.model_dump(exclude_unset=True)
    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [asset_id]
        conn.execute(f"UPDATE assets SET {set_clause} WHERE asset_id = ?", values)
        conn.commit()

    row = conn.execute("SELECT * FROM assets WHERE asset_id = ?", (asset_id,)).fetchone()
    conn.close()
    return dict(row)


# ---------------------------------------------------------------------------
# Missions
# ---------------------------------------------------------------------------

@app.get("/api/v1/missions")
def get_missions():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM missions").fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

@app.get("/api/v1/events")
def get_events():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM events").fetchall()
    conn.close()
    return [dict(row) for row in rows]
