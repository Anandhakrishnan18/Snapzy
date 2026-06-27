import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Post from '../components/Post';
import { Image, Video, Send } from 'lucide-react';
import '../styles/Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchFeed = async () => {
    try {
      const { data } = await api.get('/posts/feed');
      setPosts(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content && !media) return;

    const formData = new FormData();
    formData.append('content', content);
    if (media) formData.append('media', media);

    try {
      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setContent('');
      setMedia(null);
      fetchFeed(); // Refresh feed
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="home-container container">
      <div className="feed-header">
        <h2>Home Feed</h2>
      </div>

      <div className="create-post-card">
        <div className="create-post-top">
          <div className="avatar">
            {user.profilePic ? (
              <img src={`http://localhost:5001${user.profilePic}`} alt="avatar" />
            ) : (
              <span>{user.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        {media && (
          <div className="media-preview">
            <span>{media.name}</span>
            <button onClick={() => setMedia(null)}>X</button>
          </div>
        )}

        <div className="create-post-bottom">
          <div className="media-actions">
            <label className="media-btn">
              <Image size={20} />
              <input type="file" accept="image/*" onChange={(e) => setMedia(e.target.files[0])} hidden />
            </label>
            <label className="media-btn">
              <Video size={20} />
              <input type="file" accept="video/*" onChange={(e) => setMedia(e.target.files[0])} hidden />
            </label>
          </div>
          <button className="post-btn" onClick={handlePostSubmit}>
            <Send size={18} /> Post
          </button>
        </div>
      </div>

      <div className="feed-posts">
        {loading ? (
          <p className="loading-text">Loading feed...</p>
        ) : posts.length === 0 ? (
          <p className="no-posts">No posts yet. Follow someone to see their posts!</p>
        ) : (
          posts.map(post => <Post key={post._id} post={post} onUpdate={fetchFeed} currentUser={user} />)
        )}
      </div>
    </div>
  );
};

export default Home;
