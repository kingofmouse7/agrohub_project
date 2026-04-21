import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await API.get('/me/');
      setUser(response.data.user);
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    const response = await API.post('/register/', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setProfile(response.data.profile);
    }
    return response.data;
  };

  const login = async (username, password) => {
    const response = await API.post('/login/', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setProfile(response.data.profile);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await API.post('/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const fetchWallet = async () => {
    try {
      const response = await API.get('/wallet/');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  };

  const value = {
    user,
    profile,
    loading,
    register,
    login,
    logout,
    fetchWallet,
    isAuthenticated: !!user,
    isSeller: profile?.role === 'seller',
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};