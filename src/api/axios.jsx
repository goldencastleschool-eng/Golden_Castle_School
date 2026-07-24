import axios from "axios";

import { clearAuthToken, getAuthToken } from "../utils/authToken.js";
import { getPortalLoginPathForCurrentRoute } from "../utils/portalHost.js";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
  withCredentials: false,
});

API.interceptors.request.use((config) => {
  config.withCredentials = false;

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

      const redirectPath = getPortalLoginPathForCurrentRoute();

      // Prevent redirect loop on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = redirectPath;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
