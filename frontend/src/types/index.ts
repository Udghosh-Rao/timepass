export interface Asset {
  asset_id: string;
  name: string;
  type: string;
  status: string;
  capabilities: Record<string, unknown> | null;
  make: string;
  model: string;
  driver_version: string;
  firmware_version: string;
  created_at?: string;
  updated_at?: string;
}

export interface Mission {
  mission_id: string;
  name: string;
  asset_id: string;
  status: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
}

export interface Event {
  event_id: string;
  asset_id: string;
  event_type: string;
  severity: string;
  timestamp: string;
}

export interface Telemetry {
  telemetry_id?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  course: number;
  battery_pct: number;
  health_status: string;
  connection_status: string;
  mission_id?: string | null;
}

export interface WebSocketMessage {
  type: string;
  asset_id?: string;
  telemetry?: Telemetry;
  event?: Event;
}
