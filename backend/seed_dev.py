"""
Development seed script — SQLite only (no PostGIS).

Used only for local development when PostgreSQL/PostGIS is not available.
In production, use Alembic migrations against the real PostgreSQL/PostGIS database.
"""
import os
import sqlite3
import uuid

DB_PATH = "astra_dev.db"

conn = sqlite3.connect(DB_PATH)
conn.execute("""
CREATE TABLE IF NOT EXISTS assets (
    asset_id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    status TEXT,
    capabilities TEXT,
    make TEXT,
    model TEXT,
    driver_version TEXT,
    firmware_version TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
)
""")
conn.execute("""
CREATE TABLE IF NOT EXISTS missions (
    mission_id TEXT PRIMARY KEY,
    name TEXT,
    asset_id TEXT,
    status TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    start_time TEXT,
    end_time TEXT,
    FOREIGN KEY(asset_id) REFERENCES assets(asset_id)
)
""")
conn.execute("""
CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    asset_id TEXT,
    event_type TEXT,
    severity TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    payload TEXT,
    FOREIGN KEY(asset_id) REFERENCES assets(asset_id)
)
""")
conn.commit()

# Only seed if empty
cur = conn.execute("SELECT COUNT(*) FROM assets")
if cur.fetchone()[0] == 0:
    asset_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO assets (asset_id, name, type, status, make, model, driver_version, firmware_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (asset_id, "UGV-001", "UGV", "ACTIVE", "AstraCorp", "Explorer Pro", "1.0.0", "2.1.4")
    )
    conn.commit()
    print(f"Seeded asset UGV-001 ({asset_id})")
else:
    print("Database already has data, skipping seed.")

conn.close()
print(f"Dev database ready: {DB_PATH}")
