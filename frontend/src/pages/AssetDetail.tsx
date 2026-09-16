import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Asset } from '../types';

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return <span className="badge green"><span className="dot"></span>{status}</span>;
  if (s === 'STANDBY') return <span className="badge yellow">{status}</span>;
  if (s === 'ERROR' || s === 'FAULT') return <span className="badge red">{status}</span>;
  return <span className="badge neutral">{status}</span>;
}

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', status: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.getAsset(id)
      .then(data => { setAsset(data); setEditForm({ name: data.name, status: data.status }); })
      .catch(() => setError('Unable to load asset'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setSaving(true);
    try {
      const updated = await apiClient.updateAsset(asset.asset_id, editForm);
      setAsset(updated);
      setEditing(false);
    } catch {
      setError('Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading asset…</div>;
  if (error && !asset) return <div className="error-banner">⚠ {error}</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <button className="back-btn" onClick={() => navigate('/assets')}>
        ← Back to Assets
      </button>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>⚠ {error}</div>}

      {/* Identity Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16, color: 'var(--accent)'
        }}>
          {asset?.type?.[0] ?? '?'}
        </div>
        <div>
          <h1 className="page-title">{asset?.name}</h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{asset?.asset_id}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {asset && statusBadge(asset.status)}
          {!editing
            ? <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
            : null
          }
        </div>
      </div>

      {/* Edit form */}
      {editing && asset && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Edit Asset</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <input className="form-input" value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Fields */}
      <div className="card">
        <div className="card-header"><span className="card-title">Asset Information</span></div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-field">
              <div className="detail-field-label">Asset ID</div>
              <div className="detail-field-value mono">{asset?.asset_id}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Type</div>
              <div className="detail-field-value">{asset?.type}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Status</div>
              <div className="detail-field-value">{asset && statusBadge(asset.status)}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Make</div>
              <div className="detail-field-value">{asset?.make || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Model</div>
              <div className="detail-field-value">{asset?.model || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Driver Version</div>
              <div className="detail-field-value mono">{asset?.driver_version || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Firmware Version</div>
              <div className="detail-field-value mono">{asset?.firmware_version || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Registered</div>
              <div className="detail-field-value mono">
                {asset?.created_at ? new Date(asset.created_at).toLocaleString() : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
