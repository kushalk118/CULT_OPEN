import React, { useState, useEffect, useRef } from 'react';

export default function Navbar({ currentView, user }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:5000/api/audit/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/audit/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Operational Analytics';
      case 'inventory': return 'Inventory & Resource Discovery';
      case 'bookings': return 'Booking Request Allocations';
      case 'history': return 'Archived Borrowing Transactions';
      case 'health': return 'Asset Health & Maintenance';
      case 'audit': return 'Security Integrity Audit Logs';
      default: return 'CULT_OPEN Management Platform';
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <nav className="navbar">
      <div className="navbar-page-title">{getPageTitle()}</div>

      <div className="navbar-actions" ref={dropdownRef}>
        <button className="notif-btn" onClick={() => setShowDropdown(!showDropdown)}>
          🔔
          {unreadCount > 0 && <span className="notif-badge"></span>}
        </button>

        {showDropdown && (
          <div className="glass-panel notif-dropdown animate-fade-in">
            <div className="notif-header">
              <span>Alert Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 'bold' }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            
            <ul className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">No notifications yet.</div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <li
                    key={notif.id}
                    className={`notif-item ${notif.is_read === 0 ? 'unread' : ''}`}
                    onClick={() => notif.is_read === 0 && handleMarkAsRead(notif.id)}
                  >
                    <div className="notif-item-msg">{notif.message}</div>
                    <div className="notif-item-time">{notif.created_at.substring(5, 16).replace('T', ' ')}</div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
        
        <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
          Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user.name.split(' ')[0]}</strong>
        </div>
      </div>
    </nav>
  );
}
