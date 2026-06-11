import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Bookings from './pages/Bookings';
import History from './pages/History';
import HealthTracking from './pages/HealthTracking';
import AuditLogs from './pages/AuditLogs';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'inventory', 'bookings', 'history', 'health', 'audit'
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setInitializing(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Failed to verify token:', err);
    } finally {
      setInitializing(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthView('login');
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem', background: '#090a0f', color: '#f8fafc' }}>
        <span style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>📦</span>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', color: '#94a3b8' }}>Initializing CULT_OPEN platform secure session...</p>
      </div>
    );
  }

  // Auth flow
  if (!user) {
    if (authView === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} onViewChange={setAuthView} />;
    } else {
      return <Register onViewChange={setAuthView} />;
    }
  }

  // Authenticated layout
  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />

      <div className="main-content-wrapper">
        <Navbar currentView={currentView} user={user} />
        
        <main className="main-content">
          {currentView === 'dashboard' && <Dashboard user={user} />}
          {currentView === 'inventory' && <Inventory user={user} />}
          {currentView === 'bookings' && <Bookings user={user} />}
          {currentView === 'history' && <History user={user} />}
          {currentView === 'health' && <HealthTracking user={user} />}
          {currentView === 'audit' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
}
