import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, X, Trash2, MoreHorizontal } from 'lucide-react';
import { formatCompactTime } from '../utils/formatTime';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/PostModal.css';

const PostModal = ({ post: initialPost, onClose }) => {
  const [post, setPost] = useState(initialPost);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const { user } = useContext(AuthContext);

  const isLiked = post.likes?.includes(user?._id);
  const isOwner = post.user?._id === user?._id;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLike = async () => {
    try {
      await api.put(`/posts/${post._id}/like`);
      setPost(prev => ({
        ...prev,
        likes: isLiked 
          ? prev.likes.filter(id => id !== user._id)
          : [...(prev.likes || []), user._id]
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        onClose();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setPost(prev => ({
        ...prev,
        comments: data
      }));
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="fullscreen-modal-overlay" onClick={onClose}>
      <button className="fullscreen-modal-close-btn" onClick={onClose}>
        <X size={28} />
      </button>
      
      <div className="fullscreen-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Left Side: Media */}
        <div className="modal-left-panel">
          {post.mediaType === 'video' ? (
            <video src={`http://localhost:5001${post.media}`} controls autoPlay />
          ) : (
            <img src={`http://localhost:5001${post.media}`} alt="Post Media" />
          )}

          {/* Caption Overlay */}
          {post.content && (
            <div className="modal-caption-overlay">
              <div className="caption-username">{post.user.username}</div>
              <div className={`caption-text ${!captionExpanded ? 'clamped' : ''}`}>
                {post.content}
              </div>
              {!captionExpanded && post.content.length > 100 && (
                <button className="caption-more-btn" onClick={() => setCaptionExpanded(true)}>
                  See More
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Details */}
        <div className="modal-right-panel">
          {/* Header */}
          <div className="modal-header">
            <Link to={`/profile/${post.user._id}`} className="modal-header-user" onClick={onClose}>
              {post.user.profilePic ? (
                <img src={`http://localhost:5001${post.user.profilePic}`} alt="avatar" className="modal-header-avatar" />
              ) : (
                <div className="modal-header-avatar" style={{ backgroundColor: 'var(--accent-pink)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
                  {post.user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="modal-header-info">
                <span className="modal-header-username">{post.user.username}</span>
                <span className="modal-header-time">{formatCompactTime(post.createdAt)}</span>
              </div>
            </Link>
            
            <div className="modal-header-actions">
              {isOwner && (
                <>
                  <button className="modal-action-btn" onClick={() => setShowMenu(!showMenu)}>
                    <MoreHorizontal size={20} />
                  </button>
                  {showMenu && (
                    <div className="dropdown-menu">
                      <button className="dropdown-item" onClick={handleDeletePost}>
                        <Trash2 size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> 
                        Delete Post
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Middle Section: Comments OR Empty State */}
          {showComments ? (
            <div className="modal-comments-section">
              {post.comments && post.comments.length > 0 ? post.comments.map(c => (
                <div key={c._id} className="comment-item" style={{ alignItems: 'flex-start' }}>
                  <Link to={`/profile/${c.user._id}`} onClick={onClose} className="comment-avatar">
                    {c.user.profilePic ? (
                      <img src={`http://localhost:5001${c.user.profilePic}`} alt="avatar" />
                    ) : (
                      <div className="avatar-placeholder-sm">
                        {c.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="comment-content">
                    <div className="comment-header">
                      <Link to={`/profile/${c.user._id}`} onClick={onClose} className="comment-user">
                        <strong>{c.user.username}</strong>
                      </Link>
                    </div>
                    <div className="comment-text">{c.text}</div>
                    {c.createdAt && (
                      <div className="comment-time">
                        {formatCompactTime(c.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px', marginTop: '20px' }}>
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          ) : (
            <div className="modal-empty-state">
              <MessageCircle size={48} strokeWidth={1} opacity={0.5} />
              <p>Click the comment icon<br />to view comments.</p>
            </div>
          )}

          {/* Footer Actions (Always Visible) */}
          <div className="modal-footer">
            <div className="modal-action-icons">
              <button className={`modal-action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <button className="modal-action-btn" onClick={() => setShowComments(!showComments)}>
                <MessageCircle size={24} />
              </button>
              <button className="modal-action-btn">
                <Send size={24} />
              </button>
            </div>
            
            <div className="modal-likes-count">{post.likes?.length || 0} likes</div>

            {/* Comment Input Only When showComments is true */}
            {showComments && (
              <form onSubmit={handleComment} className="modal-comment-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" className="modal-comment-submit" disabled={!commentText.trim()}>Post</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
