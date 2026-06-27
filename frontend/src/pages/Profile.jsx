import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Post from '../components/Post';
import { UserPlus, UserMinus, MessageSquare, Edit2 } from 'lucide-react';
import '../styles/Profile.css';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/users/${id}`);
      setProfile(data);
      // Fetch user's posts
      const feedRes = await api.get('/posts/feed'); // For now, filtering from feed. Ideally, a separate endpoint.
      const userPosts = feedRes.data.filter(p => p.user._id === id);
      setPosts(userPosts);
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
        {posts.map(post => (
          <Post key={post._id} post={post} onUpdate={fetchProfile} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
};

export default Profile;
