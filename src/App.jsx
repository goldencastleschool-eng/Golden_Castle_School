import { Outlet } from "react-router-dom";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// SHARED COMPONENTS
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";

import AdminLogin from './Pages/auth/AdminLogin.jsx'




function App() {
  return (
    <div className="min-h-screen flex flex-col">
      
      {/* HEADER */}
      <Header />

      {/* PAGE CONTENT */}
      <main className="flex-1">
       
        <Outlet />
      </main>
      <Analytics/>
      <SpeedInsights/>

      {/* FOOTER */}
      <Footer />
      
    </div>
  );
}

export default App;