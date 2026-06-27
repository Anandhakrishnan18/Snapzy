import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/Search.css';
import PostModal from '../components/PostModal';

const Search = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [discoverPosts, setDiscoverPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim() === '') {
        setUsers([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await api.get(`/users/search?search=${query}`);
        setUsers(data);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch Discover Grid Posts
  const fetchDiscoverPosts = useCallback(async (pageNum) => {
    if (loadingPosts || !hasMore) return;
    setLoadingPosts(true);
    try {
      const { data } = await api.get(`/posts/discover?page=${pageNum}&limit=28`);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setDiscoverPosts(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error fetching discover posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  }, [loadingPosts, hasMore]);

  useEffect(() => {
    fetchDiscoverPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDiscoverPosts(nextPage);
  };

  return (
    <div className="search-page-container">
      {/* Sticky Search Bar */}
      <div className="search-header">
        <div className="search-bar-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="search-content">
        {query ? (
          /* Search Results */
          <div className="search-results">
            {isSearching ? (
              <div className="loading-spinner"></div>
            ) : users.length > 0 ? (
              users.map(user => (
                <div key={user._id} className="user-result-card">
                  <Link to={`/profile/${user._id}`} className="user-result-info">
                    {user.profilePic ? (
                      <img src={`http://localhost:5001${user.profilePic}`} alt={user.username} className="user-result-avatar" />
                    ) : (
                      <div className="user-result-avatar-placeholder">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="user-result-details">
                      <h4>{user.username}</h4>
                      <p>@{user.userId}</p>
                    </div>
                  </Link>
                  <Link to={`/profile/${user._id}`} className="btn-primary small-btn">View Profile</Link>
                </div>
              ))
            ) : (
              <div className="no-results">No users found</div>
            )}
          </div>
        ) : (
          /* Discover Grid */
          <div className="discover-section">
            <h3 className="discover-title">Discover</h3>
            <div className="discover-grid">
              {discoverPosts.map(post => (
                <div key={post._id} className="grid-item" onClick={() => setSelectedPost(post)}>
                  {post.mediaType === 'video' ? (
                    <video src={`http://localhost:5001${post.media}`} muted loop onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
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
              ))}
            </div>
            
            {hasMore && (
              <div className="load-more-container">
                <button className="btn-primary load-more-btn" onClick={handleLoadMore} disabled={loadingPosts}>
                  {loadingPosts ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
            {!hasMore && discoverPosts.length > 0 && (
              <div className="no-results mt-4">You've reached the end</div>
            )}
          </div>
        )}
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
};

export default Search;
