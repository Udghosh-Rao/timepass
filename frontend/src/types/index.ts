export interface Asset {
  asset_id: string;
  name: string;
  type: string;
  status: string;
  capabilities: any;
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
