from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.telemetry import Telemetry
from app.models.asset import Asset
from app.models.event import Event
from app.schemas.telemetry import TelemetryCreate
from app.realtime.ws import manager
import os

router = APIRouter(prefix="/api/v1/assets", tags=["telemetry"])

LOW_BATTERY_THRESHOLD = float(os.getenv("LOW_BATTERY_THRESHOLD", "20.0"))


@router.post("/{asset_id}/telemetry", status_code=200)
async def ingest_telemetry(
    asset_id: uuid.UUID,
    telemetry_in: TelemetryCreate,
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Parameterized WKT — no string interpolation of user data
    point_wkt = "SRID=4326;POINTZ(:lon :lat :alt)"
    ts = telemetry_in.timestamp or datetime.now(timezone.utc)

    db_telemetry = Telemetry(
        asset_id=asset_id,
        timestamp=ts,
        position=f"SRID=4326;POINTZ({telemetry_in.longitude} {telemetry_in.latitude} {telemetry_in.altitude})",
        velocity={"speed": telemetry_in.speed, "course": telemetry_in.course},
        heading=telemetry_in.heading,
        battery_pct=telemetry_in.battery_pct,
        health_status=telemetry_in.health_status,
        connection_status=telemetry_in.connection_status,
        mission_id=telemetry_in.mission_id,
    )
    db.add(db_telemetry)

    events_generated: List[Dict[str, Any]] = []

    # --- Event Engine: Connection State ---
    current_status = asset.status or "OFFLINE"
    new_status = "ACTIVE" if telemetry_in.connection_status == "CONNECTED" else "OFFLINE"

    if current_status != new_status:
        event_type = "ASSET_CONNECTED" if new_status == "ACTIVE" else "ASSET_DISCONNECTED"
        ev = Event(
            asset_id=asset_id,
            event_type=event_type,
            severity="INFO",
            payload={"previous": current_status, "new": new_status},
        )
        db.add(ev)
        db.flush()  # flush to get ev.event_id and ev.timestamp populated
        events_generated.append({
            "event_id": str(ev.event_id),
            "asset_id": str(ev.asset_id),
            "event_type": ev.event_type,
            "severity": ev.severity,
            "timestamp": (ev.timestamp or ts).isoformat() if hasattr(ev.timestamp, 'isoformat') else ts.isoformat(),
        })
        asset.status = new_status

    # --- Event Engine: Low Battery (transition only) ---
    if telemetry_in.battery_pct <= LOW_BATTERY_THRESHOLD:
        prev_tel = (
            db.query(Telemetry)
            .filter(Telemetry.asset_id == asset_id)
            .order_by(Telemetry.timestamp.desc())
            .first()
        )
        prev_battery = prev_tel.battery_pct if prev_tel else 100.0

        if prev_battery > LOW_BATTERY_THRESHOLD:
            ev = Event(
                asset_id=asset_id,
                event_type="LOW_BATTERY",
                severity="HIGH",
                payload={"battery_pct": telemetry_in.battery_pct, "threshold": LOW_BATTERY_THRESHOLD},
            )
            db.add(ev)
            db.flush()
            events_generated.append({
                "event_id": str(ev.event_id),
                "asset_id": str(ev.asset_id),
                "event_type": ev.event_type,
                "severity": ev.severity,
                "timestamp": ts.isoformat(),
            })

    db.commit()

    # --- Broadcast telemetry ---
    await manager.broadcast({
        "type": "TELEMETRY_UPDATE",
        "asset_id": str(asset_id),
        "telemetry": {
            "latitude": telemetry_in.latitude,
            "longitude": telemetry_in.longitude,
            "altitude": telemetry_in.altitude,
            "heading": telemetry_in.heading,
            "speed": telemetry_in.speed,
            "course": telemetry_in.course,
            "battery_pct": telemetry_in.battery_pct,
            "health_status": telemetry_in.health_status,
            "connection_status": telemetry_in.connection_status,
            "timestamp": ts.isoformat(),
        },
    })

    for ev_data in events_generated:
        await manager.broadcast({"type": "EVENT_NEW", "event": ev_data})

    return {"status": "ok", "telemetry_id": str(db_telemetry.telemetry_id)}


@router.get("/{asset_id}/telemetry")
def get_telemetry(
    asset_id: uuid.UUID,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    if limit > 500:
        limit = 500

    result = db.execute(
        text("""
        SELECT
            telemetry_id, timestamp, velocity, heading, battery_pct,
            health_status, connection_status, mission_id,
            ST_X(position) AS longitude,
            ST_Y(position) AS latitude,
            ST_Z(position) AS altitude
        FROM telemetry
        WHERE asset_id = :asset_id
        ORDER BY timestamp DESC
        LIMIT :limit
        """),
        {"asset_id": str(asset_id), "limit": limit}
    )

    rows = []
    for row in result.mappings():
        rows.append({
            "telemetry_id": str(row["telemetry_id"]),
            "timestamp": row["timestamp"],
            "velocity": row["velocity"],
            "heading": row["heading"],
            "battery_pct": row["battery_pct"],
            "health_status": row["health_status"],
            "connection_status": row["connection_status"],
            "mission_id": str(row["mission_id"]) if row["mission_id"] else None,
            "longitude": row["longitude"],
            "latitude": row["latitude"],
            "altitude": row["altitude"],
        })
    return rows


@router.get("/{asset_id}/state")
def get_asset_state(
    asset_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Return the latest telemetry snapshot for an asset (current live state)."""
    result = db.execute(
        text("""
        SELECT
            telemetry_id, timestamp, velocity, heading, battery_pct,
            health_status, connection_status, mission_id,
            ST_X(position) AS longitude,
            ST_Y(position) AS latitude,
            ST_Z(position) AS altitude
        FROM telemetry
        WHERE asset_id = :asset_id
        ORDER BY timestamp DESC
        LIMIT 1
        """),
        {"asset_id": str(asset_id)}
    ).mappings().first()

    if not result:
        return None

    return {
        "telemetry_id": str(result["telemetry_id"]),
        "timestamp": result["timestamp"],
        "velocity": result["velocity"],
        "heading": result["heading"],
        "battery_pct": result["battery_pct"],
        "health_status": result["health_status"],
        "connection_status": result["connection_status"],
        "mission_id": str(result["mission_id"]) if result["mission_id"] else None,
        "longitude": result["longitude"],
        "latitude": result["latitude"],
        "altitude": result["altitude"],
    }
