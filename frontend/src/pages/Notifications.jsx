import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, UserPlus, Heart, MessageSquare } from 'lucide-react';
import { formatCompactTime } from '../utils/formatTime';
import api from '../services/api';
import '../styles/Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setLoading(false);
      // Mark as read after fetching
      await api.put('/notifications/read');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={20} className="icon-like" />;
      case 'comment': return <MessageCircle size={20} className="icon-comment" />;
      case 'follow': return <UserPlus size={20} className="icon-follow" />;
      case 'message': return <MessageSquare size={20} className="icon-message" />;
      default: return null;
    }
  };

  const getMessage = (type) => {
    switch (type) {
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'follow': return 'started following you.';
      case 'message': return 'sent you a message.';
      default: return '';
    }
  };

  if (loading) return <div className="container"><p className="loading-text">Loading...</p></div>;

  return (
    <div className="notifications-container container">
      <h2>Notifications</h2>
      
      {notifications.length === 0 ? (
        <p className="no-notifications">No recent notifications.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div key={notif._id} className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}>
              <div className="notification-icon">
                {getIcon(notif.type)}
              </div>
              <Link to={`/profile/${notif.sender._id}`} className="notification-avatar">
                {notif.sender.profilePic ? (
                  <img src={`http://localhost:5001${notif.sender.profilePic}`} alt="avatar" />
                ) : (
                  <span className="avatar-placeholder">{notif.sender.username.charAt(0).toUpperCase()}</span>
                )}
              </Link>
              <div className="notification-content">
                <p>
                  <strong><Link to={`/profile/${notif.sender._id}`}>{notif.sender.username}</Link></strong> {getMessage(notif.type)}
                </p>
                <span className="notification-time">{formatCompactTime(notif.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
