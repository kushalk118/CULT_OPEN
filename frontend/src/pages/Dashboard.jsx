import React, { useState, useEffect } from 'react';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    total_inventory: 0,
    available_inventory: 0,
    pending_requests: 0,
    active_bookings: 0,
    overdue_returns: 0
  });
  const [chartData, setChartData] = useState({
    top_assets: [],
    category_bookings: [],
    health_stats: [],
    monthly_trends: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Stats
      const statsRes = await fetch('https://cult-open.onrender.com/api/dashboard/stats', { headers });
      if (!statsRes.ok) throw new Error('Failed to load statistics');
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch Charts Data if Admin
      if (user.role === 'admin') {
        const chartsRes = await fetch('https://cult-open.onrender.com/api/dashboard/charts', { headers });
        if (chartsRes.ok) {
          const chartsData = await chartsRes.json();
          setChartData(chartsData);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  // Helper to render SVG Donut Chart
  const renderDonutChart = () => {
    const data = chartData.category_bookings;
    if (!data || data.length === 0) return <div className="notif-empty">No category booking data available</div>;

    const total = data.reduce((sum, item) => sum + item.booking_count, 0);
    let cumulativePercent = 0;

    const colors = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

    return (
      <div className="chart-container">
        <svg viewBox="0 0 100 100" className="svg-chart" style={{ maxHeight: '180px' }}>
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
          {data.map((item, index) => {
            const percentage = (item.booking_count / total) * 100;
            const strokeDash = `${percentage} ${100 - percentage}`;
            const strokeOffset = 100 - cumulativePercent + 25; // start from top (12 o'clock)
            cumulativePercent += percentage;

            const color = colors[index % colors.length];

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                pathLength="100"
                style={{
                  transition: 'stroke-dashoffset 0.8s ease-in-out',
                  transformOrigin: '50% 50%'
                }}
              />
            );
          })}
          <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">
            {total}
          </text>
          <text x="50" y="58" textAnchor="middle" dominantBaseline="middle" fill="var(--text-secondary)" fontSize="5.5" letterSpacing="0.05em">
            BOOKINGS
          </text>
        </svg>
        <div className="chart-legend" style={{ width: '100%' }}>
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            return (
              <div key={index} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: color }}></span>
                <span>{item.category} ({Math.round((item.booking_count / total) * 100)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper to render SVG Bar Chart
  const renderBarChart = () => {
    const data = chartData.top_assets;
    if (!data || data.length === 0) return <div className="notif-empty">No asset utilization data available</div>;

    const maxCount = Math.max(...data.map(item => item.booking_count), 1);
    const barColors = ['url(#grad-violet)', 'url(#grad-blue)', 'url(#grad-cyan)', 'url(#grad-emerald)', 'url(#grad-amber)'];

    return (
      <div className="chart-container">
        <svg viewBox="0 0 200 120" className="svg-chart">
          <defs>
            <linearGradient id="grad-violet" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {data.map((item, index) => {
            const y = 10 + index * 22;
            const barWidth = (item.booking_count / maxCount) * 115;
            const truncatedName = item.name.length > 18 ? item.name.substring(0, 15) + '...' : item.name;

            return (
              <g key={index}>
                {/* Y Axis Label */}
                <text x="5" y={y + 11} fill="var(--text-secondary)" fontSize="5.5" dominantBaseline="middle">
                  {truncatedName}
                </text>
                {/* Empty Track */}
                <rect x="70" y={y + 5} width="115" height="10" rx="3" fill="rgba(255,255,255,0.02)" stroke="var(--border-color)" strokeWidth="0.5" />
                {/* Colored Bar */}
                <rect x="70" y={y + 5} width={barWidth} height="10" rx="3" fill={barColors[index % barColors.length]} />
                {/* Count value */}
                <text x={75 + barWidth} y={y + 11} fill="var(--text-primary)" fontSize="5.5" fontWeight="bold" dominantBaseline="middle">
                  {item.booking_count} bookings
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p className="auth-subtitle">Syncing platform metrics...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {error && <div className="error-banner">{error}</div>}

      {/* Overview stats cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ color: '#6366f1' }}>📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total_inventory}</span>
            <span className="stat-label">Total Assets</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}>✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.available_inventory}</span>
            <span className="stat-label">Available Items</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ color: '#06b6d4' }}>🔄</div>
          <div className="stat-info">
            <span className="stat-value">{stats.active_bookings}</span>
            <span className="stat-label">Active Bookings</span>
          </div>
        </div>

        {user.role === 'admin' ? (
          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ color: '#f59e0b' }}>⏳</div>
            <div className="stat-info">
              <span className="stat-value">{stats.pending_requests}</span>
              <span className="stat-label">Pending Requests</span>
            </div>
          </div>
        ) : (
          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ color: '#ef4444' }}>⚠️</div>
            <div className="stat-info">
              <span className="stat-value">{stats.overdue_returns}</span>
              <span className="stat-label">Overdue Returns</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Admin Dashboard Graphs */}
      {user.role === 'admin' ? (
        <div className="dashboard-grid">
          <div className="glass-panel analytics-card">
            <h3 className="analytics-title">Top Utilized Assets</h3>
            {renderBarChart()}
          </div>

          <div className="glass-panel analytics-card">
            <h3 className="analytics-title">Booking Category Distribution</h3>
            {renderDonutChart()}
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="glass-panel analytics-card" style={{ minHeight: '300px' }}>
            <h3 className="analytics-title">IITR Cultural Council Shared Guidelines</h3>
            <div style={{ padding: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1rem' }}>Welcome to the <strong>CULT_OPEN</strong> Smart Asset Management Platform.</p>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Select assets in the <strong>Inventory</strong> tab and request bookings for the required duration.</li>
                <li>Submit clear usage purposes to avoid approval rejections.</li>
                <li>Verify you have sufficient capacity before requesting multiple quantities.</li>
                <li>Report any damaged or faulty items immediately in the <strong>Asset Health</strong> section.</li>
                <li>Return resources promptly before the due date to ensure continuous council logistics.</li>
              </ul>
            </div>
          </div>

          <div className="glass-panel analytics-card" style={{ minHeight: '300px' }}>
            <h3 className="analytics-title">Your Quick Dashboard Actions</h3>
            <ul className="dashboard-widget-list">
              <li className="dashboard-widget-item">
                <div className="dashboard-widget-item-info">
                  <span className="dashboard-widget-item-title">Overdue Alert Check</span>
                  <span className="dashboard-widget-item-subtitle">Items checkouts overdue return</span>
                </div>
                <span className="dashboard-widget-item-value">{stats.overdue_returns}</span>
              </li>
              <li className="dashboard-widget-item">
                <div className="dashboard-widget-item-info">
                  <span className="dashboard-widget-item-title">Available Inventory Pool</span>
                  <span className="dashboard-widget-item-subtitle">Healthy assets ready for checkout</span>
                </div>
                <span className="dashboard-widget-item-value" style={{ color: '#10b981' }}>{stats.available_inventory}</span>
              </li>
              <li className="dashboard-widget-item">
                <div className="dashboard-widget-item-info">
                  <span className="dashboard-widget-item-title">Active Borrowing Sessions</span>
                  <span className="dashboard-widget-item-subtitle">Currently issued items</span>
                </div>
                <span className="dashboard-widget-item-value" style={{ color: '#06b6d4' }}>{stats.active_bookings}</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
