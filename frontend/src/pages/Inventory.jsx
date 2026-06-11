import React, { useState, useEffect } from 'react';

export default function Inventory({ user }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Modals state
  const [bookingModal, setBookingModal] = useState(null); // holds asset to book
  const [assetFormModal, setAssetFormModal] = useState(null); // holds asset to edit or 'add'
  const [qrModal, setQrModal] = useState(null); // holds asset for QR code

  // Form fields
  const [bookingForm, setBookingForm] = useState({ quantity: 1, start_date: '', end_date: '', purpose: '' });
  const [assetForm, setAssetForm] = useState({ name: '', category: 'DSLR Cameras', description: '', quantity_total: 1, status: 'active', condition: 'excellent' });

  // Available categories
  const categories = [
    'DSLR Cameras',
    'Studio Lighting Equipment',
    'Audio Systems',
    'Costumes',
    'Stage Props',
    'Recording Equipment',
    'Event Infrastructure'
  ];

  useEffect(() => {
    fetchAssets();
  }, [searchTerm, selectedCategory]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/assets';
      const params = [];
      if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch assets list');
      const data = await res.json();
      setAssets(data);
    } catch (err) {
      setError(err.message || 'Error loading assets');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (bookingForm.quantity > bookingModal.quantity_available) {
      setError('Cannot request quantity exceeding available inventory.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_id: bookingModal.id,
          quantity: bookingForm.quantity,
          start_date: bookingForm.start_date,
          end_date: bookingForm.end_date,
          purpose: bookingForm.purpose
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit booking');

      setSuccess('Booking requested successfully! Pending admin approval.');
      setBookingModal(null);
      setBookingForm({ quantity: 1, start_date: '', end_date: '', purpose: '' });
      fetchAssets();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssetFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const isEdit = assetFormModal !== 'add';
      const url = isEdit 
        ? `http://localhost:5000/api/assets/${assetFormModal.id}` 
        : 'http://localhost:5000/api/assets';
      
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assetForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save asset details');

      setSuccess(`Asset ${isEdit ? 'updated' : 'created'} successfully!`);
      setAssetFormModal(null);
      fetchAssets();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset? This will delete all associated bookings.')) return;
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete asset');

      setSuccess('Asset deleted successfully!');
      fetchAssets();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (asset) => {
    setAssetForm({
      name: asset.name,
      category: asset.category,
      description: asset.description,
      quantity_total: asset.quantity_total,
      status: asset.status,
      condition: asset.condition
    });
    setAssetFormModal(asset);
  };

  const openAddModal = () => {
    setAssetForm({
      name: '',
      category: 'DSLR Cameras',
      description: '',
      quantity_total: 1,
      status: 'active',
      condition: 'excellent'
    });
    setAssetFormModal('add');
  };

  const openQrModal = async (asset) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/assets/${asset.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQrModal(data);
    } catch (err) {
      setError('Could not fetch QR code image: ' + err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      {success && <div className="success-banner">{success}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="inventory-controls">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input search-input-field"
            placeholder="Search by name, category, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            className="form-select filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>

          {user.role === 'admin' && (
            <button className="btn btn-primary" onClick={openAddModal}>
              + Add Asset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="notif-empty">Fetching inventory catalog...</div>
      ) : assets.length === 0 ? (
        <div className="glass-panel notif-empty">No items found matching the selected search criteria.</div>
      ) : (
        <div className="assets-grid">
          {assets.map((asset) => (
            <div key={asset.id} className="glass-panel asset-card">
              <span className="asset-category-badge">{asset.category}</span>
              <h4 className="asset-name">{asset.name}</h4>
              <p className="asset-desc">{asset.description || 'No description provided.'}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className={`badge ${asset.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {asset.status}
                </span>
                <span className={`badge ${
                  asset.condition === 'excellent' ? 'badge-success' : 
                  asset.condition === 'good' ? 'badge-info' : 'badge-danger'
                }`}>
                  Condition: {asset.condition}
                </span>
              </div>

              <div className="asset-meta">
                <span className="asset-qty">
                  Available: <span className="asset-qty-val" style={{ color: asset.quantity_available > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {asset.quantity_available}
                  </span>
                </span>
                <span className="asset-qty">
                  Total Pool: <span className="asset-qty-val">{asset.quantity_total}</span>
                </span>
              </div>

              <div className="asset-actions">
                {user.role === 'admin' ? (
                  <>
                    <button className="btn btn-secondary" onClick={() => openQrModal(asset)}>QR</button>
                    <button className="btn btn-secondary" onClick={() => openEditModal(asset)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDeleteAsset(asset.id)}>Delete</button>
                  </>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setBookingModal(asset);
                      setBookingForm({ ...bookingForm, quantity: 1 });
                    }}
                    disabled={asset.quantity_available <= 0 || asset.status !== 'active'}
                  >
                    {asset.status !== 'active' ? 'Maintenance' : asset.quantity_available <= 0 ? 'Out of Stock' : 'Book Resource'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Book: {bookingModal.name}</h3>
              <button className="modal-close" onClick={() => setBookingModal(null)}>×</button>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Quantity (Max available: {bookingModal.quantity_available})</label>
                <input
                  type="number"
                  min="1"
                  max={bookingModal.quantity_available}
                  className="form-input"
                  value={bookingForm.quantity}
                  onChange={(e) => setBookingForm({ ...bookingForm, quantity: parseInt(e.target.value, 10) || 1 })}
                  required
                />
              </div>
              <div className="forms-cols-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingForm.start_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingForm.end_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Purpose of Checkout</label>
                <textarea
                  className="form-input form-textarea"
                  rows="3"
                  placeholder="Explain what event or task this asset will be used for..."
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setBookingModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Request Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSET FORM MODAL (ADD/EDIT) */}
      {assetFormModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h3>{assetFormModal === 'add' ? 'Add Asset Profile' : 'Edit Asset Profile'}</h3>
              <button className="modal-close" onClick={() => setAssetFormModal(null)}>×</button>
            </div>
            <form onSubmit={handleAssetFormSubmit}>
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sony Mirrorless Lens Kit"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={assetForm.category}
                  onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  rows="2"
                  placeholder="Details, technical specifications, and storage location info..."
                  value={assetForm.description}
                  onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="forms-cols-2">
                <div className="form-group">
                  <label className="form-label">Quantity Total</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={assetForm.quantity_total}
                    onChange={(e) => setAssetForm({ ...assetForm, quantity_total: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select
                    className="form-select"
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="damaged">Damaged (Needs repair)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Asset Status</label>
                <select
                  className="form-select"
                  value={assetForm.status}
                  onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                >
                  <option value="active">Active (Available for booking)</option>
                  <option value="maintenance">In Maintenance (Locked from booking)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setAssetFormModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE DISPLAY MODAL */}
      {qrModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-fade-in" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3>Asset QR Identity</h3>
              <button className="modal-close" onClick={() => setQrModal(null)}>×</button>
            </div>
            <div className="qr-details-view">
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {qrModal.name}
              </p>
              {qrModal.qr_code_data_url && (
                <div className="qr-image-wrapper">
                  <img src={qrModal.qr_code_data_url} alt="Asset QR Code" style={{ width: '180px', height: '180px' }} />
                </div>
              )}
              <span className="qr-code-text-val">{qrModal.qr_code_data}</span>
              <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Admins can scan this code to issue or return the asset directly.
              </p>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setQrModal(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
