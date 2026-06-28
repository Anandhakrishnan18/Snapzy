import React, { useContext } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Home, MessageSquare, Bell, User, Settings as SettingsIcon, LogOut, Search } from 'lucide-react';
import '../styles/Layout.css';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const { globalUnreadCount, toastNotification, notificationUnreadCount } = useContext(SocketContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <h2>Snapzy</h2>
        </div>

        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Home /> <span>Home</span>
          </Link>
          <Link to="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>
            <Search /> <span>Search</span>
          </Link>

          <Link to="/messages" className={`nav-link ${location.pathname.startsWith('/messages') ? 'active' : ''}`} style={{ position: 'relative' }}>
            <MessageSquare /> 
            <span>Messages</span>
            {globalUnreadCount > 0 && (
              <span className="unread-badge" style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent-pink)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                {globalUnreadCount}
              </span>
            )}
          </Link>
          <Link to="/notifications" className={`nav-link ${location.pathname === '/notifications' ? 'active' : ''}`} style={{ position: 'relative' }}>
            <Bell /> 
            <span>Notifications</span>
            {notificationUnreadCount > 0 && (
              <span className="unread-badge" style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent-pink)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                {notificationUnreadCount}
              </span>
            )}
          </Link>
          <Link to={`/profile/${user._id}`} className={`nav-link ${location.pathname.startsWith('/profile') ? 'active' : ''}`}>
            <User /> <span>Profile</span>
          </Link>
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <SettingsIcon /> <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-link logout-btn" onClick={logout}>
            <LogOut /> <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Global Toast Notification */}
      {toastNotification && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'var(--accent-pink)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 'bold',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <MessageSquare size={20} />
          {toastNotification}
        </div>
      )}
    </div>
  );
};

export default Layout;
