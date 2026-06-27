import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PostModal from '../components/PostModal';
import { UserPlus, UserMinus, MessageSquare, Edit2, Play } from 'lucide-react';
import '../styles/Profile.css';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/users/${id}`);
      setProfile(data);
      // Fetch user's posts
      const postsRes = await api.get(`/posts/profile/${id}`);
      setPosts(postsRes.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    try {
      await api.put(`/users/${id}/follow`);
      fetchProfile();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="container"><p className="loading-text">Loading profile...</p></div>;
  if (!profile) return <div className="container"><p className="no-posts">User not found</p></div>;

  const isOwner = currentUser._id === profile._id;
  const isFollowing = profile.followers.some(f => f._id === currentUser._id);

  return (
    <div className="profile-container container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profilePic ? (
            <img src={`http://localhost:5001${profile.profilePic}`} alt="avatar" />
          ) : (
            <span>{profile.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        
        <div className="profile-info">
          <div className="profile-top">
            <h2>{profile.username}</h2>
            
            <div className="profile-actions">
              {isOwner ? (
                <button className="btn-secondary">
                  <Edit2 size={16} /> Edit Profile
                </button>
              ) : (
                <>
                  <button className={`btn-primary ${isFollowing ? 'following' : ''}`} onClick={handleFollow}>
                    {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <button className="btn-secondary">
                    <MessageSquare size={16} /> Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <span><strong>{posts.length}</strong> posts</span>
            <span><strong>{profile.followers.length}</strong> followers</span>
            <span><strong>{profile.following.length}</strong> following</span>
          </div>

          <div className="profile-bio">
            <p className="user-id">@{profile.userId}</p>
            <p>{profile.bio}</p>
          </div>
        </div>
      </div>

      <div className="profile-posts-grid">
        {posts.length > 0 ? posts.map(post => {
          if (!post.media) return null; // Instagram grid primarily shows media
          return (
            <div key={post._id} className="profile-grid-item" onClick={() => setSelectedPost(post)}>
              {post.mediaType === 'video' ? (
                <>
                  <video src={`http://localhost:5001${post.media}`} />
                  <div className="video-indicator"><Play size={20} fill="white" /></div>
                </>
              ) : (
                <img src={`http://localhost:5001${post.media}`} alt="Post" />
              )}
              <div className="grid-overlay">
                <div className="grid-overlay-stats">
                  <span>❤️ {post.likes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          )
        }) : (
          <div className="no-posts-container" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p className="no-posts">No posts yet</p>
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => { setSelectedPost(null); fetchProfile(); }} />
      )}
    </div>
  );
};

export default Profile;
