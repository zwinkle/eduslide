import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, register as registerService, fetchCurrentUser } from '../services/authService';
import api from '../services/api';

// 1. Membuat Context
const AuthContext = createContext(null);

// 2. Membuat Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cek token saat aplikasi pertama kali dimuat
    const validateToken = async () => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await fetchCurrentUser(token);
          setUser(response.data);
        } catch (error) {
          // Token tidak valid atau kadaluarsa
          console.error("Invalid token, logging out");
          logout();
        }
      }
      setIsLoading(false);
    };
    validateToken();
  }, [token]);

  const login = async (credentials) => {
    const response = await loginService(credentials);
    const { access_token } = response.data;
    setToken(access_token);
    localStorage.setItem('token', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    // Ambil data user setelah login
    const userResponse = await fetchCurrentUser(access_token);
    setUser(userResponse.data);
  };

  const register = async (userData) => {
    // Fungsi register di backend kita hanya mendaftarkan, tidak otomatis login
    await registerService(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
  };

  // Tampilkan loading screen jika sedang validasi token
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Membuat custom hook untuk menggunakan context
export const useAuth = () => {
  return useContext(AuthContext);
};