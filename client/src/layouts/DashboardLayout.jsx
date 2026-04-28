import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, RefreshCcw, FileBarChart, Settings, LogOut, Wallet } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Ignore errors, always clear local state
    }
    clearUser();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Transactions', path: '/dashboard/transactions', icon: <Receipt size={20} /> },
    { name: 'Reconciliation', path: '/dashboard/reconciliation', icon: <RefreshCcw size={20} /> },
    { name: 'Reports', path: '/dashboard/reports', icon: <FileBarChart size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0'
      }}>
        <div style={{ padding: '0 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '8px' }}>
            <Wallet size={24} color="white" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>FinancePro</span>
        </div>

        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'var(--transition)',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => { if(!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { if(!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              fontWeight: '500',
              fontSize: '1rem',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ 
          height: '70px', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 32px',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                {user?.role || 'Member'} · {user?.email || ''}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
