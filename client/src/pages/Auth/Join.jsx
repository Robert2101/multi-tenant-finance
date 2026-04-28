import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Briefcase } from 'lucide-react';

const Join = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await api.get(`/auth/invite/${token}`);
        setInviteData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/auth/register-invite', {
        token,
        name,
        password
      });
      setUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Verifying invite link...</div>;
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            X
          </div>
          <h2 style={{ marginBottom: '12px' }}>Link Invalid</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
          <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '12px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-box glass-panel p-8 text-center" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase size={24} />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Join {inviteData.tenantName}</h2>
        <p className="text-sm text-gray-400 mb-6">
          You've been invited to join as an {inviteData.role}.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg mb-4 text-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input type="email" disabled value={inviteData.email} className="w-full px-4 py-3 rounded-lg bg-[#1a1b23] border border-[#2d2e3a] text-gray-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-[#1a1b23] border border-[#2d2e3a] text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-[#1a1b23] border border-[#2d2e3a] text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors mt-2">
            {submitting ? 'Creating account...' : 'Accept Invite & Join'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Join;
