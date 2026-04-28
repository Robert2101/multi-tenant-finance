import { useState, useEffect } from 'react';
import { History, Activity, FilePlus, Edit, Trash2, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const AuditLogs = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Only Admins can view audit logs
  if (user?.role !== 'Admin') {
    return null;
  }

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit');
        setLogs(res.data);
      } catch (err) {
        setError('Failed to load audit logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <FilePlus size={16} color="var(--success)" />;
      case 'UPDATE': return <Edit size={16} color="var(--accent-primary)" />;
      case 'DELETE': return <Trash2 size={16} color="var(--danger)" />;
      case 'RECONCILE': return <CheckCircle size={16} color="var(--success)" />;
      default: return <Activity size={16} color="var(--text-muted)" />;
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="glass-panel" style={{ marginTop: '24px', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}>
          <History size={22} color="var(--accent-primary)" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem' }}>Activity & Audit Logs</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Compliance timeline of all workspace actions</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {logs.map((log, index) => (
            <div key={log._id} style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '16px', 
              padding: '16px 0', 
              borderBottom: index < logs.length - 1 ? '1px solid var(--border-color)' : 'none' 
            }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: 'var(--bg-tertiary)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                {getActionIcon(log.action)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.userId?.name || 'Unknown User'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}> {log.action.toLowerCase()}d a </span>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{log.targetModel}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{formatTime(log.timestamp)}</span>
                  <span>•</span>
                  <span>{log.userId?.email || 'System'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
