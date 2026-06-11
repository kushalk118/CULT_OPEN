import React, { useState, useEffect } from 'react';

export default function HealthTracking({ user }) {
  const [assets, setAssets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reportForm, setReportForm] = useState({
    asset_id: '',
    condition: 'damaged',
    issue_description: ''
  });

  useEffect(() => {
    fetchHealthData();
  }, [user]);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://cult-open.onrender.com/api/health', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch health report details');
      const data = await res.json();
      setAssets(data.assets || []);
      setLogs(data.logs || []);

      const activeAssets = (data.assets || []).filter(a => a.status === 'active');
      if (activeAssets.length > 0) {
        setReportForm(prev => ({ ...prev, asset_id: activeAssets[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Error loading health data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportDamage = async (e) => {
    e.preventDefault();
    if (!reportForm.asset_id || !reportForm.issue_description) {
      setError('Please select an asset and write an issue description.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://cult-open.onrender.com/api/health/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');

      setSuccess('Damage report submitted and asset set to maintenance!');
      setReportForm(prev => ({ ...prev, issue_description: '' }));
      fetchHealthData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolveMaintenance = async (logId, restoreCondition) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://cult-open.onrender.com/api/health/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ log_id: logId, condition: restoreCondition })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve maintenance');

      setSuccess(`Maintenance resolved! Asset restored as ${restoreCondition}.`);
      fetchHealthData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Report Asset Damage / Fault</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Encountered a malfunction during rehearsals or shoot? Flag it here to notify admins and restrict further checkouts.
          </p>

          {success && <div className="success-banner">{success}</div>}
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleReportDamage}>
            <div className="form-group">
              <label className="form-label">Select Resource</label>
              <select
                className="form-select"
                value={reportForm.asset_id}
                onChange={(e) => setReportForm({ ...reportForm, asset_id: e.target.value })}
                required
              >
                <option value="">Choose Asset...</option>
                {assets.filter(a => a.status === 'active').map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Evaluate Malfunction State</label>
              <select
                className="form-select"
                value={reportForm.condition}
                onChange={(e) => setReportForm({ ...reportForm, condition: e.target.value })}
              >
                <option value="damaged">Damaged (Requires technical repairs)</option>
                <option value="fair">Fair (Usable with constraints)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fault Specifications & Observations</label>
              <textarea
                className="form-input form-textarea"
                rows="4"
                placeholder="State specific issues e.g. DSLR autofocus lens jamming, PA speaker buzzing, prop cracks..."
                value={reportForm.issue_description}
                onChange={(e) => setReportForm({ ...reportForm, issue_description: e.target.value })}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={loading}>
              File Report
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Equipment Status Summary</h3>
          {loading ? (
            <div className="notif-empty">Fetching condition reports...</div>
          ) : assets.length === 0 ? (
            <div className="notif-empty">No catalog items.</div>
          ) : (
            <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Condition</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: '500' }}>{a.name}</td>
                      <td>
                        <span className={`badge ${
                          a.condition === 'excellent' ? 'badge-success' :
                          a.condition === 'good' ? 'badge-info' : 'badge-danger'
                        }`}>
                          {a.condition}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Maintenance Registry & Resolving</h3>
        {loading ? (
          <div className="notif-empty">Fetching logs...</div>
        ) : logs.length === 0 ? (
          <div className="notif-empty">No logged repair cycles in the history.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '680px', overflowY: 'auto' }}>
            {logs.map((log) => (
              <div key={log.id} className="glass-panel" style={{ padding: '1.25rem', borderLeft: log.status === 'pending' ? '4px solid var(--warning)' : '4px solid var(--success)', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{log.asset_name}</span>
                  <span className={`badge ${log.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                    {log.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <strong>Problem:</strong> "{log.issue_description}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Reported by: {log.reported_by_name}</span>
                  <span>{log.created_at.substring(0, 16)}</span>
                </div>

                {log.status === 'pending' && user.role === 'admin' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleResolveMaintenance(log.id, 'good')}>
                      Resolve as Good
                    </button>
                    <button className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleResolveMaintenance(log.id, 'excellent')}>
                      Resolve as Excellent
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
