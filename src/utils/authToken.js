const AUTH_TOKEN_STORAGE_KEY = "gcs_access_token";

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
