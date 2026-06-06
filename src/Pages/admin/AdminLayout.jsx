// React Router imports
// NavLink => Creates navigation links with active state
// Outlet => Renders child routes inside this layout
// useNavigate => Used for programmatic navigation
import { NavLink, Outlet, useNavigate } from "react-router-dom";

// Icons used throughout the admin dashboard
import {
  FaChartLine,
  FaClipboardCheck,
  FaFileLines,
  FaLayerGroup,
  FaRightFromBracket,
  FaUserGraduate,
  FaUserShield,
} from "react-icons/fa6";

// Authentication context
// Provides current user data and logout function
import { useAuth } from "../../context/AuthContext.jsx";

// Axios instance for API requests
import API from "../../api/axios.jsx";

/* ==================================================
   ADMIN NAVIGATION LINKS
   --------------------------------------------------
   Central location for all admin navigation items.
   Each object contains:
   - label => Text displayed in menu
   - path => Route path
   - icon => Icon displayed beside label
   - end => Exact matching for overview route
================================================== */
const adminLinks = [
  {
    label: "Overview",
    path: "/admin",
    icon: <FaChartLine />,
    end: true,
  },
  {
    label: "Students",
    path: "/admin/students",
    icon: <FaUserGraduate />,
  },
  {
    label: "Classes",
    path: "/admin/classes",
    icon: <FaLayerGroup />,
  },
  {
    label: "Results",
    path: "/admin/results",
    icon: <FaClipboardCheck />,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: <FaFileLines />,
  },
];

function AdminLayout() {
  // Router navigation hook
  const navigate = useNavigate();

  // Get authenticated user and logout function
  const { logout } = useAuth();

  /* ==========================================
     HANDLE LOGOUT
     ------------------------------------------
     1. Notify backend that user is logging out
     2. Clear authentication state
     3. Redirect to login page
  ========================================== */
  const handleLogout = async () => {
    await API.post("/auth/logout").catch(() => {});
    await logout();
    navigate("/login");
  };

  /* ==========================================
     ACTIVE NAVIGATION STYLING
     ------------------------------------------
     React Router automatically provides
     isActive.

     Active link:
     - Button background
     - Secondary text
     - Shadow

     Inactive link:
     - Muted text
     - Hover effects
  ========================================== */
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-5 py-4 font-semibold transition-all duration-300 ${
      isActive
        ? "bg-button text-secondary shadow-lg"
        : "text-primary/80 hover:bg-primary/10 hover:text-primary"
    }`;

  return (
    // Main page wrapper
    <main className="min-h-screen bg-background">

      {/* =====================================
          MAIN GRID LAYOUT

          Mobile:
          1 Column

          Desktop (lg):
          Sidebar = 300px
          Content = Remaining Width
      ===================================== */}
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">

        {/* =====================================
            SIDEBAR
        ===================================== */}
        <aside className="bg-secondary px-5 py-6 gap-10 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between">

          {/* =================================
              ADMIN LOGO / BRANDING
          ================================= */}
          <div className="w-full flex justify-between items-center gap-6">

            <div className="flex items-center gap-3">
              {/* Logo Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-2xl text-secondary shadow-xl">
              <FaUserShield />
            </div>

            {/* School Information */}
            <div>
              <h1 className="text-2xl font-extrabold text-primary">
                Admin Portal
              </h1>

              <p className="mt-1 text-sm text-primary/70">
                Golden Castle School
              </p>
            </div>
            </div>

            {/* =================================
              LOGOUT BUTTON
          ================================= */}
          <button
            onClick={handleLogout}
            className="flex  cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] lg:hidden"
          >
            <FaRightFromBracket />
            Logout
          </button>
          </div>

          {/* =================================
              NAVIGATION LINKS

              Mobile:
              Horizontal scrolling

              Desktop:
              Vertical sidebar menu
          ================================= */}
          <nav className="mt-8 flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">

            {adminLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={linkClass}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

       

          {/* =================================
              LOGOUT BUTTON
          ================================= */}
          <button
            onClick={handleLogout}
            className="hidden lg:block mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <FaRightFromBracket />
            Logout
          </button>
        </aside>

        {/* =====================================
            MAIN CONTENT AREA

            Child routes render here through
            React Router's Outlet component.
        ===================================== */}
        <section className="min-w-0">
          <Outlet />
        </section>

      </div>
    </main>
  );
}

export default AdminLayout;
