import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { Mission } from '../types';

function missionStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return <span className="badge green"><span className="dot"></span>{status}</span>;
  if (s === 'CREATED') return <span className="badge blue">{status}</span>;
  if (s === 'PAUSED') return <span className="badge yellow">{status}</span>;
  if (s === 'COMPLETED') return <span className="badge neutral">{status}</span>;
  if (s === 'FAILED') return <span className="badge red">{status}</span>;
  return <span className="badge neutral">{status}</span>;
}

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getMissions()
      .then(data => setMissions(data))
      .catch(() => setError('Unable to load data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading missions…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Missions</h1>
        <p className="page-subtitle">Mission records from the database — read only in this release</p>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Missions ({missions.length})</span>
        </div>

        {missions.length === 0 && !error ? (
          <div className="empty-state">
            <div className="icon">◎</div>
            <div className="title">No missions available</div>
            <div className="desc">Mission creation will be available in a future release</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mission ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Asset ID</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {missions.map(m => (
                <tr key={m.mission_id}>
                  <td><span className="mono">{m.mission_id.split('-')[0]}…</span></td>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td>{missionStatusBadge(m.status)}</td>
                  <td><span className="mono">{m.asset_id.split('-')[0]}…</span></td>
                  <td className="secondary">{m.start_time ? new Date(m.start_time).toLocaleString() : '—'}</td>
                  <td className="secondary">{m.end_time ? new Date(m.end_time).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
