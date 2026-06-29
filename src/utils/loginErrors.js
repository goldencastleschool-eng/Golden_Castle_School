const roleLabels = {
  admin: "admin",
  executive: "principal/chairman",
  student: "student",
  teacher: "teacher",
};

const identifierLabels = {
  admin: "username",
  executive: "username",
  student: "admission number",
  teacher: "username",
};

export const getPortalLoginErrorMessage = (requestError, role = "student") => {
  const status = requestError.response?.status;
  const responseData = requestError.response?.data;
  const backendMessage =
    typeof responseData === "string"
      ? responseData
      : responseData?.message || responseData?.error || "";
  const roleLabel = roleLabels[role] || "portal";
  const identifierLabel = identifierLabels[role] || "login ID";

  if (!requestError.response) {
    return "We could not reach the portal server. Please check your internet connection and try again.";
  }

  if (status === 404) {
    return "This portal login is not available right now. Please contact the school administrator.";
  }

  if (status === 429) {
    return "Too many login attempts. Please wait a few minutes, then try again.";
  }

  if (status === 400) {
    return backendMessage || `Enter your ${identifierLabel} and password to continue.`;
  }

  if (status === 401) {
    return `We could not sign you in. Please check your ${identifierLabel}, password, and selected ${roleLabel} portal, then try again.`;
  }

  if (status === 403) {
    return (
      backendMessage ||
      `This ${roleLabel} account cannot access the portal right now. Please contact the school administrator.`
    );
  }

  return (
    backendMessage ||
    "Something went wrong while signing in. Please try again, or contact the school administrator if it continues."
  );
};
