import { useEffect, useState } from "react";
import API from "../api/axios.jsx";
import AuthContext from "./AuthContext.js";
import { clearAuthToken } from "../utils/authToken.js";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await API.get("/auth/me", {
          skipAuthRedirect: true,
        });

        setUser(response.data?.user || null);
      } catch {
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
