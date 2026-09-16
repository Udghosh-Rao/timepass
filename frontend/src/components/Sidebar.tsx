import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Map, AlertTriangle, Radio
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/assets', icon: Cpu, label: 'Assets' },
  { to: '/missions', icon: Map, label: 'Missions' },
  { to: '/events', icon: AlertTriangle, label: 'Events' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">A</div>
        <div>
          <div className="brand-name">AstraOS</div>
          <div className="brand-version">v0.4.0-dev</div>
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
          <span className="sidebar-status-text">SVI Not Connected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="sidebar-status-dot offline"></span>
          <span className="sidebar-status-text">No active vehicles</span>
        </div>
      </div>
    </aside>
  );
}
