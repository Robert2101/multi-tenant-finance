import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import api from '../../services/api';

const PER_PAGE = 10;


const formatCurrency = (val, currency = 'USD') =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format(val || 0);

const ReconciliationPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [reconciling, setReconciling] = useState(null);
  const [isAutoReconciling, setIsAutoReconciling] = useState(false);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);


  
  // Plaid & Connection state
  const [linkToken, setLinkToken] = useState(null);
  const [isPlaidLoading, setIsPlaidLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, bankName: '' });
  const [hasPendingSetuConsent, setHasPendingSetuConsent] = useState(false);
  const [isSetuFetching, setIsSetuFetching] = useState(false);

  const handleConnectIndianBank = async () => {
    try {
        const res = await api.post('/reconciliation/setu/consent');
        localStorage.setItem('setuConsentId', res.data.consentId);
        setHasPendingSetuConsent(true);
        window.location.href = res.data.url;
    } catch (error) {
        console.error('FRONTEND SETU ERROR:', error.response?.data || error);
        alert(`Failed to start Indian Bank sync: ${error.response?.data?.error || 'Server error'}`);
    }
  };

  // Manual trigger — works even if redirect dropped the query params
  const handleCompleteSetuImport = async () => {
    const consentId = localStorage.getItem('setuConsentId');
    if (!consentId) {
      alert('No pending Indian Bank consent found. Please click Connect Indian Bank first.');
      return;
    }
    setIsSetuFetching(true);
    setResult(null);
    try {
      const res = await api.post('/reconciliation/setu/fetch', { consentId });
      setResult({ type: 'success', message: res.data.message || 'Successfully imported Indian Bank data!' });
      localStorage.removeItem('setuConsentId');
      setHasPendingSetuConsent(false);
      fetchData();
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Failed to fetch Setu data' });
    } finally {
      setIsSetuFetching(false);
    }
  };


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Transactions
      const txRes = await api.get('/transactions');
      setPending(txRes.data.filter((tx) => tx.status === 'pending'));
      setPage(1);


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

  // Check localStorage for a pending consent on every page load
  useEffect(() => {
    const saved = localStorage.getItem('setuConsentId');
    if (saved) setHasPendingSetuConsent(true);
  }, []);

  const setuFetchedRef = React.useRef(false);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('setu') === 'success' && !setuFetchedRef.current) {
      setuFetchedRef.current = true; // Prevent duplicate calls
      const fetchSetu = async () => {
        try {
          const consentId = urlParams.get('id') || localStorage.getItem('setuConsentId');
          console.log('FRONTEND: Calling setu/fetch with consentId:', consentId);
          const result = await api.post('/reconciliation/setu/fetch', { consentId });
          console.log('FRONTEND: Setu fetch result:', result.data);
          setResult({ type: 'success', message: result.data.message || 'Successfully imported Indian Bank data!' });
          localStorage.removeItem('setuConsentId'); // Clean up
          fetchData();
        } catch (err) {
          console.error('FRONTEND SETU FETCH ERROR:', err.response?.data || err);
          setResult({ type: 'error', message: err.response?.data?.error || 'Failed to fetch Setu data' });
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      fetchSetu();
    }
  }, [fetchData]);

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

  const handleAutoReconcile = async () => {
    setIsAutoReconciling(true);
    setResult(null);
    try {
      const res = await api.post('/reconciliation/auto-reconcile');
      setResult({ type: 'success', message: res.data.message });
      fetchData();
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Auto-reconciliation failed' });
    } finally {
      setIsAutoReconciling(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Reconciliation</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Connect your real bank or simulate records to match transactions.</p>
      </div>

      {/* Connection Status Banner */}
      <div style={{ padding: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: connectionStatus.connected ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                    className="button-primary" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}>
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
                {simulating ? 'Syncing...' : 'Sync Real Transactions'}
            </button>
            <button onClick={handleConnectIndianBank} className="button-primary" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}>
                Connect Indian Bank (UPI/Netbanking)
            </button>
            {hasPendingSetuConsent && (
                <button onClick={handleCompleteSetuImport} disabled={isSetuFetching}
                    style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #f97316, #ef4444)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '700', animation: 'pulse 2s infinite', boxShadow: '0 0 12px rgba(249,115,22,0.5)' }}>
                    {isSetuFetching ? '⏳ Importing Data...' : '✅ Complete Indian Bank Import'}
                </button>
            )}
        </div>
      </div>

      {/* Result Alert */}
      {result && (
        <div style={{ padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: result.type === 'success' ? 'var(--success)' : 'var(--danger)', borderLeft: `4px solid ${result.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, background: 'var(--bg-secondary)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
          <span style={{ fontWeight: '500' }}>{result.message}</span>
          <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
        </div>
      )}

      {/* Simulation Fallback */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span>Don't have a real bank?</span>
              <button onClick={handleSimulate} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: '0.9rem', textDecoration: 'underline' }}>Simulate bank feed</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleAutoReconcile} disabled={isAutoReconciling || pending.length === 0}
              title="Matches bank imports against manually entered transactions by amount and date"
              style={{ padding: '10px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: pending.length === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: pending.length === 0 ? 0.5 : 1 }}>
              {isAutoReconciling ? 'Matching...' : 'Auto Reconcile'}
            </button>
            <button onClick={handleReconcileAll} disabled={reconciling === 'all' || pending.length === 0}
              style={{ padding: '10px 20px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}>
              Reconcile All ({pending.length})
            </button>
          </div>

      </div>

      {/* Pending Table */}
      <div style={{ overflow: 'hidden', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pending Bank Records</h3>
          <span style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
            {pending.length} Items Total
          </span>
        </div>
        
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Fetching latest records...</p>
          </div>
        ) : pending.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
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
                {pending.slice((page-1)*PER_PAGE, page*PER_PAGE).map((tx) => (
                  <tr key={tx._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: '700', background: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>{tx.type}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{tx.category}</td>
                    <td style={{ padding: '16px 20px', fontSize: '0.9rem' }}>{tx.description || '—'}</td>
                    <td style={{ padding: '16px 20px', fontWeight: '700', fontSize: '1rem', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.category === 'Bank Import' ? 'INR' : 'USD')}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button onClick={() => handleReconcileOne(tx._id)} disabled={reconciling === tx._id}
                        style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>
                        Reconcile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pending.length > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '20px', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '8px 18px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Page {page} of {Math.ceil(pending.length / PER_PAGE)} &nbsp;·&nbsp; {pending.length} pending
            </span>
            <button onClick={() => setPage(p => Math.min(Math.ceil(pending.length / PER_PAGE), p + 1))} disabled={page === Math.ceil(pending.length / PER_PAGE)}
              style={{ padding: '8px 18px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: page === Math.ceil(pending.length / PER_PAGE) ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === Math.ceil(pending.length / PER_PAGE) ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconciliationPage;
