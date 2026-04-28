import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [formData, setFormData] = useState({ tenantName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      setUser(response.data); // save user to Zustand store
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    marginBottom: '20px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'var(--transition)'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ background: 'var(--accent-glow)', padding: '16px', borderRadius: '50%' }}>
            <Building size={32} color="var(--accent-primary)" />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '2rem' }}>Create Workspace</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Set up a new isolated tenant environment
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Company / Workspace Name
            </label>
            <input 
              type="text" 
              required
              style={inputStyle}
              placeholder="Acme Corp"
              value={formData.tenantName}
              onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Your Full Name
            </label>
            <input 
              type="text" 
              required
              style={inputStyle}
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Work Email Address
            </label>
            <input 
              type="email" 
              required
              style={inputStyle}
              placeholder="john@acmecorp.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input 
              type="password" 
              required
              style={inputStyle}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'var(--transition)',
              marginTop: '10px'
            }}
          >
            {loading ? 'Creating Workspace...' : 'Create Tenant Workspace'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
          Already have a workspace? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
