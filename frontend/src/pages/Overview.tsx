import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { wsClient } from '../api/websocket';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SystemStats {
  assets: number;
  missions: number;
  events: number;
}

export default function Overview() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [fleetBattery, setFleetBattery] = useState<{name: string, battery: number}[]>([]);

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
        
        // Initial fleet battery from API (we fetch latest telemetry for each asset)
        const batData = await Promise.all(assets.map(async (a: any) => {
          try {
             const tel = await apiClient.getAssetTelemetry(a.asset_id, 1);
             return { name: a.name, battery: tel.length ? tel[0].battery_pct : 0, id: a.asset_id };
          } catch {
             return { name: a.name, battery: 0, id: a.asset_id };
          }
        }));
        setFleetBattery(batData);
      } catch {
        setBackendOk(false);
      } finally {
        setLoading(false);
      }
    };
    load();
    
    const unsubs = [
      wsClient.subscribe("EVENT_NEW", () => {
        setStats(s => s ? { ...s, events: s.events + 1 } : s);
      }),
      wsClient.subscribe("TELEMETRY_UPDATE", (msg) => {
        setFleetBattery(prev => {
           const next = [...prev];
           const idx = next.findIndex(a => a.id === msg.asset_id);
           if(idx !== -1) {
             next[idx].battery = msg.telemetry.battery_pct;
           }
           return next;
        });
      })
    ];
    return () => unsubs.forEach(u => u());
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

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">System Status</span>
        </div>
        <div className="card-body">
          <div className="status-indicator">
            <span className="status-label">Backend</span>
            {backendOk ? <span className="status-value ok">Operational</span> : <span className="status-value error">Unavailable</span>}
          </div>
          <div className="status-indicator">
            <span className="status-label">Database</span>
            {stats !== null ? <span className="status-value ok">Connected</span> : <span className="status-value error">Unavailable</span>}
          </div>
          <div className="status-indicator">
            <span className="status-label">SVI Stream</span>
            {fleetBattery.some(b => b.battery > 0) ? <span className="status-value ok">Active</span> : <span className="status-value unknown">No active telemetry</span>}
          </div>
        </div>
      </div>

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

      {/* Real Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
         <div className="card-header">
            <span className="card-title">Fleet Battery Levels</span>
         </div>
         <div className="card-body" style={{ height: 260 }}>
            {fleetBattery.length === 0 ? (
               <div className="empty-state">
                  <div className="icon">⚡️</div>
                  <div className="title">No telemetry data available</div>
               </div>
            ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={fleetBattery} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                   <Tooltip 
                     cursor={{fill: 'var(--bg-hover)'}}
                     contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} 
                   />
                   <Bar dataKey="battery" radius={[4, 4, 0, 0]}>
                     {fleetBattery.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.battery > 20 ? 'var(--accent)' : 'var(--red)'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            )}
         </div>
      </div>

      {!backendOk && (
        <div className="error-banner">
          ⚠ Backend unavailable — ensure the backend is running on port 8000
        </div>
      )}
    </div>
  );
}
