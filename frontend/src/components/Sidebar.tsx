import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Map, AlertTriangle, Radio
} from 'lucide-react';
import { wsClient } from '../api/websocket';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/assets', icon: Cpu, label: 'Assets' },
  { to: '/missions', icon: Map, label: 'Missions' },
  { to: '/events', icon: AlertTriangle, label: 'Events' },
];

export default function Sidebar() {
  const location = useLocation();
  const [activeAssets, setActiveAssets] = useState(0);

  useEffect(() => {
    // Track unique active assets from live telemetry
    const seen = new Set<string>();
    const unsub = wsClient.subscribe("TELEMETRY_UPDATE", (msg: any) => {
      seen.add(msg.asset_id);
      setActiveAssets(seen.size);
    });
    return unsub;
  }, []);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">A</div>
        <div>
          <div className="brand-name">AstraOS</div>
          <div className="brand-version">v0.5.0-dev</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <Radio size={13} style={{ marginRight: 6, opacity: 0.4 }} />
          <span className="sidebar-status-text">SVI Data Stream</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className={`sidebar-status-dot${activeAssets === 0 ? ' offline' : ''}`}></span>
          <span className="sidebar-status-text">
            {activeAssets === 0 ? 'No active telemetry' : `${activeAssets} vehicle${activeAssets > 1 ? 's' : ''} active`}
          </span>
        </div>
      </div>
    </aside>
  );
}
