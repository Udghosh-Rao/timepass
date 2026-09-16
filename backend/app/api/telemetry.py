from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import json
from datetime import datetime

from app.core.database import get_db
from app.models.telemetry import Telemetry
from app.models.asset import Asset
from app.models.event import Event
from app.schemas.telemetry import TelemetryCreate, TelemetryResponse
from app.realtime.ws import manager

router = APIRouter(prefix="/api/v1/assets", tags=["telemetry"])

LOW_BATTERY_THRESHOLD = 20.0

@router.post("/{asset_id}/telemetry")
async def ingest_telemetry(asset_id: uuid.UUID, telemetry_in: TelemetryCreate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # PostGIS geometry format
    point_wkt = f"SRID=4326;POINTZ({telemetry_in.longitude} {telemetry_in.latitude} {telemetry_in.altitude})"

    # Create telemetry record
    db_telemetry = Telemetry(
        asset_id=asset_id,
        timestamp=telemetry_in.timestamp or datetime.utcnow(),
        position=point_wkt,
        velocity={"speed": telemetry_in.speed, "course": telemetry_in.course},
        heading=telemetry_in.heading,
        battery_pct=telemetry_in.battery_pct,
        health_status=telemetry_in.health_status,
        connection_status=telemetry_in.connection_status,
        mission_id=telemetry_in.mission_id
    )
    db.add(db_telemetry)

    events_generated = []

    # Event Engine Logic
    # 1. Connection state changes
    if hasattr(asset, 'status'):
        current_status = getattr(asset, 'status', 'OFFLINE')
        new_status = 'ACTIVE' if telemetry_in.connection_status == 'CONNECTED' else 'OFFLINE'
        
        if current_status != new_status:
            # Generate event
            event_type = "ASSET_CONNECTED" if new_status == 'ACTIVE' else "ASSET_DISCONNECTED"
            ev = Event(
                asset_id=asset_id,
                event_type=event_type,
                severity="INFO",
                payload={"previous": current_status, "new": new_status}
            )
            db.add(ev)
            events_generated.append(ev)
            asset.status = new_status

    # 2. Low Battery Logic
    # We only trigger LOW_BATTERY if the current telemetry falls below threshold
    # AND the asset didn't already have a low battery recorded from the last payload.
    # To simplify without doing a heavy DB lookup, we can check a simple flag on asset or query the latest event.
    last_low_battery_event = db.query(Event).filter(
        Event.asset_id == asset_id,
        Event.event_type == "LOW_BATTERY"
    ).order_by(Event.timestamp.desc()).first()

    # Determine if we should trigger:
    # If currently low battery:
    if telemetry_in.battery_pct <= LOW_BATTERY_THRESHOLD:
        # Need to trigger if there wasn't a recent low battery event or if it's been a while (e.g. > 1 hr)
        # But for this task, we will just trigger if the previous telemetry was > threshold.
        # Let's get the most recent telemetry before this one.
        prev_telemetry = db.query(Telemetry).filter(
            Telemetry.asset_id == asset_id
        ).order_by(Telemetry.timestamp.desc()).first()
        
        prev_battery = prev_telemetry.battery_pct if prev_telemetry else 100.0
        
        if prev_battery > LOW_BATTERY_THRESHOLD:
            ev = Event(
                asset_id=asset_id,
                event_type="LOW_BATTERY",
                severity="HIGH",
                payload={"battery_pct": telemetry_in.battery_pct}
            )
            db.add(ev)
            events_generated.append(ev)

    db.commit()

    # Broadcast updates via WebSocket
    update_msg = {
        "type": "TELEMETRY_UPDATE",
        "asset_id": str(asset_id),
        "telemetry": {
            "latitude": telemetry_in.latitude,
            "longitude": telemetry_in.longitude,
            "altitude": telemetry_in.altitude,
            "heading": telemetry_in.heading,
            "speed": telemetry_in.speed,
            "battery_pct": telemetry_in.battery_pct,
            "health_status": telemetry_in.health_status,
            "connection_status": telemetry_in.connection_status,
            "timestamp": db_telemetry.timestamp.isoformat()
        }
    }
    await manager.broadcast(update_msg)

    for ev in events_generated:
        await manager.broadcast({
            "type": "EVENT_NEW",
            "event": {
                "event_id": str(ev.event_id),
                "asset_id": str(ev.asset_id),
                "event_type": ev.event_type,
                "severity": ev.severity,
                "timestamp": ev.timestamp.isoformat() if ev.timestamp else datetime.utcnow().isoformat()
            }
        })

    return {"status": "ok"}

@router.get("/{asset_id}/telemetry")
def get_telemetry(asset_id: uuid.UUID, limit: int = 100, db: Session = Depends(get_db)):
    # Returns history. We serialize it nicely because PostGIS geometry isn't JSON serializable directly.
    # In production, we use ST_AsGeoJSON
    result = db.execute(
        f"""
        SELECT 
            telemetry_id, timestamp, velocity, heading, battery_pct, 
            health_status, connection_status, mission_id,
            ST_X(position) as longitude, ST_Y(position) as latitude, ST_Z(position) as altitude
        FROM telemetry
        WHERE asset_id = '{asset_id}'
        ORDER BY timestamp DESC
        LIMIT {limit}
        """
    )
    
    rows = []
    for row in result:
        rows.append({
            "telemetry_id": str(row[0]),
            "timestamp": row[1],
            "velocity": row[2],
            "heading": row[3],
            "battery_pct": row[4],
            "health_status": row[5],
            "connection_status": row[6],
            "mission_id": str(row[7]) if row[7] else None,
            "longitude": row[8],
            "latitude": row[9],
            "altitude": row[10]
        })
    return rows
