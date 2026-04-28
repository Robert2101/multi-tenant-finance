import { useState } from 'react';
import { FileBarChart, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import api from '../../services/api';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const ReportsPage = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const inputStyle = {
    padding: '10px 14px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
  };

  const generateReport = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const res = await api.get(`/reports/pnl?startDate=${startDate}&endDate=${endDate}`);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/reports/export/csv?startDate=${startDate}&endDate=${endDate}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pnl-report-${startDate}-to-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || 'Export failed. Ensure reconciled transactions exist for this period.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Financial Reports</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Generate Profit & Loss statements and export compliance-ready reports.</p>
      </div>

      {/* Controls */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Start Date</label>
          <input type="date" style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>End Date</label>
          <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={generateReport} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
          <FileBarChart size={18} />
          {loading ? 'Generating...' : 'Generate P&L Report'}
        </button>

        {report && (
          <button onClick={handleExport} disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: exporting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: exporting ? 0.7 : 1 }}>
            <Download size={18} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '14px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {report && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <div className="glass-panel" style={{ flex: 1, minWidth: '200px', padding: '28px', borderTop: '3px solid var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <TrendingUp size={20} color="var(--success)" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Income</p>
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(report.totalCredit)}</h3>
            </div>
            <div className="glass-panel" style={{ flex: 1, minWidth: '200px', padding: '28px', borderTop: '3px solid var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <TrendingDown size={20} color="var(--danger)" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Expenses</p>
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>{formatCurrency(report.totalDebit)}</h3>
            </div>
            <div className="glass-panel" style={{ flex: 1, minWidth: '200px', padding: '28px', borderTop: `3px solid ${report.NetProfit >= 0 ? 'var(--accent-primary)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <DollarSign size={20} color="var(--accent-primary)" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Net Profit</p>
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', color: report.NetProfit >= 0 ? 'var(--accent-primary)' : 'var(--danger)' }}>{formatCurrency(report.NetProfit)}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Breakdown by Category</h3>
            {report.breakdown && report.breakdown.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', textTransform: 'capitalize', fontWeight: '500' }}>{item._id}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: item._id === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No reconciled transactions found for this period. Reconcile transactions first.
              </p>
            )}
          </div>
        </div>
      )}

      {!report && !loading && !error && (
        <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <FileBarChart size={60} opacity={0.2} />
          <p style={{ fontSize: '1.1rem' }}>Select a date range and click "Generate P&L Report"</p>
          <p style={{ fontSize: '0.9rem' }}>Reports are based on reconciled transactions only.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
