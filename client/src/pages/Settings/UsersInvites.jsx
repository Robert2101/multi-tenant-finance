import { useState, useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const UsersInvites = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, iRes] = await Promise.all([
        api.get('/tenant/users'),
        api.get('/tenant/invites')
      ]);
      setUsers(uRes.data.users || []);
      setInvites(iRes.data || []);
    } catch (error) {
      console.error('Failed to fetch users/invites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await api.post('/tenant/invites', { email: inviteEmail, role: inviteRole });
      setInviteMsg({ type: 'success', text: `Invite link created: ${res.data.inviteLink}` });
      setInviteEmail('');
      fetchData();
    } catch (err) {
      setInviteMsg({ type: 'error', text: err.response?.data?.message || 'Failed to trigger invite' });
    } finally {
      setInviting(false);
    }
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');

  return (
    <div className="glass-panel" style={{ marginTop: '24px', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '10px' }}>
          <Users size={22} color="var(--accent-primary)" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem' }}>Team Members</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage who has access to this workspace</p>
        </div>
      </div>

      {user?.role === 'Admin' && (
        <div style={{ marginBottom: '32px', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Invite New Member
          </h4>
          
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Address</label>
              <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} placeholder="colleague@company.com" />
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}>
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={inviting} style={{ padding: '10px 24px', height: '42px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, minWidth: '120px' }}>
              {inviting ? 'Inviting...' : 'Send Invite'}
            </button>
          </form>

          {inviteMsg && (
            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', wordBreak: 'break-all', background: inviteMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: inviteMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              {inviteMsg.text}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading team members...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Active Users ({users.length})</h4>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {users.map((u, i) => (
                <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: i < users.length - 1 ? '1px solid var(--border-color)' : 'none', background: 'var(--bg-primary)' }}>
                  <div>
                    <p style={{ fontWeight: 500 }}>{u.name} {user._id === u._id && <span style={{ fontSize: '0.75rem', background: 'var(--accent-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>You</span>}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</p>
                  </div>
                  <div style={{ padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{u.role}</div>
                </div>
              ))}
            </div>
          </div>

          {pendingInvites.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Pending Invites ({pendingInvites.length})</h4>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {pendingInvites.map((inv, i) => (
                  <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: i < pendingInvites.length - 1 ? '1px solid var(--border-color)' : 'none', background: 'var(--bg-primary)' }}>
                    <div>
                      <p style={{ fontWeight: 500 }}>{inv.email}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ padding: '4px 12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '12px', fontSize: '0.85rem' }}>{inv.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersInvites;
