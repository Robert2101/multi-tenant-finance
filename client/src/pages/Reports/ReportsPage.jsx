import { useState } from 'react';
import { FileBarChart, Download, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import api from '../../services/api';

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (val, currency = 'USD') =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(val || 0);

const ReportsPage = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const res = await api.get('/transactions');
      
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000; // include end day

      const inRange = res.data.filter(tx => {
        const txTime = new Date(tx.date).getTime();
        return txTime >= start && txTime < end;
      });

      const reconciled = inRange.filter(tx => tx.status === 'reconciled');
      const pendingCount = inRange.length - reconciled.length;

      const indianTx = reconciled.filter(tx => tx.category === 'Bank Import');
      const plaidTx  = reconciled.filter(tx => tx.category !== 'Bank Import');

      let inrInc = 0, inrExp = 0, usdInc = 0, usdExp = 0;
      indianTx.forEach(tx => tx.type === 'income' ? inrInc += tx.amount : inrExp += tx.amount);
      plaidTx.forEach(tx => tx.type === 'income' ? usdInc += tx.amount : usdExp += tx.amount);

      const inMap = {}, exMap = {};
      reconciled.forEach(tx => {
        const amt = tx.amount;
        const cur = tx.category === 'Bank Import' ? 'INR' : 'USD';
        if (tx.type === 'income') {
          if (!inMap[tx.category]) inMap[tx.category] = { category: tx.category, INR: 0, USD: 0 };
          inMap[tx.category][cur] += amt;
        } else {
          if (!exMap[tx.category]) exMap[tx.category] = { category: tx.category, INR: 0, USD: 0 };
          exMap[tx.category][cur] += amt;
        }
      });

      setReportData({
        inrInc, inrExp, inrNet: inrInc - inrExp,
        usdInc, usdExp, usdNet: usdInc - usdExp,
        inMap: Object.values(inMap).sort((a, b) => (b.INR + b.USD) - (a.INR + a.USD)),
        exMap: Object.values(exMap).sort((a, b) => (b.INR + b.USD) - (a.INR + a.USD)),
        pendingCount,
        totalTxs: reconciled.length
      });

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

  const inputStyle = {
    padding: '10px 14px', background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none',
  };

  const renderMulti = (inr, usd, colPos, colNeg) => {
    if (inr === 0 && usd === 0) return <span style={{ color: colPos || 'inherit' }}>{fmt(0, 'USD')}</span>;
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        {inr !== 0 && <span style={{ color: inr >= 0 ? colPos : colNeg }}>{fmt(inr, 'INR')}</span>}
        {usd !== 0 && <span style={{ color: usd >= 0 ? colPos : colNeg, fontSize: inr !== 0 ? '0.7em' : '1em', opacity: inr !== 0 ? 0.8 : 1 }}>{fmt(usd, 'USD')}</span>}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '4px' }}>Financial Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Generate Profit & Loss statements and export compliance-ready CSVs.</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight:'600' }}>Start Date</label>
          <input type="date" style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight:'600' }}>End Date</label>
          <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={generateReport} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
          <FileBarChart size={18} />
          {loading ? 'Generating...' : 'Generate P&L Report'}
        </button>

        {reportData && (
          <button onClick={handleExport} disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: exporting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: exporting ? 0.7 : 1 }}>
            <Download size={18} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '14px 20px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {reportData && (
        <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
          
          {reportData.pendingCount > 0 && (
            <div style={{ padding:'12px 16px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:'12px', fontSize:'0.9rem', fontWeight:'500' }}>
              <AlertCircle size={18} />
              There are {reportData.pendingCount} pending transactions in this period. Reconcile them for a complete report.
            </div>
          )}

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '24px', background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', borderTop: '3px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={18} color="#10b981" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Income</p>
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>
                {renderMulti(reportData.inrInc, reportData.usdInc, '#10b981', '#10b981')}
              </h3>
            </div>
            
            <div style={{ padding: '24px', background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', borderTop: '3px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingDown size={18} color="#ef4444" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Expenses</p>
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>
                {renderMulti(reportData.inrExp, reportData.usdExp, '#ef4444', '#ef4444')}
              </h3>
            </div>
            
            <div style={{ padding: '24px', background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', borderTop: `3px solid ${(reportData.inrNet >= 0 && reportData.usdNet >= 0) ? '#10b981' : '#ef4444'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <DollarSign size={18} color={(reportData.inrNet >= 0 && reportData.usdNet >= 0) ? '#10b981' : '#ef4444'} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em' }}>Net Profit</p>
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>
                {renderMulti(reportData.inrNet, reportData.usdNet, '#10b981', '#ef4444')}
              </h3>
            </div>
          </div>

          {/* Breakdown Tables */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            
            {/* Income Table */}
            <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'24px' }}>
              <h3 style={{ marginBottom:'20px', fontSize:'1.1rem', fontWeight:'700', color:'#10b981' }}>Income Breakdown</h3>
              {reportData.inMap.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 0', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Category</th>
                      <th style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.inMap.map((row) => (
                      <tr key={row.category} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 0', fontSize:'0.9rem', fontWeight:'500', color:'var(--text-secondary)' }}>{row.category}</td>
                        <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: '700' }}>
                          {renderMulti(row.INR, row.USD, '#10b981', '#10b981')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', textAlign:'center', padding:'40px 0' }}>No income recorded in this period.</p>
              )}
            </div>

            {/* Expense Table */}
            <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'var(--radius-md)', padding:'24px' }}>
              <h3 style={{ marginBottom:'20px', fontSize:'1.1rem', fontWeight:'700', color:'#ef4444' }}>Expense Breakdown</h3>
              {reportData.exMap.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 0', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Category</th>
                      <th style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.exMap.map((row) => (
                      <tr key={row.category} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 0', fontSize:'0.9rem', fontWeight:'500', color:'var(--text-secondary)' }}>{row.category}</td>
                        <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: '700' }}>
                          {renderMulti(row.INR, row.USD, '#ef4444', '#ef4444')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', textAlign:'center', padding:'40px 0' }}>No expenses recorded in this period.</p>
              )}
            </div>

          </div>

        </div>
      )}

      {!reportData && !loading && !error && (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', background:'var(--bg-secondary)', border:'1px dashed var(--border-color)', borderRadius:'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <FileBarChart size={48} opacity={0.3} />
          <p style={{ fontSize: '1rem', fontWeight:'500' }}>Select a date range and click "Generate P&L Report"</p>
          <p style={{ fontSize: '0.85rem' }}>Reports are compiled instantly from your reconciled transactions.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
