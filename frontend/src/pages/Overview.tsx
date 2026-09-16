import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface SystemStats {
  assets: number;
  missions: number;
  events: number;
}

function statusBadge(ok: boolean) {
  return ok
    ? <span className="status-value ok">Operational</span>
    : <span className="status-value error">Unavailable</span>;
}

export default function Overview() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await apiClient.getSystemHealth();
        setBackendOk(true);
        const [assets, missions, events] = await Promise.all([
          apiClient.getAssets(),
          apiClient.getMissions(),
          apiClient.getEvents(),
        ]);
        setStats({ assets: assets.length, missions: missions.length, events: events.length });
      } catch {
        setBackendOk(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="loading"><div className="spinner"></div>Connecting to backend…</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">System Overview</h1>
        <p className="page-subtitle">AstraOS platform health and asset summary</p>
      </div>

      {/* System Status Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">System Status</span>
        </div>
        <div className="card-body">
          <div className="status-indicator">
            <span className="status-label">Backend</span>
            {statusBadge(backendOk === true)}
          </div>
          <div className="status-indicator">
            <span className="status-label">Database</span>
            {stats !== null
              ? <span className="status-value ok">Connected</span>
              : <span className="status-value error">Unavailable</span>
            }
          </div>
          <div className="status-indicator">
            <span className="status-label">SVI</span>
            <span className="status-value unknown">Not Configured</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {backendOk && stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Registered Assets</div>
            <div className="stat-value">{stats.assets}</div>
            <div className="stat-sub">UGV · UAV · AUV</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Missions</div>
            <div className="stat-value">{stats.missions}</div>
            <div className="stat-sub">Total in database</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">System Events</div>
            <div className="stat-value">{stats.events}</div>
            <div className="stat-sub">Logged events</div>
          </div>
        </div>
      )}

      {!backendOk && (
        <div className="error-banner">
          ⚠ Backend unavailable — ensure the backend is running on port 8000
        </div>
      )}
    </div>
  );
}
