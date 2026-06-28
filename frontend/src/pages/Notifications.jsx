import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Heart, MessageSquare, MessageCircle } from 'lucide-react';
import { formatCompactTime } from '../utils/formatTime';
import api from '../services/api';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import '../styles/Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setNotificationUnreadCount } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
      setNotificationUnreadCount(0); // Reset global badge
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

  const handleNotificationClick = (notif) => {
    if (notif.type === 'message') {
      navigate('/messages');
    } else if (notif.type === 'like' || notif.type === 'comment') {
      navigate(`/profile/${user._id}`);
    } else if (notif.type === 'follow') {
      navigate(`/profile/${notif.sender._id}`);
    }
  };

  // Group notifications
  const processNotifications = (notifs) => {
    const messageCounts = {};
    const toRender = [];

    notifs.forEach(notif => {
      if (notif.type === 'message' && !notif.isRead) {
        if (!messageCounts[notif.sender._id]) {
          messageCounts[notif.sender._id] = { count: 0, firstNotif: notif };
        }
        messageCounts[notif.sender._id].count += 1;
      } else {
        toRender.push(notif);
      }
    });

    Object.values(messageCounts).forEach(group => {
      if (group.count > 1) {
        const notif = { ...group.firstNotif };
        notif.messageCount = group.count;
        toRender.push(notif);
      } else {
        toRender.push(group.firstNotif);
      }
    });

    toRender.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    toRender.forEach(notif => {
      const date = new Date(notif.createdAt);
      if (date >= todayStart) {
        today.push(notif);
      } else if (date >= yesterdayStart) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });

    return { today, yesterday, earlier };
  };

  if (loading) return <div className="container"><p className="loading-text">Loading...</p></div>;

  const { today, yesterday, earlier } = processNotifications(notifications);

  const renderSection = (title, notifs) => {
    if (notifs.length === 0) return null;
    return (
      <div className="notification-section">
        <h3 className="notification-section-title">{title}</h3>
        {notifs.map(notif => (
          <div 
            key={notif._id} 
            className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
            onClick={() => handleNotificationClick(notif)}
          >
            <div className="notification-icon">
              {getIcon(notif.type)}
            </div>
            <div className="notification-avatar">
              {notif.sender.profilePic ? (
                <img src={`http://localhost:5001${notif.sender.profilePic}`} alt="avatar" />
              ) : (
                <span className="avatar-placeholder">{notif.sender.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="notification-content">
              <p>
                <strong>{notif.sender.username}</strong>{' '}
                {notif.type === 'message' && notif.messageCount > 1 
                  ? `sent ${notif.messageCount} new messages.`
                  : notif.type === 'like' ? 'liked your post.'
                  : notif.type === 'comment' ? 'commented on your post.'
                  : notif.type === 'follow' ? 'started following you.'
                  : 'sent you a message.'}
              </p>
              <span className="notification-time">{formatCompactTime(notif.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="notifications-container container">
      <h2>Notifications</h2>
      
      {notifications.length === 0 ? (
        <p className="no-notifications">No recent notifications.</p>
      ) : (
        <div className="notifications-list">
          {renderSection('Today', today)}
          {renderSection('Yesterday', yesterday)}
          {renderSection('Earlier', earlier)}
        </div>
      )}
    </div>
  );
};

export default Notifications;
