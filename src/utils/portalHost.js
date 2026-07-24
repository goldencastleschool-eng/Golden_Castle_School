const portalHostnames = (
  import.meta.env.VITE_PORTAL_HOSTNAMES ||
  "portal.goldencastleschool.com,portal.goldencastle.com"
)
  .split(",")
  .map((hostname) => hostname.trim().toLowerCase())
  .filter(Boolean);

export const isPortalHostname = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return portalHostnames.includes(window.location.hostname.toLowerCase());
};

export const getPortalLoginPath = (fallbackPath = "/login") => {
  if (!isPortalHostname()) {
    return fallbackPath;
  }

  if (fallbackPath === "/secure-admin-login" || fallbackPath === "/executive-login") {
    return fallbackPath;
  }

  return "/student-login";
};

export const getPortalLoginPathForCurrentRoute = () => {
  if (typeof window === "undefined") {
    return "/login";
  }

  if (window.location.pathname.startsWith("/reports")) {
    return getPortalLoginPath("/executive-login");
  }

  if (window.location.pathname.startsWith("/admin")) {
    return getPortalLoginPath("/secure-admin-login");
  }

  return getPortalLoginPath("/login");
};
