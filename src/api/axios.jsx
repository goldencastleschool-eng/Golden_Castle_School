import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://golden-castle-school-api.onrender.com/api",
});

// Attach JWT to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired or invalid tokens
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

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
