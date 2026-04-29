import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../services/api';

const StatCard = ({ title, value, trend, isPositive, loading }) => (
  <div style={{ padding: '24px', flex: 1, minWidth: '240px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>{title}</p>
        {loading ? (
          <div style={{ width: '140px', height: '32px', background: 'var(--bg-tertiary)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <h3 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</h3>
        )}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
      {!loading && (
        <>
          <span style={{ 
            color: isPositive ? 'var(--success)' : 'var(--danger)',
            fontWeight: '600'
          }}>
            {isPositive ? '+' : '-'}{trend}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>reconciled transactions</span>
        </>
      )}
    </div>
  </div>
);

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px 16px'
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color, fontWeight: '600' }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [summaryRes, txRes] = await Promise.all([
          api.get('/reports/dashboard-summary'),
          api.get('/transactions'),
        ]);
        setSummary(summaryRes.data);
        setRecentTx(txRes.data.slice(0, 5));

        // Build monthly chart data from transactions
        const monthMap = {};
        txRes.data.forEach((tx) => {
          const month = new Date(tx.date).toLocaleString('default', { month: 'short', year: '2-digit' });
          if (!monthMap[month]) monthMap[month] = { month, Income: 0, Expenses: 0 };
          if (tx.type === 'income') monthMap[month].Income += tx.amount;
          else monthMap[month].Expenses += tx.amount;
        });
        setChartData(Object.values(monthMap).slice(-6));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Financial Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Here's what's happening with your workspace today.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary?.totalIncome)}
          trend={`${summary?.reconciledCount || 0}`}
          isPositive={true}
          loading={loading}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalExpense)}
          trend={`${summary?.pendingCount || 0}`}
          isPositive={false}
          loading={loading}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(summary?.netProfit)}
          trend={summary?.netProfit >= 0 ? 'Positive' : 'Negative'}
          isPositive={(summary?.netProfit || 0) >= 0}
          loading={loading}
        />
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Chart */}
        <div style={{ flex: 2, minWidth: '400px', height: '400px', padding: '24px', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Cash Flow Overview</h3>
          {chartData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '8px' }}>
              <p>Add transactions to see your cash flow chart</p>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Area type="monotone" dataKey="Income" stroke="#2563eb" strokeWidth={2} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Expenses" stroke="#dc2626" strokeWidth={2} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div style={{ flex: 1, minWidth: '300px', padding: '24px', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Transactions</h3>
            <a href="/dashboard/transactions" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'none' }}>View All</a>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: '52px', background: 'var(--bg-tertiary)', borderRadius: '6px', marginBottom: '12px' }} />
            ))
          ) : recentTx.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              No transactions yet.<br />Add your first transaction!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentTx.map((tx) => (
                <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '0.9rem' }}>{tx.description || tx.category}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.date).toLocaleDateString()} · {tx.category}
                    </p>
                  </div>
                  <div style={{ fontWeight: '600', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
