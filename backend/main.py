from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import assets, missions, events, telemetry, ws

app = FastAPI(title="AstraOS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router)
app.include_router(missions.router)
app.include_router(events.router)
app.include_router(telemetry.router)
app.include_router(ws.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "AstraOS Backend Foundation"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
