const AUTH_TOKEN_STORAGE_KEY = "gcs_access_token";
const LEGACY_AUTH_COOKIE_NAMES = [
  "token",
  "jwt",
  "authToken",
  "auth_token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "gcs_auth",
  "gcs_auth_token",
  "gcs_access_token",
  "connect.sid",
];

const getCookieDomainCandidates = () => {
  if (typeof window === "undefined") {
    return [""];
  }

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const rootDomain = parts.length > 2 ? `.${parts.slice(-2).join(".")}` : "";

  return ["", hostname, rootDomain].filter(Boolean);
};

export const clearLegacyAuthCookies = () => {
  if (typeof document === "undefined") {
    return;
  }

  const expires = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const paths = ["/", "/api"];
  const domains = getCookieDomainCandidates();

  LEGACY_AUTH_COOKIE_NAMES.forEach((name) => {
    paths.forEach((path) => {
      document.cookie = `${name}=; ${expires}; path=${path}`;

      domains.forEach((domain) => {
        document.cookie = `${name}=; ${expires}; path=${path}; domain=${domain}`;
      });
    });
  });
};

const decodeJwtPayload = (token) => {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
};

export const getAuthTokenPayload = (token) => decodeJwtPayload(token);

export const getAuthTokenExpirationTime = (token) => {
  const payload = decodeJwtPayload(token);

  return payload?.exp ? payload.exp * 1000 : 0;
};

export const isUsableAuthToken = (token) => {
  if (!token || typeof token !== "string") {
    return false;
  }

  const payload = decodeJwtPayload(token);

  if (!payload?.id || !payload?.role) {
    return false;
  }

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
};

export const getAuthToken = () => {
  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

    if (!isUsableAuthToken(token)) {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      return "";
    }

    return token;
  } catch {
    return "";
  }
};

export const setAuthToken = (token) => {
  try {
    if (isUsableAuthToken(token)) {
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
