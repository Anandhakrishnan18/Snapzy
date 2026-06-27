import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Settings.css';

const Settings = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('account');
  const [message, setMessage] = useState('');
  
  // Account Form
  const [profilePic, setProfilePic] = useState(null);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio || '');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Privacy & Notifications Form
  const [privacy, setPrivacy] = useState(user.privacy || {});
  const [notifications, setNotifications] = useState(user.notifications || {});

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('bio', bio);
      if (profilePic) {
        formData.append('profilePic', profilePic);
      }
      
      await updateProfile(formData);
      setMessage('Account updated successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Update failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirmPassword) {
      return setMessage('New passwords do not match');
    }
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Password update failed');
    }
  };

  const handleUpdatePrivacy = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('privacy', JSON.stringify(privacy));
      formData.append('notifications', JSON.stringify(notifications));
      await updateProfile(formData);
      setMessage('Settings updated successfully!');
    } catch (error) {
      setMessage('Settings update failed');
    }
  };

  return (
    <div className="settings-container container">
      <h2>Settings</h2>
      
      <div className="settings-layout">
        <div className="settings-sidebar">
          <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>Account</button>
          <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}>Privacy & Notifications</button>
          <button className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>Change Password</button>
        </div>

        <div className="settings-content">
          {message && <div className="settings-message">{message}</div>}

          {activeTab === 'account' && (
            <form onSubmit={handleUpdateAccount} className="settings-form">
              <h3>Edit Profile</h3>
              <div className="form-group">
                <label>Profile Picture</label>
                <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="3" />
              </div>
              <button type="submit" className="btn-primary">Save Changes</button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="settings-form">
              <h3>Change Password</h3>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary">Update Password</button>
            </form>
          )}

          {activeTab === 'privacy' && (
            <form onSubmit={handleUpdatePrivacy} className="settings-form">
              <h3>Privacy</h3>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={privacy.isPrivate} onChange={(e) => setPrivacy({...privacy, isPrivate: e.target.checked})} />
                  Private Account
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={privacy.showOnlineStatus} onChange={(e) => setPrivacy({...privacy, showOnlineStatus: e.target.checked})} />
                  Show Online Status
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={privacy.readReceipts} onChange={(e) => setPrivacy({...privacy, readReceipts: e.target.checked})} />
                  Read Receipts
                </label>
              </div>

              <h3 className="mt-4">Notifications</h3>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={notifications.likes} onChange={(e) => setNotifications({...notifications, likes: e.target.checked})} />
                  Likes
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={notifications.comments} onChange={(e) => setNotifications({...notifications, comments: e.target.checked})} />
                  Comments
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={notifications.messages} onChange={(e) => setNotifications({...notifications, messages: e.target.checked})} />
                  Messages
                </label>
              </div>
              <button type="submit" className="btn-primary mt-4">Save Privacy & Notifications</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
