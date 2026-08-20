import { Outlet } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// SHARED COMPONENTS
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";
import { isPortalHostname } from "./utils/portalHost.js";
import Seo from "./components/common/Seo.jsx";

function App() {
  const showPublicChrome = !isPortalHostname();

  return (
    <div className="min-h-screen flex flex-col">
      <Seo />
      
      {/* HEADER */}
      {showPublicChrome && <Header />}

      {/* PAGE CONTENT */}
      <main className="flex-1">
       
        <Outlet />
      </main>
      <Analytics/>
      <SpeedInsights/>

      {/* FOOTER */}
      {showPublicChrome && <Footer />}
      
    </div>
  );
}

export default App;
