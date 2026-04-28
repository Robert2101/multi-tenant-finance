import { useState, useEffect } from 'react';
import { Building2, Save, User, Shield } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import UsersInvites from './UsersInvites';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const SettingsPage = () => {
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState(null);
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await api.get('/tenant');
        setTenant(res.data);
        setTenantName(res.data.name);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/tenant', { name: tenantName });
      setTenant(res.data);
      setMessage({ type: 'success', text: 'Workspace settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your tenant workspace and account preferences.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Workspace Settings */}
        <div className="glass-panel" style={{ flex: 2, minWidth: '300px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}><Building2 size={22} color="var(--accent-primary)" /></div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Workspace Settings</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Update your tenant workspace details</p>
            </div>
          </div>

          {message && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading workspace info...</div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Workspace / Company Name</label>
                <input type="text" required style={inputStyle} value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Subscription Status</label>
                <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tenant?.subscriptionStatus === 'active' ? 'var(--success)' : '#f59e0b', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{tenant?.subscriptionStatus || 'trial'}</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tenant ID</label>
                <input readOnly style={{ ...inputStyle, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'default' }} value={user?.tenantId || ''} />
              </div>
              <button type="submit" disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: saving ? 0.7 : 1 }}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>

        {/* Account Info */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}><User size={22} color="var(--accent-primary)" /></div>
              <h3 style={{ fontSize: '1.1rem' }}>Account Info</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Name', value: user?.name },
                { label: 'Email', value: user?.email },
                { label: 'User ID', value: user?._id, small: true },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>{item.label}</p>
                  <p style={{ fontWeight: '500', fontSize: item.small ? '0.78rem' : '0.95rem', color: item.small ? 'var(--text-secondary)' : 'var(--text-primary)', wordBreak: 'break-all' }}>{item.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}><Shield size={22} color="var(--success)" /></div>
              <h3 style={{ fontSize: '1.1rem' }}>Role & Access</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <span style={{ fontWeight: '600', color: 'var(--success)' }}>{user?.role || 'Admin'}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>· Full Access</span>
            </div>
          </div>
        </div>
      </div>

      <UsersInvites />
      
    </div>
  );
};

export default SettingsPage;
