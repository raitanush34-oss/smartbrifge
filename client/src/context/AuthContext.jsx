import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('staffsync_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('staffsync_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser({
              ...res.data.data.user,
              employee: res.data.data.employee,
              name: res.data.data.employee
                ? `${res.data.data.employee.firstName} ${res.data.data.employee.lastName}`
                : res.data.data.user.email.split('@')[0],
              department: res.data.data.employee?.department || 'General',
              designation: res.data.data.employee?.designation || 'Staff',
              avatar: res.data.data.employee?.avatar || '',
            });
          }
        } catch (error) {
          console.error('Session restore failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { token, refreshToken, user } = res.data.data;
        localStorage.setItem('staffsync_token', token);
        localStorage.setItem('staffsync_refresh_token', refreshToken);
        localStorage.setItem('staffsync_user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        return { success: true, user };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please verify credentials.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('staffsync_token');
      localStorage.removeItem('staffsync_refresh_token');
      localStorage.removeItem('staffsync_user');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (...roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
