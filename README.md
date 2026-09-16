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

## Database Architecture

AstraOS is strictly designed to run on **PostgreSQL with PostGIS**. This is required for advanced geospatial telemetry indexing.

While a fallback SQLite `main_dev.py` exists for rapid UI testing without Docker, it should **not** be used for core development involving actual location services.

---

## Getting Started

### 1. Start the Backend (PostgreSQL)

Ensure you have a PostgreSQL instance running with the PostGIS extension.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure your database
cp .env.example .env
# Edit .env and set DATABASE_URL=postgresql://user:password@localhost/astra

# Run migrations to build the schema
alembic upgrade head

# Start the AstraOS server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

*(Optional) For quick UI-only dev without Postgres, you can use `python3 seed_dev.py` and `uvicorn main_dev:app` to run against a local SQLite file.*

### 2. Start the Frontend

In a new terminal window:

```bash
cd frontend
npm install

# Configure API URLs
cp .env.example .env
# Ensure VITE_API_BASE_URL and VITE_WS_URL point to your backend

npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the Operator Application.

### 3. Start the Data Simulator

To see live data flowing into the platform, run the simulator in a third terminal window.

```bash
cd simulator
# Ensure API_URL in .env points to the backend
python3 main.py
```

### Environment Variables

**Backend (`backend/.env`)**
- `DATABASE_URL`: Connection string to PostgreSQL (e.g. `postgresql://user:pass@localhost:5432/astra`)
- `LOW_BATTERY_THRESHOLD`: Float value triggering battery events (default: `20.0`)

**Frontend (`frontend/.env`)**
- `VITE_API_BASE_URL`: REST API path (default: `http://localhost:8000/api/v1`)
- `VITE_WS_URL`: WebSocket path (default: `ws://localhost:8000/api/v1/ws`)

**Simulator (`simulator/.env`)**
- `API_URL`: The base URL for the AstraOS API.
- `PUBLISH_INTERVAL`: How often telemetry is sent, in seconds.

## Running Tests

To run the core test suite:
```bash
cd backend
pytest
```
