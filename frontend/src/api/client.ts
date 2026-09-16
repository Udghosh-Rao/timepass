import type { Asset, Mission, Event } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = {
  getSystemHealth: async () => {
    const res = await fetch('http://localhost:8000/api/health');
    if (!res.ok) throw new Error("Backend unavailable");
    return res.json();
  },

  getAssets: async (): Promise<Asset[]> => {
    const res = await fetch(`${API_BASE_URL}/assets`);
    if (!res.ok) throw new Error("Unable to load data");
    return res.json();
  },

  getAsset: async (id: string): Promise<Asset> => {
    const res = await fetch(`${API_BASE_URL}/assets/${id}`);
    if (!res.ok) throw new Error("Unable to load data");
    return res.json();
  },

  getAssetTelemetry: async (id: string, limit: number = 100): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/assets/${id}/telemetry?limit=${limit}`);
    if (!res.ok) throw new Error("Unable to load data");
    return res.json();
  },

  createAsset: async (data: Partial<Asset>): Promise<Asset> => {
    const res = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Unable to save data");
    return res.json();
  },

  updateAsset: async (id: string, data: Partial<Asset>): Promise<Asset> => {
    const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Unable to update data");
    return res.json();
  },

  getMissions: async (): Promise<Mission[]> => {
    const res = await fetch(`${API_BASE_URL}/missions`);
    if (!res.ok) throw new Error("Unable to load data");
    return res.json();
  },

  getEvents: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE_URL}/events`);
    if (!res.ok) throw new Error("Unable to load data");
    return res.json();
  }
};
