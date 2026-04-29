import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const fmt = (val, cur = 'USD') =>
  new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency', currency: cur, maximumFractionDigits: 0,
  }).format(val || 0);

const shortNum = (v) =>
  v >= 1e7 ? `${(v/1e7).toFixed(1)}Cr`
  : v >= 1e5 ? `${(v/1e5).toFixed(1)}L`
  : v >= 1000 ? `${(v/1000).toFixed(0)}k`
  : String(v);

const CAT_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#ef4444'];

const Skeleton = ({ h = '32px', w = '100%' }) => (
  <div style={{ width: w, height: h, borderRadius: '6px', background: 'var(--bg-tertiary)', animation: 'pulse 1.5s infinite' }} />
);

const TipBox = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'8px', padding:'12px 16px' }}>
      <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', fontWeight:'700', marginBottom:'8px', textTransform:'uppercase' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight:'700', fontSize:'0.9rem' }}>
          {p.name}: {currency === 'INR' ? '₹' : '$'}{shortNum(p.value)}
        </p>
      ))}
    </div>
  );
};

const DonutTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-color)', borderRadius:'8px', padding:'10px 14px' }}>
      <p style={{ fontWeight:'700' }}>{payload[0].name}</p>
      <p style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{shortNum(payload[0].value)}</p>
    </div>
  );
};

const buildMonthly = (txList) => {
  const map = {};
  txList.forEach(tx => {
    const m = new Date(tx.date).toLocaleString('default', { month:'short', year:'2-digit' });
    if (!map[m]) map[m] = { month: m, Income: 0, Expenses: 0 };
    if (tx.type === 'income') map[m].Income += tx.amount;
    else map[m].Expenses += tx.amount;
  });
  return Object.values(map).slice(-6);
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [allTx, setAllTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          api.get('/reports/dashboard-summary'),
          api.get('/transactions'),
        ]);
        setSummary(sRes.data);
        setAllTx(tRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const indianTx = allTx.filter(tx => tx.category === 'Bank Import');
  const plaidTx  = allTx.filter(tx => tx.category !== 'Bank Import');

  let inrInc = 0, inrExp = 0, usdInc = 0, usdExp = 0;
  indianTx.forEach(tx => tx.type === 'income' ? inrInc += tx.amount : inrExp += tx.amount);
  plaidTx.forEach(tx => tx.type === 'income' ? usdInc += tx.amount : usdExp += tx.amount);
  const inrNet = inrInc - inrExp;
  const usdNet = usdInc - usdExp;

  const renderMulti = (inr, usd, colPos, colNeg) => {
    if (inr === 0 && usd === 0) return <span style={{ color: colPos }}>{fmt(0, 'USD')}</span>;
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        {inr !== 0 && <span style={{ color: inr >= 0 ? colPos : colNeg }}>{fmt(inr, 'INR')}</span>}
        {usd !== 0 && <span style={{ color: usd >= 0 ? colPos : colNeg, fontSize: inr !== 0 ? '0.7em' : '1em', opacity: inr !== 0 ? 0.8 : 1 }}>{fmt(usd, 'USD')}</span>}
      </div>
    );
  };

  const indianChart = buildMonthly(indianTx);
  const plaidChart  = buildMonthly(plaidTx);

  const catMap = {};
  allTx.filter(tx => tx.type === 'expense').forEach(tx => {
    catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
  });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 7);
  const catTotal = catData.reduce((s, c) => s + c.value, 0);

  const recentTx = allTx.slice(0, 8);
  const reconRate = summary?.totalTransactions
    ? Math.round((summary.reconciledCount / summary.totalTransactions) * 100) : 0;
  const net = summary?.netProfit || 0;

  const card = {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
  };

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {/* ── Top: greeting + quick links ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:'4px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
          <h1 style={{ fontSize:'1.7rem', fontWeight:'700' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Link to="/dashboard/reconciliation" style={{ padding:'8px 16px', fontSize:'0.85rem', fontWeight:'600', borderRadius:'var(--radius-md)', background:'var(--accent-primary)', color:'white', textDecoration:'none' }}>
            Reconcile
          </Link>
          <Link to="/dashboard/reports" style={{ padding:'8px 16px', fontSize:'0.85rem', fontWeight:'600', borderRadius:'var(--radius-md)', background:'var(--bg-secondary)', color:'var(--text-primary)', border:'1px solid var(--border-color)', textDecoration:'none' }}>
            Reports
          </Link>
        </div>
      </div>

      {/* ── Hero + 4 stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', gap:'16px' }}>
        {/* Hero net profit */}
        <div style={{ ...card, gridColumn:'1 / 3', padding:'28px', background: 'var(--bg-secondary)' }}>
          <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px' }}>Net Profit / Loss</p>
          {loading ? <Skeleton h="48px" /> : (
            <h2 style={{ fontSize:'2.4rem', fontWeight:'800', lineHeight:1 }}>
              {renderMulti(inrNet, usdNet, '#10b981', '#ef4444')}
            </h2>
          )}
          {!loading && <p style={{ marginTop:'10px', fontSize:'0.82rem', color:'var(--text-muted)' }}>
            {reconRate}% of {summary?.totalTransactions} transactions reconciled
          </p>}
        </div>

        {/* Revenue */}
        <div style={{ ...card, padding:'20px 22px' }}>
          <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Total Revenue</p>
          {loading ? <Skeleton h="28px" /> : <div style={{ fontSize:'1.5rem', fontWeight:'700' }}>{renderMulti(inrInc, usdInc, '#10b981', '#10b981')}</div>}
          {!loading && <p style={{ marginTop:'6px', fontSize:'0.78rem', color:'var(--text-muted)' }}>All-time income</p>}
        </div>

        {/* Expenses */}
        <div style={{ ...card, padding:'20px 22px' }}>
          <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Total Expenses</p>
          {loading ? <Skeleton h="28px" /> : <div style={{ fontSize:'1.5rem', fontWeight:'700' }}>{renderMulti(inrExp, usdExp, '#ef4444', '#ef4444')}</div>}
          {!loading && <p style={{ marginTop:'6px', fontSize:'0.78rem', color:'var(--text-muted)' }}>{summary?.pendingCount} pending</p>}
        </div>

        {/* Pending */}
        <div style={{ ...card, padding:'20px 22px' }}>
          <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Pending Review</p>
          {loading ? <Skeleton h="28px" /> : <p style={{ fontSize:'1.5rem', fontWeight:'700', color:'#f59e0b' }}>{summary?.pendingCount ?? '—'}</p>}
          {!loading && (
            <div style={{ marginTop:'8px', height:'4px', borderRadius:'2px', background:'var(--bg-tertiary)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${100 - reconRate}%`, background:'#f59e0b', borderRadius:'2px', transition:'width 0.6s ease' }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Two separate charts: Plaid USD + Indian INR ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>

        {/* Plaid USD Bar Chart */}
        <div style={{ ...card, padding:'24px' }}>
          <div style={{ marginBottom:'16px' }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:'700' }}>Plaid — USD Cash Flow</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', marginTop:'2px' }}>US bank transactions (last 6 months)</p>
          </div>
          {loading ? <Skeleton h="220px" /> : plaidChart.length === 0 ? (
            <div style={{ height:'220px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'0.88rem' }}>
              No Plaid data. Connect a US bank to see this chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={plaidChart} margin={{ top:5, right:5, left:0, bottom:0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${shortNum(v)}`} />
                <Tooltip content={<TipBox currency="USD" />} />
                <Legend wrapperStyle={{ fontSize:'0.8rem' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
                <Bar dataKey="Expenses" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Indian Bank INR Area Chart */}
        <div style={{ ...card, padding:'24px' }}>
          <div style={{ marginBottom:'16px' }}>
            <h3 style={{ fontSize:'0.95rem', fontWeight:'700' }}>Indian Bank — INR Cash Flow</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', marginTop:'2px' }}>Setu AA transactions (last 6 months)</p>
          </div>
          {loading ? <Skeleton h="220px" /> : indianChart.length === 0 ? (
            <div style={{ height:'220px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'0.88rem' }}>
              No Indian Bank data. Connect via Setu to see this chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={indianChart} margin={{ top:5, right:5, left:0, bottom:0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${shortNum(v)}`} />
                <Tooltip content={<TipBox currency="INR" />} />
                <Legend wrapperStyle={{ fontSize:'0.8rem' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
                <Bar dataKey="Expenses" fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom: Expense Donut + Recent Transactions ── */}
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'24px' }}>

        {/* Expense Breakdown */}
        <div style={{ ...card, padding:'24px' }}>
          <h3 style={{ fontSize:'0.95rem', fontWeight:'700', marginBottom:'4px' }}>Expenses by Category</h3>
          <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', marginBottom:'16px' }}>All-time breakdown</p>

          {loading ? <Skeleton h="160px" /> : catData.length === 0 ? (
            <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'0.88rem' }}>No expenses yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} paddingAngle={3} dataKey="value">
                    {catData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<DonutTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginTop:'12px' }}>
                {catData.map((item, i) => (
                  <div key={item.name} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: CAT_COLORS[i % CAT_COLORS.length], flexShrink:0 }} />
                    <span style={{ flex:1, fontSize:'0.8rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</span>
                    <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:'700' }}>
                      {Math.round((item.value / catTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Transactions */}
        <div style={{ ...card, padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div>
              <h3 style={{ fontSize:'0.95rem', fontWeight:'700' }}>Recent Transactions</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', marginTop:'2px' }}>Latest 8 entries across all sources</p>
            </div>
            <Link to="/dashboard/transactions" style={{ fontSize:'0.82rem', color:'var(--accent-primary)', textDecoration:'none', fontWeight:'600' }}>View all</Link>
          </div>

          {loading ? Array.from({length:5}).map((_,i) => (
            <div key={i} style={{ marginBottom:'10px' }}><Skeleton h="42px" /></div>
          )) : recentTx.length === 0 ? (
            <div style={{ color:'var(--text-muted)', textAlign:'center', padding:'40px 0', fontSize:'0.9rem' }}>No transactions yet</div>
          ) : (
            <div>
              {recentTx.map((tx, i) => {
                const isINR = tx.category === 'Bank Import';
                return (
                  <div key={tx._id} style={{
                    display:'flex', alignItems:'center', gap:'14px',
                    padding:'10px 0',
                    borderBottom: i < recentTx.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}>
                    <div style={{
                      width:'34px', height:'34px', borderRadius:'8px', flexShrink:0,
                      background: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.68rem', fontWeight:'800',
                      color: tx.type === 'income' ? '#10b981' : '#6366f1',
                    }}>
                      {isINR ? '₹' : '$'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:'600', fontSize:'0.87rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {tx.description || tx.category}
                      </p>
                      <p style={{ fontSize:'0.74rem', color:'var(--text-muted)', marginTop:'2px' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN')} · {tx.category}
                      </p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ fontWeight:'700', fontSize:'0.9rem', color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, isINR ? 'INR' : 'USD')}
                      </p>
                      <span style={{
                        fontSize:'0.68rem', padding:'2px 7px', borderRadius:'20px', fontWeight:'600',
                        background: tx.status === 'reconciled' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: tx.status === 'reconciled' ? '#10b981' : '#f59e0b',
                      }}>{tx.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
