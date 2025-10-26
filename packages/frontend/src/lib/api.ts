import axios from 'axios';
import { useAuthStore } from '@/state/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Important for sending cookies (like the refresh token)
});

// Request interceptor to add the JWT access token to every request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh logic (optional but good practice)
// For simplicity, this example just handles 401 by logging out.
// A full implementation would attempt to use the refresh token.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // If a request is unauthorized, it might be due to an expired token.
      // Log the user out to force a new login.
      console.log('Unauthorized request. Logging out.');
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Force redirect
    }
    return Promise.reject(error);
  }
);

export default api;