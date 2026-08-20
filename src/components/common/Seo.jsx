import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteName = "Golden Castle International School";
const siteUrl = "https://www.goldencastleschool.com";
const defaultDescription = "Golden Castle International School provides quality nursery, basic, secondary, boarding, and computer education in Nigeria.";

const pageMetadata = {
  "/": { title: siteName, description: defaultDescription },
  "/about": { title: `About Us | ${siteName}`, description: "Learn about Golden Castle International School, our values, learning environment, and commitment to academic excellence." },
  "/contact": { title: `Contact Us | ${siteName}`, description: "Contact Golden Castle International School for admissions, enquiries, and school information." },
  "/gallery": { title: `School Gallery | ${siteName}`, description: "Explore life, learning, and activities at Golden Castle International School." },
  "/programs": { title: `Our Programmes | ${siteName}`, description: "Explore nursery, basic, secondary, boarding, computer training, and music and arts programmes." }
};

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const [key, keyValue] = attribute;
    element.setAttribute(key, keyValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
};

function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPrivateRoute = ["/admin", "/teacher", "/student", "/reports", "/login", "/teacher-login", "/secure-admin-login", "/student-login", "/executive-login"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
    const metadata = pageMetadata[pathname] || (pathname.startsWith("/programs/") ? { title: `Programmes | ${siteName}`, description: "Discover the learning programmes available at Golden Castle International School." } : { title: siteName, description: defaultDescription });
    document.title = metadata.title;
    setMeta('meta[name="description"]', ["name", "description"], metadata.description);
    setMeta('meta[name="robots"]', ["name", "robots"], isPrivateRoute ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', ["property", "og:title"], metadata.title);
    setMeta('meta[property="og:description"]', ["property", "og:description"], metadata.description);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", `${siteUrl}${pathname}`);
  }, [pathname]);

  return null;
}

export default Seo;
