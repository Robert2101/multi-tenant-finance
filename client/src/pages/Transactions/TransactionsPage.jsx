import { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const PER_PAGE = 15;


const CATEGORIES = ['Sales', 'Consulting', 'Rent', 'Software', 'Utilities', 'Salaries', 'Marketing', 'Travel', 'Other'];

const formatCurrency = (val, currency = 'USD') =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format(val || 0);

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const Modal = ({ isOpen, onClose, onSave, editTx }) => {
  const [form, setForm] = useState({
    type: 'income', amount: '', category: 'Sales', description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editTx) {
      setForm({
        type: editTx.type, amount: editTx.amount, category: editTx.category,
        description: editTx.description || '',
        date: new Date(editTx.date).toISOString().split('T')[0],
      });
    } else {
      setForm({ type: 'income', amount: '', category: 'Sales', description: '', date: new Date().toISOString().split('T')[0] });
    }
    setError('');
  }, [editTx, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editTx) {
        await api.put(`/transactions/${editTx._id}`, form);
      } else {
        await api.post('/transactions', form);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '32px', margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.3rem' }}>{editTx ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>&times;</button>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['income', 'expense'].map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                style={{ flex: 1, padding: '10px', border: '2px solid', borderColor: form.type === t ? (t === 'income' ? 'var(--success)' : 'var(--danger)') : 'var(--border-color)', background: form.type === t ? (t === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent', color: form.type === t ? (t === 'income' ? 'var(--success)' : 'var(--danger)') : 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize' }}>
                {t === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Amount ($)</label>
            <input type="number" min="0.01" step="0.01" required style={inputStyle} placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Category</label>
            <select required style={{ ...inputStyle, appearance: 'none' }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Description (optional)</label>
            <input type="text" style={inputStyle} placeholder="e.g. Stripe payout for March" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Date</label>
            <input type="date" required style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <button type="submit" disabled={saving}
            style={{ padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '8px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : editTx ? 'Update Transaction' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

const TransactionsPage = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  const isViewer = user?.role === 'Viewer';

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = transactions.filter((tx) => {
    const matchType = filterType === 'all' || tx.type === filterType;
    const matchSearch = !search || (tx.description?.toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="animate-fade-in">
      {/* Page header — NOT sticky, stays at top naturally */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Transactions</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage all income and expense records for this workspace.</p>
        </div>
        {!isViewer && (
          <button onClick={() => { setEditTx(null); setModalOpen(true); }}
            style={{ padding: '10px 20px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}>
            Add Transaction
          </button>
        )}
      </div>

      {/* Search + filter bar — sticky so it stays visible while scrolling the table */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-primary)', paddingBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '8px 14px', flex: 1, minWidth: '200px', border: '1px solid var(--border-color)' }}>
            <span style={{color: 'var(--text-muted)'}}>Search</span>
            <input type="text" placeholder="Search by description or category..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '8px'}}>Filter:</span>
            {['all', 'income', 'expense'].map((t) => (
              <button key={t} onClick={() => { setFilterType(t); setPage(1); }}
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: filterType === t ? 'none' : '1px solid var(--border-color)', background: filterType === t ? 'var(--accent-primary)' : 'transparent', color: filterType === t ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500', textTransform: 'capitalize', fontSize: '0.85rem' }}>{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ overflow: 'hidden', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {transactions.length === 0 ? 'No transactions yet. Add your first one!' : 'No transactions match your filter.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Date', 'Type', 'Category', 'Description', 'Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((tx) => (
                  <tr key={tx._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', fontSize: '0.9rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '600', background: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', textTransform: 'capitalize' }}>{tx.type}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{tx.category}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.9rem' }}>{tx.description || '—'}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.category === 'Bank Import' ? 'INR' : 'USD')}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '600', background: tx.status === 'reconciled' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: tx.status === 'reconciled' ? 'var(--success)' : '#f59e0b' }}>{tx.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {!isViewer ? (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={() => { setEditTx(tx); setModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Edit</button>
                          <button onClick={() => handleDelete(tx._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: '500' }}>Delete</button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px', padding: '16px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
            Previous
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} total</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '8px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
            Next
          </button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={fetchTransactions} editTx={editTx} />
    </div>
  );
};

export default TransactionsPage;
