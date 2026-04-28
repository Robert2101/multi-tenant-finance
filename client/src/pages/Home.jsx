import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
      {/* Navbar */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '20px 40px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700', fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '6px', borderRadius: '8px' }}>
            <Wallet size={24} color="white" />
          </div>
          FinancePro
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent', color: 'var(--text-secondary)', border: 'none',
              padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: '600',
              cursor: 'pointer', transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register')}
            style={{
              background: 'var(--text-primary)', color: 'var(--bg-secondary)', border: 'none',
              padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: '600',
              cursor: 'pointer', transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Start for free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="animate-fade-in" style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' 
      }}>
        <div style={{ 
          background: 'var(--accent-glow)', color: 'var(--accent-primary)', 
          padding: '6px 16px', borderRadius: 'var(--radius-full)', 
          fontWeight: '600', fontSize: '0.9rem', marginBottom: '32px'
        }}>
          Multi-tenant platform for growing businesses
        </div>
        
        <h1 style={{ 
          fontSize: '4.5rem', fontWeight: '700', lineHeight: '1.1', 
          maxWidth: '800px', marginBottom: '24px', letterSpacing: '-0.02em',
          color: 'var(--text-primary)'
        }}>
          Financial clarity for modern teams.
        </h1>
        
        <p style={{ 
          color: 'var(--text-secondary)', fontSize: '1.25rem', 
          maxWidth: '600px', marginBottom: '48px', lineHeight: '1.6' 
        }}>
          Manage multiple entities, automate reconciliation, and generate compliance-ready reports—all from one secure workspace.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/register')}
            style={{
              background: 'var(--accent-primary)', color: 'white', border: 'none',
              padding: '16px 32px', borderRadius: 'var(--radius-md)', fontWeight: '600',
              fontSize: '1.1rem', cursor: 'pointer', transition: 'var(--transition)',
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)'
            }}
            onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.23)'; }}
            onMouseOut={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 14px 0 rgba(37, 99, 235, 0.39)'; }}
          >
            Create your workspace <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
