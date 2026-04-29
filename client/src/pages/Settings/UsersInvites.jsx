import { useState, useEffect } from 'react';

import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const RoleBadge = ({ role }) => {
  const colors = {
    Admin:  { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    Editor: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    Viewer: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  };
  const c = colors[role] || colors.Viewer;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{role}</span>
  );
};

const Avatar = ({ name, size = 36 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const hue = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},60%,40%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.4,
      flexShrink: 0,
    }}>{initial}</div>
  );
};

const UsersInvites = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, iRes] = await Promise.all([
        api.get('/tenant/users'),
        api.get('/tenant/invites'),
      ]);
      setUsers(uRes.data.users || []);
      setInvites(iRes.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await api.post('/tenant/invites', { email: inviteEmail, role: inviteRole });
      setInviteMsg({ type: 'success', text: res.data.inviteLink });
      setInviteEmail('');
      fetchData();
    } catch (err) {
      setInviteMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create invite' });
    } finally {
      setInviting(false);
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2500);
    });
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>

      {/* ── Invite Form (Admin only) ── */}
      {user?.role === 'Admin' && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {/* Card header */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Invite New Member</h3>
            <p style={{ margin: '0 0 0 8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Send an invite link to a teammate</p>
          </div>

          {/* Form body */}
          <div style={{ padding: '24px' }}>
            <form onSubmit={handleInvite}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* Email */}
                <div style={{ flex: '1 1 240px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Email Address
                  </label>
                  <input
                      type="email" required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 14px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                </div>

                {/* Role */}
                <div style={{ flex: '0 1 140px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem', outline: 'none',
                    }}
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Button */}
                <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="submit" disabled={inviting}
                    style={{
                      padding: '10px 24px', height: '42px',
                      background: inviting ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                      color: inviting ? 'var(--text-muted)' : 'white',
                      border: 'none', borderRadius: 'var(--radius-md)',
                      cursor: inviting ? 'not-allowed' : 'pointer',
                      fontWeight: 600, fontSize: '0.9rem',
                      whiteSpace: 'nowrap', transition: 'all 0.2s',
                    }}
                  >
                    {inviting ? 'Sending…' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </form>

            {/* Result message */}
            {inviteMsg && (
              <div style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: inviteMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
              }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '0.82rem', fontWeight: 600, color: inviteMsg.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                    {inviteMsg.type === 'success' ? '✅ Invite link created!' : '❌ Error'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {inviteMsg.text}
                  </p>
                </div>
                {inviteMsg.type === 'success' && (
                    <button
                    onClick={() => copyLink(inviteMsg.text)}
                    style={{
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: 'var(--radius-md)',
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                      color: 'var(--success)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    }}
                  >
                    {copiedLink === inviteMsg.text ? 'Copied!' : 'Copy Link'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Active Users ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Active Members</h3>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 10px', borderRadius: '20px' }}>
            {users.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No members yet.</div>
        ) : (
          users.map((u, i) => (
            <div key={u._id} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 24px',
              borderBottom: i < users.length - 1 ? '1px solid var(--border-color)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar name={u.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{u.name}</span>
                  {user._id === u._id && (
                    <span style={{ fontSize: '0.7rem', background: 'var(--accent-primary)', color: 'white', padding: '1px 7px', borderRadius: '20px' }}>You</span>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
              </div>
              <RoleBadge role={u.role} />
            </div>
          ))
        )}
      </div>

      {/* ── Pending Invites ── */}
      {pendingInvites.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Pending Invites</h3>
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 10px', borderRadius: '20px' }}>
              {pendingInvites.length}
            </span>
          </div>
          {pendingInvites.map((inv, i) => (
            <div key={inv._id} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 24px',
              borderBottom: i < pendingInvites.length - 1 ? '1px solid var(--border-color)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(245,158,11,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem',
              }}>
                {inv.email.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{inv.email}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <RoleBadge role={inv.role} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersInvites;
