import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear old localStorage if present to prevent lingering data
    localStorage.removeItem('userInfo');
    
    const userInfo = sessionStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (loginId, password) => {
    const { data } = await api.post('/auth/login', { loginId, password });
    sessionStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('userInfo');
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  const updateProfile = async (formData) => {
    const { data } = await api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // merge token from current user
    const updatedUser = { ...data, token: user.token };
    sessionStorage.setItem('userInfo', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
