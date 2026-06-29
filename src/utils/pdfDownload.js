import API from "../api/axios.jsx";

export const isIOSDevice = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";

  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const buildAuthenticatedPdfUrl = (path) => {
  const token = localStorage.getItem("token");
  const baseUrl = API.defaults.baseURL || "";
  const url = new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`);

  if (token) {
    url.searchParams.set("token", token);
  }

  return url.href;
};

export const openPdfNativelyOnIOS = (path) => {
  if (!isIOSDevice()) {
    return false;
  }

  window.open(buildAuthenticatedPdfUrl(path), "_blank", "noopener,noreferrer");
  return true;
};

export const downloadPdfBlob = async ({ path, fileName }) => {
  const response = await API.get(path, {
    responseType: "blob",
  });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
};
