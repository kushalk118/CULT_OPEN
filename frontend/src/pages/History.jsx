import React, { useState, useEffect } from 'react';

export default function History({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://cult-open.onrender.com/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch borrowing history');
      const data = await res.json();
      
      const historyData = data.filter(b => ['returned', 'rejected'].includes(b.status));
      setHistory(historyData);
    } catch (err) {
      setError(err.message || 'Error loading history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>
        {user.role === 'admin' ? 'Global Historical Allocations Log' : 'Your Borrowing History'}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Chronological audit record of completed returns and rejected resource requests.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="notif-empty">Fetching history archives...</div>
      ) : history.length === 0 ? (
        <div className="notif-empty">No archived bookings or transactions found.</div>
      ) : (
        <div className="table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                {user.role === 'admin' && <th>User</th>}
                <th>Resource Name</th>
                <th>Quantity</th>
                <th>Requested Range</th>
                <th>Issue Date</th>
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>#{h.id}</td>
                  {user.role === 'admin' && (
                    <td>
                      <div style={{ fontWeight: '600' }}>{h.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.user_email}</div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: '600' }}>{h.asset_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.asset_category}</div>
                  </td>
                  <td>{h.quantity}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>S: {h.start_date}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>E: {h.end_date}</div>
                  </td>
                  <td>{h.issued_at || '-'}</td>
                  <td>{h.returned_at || '-'}</td>
                  <td>
                    <span className={`badge ${h.status === 'returned' ? 'badge-success' : 'badge-danger'}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
