import React, { useState, useEffect } from 'react';

export default function Bookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // QR Simulator state
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [scannedAssetBookings, setScannedAssetBookings] = useState([]);
  const [qrError, setQrError] = useState('');

  // Return modal state
  const [returnModal, setReturnModal] = useState(null); // holds booking object
  const [returnForm, setReturnForm] = useState({
    condition: 'excellent',
    maintenance_reported: false,
    issue_description: ''
  });

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://cult-open.onrender.com/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch bookings list');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://cult-open.onrender.com/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update booking status');

      setSuccess(`Booking was successfully ${newStatus}!`);
      fetchBookings();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleIssueAsset = async (bookingId) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://cult-open.onrender.com/api/bookings/${bookingId}/issue`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue asset');

      setSuccess('Asset issued successfully! Inventory counts updated.');
      fetchBookings();
      if (scannedAsset) handleQrLookup(null, scannedAsset.qr_code_data); // refresh QR details if lookup is open
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://cult-open.onrender.com/api/bookings/${returnModal.id}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(returnForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process return');

      setSuccess('Asset returned successfully! Inventory pools updated.');
      setReturnModal(null);
      setReturnForm({ condition: 'excellent', maintenance_reported: false, issue_description: '' });
      fetchBookings();
      if (scannedAsset) handleQrLookup(null, scannedAsset.qr_code_data); // refresh QR details
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  // QR Code Simulator lookup logic
  const handleQrLookup = async (e, directCode = '') => {
    if (e) e.preventDefault();
    const code = directCode || qrCodeInput;
    if (!code) {
      setQrError('Please enter or select a QR code identity tag');
      return;
    }
    setQrError('');
    setScannedAsset(null);
    setScannedAssetBookings([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://cult-open.onrender.com/api/assets/qr?qrCodeText=${encodeURIComponent(code)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to lookup QR code');
      
      setScannedAsset(data);

      // Filter local bookings for this asset ID
      const assetBookings = bookings.filter(b => b.asset_id === data.id);
      setScannedAssetBookings(assetBookings);
    } catch (err) {
      setQrError(err.message || 'Asset not found for scanned tag');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'issued': return 'badge-info';
      case 'returned': return 'badge-success';
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in">
      {success && <div className="success-banner">{success}</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* QR CODE SIMULATOR FOR ADMIN */}
      {user.role === 'admin' && (
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📷</span> QR-Code Asset Scan Simulator
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Simulate scanning an asset's QR code bar tag. Enter a custom code or pick from the seeded catalog to immediately issue/return/view status.
          </p>
          
          <form onSubmit={(e) => handleQrLookup(e)} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Asset QR Tag (e.g., CULT-ASSET-SON-5321)"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select
                className="form-select"
                onChange={(e) => {
                  setQrCodeInput(e.target.value);
                  handleQrLookup(null, e.target.value);
                }}
                style={{ width: '180px' }}
                value={qrCodeInput}
              >
                <option value="">Quick Select QR...</option>
                <option value="CULT-ASSET-SON-8643">Sony Camera (Seeded)</option>
                <option value="CULT-ASSET-JBL-1025">JBL PA Speaker (Seeded)</option>
                <option value="CULT-ASSET-APU-2495">Amaran Studio Light</option>
                <option value="CULT-ASSET-ROD-9102">Rode Microphone</option>
              </select>

              <button type="submit" className="btn btn-primary">Scan Tag</button>
            </div>
          </form>

          {qrError && <div className="error-msg" style={{ marginTop: '0.5rem' }}>{qrError}</div>}

          {scannedAsset && (
            <div className="glass-panel animate-fade-in" style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ color: '#a855f7', marginBottom: '0.5rem' }}>Asset Identified</h4>
                <p style={{ fontWeight: '600' }}>{scannedAsset.name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category: {scannedAsset.category}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Condition: <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{scannedAsset.condition}</span></p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status: <span className={`badge ${scannedAsset.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>{scannedAsset.status}</span></p>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                  <span>Available: <strong>{scannedAsset.quantity_available}</strong></span>
                  <span>Total: <strong>{scannedAsset.quantity_total}</strong></span>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Pending or Active Bookings ({scannedAssetBookings.length})</h4>
                {scannedAssetBookings.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No active borrowing logs for this asset.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {scannedAssetBookings.map((b) => (
                      <div key={b.id} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: '500' }}>User: {b.user_name || b.user_email}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Qty: {b.quantity} | Status: {b.status}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {b.status === 'approved' && (
                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIssueAsset(b.id)}>Issue</button>
                          )}
                          {b.status === 'issued' && (
                            <button className="btn btn-success" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setReturnModal(b)}>Return</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL BOOKINGS LOG TABLE */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>
          {user.role === 'admin' ? 'Global Booking Requests & Allocations' : 'Your Borrowing Requests & History'}
        </h3>

        {loading ? (
          <div className="notif-empty">Fetching booking transactions...</div>
        ) : bookings.length === 0 ? (
          <div className="notif-empty">No booking logs or requests found in the system database.</div>
        ) : (
          <div className="table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {user.role === 'admin' && <th>Requested By</th>}
                  <th>Resource</th>
                  <th>Quantity</th>
                  <th>Duration</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  {user.role === 'admin' && <th>Action Actions</th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>#{booking.id}</td>
                    {user.role === 'admin' && (
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{booking.user_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.user_email}</div>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{booking.asset_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.asset_category} | {booking.asset_qr}</div>
                    </td>
                    <td>{booking.quantity}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>Start: {booking.start_date}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>End: {booking.end_date}</div>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                      {booking.purpose || '-'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    {user.role === 'admin' && (
                      <td>
                        <div className="table-action-btns">
                          {booking.status === 'pending' && (
                            <>
                              <button className="btn btn-success" onClick={() => handleStatusUpdate(booking.id, 'approved')}>Approve</button>
                              <button className="btn btn-danger" onClick={() => handleStatusUpdate(booking.id, 'rejected')}>Reject</button>
                            </>
                          )}
                          {booking.status === 'approved' && (
                            <button className="btn btn-primary" onClick={() => handleIssueAsset(booking.id)}>Issue Item</button>
                          )}
                          {booking.status === 'issued' && (
                            <button className="btn btn-success" onClick={() => setReturnModal(booking)}>Return Item</button>
                          )}
                          {['returned', 'rejected'].includes(booking.status) && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Archived</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RETURN MODAL */}
      {returnModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Process Return: {returnModal.asset_name}</h3>
              <button className="modal-close" onClick={() => {
                setReturnModal(null);
                setReturnForm({ condition: 'excellent', maintenance_reported: false, issue_description: '' });
              }}>×</button>
            </div>
            
            <form onSubmit={handleReturnSubmit}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Booking ID: #{returnModal.id} | Quantity: {returnModal.quantity} | User: {returnModal.user_name || returnModal.user_email}
              </p>

              <div className="form-group">
                <label className="form-label">Evaluate Asset Condition</label>
                <select
                  className="form-select"
                  value={returnForm.condition}
                  onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                >
                  <option value="excellent">Excellent (As issued)</option>
                  <option value="good">Good (Light usage wear)</option>
                  <option value="damaged">Damaged (Faulty/needs inspection)</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
                <input
                  type="checkbox"
                  id="notif_maint"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={returnForm.maintenance_reported}
                  onChange={(e) => setReturnForm({ ...returnForm, maintenance_reported: e.target.checked })}
                />
                <label htmlFor="notif_maint" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: '500' }}>
                  Send to maintenance (Lock resource booking)
                </label>
              </div>

              {returnForm.maintenance_reported && (
                <div className="form-group animate-fade-in">
                  <label className="form-label">Issue Details / Damage Report</label>
                  <textarea
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="Describe specific fault, damages, or necessary repair actions..."
                    value={returnForm.issue_description}
                    onChange={(e) => setReturnForm({ ...returnForm, issue_description: e.target.value })}
                    required
                  ></textarea>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setReturnModal(null);
                  setReturnForm({ condition: 'excellent', maintenance_reported: false, issue_description: '' });
                }}>Cancel</button>
                <button type="submit" className="btn btn-success">Complete Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
