import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function Topbar() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        await apiClient.getSystemHealth();
        setStatus('healthy');
      } catch {
        setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date().toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });

  return (
    <header className="topbar">
      <div className="topbar-left" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {now} UTC
      </div>
      <div className="topbar-right">
        <div className="topbar-chip">
          <span className={`dot${status === 'offline' ? ' error' : ''}`}></span>
          <span>
            {status === 'checking' ? 'Connecting...' : status === 'healthy' ? 'Backend Online' : 'Backend Offline'}
          </span>
        </div>
        <div className="topbar-chip">
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            DEV
          </span>
        </div>
      </div>
    </header>
  );
}
