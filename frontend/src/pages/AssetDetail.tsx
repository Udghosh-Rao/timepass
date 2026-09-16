import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { wsClient } from '../api/websocket';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [a, t, e] = await Promise.all([
          apiClient.getAsset(id),
          apiClient.getAssetTelemetry(id, 20),
          apiClient.getEvents()
        ]);
        setAsset(a);
        setTelemetry(t.reverse()); // Chronological for chart
        setEvents(e.filter((ev: any) => ev.asset_id === id).slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (loading || !mapContainer.current || !telemetry) return;

    const currentTel = telemetry[telemetry.length - 1];

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: currentTel ? [currentTel.longitude, currentTel.latitude] : [0, 0],
        zoom: currentTel ? 14 : 1,
        interactive: true
      });

      if (currentTel) {
        marker.current = new maplibregl.Marker({ color: 'var(--accent)' })
          .setLngLat([currentTel.longitude, currentTel.latitude])
          .addTo(map.current);
      }
    }
  }, [loading, telemetry]);

  useEffect(() => {
    if (!id) return;
    const unsubs = [
      wsClient.subscribe("TELEMETRY_UPDATE", (msg) => {
        if (msg.asset_id !== id) return;
        setTelemetry(prev => {
          const newTel = [...prev, msg.telemetry];
          if (newTel.length > 20) newTel.shift();
          return newTel;
        });
        
        // Update marker
        if (map.current && marker.current) {
           marker.current.setLngLat([msg.telemetry.longitude, msg.telemetry.latitude]);
           map.current.panTo([msg.telemetry.longitude, msg.telemetry.latitude]);
        }
      }),
      wsClient.subscribe("EVENT_NEW", (msg) => {
         if (msg.event.asset_id !== id) return;
         setEvents(prev => [msg.event, ...prev].slice(0, 10));
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading asset…</div>;
  if (!asset) return <div className="error-banner">Asset not found</div>;

  const currentTel = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
             <button onClick={() => navigate('/assets')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 24, padding: 0 }}>‹</button>
             <h1 className="page-title" style={{ margin: 0 }}>{asset.name}</h1>
             <span className={`badge ${asset.status === 'ACTIVE' ? 'badge-active' : 'badge-offline'}`}>{asset.status}</span>
           </div>
           <p className="page-subtitle">{asset.make || 'Unknown Make'} {asset.model || 'Unknown Model'} · {asset.type}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Status Card */}
        <div className="card">
          <div className="card-header"><span className="card-title">Live Telemetry</span></div>
          <div className="card-body">
             {currentTel ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                   <div>
                      <div className="stat-label">Battery</div>
                      <div style={{ color: currentTel.battery_pct > 20 ? 'var(--text)' : 'var(--red)', fontSize: 24, fontWeight: 500 }}>{currentTel.battery_pct.toFixed(1)}%</div>
                   </div>
                   <div>
                      <div className="stat-label">Speed</div>
                      <div style={{ fontSize: 24, fontWeight: 500 }}>{currentTel.speed.toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>m/s</span></div>
                   </div>
                   <div>
                      <div className="stat-label">Heading</div>
                      <div style={{ fontSize: 24, fontWeight: 500 }}>{currentTel.heading.toFixed(0)}°</div>
                   </div>
                   <div>
                      <div className="stat-label">Health</div>
                      <div style={{ fontSize: 24, fontWeight: 500 }}>{currentTel.health_status}</div>
                   </div>
                </div>
             ) : (
                <div className="empty-state">No telemetry data available</div>
             )}
          </div>
        </div>

        {/* Map Card */}
        <div className="card" style={{ overflow: 'hidden', padding: 0, border: '1px solid var(--border)' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '240px' }} />
          {!currentTel && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
               No positions available
            </div>
          )}
        </div>
      </div>

      {/* Speed Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
         <div className="card-header"><span className="card-title">Speed History</span></div>
         <div className="card-body" style={{ height: 260 }}>
            {telemetry.length === 0 ? (
               <div className="empty-state">No telemetry data available</div>
            ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={telemetry} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                   <Tooltip 
                     labelFormatter={(t) => new Date(t).toLocaleString()}
                     contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6 }} 
                   />
                   <Line type="monotone" dataKey="speed" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
                 </LineChart>
               </ResponsiveContainer>
            )}
         </div>
      </div>

      {/* Events */}
      <div className="card">
         <div className="card-header"><span className="card-title">Recent Events</span></div>
         <div className="card-body" style={{ padding: 0 }}>
            {events.length === 0 ? (
               <div className="empty-state" style={{ padding: 32 }}>No recent events</div>
            ) : (
               <table className="table">
                  <thead>
                     <tr>
                        <th>Time</th>
                        <th>Event Type</th>
                        <th>Severity</th>
                     </tr>
                  </thead>
                  <tbody>
                     {events.map((ev: any) => (
                        <tr key={ev.event_id}>
                           <td style={{ color: 'var(--text-muted)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</td>
                           <td>{ev.event_type}</td>
                           <td>
                              <span className={`badge ${ev.severity === 'CRITICAL' || ev.severity === 'HIGH' ? 'badge-error' : 'badge-info'}`}>
                                 {ev.severity}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
}
