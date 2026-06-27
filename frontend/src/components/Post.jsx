import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCompactTime } from '../utils/formatTime';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import api from '../services/api';
import '../styles/Post.css';

const Post = ({ post, onUpdate, currentUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = async () => {
    try {
      await api.put(`/posts/${post._id}/like`);
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setCommentText('');
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await api.delete(`/posts/${post._id}/comment/${commentId}`);
        onUpdate();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        onUpdate();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const isLiked = post.likes.includes(currentUser._id);
  const isOwner = post.user._id === currentUser._id;

  return (
    <div className={`post-card ${showComments ? 'with-comments' : ''}`}>
      
      {/* LEFT SIDE: Original Post Content */}
      <div className="post-main">
        <div className="post-header">
          <Link to={`/profile/${post.user._id}`} className="post-user-info">
            <div className="avatar sm">
              {post.user.profilePic ? (
                <img src={`http://localhost:5001${post.user.profilePic}`} alt="avatar" />
              ) : (
                <span>{post.user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h4>{post.user.username}</h4>
              <span className="post-time">{formatCompactTime(post.createdAt)}</span>
            </div>
          </Link>
          {isOwner && (
            <button className="delete-btn" onClick={handleDelete}>
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="post-content">
          {post.content && <p>{post.content}</p>}
          {post.media && (
            <div className="post-media">
              {post.mediaType === 'video' ? (
                <video src={`http://localhost:5001${post.media}`} controls />
              ) : (
                <img src={`http://localhost:5001${post.media}`} alt="Post Media" />
              )}
            </div>
          )}
        </div>

        <div className="post-actions">
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={20} fill={isLiked ? 'var(--accent-pink)' : 'none'} />
            <span>{post.likes.length} Likes</span>
          </button>
          <button className="action-btn" onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={20} />
            <span>{post.comments.length} Comments</span>
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Comments Panel (Only visible when toggled) */}
      {showComments && (
        <div className="post-comments-side">
          
          {/* Header */}
          <div className="comments-side-header">
            💬 Comments ({post.comments.length})
          </div>
          
          {/* Middle: Scrollable Comments List */}
          <div className="comments-list-container">
            {post.comments.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
                No comments yet. Be the first!
              </div>
            ) : (
              post.comments.map(comment => (
                <div key={comment._id} className="comment-item">
                  <Link to={`/profile/${comment.user._id}`} className="comment-avatar">
                    {comment.user.profilePic ? (
                      <img src={`http://localhost:5001${comment.user.profilePic}`} alt="avatar" />
                    ) : (
                      <div className="avatar-placeholder-sm">{comment.user.username.charAt(0).toUpperCase()}</div>
                    )}
                  </Link>
                  <div className="comment-content">
                    <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Link to={`/profile/${comment.user._id}`} className="comment-user">
                          {comment.user.username}
                        </Link>
                        <span className="comment-text">{comment.text}</span>
                      </div>
                      {comment.user._id === currentUser._id && (
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteComment(comment._id)}
                          style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="comment-time">
                      {comment.createdAt ? formatCompactTime(comment.createdAt) : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Bottom: Fixed Input Form */}
          <div className="comments-side-footer">
            <form className="comment-form" onSubmit={handleComment}>
              <div className="avatar sm" style={{ flexShrink: 0, width: 32, height: 32 }}>
                {currentUser.profilePic ? (
                  <img src={`http://localhost:5001${currentUser.profilePic}`} alt="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <span style={{ fontSize: '0.9rem' }}>{currentUser.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={!commentText.trim()}>Post</button>
            </form>
          </div>
          
        </div>
      )}

    </div>
  );
};

export default Post;
