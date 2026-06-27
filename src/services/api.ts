import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired tokens and format errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const response = error.response;
    let errorData = {
      message: 'Network error or server is unreachable',
      status: error.status || 500,
      errorCode: 'NETWORK_ERROR',
      details: null as any
    };

    if (response) {
      const status = response.status;
      const data = response.data;
      
      errorData.status = status;
      errorData.errorCode = data?.errorCode || 'API_ERROR';
      errorData.details = data?.details || null;
      errorData.message = data?.message || 'An error occurred';

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        errorData.message = data?.message || 'Session expired. Please log in again.';
        errorData.errorCode = 'UNAUTHORIZED';
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      } else if (status === 403) {
        errorData.message = data?.message || 'You do not have permission to perform this action.';
        errorData.errorCode = 'FORBIDDEN';
      } else if (status === 404) {
        errorData.message = data?.message || 'Requested resource not found.';
        errorData.errorCode = 'NOT_FOUND';
      } else if (status === 409) {
        errorData.message = data?.message || 'A duplicate entry already exists.';
        errorData.errorCode = 'CONFLICT';
      } else if (status === 422) {
        errorData.message = data?.message || 'Unprocessable entity.';
        errorData.errorCode = 'UNPROCESSABLE';
      } else if (status === 429) {
        errorData.message = 'Too many requests. Please try again later.';
        errorData.errorCode = 'RATE_LIMIT';
      } else if (status >= 500) {
        errorData.message = data?.message || 'Server error. Please contact administration.';
        errorData.errorCode = 'SERVER_ERROR';
      }

      // Format validation errors
      if (data?.errorCode === 'VALIDATION_ERROR' && data?.details) {
        const fieldErrors = Object.entries(data.details)
          .map(([field, msgs]) => {
            const fieldMsg = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
            return `${field}: ${fieldMsg}`;
          })
          .join('; ');
        errorData.message = `Validation failed: ${fieldErrors}`;
      }
    } else if (error.message) {
      errorData.message = error.message;
    }

    return Promise.reject(errorData);
  }
);

