import { useEffect, useState } from "react";
import API from "../api/axios.jsx";
import AuthContext from "./AuthContext.js";
import {
  clearAuthToken,
  clearLegacyAuthCookies,
  getAuthTokenExpirationTime,
  getAuthToken,
} from "../utils/authToken.js";
import { getPortalLoginPathForCurrentRoute } from "../utils/portalHost.js";

const redirectToLogin = () => {
  if (typeof window === "undefined" || window.location.pathname.includes("/login")) {
    return;
  }

  window.location.href = getPortalLoginPathForCurrentRoute();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      clearLegacyAuthCookies();

      if (!getAuthToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await API.get("/auth/me", {
          skipAuthRedirect: true,
        });

        setUser(response.data?.user || null);
      } catch {
        clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const token = getAuthToken();
    const expiresAt = getAuthTokenExpirationTime(token);
    const msUntilExpiry = expiresAt - Date.now();

    if (!expiresAt || msUntilExpiry <= 0) {
      clearAuthToken();
      setUser(null);
      redirectToLogin();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearAuthToken();
      setUser(null);
      redirectToLogin();
    }, msUntilExpiry);

    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
