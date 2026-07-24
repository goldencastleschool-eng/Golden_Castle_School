import { useEffect, useState } from "react";
import API from "../api/axios.jsx";
import AuthContext from "./AuthContext.js";
import { clearAuthToken, getAuthToken } from "../utils/authToken.js";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
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
