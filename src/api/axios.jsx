import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
  withCredentials: true,
});

// Handle expired or invalid sessions
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
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
