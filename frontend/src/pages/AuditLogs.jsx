import React, { useState, useEffect } from 'react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://cult-open.onrender.com/api/audit/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch system audit logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message || 'Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.user_email && log.user_email.toLowerCase().includes(term)) ||
      (log.user_name && log.user_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>System Integrity Audit Logs</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Chronological record of critical transactions, inventory updates, system logins, and booking approvals.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ marginBottom: '1.5rem', maxWidth: '350px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Filter logs by action, user or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="notif-empty">Fetching system registry logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="notif-empty">No matching audit logs found.</div>
      ) : (
        <div className="table-container">
          <table className="app-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Operator User</th>
                <th>Operation Action</th>
                <th>Details Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>#{log.id}</td>
                  <td>
                    {log.user_id ? (
                      <>
                        <div style={{ fontWeight: '600' }}>{log.user_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user_email} ({log.user_role})</div>
                      </>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>System / Guest</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      log.action.includes('CREATED') || log.action.includes('REGISTERED') ? 'badge-success' :
                      log.action.includes('UPDATED') || log.action.includes('ISSUED') ? 'badge-info' :
                      log.action.includes('DELETED') || log.action.includes('REJECTED') ? 'badge-danger' : 'badge-warning'
                    }`} style={{ fontSize: '0.725rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ maxWidth: '280px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                    {log.details}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{log.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
