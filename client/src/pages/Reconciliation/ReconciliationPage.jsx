import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, CheckCircle, AlertTriangle, Zap, Landmark, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import api from '../../services/api';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const ReconciliationPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [reconciling, setReconciling] = useState(null);
  const [result, setResult] = useState(null);
  
  // Plaid & Connection state
  const [linkToken, setLinkToken] = useState(null);
  const [isPlaidLoading, setIsPlaidLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, bankName: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Transactions
      const txRes = await api.get('/transactions');
      setPending(txRes.data.filter((tx) => tx.status === 'pending'));

      // 2. Fetch Tenant/Connection Status
      const tenantRes = await api.get('/tenant/me');
      if (tenantRes.data.plaidAccessToken) {
        setConnectionStatus({
          connected: true,
          bankName: tenantRes.data.plaidInstitutionName || 'Connected Bank'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Plaid Integration Flow ---

  const fetchLinkToken = async () => {
    setIsPlaidLoading(true);
    try {
      const response = await api.post('/reconciliation/create-link-token');
      setLinkToken(response.data.link_token);
    } catch (err) {
      setResult({ type: 'error', message: 'Failed to initialize Plaid connection' });
    } finally {
      setIsPlaidLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        await api.post('/reconciliation/exchange-public-token', { 
            publicToken: public_token,
            metadata: metadata // Now sending metadata to save bank name
        });
        setResult({ type: 'success', message: `Connected to ${metadata.institution.name}!` });
        setLinkToken(null);
        fetchData(); // Refresh UI to show connected status
      } catch (err) {
        setResult({ type: 'error', message: 'Failed to exchange token with bank' });
      }
    },
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (ready && linkToken) open();
  }, [ready, linkToken, open]);

  const handleSyncPlaid = async () => {
    setSimulating(true);
    setResult(null);
    try {
      const res = await api.post('/reconciliation/sync');
      setResult({ type: 'success', message: res.data.message });
      fetchData();
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Sync failed.' });
    } finally {
      setSimulating(false);
    }
  };

  // --- Simulation/Manual Logic ---
  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await api.post('/reconciliation/simulate');
      setResult({ type: 'success', message: res.data.message });
      fetchData();
    } catch (err) { setResult({ type: 'error', message: 'Simulation failed' }); }
    finally { setSimulating(false); }
  };

  const handleReconcileOne = async (txId) => {
    setReconciling(txId);
    try {
      await api.patch(`/reconciliation/reconcile/${txId}`);
      fetchData();
    } catch (err) { setResult({ type: 'error', message: 'Reconciliation failed' }); }
    finally { setReconciling(null); }
  };

  const handleReconcileAll = async () => {
    setReconciling('all');
    try {
      await api.post('/reconciliation/reconcile-all');
      fetchData();
    } catch (err) { setResult({ type: 'error', message: 'Bulk reconciliation failed' }); }
    finally { setReconciling(null); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Reconciliation</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Connect your real bank or simulate records to match transactions.</p>
      </div>

      {/* Connection Status Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: connectionStatus.connected ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: connectionStatus.connected ? 'var(--success)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {connectionStatus.connected ? <ShieldCheck size={32} /> : <Landmark size={32} />}
            </div>
            <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                    {connectionStatus.connected ? `Bank Connected: ${connectionStatus.bankName}` : 'No Bank Connected'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {connectionStatus.connected ? 'Your real-time bank feed is active.' : 'Link your bank to automate transaction tracking.'}
                </p>
            </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
            {!connectionStatus.connected ? (
                <button onClick={fetchLinkToken} disabled={isPlaidLoading}
                    className="button-primary" style={{ padding: '10px 24px' }}>
                    <LinkIcon size={18} style={{ marginRight: '8px' }} />
                    Connect Real Bank
                </button>
            ) : (
                <button onClick={fetchLinkToken} disabled={isPlaidLoading}
                    style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Switch Bank
                </button>
            )}
            
            <button onClick={handleSyncPlaid} disabled={simulating || !connectionStatus.connected}
                style={{ opacity: connectionStatus.connected ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: connectionStatus.connected ? 'pointer' : 'not-allowed', fontWeight: '600' }}>
                <RefreshCcw size={18} className={simulating ? 'animate-spin' : ''} />
                Sync Real Transactions
            </button>
        </div>
      </div>

      {/* Result Alert */}
      {result && (
        <div className="glass-panel animate-slide-up" style={{ padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: result.type === 'success' ? 'var(--success)' : 'var(--danger)', borderLeft: `4px solid ${result.type === 'success' ? 'var(--success)' : 'var(--danger)'}` }}>
          {result.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span style={{ fontWeight: '500' }}>{result.message}</span>
          <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
        </div>
      )}

      {/* Simulation Fallback */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <Zap size={16} color="#f59e0b" />
              <span>Don't have a real bank?</span>
              <button onClick={handleSimulate} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: '0.9rem', textDecoration: 'underline' }}>Simulate bank feed</button>
          </div>

          <button onClick={handleReconcileAll} disabled={reconciling === 'all' || pending.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--accent-glow)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}>
            <CheckCircle size={18} />
            Reconcile All ({pending.length})
          </button>
      </div>

      {/* Pending Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Pending Bank Records</h3>
          <span style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
            {pending.length} Items Total
          </span>
        </div>
        
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
              <RefreshCcw size={32} className="animate-spin" style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Fetching latest records...</p>
          </div>
        ) : pending.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h4 style={{ margin: '0 0 8px' }}>Clean Slate!</h4>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>All bank records have been reconciled. Sync your bank or simulate a feed to fetch new items.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Date', 'Type', 'Category', 'Description', 'Amount', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map((tx) => (
                  <tr key={tx._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: '700', background: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>{tx.type}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{tx.category}</td>
                    <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{tx.description || '—'}</td>
                    <td style={{ padding: '16px 20px', fontWeight: '700', fontSize: '1rem', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button onClick={() => handleReconcileOne(tx._id)} disabled={reconciling === tx._id}
                        className="button-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        <CheckCircle size={14} style={{ marginRight: '6px' }} />
                        Reconcile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconciliationPage;
