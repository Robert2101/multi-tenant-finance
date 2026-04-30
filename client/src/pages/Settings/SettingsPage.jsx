import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import UsersInvites from './UsersInvites';
import AuditLogs from './AuditLogs';

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

  const isAdmin = user?.role === 'Admin';

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Workspace Settings */}
        <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Workspace</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Manage your tenant workspace details.</p>

          {message && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Company Name</label>
                <input type="text" required style={{...inputStyle, opacity: isAdmin ? 1 : 0.6}} value={tenantName} onChange={(e) => setTenantName(e.target.value)} disabled={!isAdmin} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Subscription Status</label>
                <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', opacity: isAdmin ? 1 : 0.6 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tenant?.subscriptionStatus === 'active' ? 'var(--success)' : '#f59e0b', display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize', fontSize: '0.9rem' }}>{tenant?.subscriptionStatus || 'trial'}</span>
                </div>
              </div>
              
              {!isAdmin && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Only Admins can modify workspace settings.</p>
              )}

              {isAdmin && (
                  <button type="submit" disabled={saving}
                    style={{ marginTop: '8px', padding: '10px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius-md)', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
              )}
            </form>
          )}
        </div>

        {/* Account Info */}
        <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>My Account</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>Personal information and role.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Name</p>
              <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{user?.name || '—'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Email</p>
              <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{user?.email || '—'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Role</p>
              <div style={{ display: 'inline-flex', padding: '4px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: '500' }}>
                {user?.role || 'Admin'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UsersInvites />
      <AuditLogs />
      
    </div>
  );
};

export default SettingsPage;
