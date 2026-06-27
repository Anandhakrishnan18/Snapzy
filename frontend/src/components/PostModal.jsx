import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Post.css';

const PostModal = ({ post: initialPost, onClose }) => {
  const [post, setPost] = useState(initialPost);
  const [commentText, setCommentText] = useState('');
  const { user } = useContext(AuthContext);

  const isLiked = post.likes?.includes(user?._id);

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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', display: 'flex', flexDirection: 'row', padding: 0, overflow: 'hidden', height: '80vh' }}>
        
        {/* Left Side: Media */}
        <div style={{ flex: 1, backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {post.mediaType === 'video' ? (
            <video src={`http://localhost:5001${post.media}`} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
          ) : (
            <img src={`http://localhost:5001${post.media}`} alt="Post Media" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>

        {/* Right Side: Details */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}>
          {/* Header */}
          <div className="post-header" style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
            <Link to={`/profile/${post.user._id}`} className="post-user-info" onClick={onClose}>
              {post.user.profilePic ? (
                <img src={`http://localhost:5001${post.user.profilePic}`} alt="avatar" />
              ) : (
                <div className="avatar-placeholder">{post.user.username.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <h4>{post.user.username}</h4>
                <p>@{post.user.userId}</p>
              </div>
            </Link>
            <button className="icon-btn" onClick={onClose}><X size={24} /></button>
          </div>

          {/* Comments Section */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)' }}>
            {/* Caption */}
            {post.content && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Link to={`/profile/${post.user._id}`} onClick={onClose} style={{ fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none' }}>
                  {post.user.username}
                </Link>
                <span style={{ color: 'var(--text-secondary)' }}>{post.content}</span>
              </div>
            )}

            {/* Comments */}
            {post.comments && post.comments.map(c => (
              <div key={c._id} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <Link to={`/profile/${c.user._id}`} onClick={onClose} style={{ fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none' }}>
                  {c.user.username}
                </Link>
                <span style={{ color: 'var(--text-secondary)' }}>{c.text}</span>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
            <div className="post-actions" style={{ marginBottom: '10px' }}>
              <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <button className="action-btn">
                <MessageCircle size={24} />
              </button>
            </div>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{post.likes?.length || 0} likes</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </div>

            <form onSubmit={handleComment} className="comment-form">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={!commentText.trim()} style={{ color: 'var(--accent-pink)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Post</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
