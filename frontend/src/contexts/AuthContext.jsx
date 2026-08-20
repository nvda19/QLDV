import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Mỗi lần app khởi động lại (reload trang), kiểm tra token đã lưu còn hợp lệ hay không
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        setUser(res.data);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    const { token: newToken, refreshToken, RefreshToken, user: newUser } = res.data;
    const finalRefreshToken = refreshToken || RefreshToken;
    localStorage.setItem('token', newToken);
    if (finalRefreshToken) {
      localStorage.setItem('refreshToken', finalRefreshToken);
    }
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout API failed", e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const changePassword = useCallback(async (newPassword) => {
    await authApi.changePassword(newPassword);
    const res = await authApi.getMe();
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
  }, []);

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    login,
    logout,
    changePassword,
    loading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
