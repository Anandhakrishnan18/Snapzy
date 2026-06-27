import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
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
    <div className="post-card">
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
            <span className="post-time">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
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

      {showComments && (
        <div className="comments-section">
          <form className="comment-form" onSubmit={handleComment}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
          
          <div className="comments-list">
            {post.comments.map(comment => (
              <div key={comment._id} className="comment-item">
                <Link to={`/profile/${comment.user._id}`} className="comment-avatar">
                  {comment.user.profilePic ? (
                    <img src={`http://localhost:5001${comment.user.profilePic}`} alt="avatar" />
                  ) : (
                    <div className="avatar-placeholder-sm">{comment.user.username.charAt(0).toUpperCase()}</div>
                  )}
                </Link>
                <div className="comment-content">
                  <div className="comment-header">
                    <Link to={`/profile/${comment.user._id}`} className="comment-user">
                      <strong>{comment.user.username}</strong>
                    </Link>
                  </div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-time">
                    {comment.createdAt ? `${formatDistanceToNow(new Date(comment.createdAt))} ago` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
