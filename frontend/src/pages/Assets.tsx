import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { wsClient } from '../api/websocket';
import type { Asset } from '../types';
import { Plus } from 'lucide-react';

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return <span className="badge green"><span className="dot"></span>{status}</span>;
  if (s === 'STANDBY') return <span className="badge yellow"><span className="dot"></span>{status}</span>;
  if (s === 'OFFLINE') return <span className="badge neutral">{status}</span>;
  if (s === 'ERROR' || s === 'FAULT') return <span className="badge red">{status}</span>;
  return <span className="badge neutral">{status}</span>;
}

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', type: '', status: 'STANDBY', make: '', model: '', driver_version: '', firmware_version: ''
  });

  useEffect(() => { 
    loadAssets(); 
    
    const unsub = wsClient.subscribe("TELEMETRY_UPDATE", (msg: any) => {
       setAssets(prev => prev.map(a => 
          a.asset_id === msg.asset_id ? { ...a, status: msg.telemetry.connection_status === 'CONNECTED' ? 'ACTIVE' : 'OFFLINE' } : a
       ));
    });
    return unsub;
  }, []);

  const loadAssets = async () => {
    try {
      setError(null);
      const data = await apiClient.getAssets();
      setAssets(data);
    } catch {
      setError('Unable to load data — backend may be unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.createAsset(form);
      setShowForm(false);
      setForm({ name: '', type: '', status: 'STANDBY', make: '', model: '', driver_version: '', firmware_version: '' });
      await loadAssets();
    } catch {
      setError('Failed to create asset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading assets…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assets</h1>
        <p className="page-subtitle">Registered unmanned systems</p>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}

      {/* Register Asset Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Register New Asset</span>
            <button className="btn-ghost btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Asset Name', key: 'name', placeholder: 'UGV-001', required: true },
                  { label: 'Type', key: 'type', placeholder: 'UGV · UAV · AUV', required: true },
                  { label: 'Status', key: 'status', placeholder: 'STANDBY', required: true },
                  { label: 'Make', key: 'make', placeholder: 'Manufacturer' },
                  { label: 'Model', key: 'model', placeholder: 'Model name' },
                  { label: 'Driver Version', key: 'driver_version', placeholder: '1.0.0' },
                  { label: 'Firmware Version', key: 'firmware_version', placeholder: '2.0.0' },
                ].map(({ label, key, placeholder, required }) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}{required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
                    <input
                      className="form-input"
                      placeholder={placeholder}
                      required={required}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering…' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Assets ({assets.length})</span>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} />
              Register Asset
            </button>
          )}
        </div>

        {assets.length === 0 && !error ? (
          <div className="empty-state">
            <div className="icon">◯</div>
            <div className="title">No assets registered</div>
            <div className="desc">Register a vehicle to begin operations</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Make / Model</th>
                <th>Driver</th>
                <th>Firmware</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.asset_id}>
                  <td style={{ fontWeight: 500 }}>{asset.name}</td>
                  <td><span className="badge blue">{asset.type}</span></td>
                  <td>{statusBadge(asset.status)}</td>
                  <td className="secondary">{[asset.make, asset.model].filter(Boolean).join(' · ') || '—'}</td>
                  <td><span className="mono">{asset.driver_version || '—'}</span></td>
                  <td><span className="mono">{asset.firmware_version || '—'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-link" onClick={() => navigate(`/assets/${asset.asset_id}`)}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
