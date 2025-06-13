import api from './api';

export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const login = (credentials) => {
  // Ingat, backend mengharapkan JSON dengan 'email' dan 'password'
  return api.post('/auth/login', credentials);
};

export const fetchCurrentUser = (token) => {
  return api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};