import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';



const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearUser } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    clearUser();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard',      path: '/dashboard' },
    { name: 'Transactions',   path: '/dashboard/transactions' },
    { name: 'Reconciliation', path: '/dashboard/reconciliation' },
    { name: 'Reports',        path: '/dashboard/reports' },
    { name: 'Settings',       path: '/dashboard/settings' },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const W = collapsed ? '72px' : '260px';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: W,
        minWidth: W,
        maxWidth: W,
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease, max-width 0.25s ease',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Logo + Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '20px 0' : '20px 16px 20px 24px',
          minHeight: '70px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <span style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              FinancePro
            </span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-primary)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {/* Nav — scrollable middle section */}
        <nav style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={collapsed ? item.name : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '12px 0' : '11px 16px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.18s',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{collapsed ? item.name.charAt(0) : item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout — always stuck at the bottom */}
        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '12px',
              width: '100%',
              padding: collapsed ? '12px 0' : '11px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              fontWeight: '500',
              fontSize: '0.95rem',
              transition: 'background 0.18s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>{collapsed ? '←' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: '70px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 32px',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.role || ''}
              </div>
            </div>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--accent-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', color: 'white', fontSize: '1.1rem',
            }}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page scroll area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
