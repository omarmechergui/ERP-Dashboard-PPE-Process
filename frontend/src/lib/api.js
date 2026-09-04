import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000',
  timeout: 600000, // 10 minutes for large Excel imports on MongoDB free tier
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (like 401 Unauthorized)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip aborted/canceled requests entirely (from AbortController or unmounted components)
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized — redirect to login and stop
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(new Error("Session expirée, veuillez vous reconnecter."));
    }

    // Log genuine errors for debugging
    console.error("API Error intercepted:", JSON.stringify({
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    }, null, 2));

    // Enrich error.message with server-provided text for backward compatibility,
    // while preserving the full Axios error object (response, status, etc.)
    const errorData = error.response?.data;
    const serverMessage = errorData?.error || errorData?.message;
    if (serverMessage) {
      error.message = serverMessage;
    } else if (!error.response) {
      error.message = "Le serveur backend est inaccessible. Assurez-vous qu'il est bien démarré.";
    }
    return Promise.reject(error);
  }
);

export default API;
