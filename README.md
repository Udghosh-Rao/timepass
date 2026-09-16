# AstraOS

AstraOS is an operational software platform designed to manage and monitor unmanned systems. This repository contains the core software components: the operator frontend, the FastAPI backend (with PostgreSQL/PostGIS support), and a telemetry data simulator.

## Architecture

AstraOS is built with a decoupled architecture:
- **Frontend**: React + TypeScript + Vite. It provides the Operator Application (UI, Maps, Live Telemetry).
- **Backend**: FastAPI + Python. It provides the REST API, Telemetry Ingestion, Event Engine, and WebSocket broadcasting.
- **Simulator**: A Python tool to generate realistic asset movement, battery drain, and telemetry updates.
- **Database**: PostgreSQL with PostGIS (for spatial queries) in production, and SQLite for rapid local development.

### Telemetry & WebSocket Flow

1. The **Simulator** (or an actual vehicle) sends periodic POST requests to `/api/v1/assets/{asset_id}/telemetry`.
2. The **Backend** receives the payload, saves it to the database, and processes it through the **Event Engine** (e.g., triggering `LOW_BATTERY` or `ASSET_CONNECTED`).
3. The Backend immediately broadcasts the telemetry and any generated events to all connected Operator Applications via a **WebSocket** connection on `/api/v1/ws`.
4. The **Frontend** receives the live feed and dynamically updates the charts, maps, and asset tables without polling.

---

## Getting Started (Local Development)

You can run AstraOS locally without Docker or PostGIS using the built-in SQLite development mode.

### 1. Start the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Seed the local SQLite database
python3 seed_dev.py

# Start the FastAPI server on port 8000
uvicorn main_dev:app --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the Operator Application.

### 3. Start the Data Simulator

To see live data flowing into the platform, run the simulator in a third terminal window. It will automatically detect the seeded asset and start streaming telemetry.

```bash
cd simulator
python3 main.py
```

### Environment Variables

The backend relies on the following environment variables (defined in `.env`):
- `DATABASE_URL`: Connection string to the PostgreSQL database (for production).
- `API_URL`: (Simulator) The base URL for the AstraOS API.
- `PUBLISH_INTERVAL`: (Simulator) How often telemetry is sent, in seconds.

## Running Tests

To run the core test suite:
```bash
cd backend
pytest
```
