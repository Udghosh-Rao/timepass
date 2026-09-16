import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { wsClient } from '../api/websocket';
import type { Event } from '../types';

function severityBadge(severity: string) {
  const s = severity.toUpperCase();
  if (s === 'CRITICAL') return <span className="badge red"><span className="dot"></span>CRITICAL</span>;
  if (s === 'HIGH')     return <span className="badge orange">HIGH</span>;
  if (s === 'MEDIUM')   return <span className="badge yellow">MEDIUM</span>;
  if (s === 'LOW')      return <span className="badge blue">LOW</span>;
  return <span className="badge neutral">{severity}</span>;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getEvents()
      .then(data => setEvents(data))
      .catch(() => setError('Unable to load data'))
      .finally(() => setLoading(false));

    const unsub = wsClient.subscribe("EVENT_NEW", (msg: any) => {
       setEvents(prev => [msg.event, ...prev]);
    });
    return unsub;
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading events…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">System Events</h1>
        <p className="page-subtitle">Events logged by the platform — Event Engine not yet active</p>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Event Log ({events.length})</span>
        </div>

        {events.length === 0 && !error ? (
          <div className="empty-state">
            <div className="icon">◉</div>
            <div className="title">No events available</div>
            <div className="desc">Events will appear here once the Event Engine is active</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Asset ID</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.event_id}>
                  <td><span className="mono">{new Date(ev.timestamp).toLocaleString()}</span></td>
                  <td style={{ fontWeight: 500 }}>{ev.event_type}</td>
                  <td>{severityBadge(ev.severity)}</td>
                  <td><span className="mono">{ev.asset_id.split('-')[0]}…</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
