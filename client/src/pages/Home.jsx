import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', width: '100%', padding: '60px 40px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '24px', fontSize: '3rem' }}>
          Welcome to the <span className="text-gradient">Multi-tenant Finance Platform</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Affordable and scalable financial management solutions for small businesses and freelancers. Isolated workspaces, advanced reporting, and real-time reconciliation.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/register')}
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'var(--transition)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--accent-hover)'}
            onMouseOut={(e) => e.target.style.background = 'var(--accent-primary)'}
          >
            Get Started
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '14px 32px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--bg-tertiary)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
