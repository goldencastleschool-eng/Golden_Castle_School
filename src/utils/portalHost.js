const DEFAULT_PORTAL_HOST_MAP = {
  "student.goldencastleschool.com": "student",
  "portal.goldencastleschool.com": "student",
  "staff.goldencastleschool.com": "teacher",
  "admin.goldencastleschool.com": "admin",
  "executive.goldencastleschool.com": "executive",
  "portal.goldencastle.com": "student",
};

const parsePortalHostMap = () => {
  const rawMap = import.meta.env.VITE_PORTAL_HOST_MAP || "";

  return rawMap
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((hostMap, entry) => {
      const [hostname, portalType] = entry.split(":").map((part) => part?.trim());

      if (hostname && portalType) {
        hostMap[hostname.toLowerCase()] = portalType.toLowerCase();
      }

      return hostMap;
    }, { ...DEFAULT_PORTAL_HOST_MAP });
};

const portalHostMap = parsePortalHostMap();

export const PORTAL_TYPES = {
  STUDENT: "student",
  TEACHER: "teacher",
  ADMIN: "admin",
  EXECUTIVE: "executive",
};

export const getCurrentPortalType = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return portalHostMap[window.location.hostname.toLowerCase()] || "";
};

export const isPortalHostname = () => Boolean(getCurrentPortalType());

export const getPortalLoginPath = (fallbackPath = "/login") => {
  const portalType = getCurrentPortalType();

  if (portalType === PORTAL_TYPES.STUDENT) {
    return "/student-login";
  }

  if (portalType === PORTAL_TYPES.TEACHER) {
    return "/teacher-login";
  }

  if (portalType === PORTAL_TYPES.ADMIN) {
    return "/secure-admin-login";
  }

  if (portalType === PORTAL_TYPES.EXECUTIVE) {
    return "/executive-login";
  }

  return fallbackPath;
};

export const getPortalHomePath = () => {
  const portalType = getCurrentPortalType();

  if (portalType === PORTAL_TYPES.STUDENT) {
    return "/student-login";
  }

  if (portalType === PORTAL_TYPES.TEACHER) {
    return "/teacher-login";
  }

  if (portalType === PORTAL_TYPES.ADMIN) {
    return "/secure-admin-login";
  }

  if (portalType === PORTAL_TYPES.EXECUTIVE) {
    return "/executive-login";
  }

  return "/";
};

export const getPortalLoginPathForCurrentRoute = () => {
  if (typeof window === "undefined") {
    return "/login";
  }

  return getPortalLoginPath(
    window.location.pathname.startsWith("/reports")
      ? "/executive-login"
      : window.location.pathname.startsWith("/admin")
        ? "/secure-admin-login"
        : window.location.pathname.startsWith("/teacher")
          ? "/teacher-login"
          : window.location.pathname.startsWith("/student")
            ? "/student-login"
            : "/login"
  );
};
