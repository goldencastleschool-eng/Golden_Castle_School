import axios from "axios";

const AUTH_TOKEN_STORAGE_KEY = "gcs_auth_token";

export const getAuthToken = () => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return "";
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // Storage can be unavailable in some private browsing contexts.
  }
};

export const clearAuthToken = () => {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in some private browsing contexts.
  }
};

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle expired or invalid sessions
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      clearAuthToken();

      const redirectPath = window.location.pathname.startsWith("/reports")
        ? "/executive-login"
        : window.location.pathname.startsWith("/admin")
        ? "/secure-admin-login"
        : "/login";

      // Prevent redirect loop on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = redirectPath;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
