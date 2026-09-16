import os
import time
import requests
import random
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000/api/v1")
PUBLISH_INTERVAL = float(os.getenv("PUBLISH_INTERVAL", "2.0"))

START_LAT = float(os.getenv("START_LAT", "37.7749"))
START_LON = float(os.getenv("START_LON", "122.4194"))
START_ALT = float(os.getenv("START_ALT", "10.0"))
START_BATTERY = float(os.getenv("START_BATTERY", "100.0"))

class Simulator:
    def __init__(self, asset_id: str):
        self.asset_id = asset_id
        self.lat = START_LAT
        self.lon = START_LON
        self.alt = START_ALT
        self.battery = START_BATTERY
        self.heading = 0.0
        self.speed = 5.0
    
    def step(self):
        # Battery drains slowly
        self.battery = max(0.0, self.battery - random.uniform(0.1, 0.5))
        
        # Heading wanders slowly
        self.heading = (self.heading + random.uniform(-10.0, 10.0)) % 360
        
        # Speed wanders slowly but stays positive
        self.speed = max(0.0, self.speed + random.uniform(-0.5, 0.5))
        
        # Update position based on simple approx (1 deg lat ~ 111km)
        # Just move slightly for demonstration
        import math
        rad_heading = math.radians(self.heading)
        # very small multiplier to keep it local
        self.lat += (math.cos(rad_heading) * self.speed) * 0.00001
        self.lon += (math.sin(rad_heading) * self.speed) * 0.00001
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "latitude": self.lat,
            "longitude": self.lon,
            "altitude": self.alt,
            "heading": self.heading,
            "speed": self.speed,
            "course": self.heading,
            "battery_pct": self.battery,
            "health_status": "NOMINAL" if self.battery > 10 else "CRITICAL",
            "connection_status": "CONNECTED"
        }

def get_first_asset():
    try:
        resp = requests.get(f"{API_URL}/assets")
        resp.raise_for_status()
        assets = resp.json()
        if not assets:
            print("No assets found in AstraOS. Please create one.")
            return None
        return assets[0]['asset_id']
    except Exception as e:
        print(f"Error fetching assets: {e}")
        return None

def main():
    print("Starting AstraOS Data Simulator...")
    
    # Wait for API to be ready
    asset_id = None
    while not asset_id:
        asset_id = get_first_asset()
        if not asset_id:
            print("Retrying in 5 seconds...")
            time.sleep(5)
            
    print(f"Targeting Asset ID: {asset_id}")
    
    sim = Simulator(asset_id)
    
    while True:
        payload = sim.step()
        try:
            resp = requests.post(
                f"{API_URL}/assets/{asset_id}/telemetry",
                json=payload
            )
            if resp.status_code == 200:
                print(f"[{payload['timestamp']}] Sent telemetry: Batt {payload['battery_pct']:.1f}% | Spd {payload['speed']:.1f}")
            else:
                print(f"Error posting telemetry: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"Connection error: {e}")
            
        time.sleep(PUBLISH_INTERVAL)

if __name__ == "__main__":
    main()
