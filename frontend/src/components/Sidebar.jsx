import React from 'react';

export default function Sidebar({ currentView, onViewChange, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', adminOnly: false },
    { id: 'inventory', name: 'Inventory Catalog', icon: '📦', adminOnly: false },
    { id: 'bookings', name: 'Bookings Manager', icon: '🔄', adminOnly: true },
    { id: 'history', name: 'Borrowing History', icon: '⏳', adminOnly: false },
    { id: 'health', name: 'Asset Health', icon: '🛠️', adminOnly: false },
    { id: 'audit', name: 'Audit Logs', icon: '🛡️', adminOnly: true },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">📦</span>
        <span className="sidebar-title">CULT_OPEN</span>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          if (item.adminOnly && user.role !== 'admin') return null;

          return (
            <li key={item.id}>
              <a
                onClick={() => onViewChange(item.id)}
                className={`sidebar-link ${currentView === item.id ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user.name}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user.email}</span>
          <span className="badge badge-info" style={{ fontSize: '0.65rem', alignSelf: 'flex-start', marginTop: '0.25rem' }}>
            {user.role}
          </span>
        </div>
        <button
          className="btn btn-secondary"
          onClick={onLogout}
          style={{ width: '100%', marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
