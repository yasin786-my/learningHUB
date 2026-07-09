/**
 * LearningHUB — Auth Context (login, logout, current user)
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lhub_user');
    const token  = localStorage.getItem('lhub_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      // Optionally validate token with /me
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('lhub_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { username: identifier, password });
    const { token, user: u } = res.data;
    localStorage.setItem('lhub_token', token);
    localStorage.setItem('lhub_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('lhub_token');
    localStorage.removeItem('lhub_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
