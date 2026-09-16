import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { wsClient } from '../api/websocket';
import type { Asset, Mission, Event, Telemetry, WebSocketMessage } from '../types';
import { Activity, Battery, Map as MapIcon, Wifi, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Overview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssets: 0,
    connectedAssets: 0,
    activeMissions: 0,
    recentEvents: 0
  });
  const [batteryData, setBatteryData] = useState<{name: string, battery: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [assets, missions, events] = await Promise.all([
          apiClient.getAssets(),
          apiClient.getMissions(),
          apiClient.getEvents()
        ]);
        
        // Fetch latest state for battery chart
        const batData = await Promise.all(assets.map(async (a: Asset) => {
           try {
             const tel = await fetch(import.meta.env.VITE_API_BASE_URL + `/assets/${a.asset_id}/state`).then(r => r.json());
             return { name: a.name, battery: tel?.battery_pct || 0 };
           } catch { return { name: a.name, battery: 0 }; }
        }));

        setStats({
          totalAssets: assets.length,
          connectedAssets: assets.filter((a: Asset) => a.status === 'ACTIVE').length,
          activeMissions: missions.filter((m: Mission) => m.status === 'ACTIVE').length,
          recentEvents: events.length
        });
        setBatteryData(batData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();

    const unsubs = [
      wsClient.subscribe("TELEMETRY_UPDATE", (msg: WebSocketMessage) => {
         if (!msg.telemetry) return;
         setBatteryData(prev => {
            const next = [...prev];
            const idx = next.findIndex(x => x.name.includes(msg.asset_id!.split('-')[0]));
            if (idx >= 0) {
               next[idx].battery = msg.telemetry!.battery_pct;
            }
            return next;
         });
      }),
      wsClient.subscribe("EVENT_NEW", (msg: WebSocketMessage) => {
         setStats(s => ({ ...s, recentEvents: s.recentEvents + 1 }));
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
            {stats !== null ? <span className="status-value ok">Operational</span> : <span className="status-value error">Unavailable</span>}
          </div>
          <div className="status-indicator">
            <span className="status-label">Database</span>
            {stats !== null ? <span className="status-value ok">Connected</span> : <span className="status-value error">Unavailable</span>}
          </div>
          <div className="status-indicator">
            <span className="status-label">SVI Stream</span>
            {batteryData.some(b => b.battery > 0) ? <span className="status-value ok">Active</span> : <span className="status-value unknown">No active telemetry</span>}
          </div>
        </div>
      </div>

      {stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Registered Assets</div>
            <div className="stat-value">{stats.totalAssets}</div>
            <div className="stat-sub">UGV · UAV · AUV</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Connected Assets</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.connectedAssets}</div>
            <div className="stat-sub">Active connections</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Missions</div>
            <div className="stat-value">{stats.activeMissions}</div>
            <div className="stat-sub">Running operations</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">System Events</div>
            <div className="stat-value">{stats.recentEvents}</div>
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
            {batteryData.length === 0 ? (
               <div className="empty-state">
                  <div className="icon">⚡️</div>
                  <div className="title">No telemetry data available</div>
               </div>
            ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={batteryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                   <Tooltip 
                     cursor={{fill: 'var(--bg-hover)'}}
                     contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} 
                   />
                   <Bar dataKey="battery" radius={[4, 4, 0, 0]}>
                     {batteryData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.battery > 20 ? 'var(--accent)' : 'var(--red)'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            )}
         </div>
      </div>
    </div>
  );
}
