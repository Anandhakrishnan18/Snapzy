import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { format } from 'date-fns';
import { formatCompactTime } from '../utils/formatTime';
import { Send, Image as ImageIcon, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import '../styles/Messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Real-time state
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef({});
  
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers, setGlobalUnreadCount } = useContext(SocketContext);
  const messagesEndRef = useRef(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    // When we open messages page, we can clear global unread badge if we are viewing the latest chats.
    // Or clear it selectively. Let's just reset it to 0 for simplicity.
    setGlobalUnreadCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        if (activeChat && (message.sender === activeChat._id || message.receiver === activeChat._id)) {
          setMessages(prev => [...prev, message]);
          
          // If we are actively chatting with the sender, mark it as seen instantly
          if (message.sender === activeChat._id) {
            socket.emit('markSeen', { senderId: activeChat._id, receiverId: user._id });
          }
        }
        fetchConversations();
      };

      const handleUserTyping = ({ userId }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: true }));
      };

      const handleUserStoppedTyping = ({ userId }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: false }));
      };

      const handleMessagesSeen = ({ receiverId }) => {
        if (activeChat && activeChat._id === receiverId) {
          setMessages(prev => prev.map(m => m.sender === user._id && m.status !== 'seen' ? { ...m, status: 'seen' } : m));
          fetchConversations();
        }
      };

      const handleMessageDelivered = ({ messageId }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'delivered' } : m));
      };

      socket.on('newMessage', handleNewMessage);
      socket.on('userTyping', handleUserTyping);
      socket.on('userStoppedTyping', handleUserStoppedTyping);
      socket.on('messagesSeen', handleMessagesSeen);
      socket.on('messageDelivered', handleMessageDelivered);

      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('userTyping', handleUserTyping);
        socket.off('userStoppedTyping', handleUserStoppedTyping);
        socket.off('messagesSeen', handleMessagesSeen);
        socket.off('messageDelivered', handleMessageDelivered);
      }
    }
  }, [socket, activeChat, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const selectUserToChat = async (targetUser) => {
    setActiveChat(targetUser);
    setIsMobileChatOpen(true);
    
    // Clear local unread count for this user
    setConversations(prev => prev.map(c => c.user._id === targetUser._id ? { ...c, unreadCount: 0 } : c));

    try {
      const { data } = await api.get(`/messages/${targetUser._id}`);
      setMessages(data);
      
      // Tell sender we have seen their messages
      if (socket) {
        socket.emit('markSeen', { senderId: targetUser._id, receiverId: user._id });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (activeChat && socket) {
      socket.emit('typing', { senderId: user._id, receiverId: activeChat._id });
      
      clearTimeout(typingTimeoutRef.current[activeChat._id]);
      typingTimeoutRef.current[activeChat._id] = setTimeout(() => {
        socket.emit('stopTyping', { senderId: user._id, receiverId: activeChat._id });
      }, 2000);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageText = newMessage;
    setNewMessage('');
    
    if (socket) {
      socket.emit('stopTyping', { senderId: user._id, receiverId: activeChat._id });
    }

    try {
      const { data } = await api.post('/messages', {
        receiverId: activeChat._id,
        text: messageText
      });

      setMessages(prev => [...prev, data]);
      
      if (socket) {
        socket.emit('sendMessage', {
          receiverId: activeChat._id,
          message: data
        });
      }
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const backToList = () => {
    setIsMobileChatOpen(false);
    setActiveChat(null);
  };

  const renderReadReceipt = (status) => {
    if (status === 'seen') return <CheckCheck size={14} color="#38bdf8" />;
    if (status === 'delivered') return <CheckCheck size={14} color="#94a3b8" />;
    return <Check size={14} color="#94a3b8" />;
  };

  return (
    <div className="messages-container">
      {/* Left Panel: Conversation List */}
      <div className={`conversations-sidebar ${isMobileChatOpen ? 'hide-on-mobile' : ''}`}>
        <div className="sidebar-header">
          <h3>Messages</h3>
        </div>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="no-conversations">No conversations yet.</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.user._id} 
                className={`conversation-item ${activeChat?._id === conv.user._id ? 'active' : ''}`}
                onClick={() => selectUserToChat(conv.user)}
              >
                <div className="avatar lg">
                  {conv.user.profilePic ? (
                    <img src={`http://localhost:5001${conv.user.profilePic}`} alt="avatar" />
                  ) : (
                    <span>{conv.user.username.charAt(0).toUpperCase()}</span>
                  )}
                  {onlineUsers.includes(conv.user._id) ? (
                    <span className="online-indicator"></span>
                  ) : (
                    <span className="offline-indicator"></span>
                  )}
                </div>
                <div className="conversation-info">
                  <div className="conv-header">
                    <h4>{conv.user.username}</h4>
                    {conv.createdAt && new Date(conv.createdAt).getTime() > 0 && (
                      <span className="conv-time">
                        {formatCompactTime(conv.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="conv-preview">
                    <p className={`last-message ${conv.unreadCount > 0 ? 'unread-text' : ''}`}>
                      {typingUsers[conv.user._id] ? (
                        <span className="typing-text">typing...</span>
                      ) : (
                        <>
                          {conv.isMine && 'You: '}
                          {conv.lastMessage || 'Start a conversation'}
                        </>
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Chat Area */}
      <div className={`chat-area ${!isMobileChatOpen ? 'hide-on-mobile' : ''}`}>
        {activeChat ? (
          <div className="chat-interface">
            {/* Chat Header */}
            <div className="chat-header">
              <button className="back-btn mobile-only" onClick={backToList}>
                <ArrowLeft size={24} />
              </button>
              <div className="avatar sm">
                {activeChat.profilePic ? (
                  <img src={`http://localhost:5001${activeChat.profilePic}`} alt="avatar" />
                ) : (
                  <span>{activeChat.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="chat-user-info">
                <h4>{activeChat.username}</h4>
                <span className="status">
                  {onlineUsers.includes(activeChat._id) 
                    ? 'Online' 
                    : activeChat.lastSeen 
                      ? `Last seen ${formatCompactTime(activeChat.lastSeen)}` 
                      : 'Offline'}
                </span>
              </div>
            </div>

            {/* Messages List */}
            <div className="messages-list">
              {messages.map((msg, index) => {
                const isMine = msg.sender === user._id;
                const showDate = index === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[index-1].createdAt).toDateString();
                
                return (
                  <React.Fragment key={msg._id}>
                    {showDate && (
                      <div className="date-separator">
                        <span>{format(new Date(msg.createdAt), 'MMMM d, yyyy')}</span>
                      </div>
                    )}
                    <div className={`message-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && (
                         <div className="message-avatar">
                           {activeChat.profilePic ? (
                             <img src={`http://localhost:5001${activeChat.profilePic}`} alt="avatar" />
                           ) : (
                             <span>{activeChat.username.charAt(0).toUpperCase()}</span>
                           )}
                         </div>
                      )}
                      <div className="message-content-wrapper">
                        <div className="message-bubble">
                          <p>{msg.text}</p>
                        </div>
                        <div className="message-meta">
                          <span className="timestamp">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                          {isMine && (
                            <span className="read-receipt">{renderReadReceipt(msg.status)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              
              {/* Typing Indicator */}
              {typingUsers[activeChat._id] && (
                <div className="message-bubble-wrapper theirs">
                  <div className="message-avatar">
                    {activeChat.profilePic ? (
                      <img src={`http://localhost:5001${activeChat.profilePic}`} alt="avatar" />
                    ) : (
                      <span>{activeChat.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="typing-indicator-bubble">
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>

            {/* Message Input Area */}
            <form className="message-input-area" onSubmit={sendMessage}>
              <div className="input-wrapper">
                <button type="button" className="icon-btn action">
                  <ImageIcon size={22} />
                </button>
                <input
                  type="text"
                  placeholder="Message..."
                  value={newMessage}
                  onChange={handleTyping}
                />
                <button type="submit" disabled={!newMessage.trim()} className="send-btn">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="no-chat-selected">
            <div className="icon-circle">
              <Send size={48} />
            </div>
            <h2>Your Messages</h2>
            <p>Send private photos and messages to a friend or group.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
