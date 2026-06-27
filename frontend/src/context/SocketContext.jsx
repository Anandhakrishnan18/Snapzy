import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5001', {
        auth: { token: user.token }
      });
      setSocket(newSocket);

      newSocket.on('userOnline', (userId) => {
        setOnlineUsers(prev => [...new Set([...prev, userId])]);
      });

      newSocket.on('userOffline', (data) => {
        const id = typeof data === 'object' ? data.userId : data;
        setOnlineUsers(prev => prev.filter(uid => uid !== id));
      });

      newSocket.on('newMessage', (message) => {
        // If we are not on the messages page, or not looking at this chat, show toast
        if (!window.location.pathname.startsWith('/messages')) {
          setGlobalUnreadCount(prev => prev + 1);
          setToastNotification(`New message from ${message.sender}`);
          
          // Play sound
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed', e));
          } catch(e) {}

          setTimeout(() => setToastNotification(null), 3000);
        }
      });

      return () => newSocket.disconnect();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, globalUnreadCount, setGlobalUnreadCount, toastNotification }}>
      {children}
    </SocketContext.Provider>
  );
};
