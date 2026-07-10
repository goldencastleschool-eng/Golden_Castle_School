// React Router imports
// NavLink => Creates navigation links with active state
// Outlet => Renders child routes inside this layout
// useNavigate => Used for programmatic navigation
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

// Icons used throughout the admin dashboard
import {
  FaAnglesLeft,
  FaAnglesRight,
  FaBars,
  FaBed,
  FaBullhorn,
  FaBus,
  FaChartLine,
  FaChartPie,
  FaClipboardCheck,
  FaChalkboardUser,
  FaEye,
  FaLayerGroup,
  FaMoneyBillWave,
  FaReceipt,
  FaRightFromBracket,
  FaUserGraduate,
  FaUserShield,
  FaXmark,
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
    label: "Teachers",
    path: "/admin/teachers",
    icon: <FaChalkboardUser />,
  },
  {
    label: "Classes",
    path: "/admin/classes",
    icon: <FaLayerGroup />,
  },
  {
    label: "Fees",
    path: "/admin/fees",
    icon: <FaReceipt />,
  },
  {
    label: "Buses",
    path: "/admin/buses",
    icon: <FaBus />,
  },
  {
    label: "Boarding",
    path: "/admin/boarding",
    icon: <FaBed />,
  },
  {
    label: "Payroll",
    path: "/admin/payroll",
    icon: <FaMoneyBillWave />,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: <FaChartPie />,
  },
  {
    label: "Results",
    path: "/admin/results",
    icon: <FaClipboardCheck />,
  },
  {
    label: "Portal Status",
    path: "/admin/portal-status",
    icon: <FaEye />,
  },
  {
    label: "Portal Notices",
    path: "/admin/portal-notices",
    icon: <FaBullhorn />,
  },
];

function AdminLayout() {
  // Router navigation hook
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get authenticated user and logout function
  const { user, logout } = useAuth();

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
    `flex shrink-0 items-center gap-3 rounded-lg px-5 py-4 font-semibold transition-all duration-300 lg:w-full ${
      sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
    } ${
      isActive
        ? "bg-button text-secondary shadow-lg"
        : "text-primary/80 hover:bg-primary/10 hover:text-primary"
    }`;

  return (
    // Main page wrapper
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-secondary px-5 py-4 shadow-lg lg:hidden">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-button text-secondary">
            <FaUserShield />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-extrabold text-primary">Admin Portal</p>
            <p className="truncate text-xs font-semibold text-primary/60">
              {user?.username || "Golden Castle School"}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Open admin menu"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-button text-secondary shadow-lg"
        >
          <FaBars />
        </button>
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close admin menu overlay"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      {/* =====================================
          MAIN GRID LAYOUT

          Mobile:
          1 Column

          Desktop (lg):
          Sidebar = 300px
          Content = Remaining Width
      ===================================== */}
      <div
        className={`grid min-h-screen grid-cols-1 transition-[grid-template-columns] duration-300 ease-in-out ${
          sidebarCollapsed
            ? "lg:grid-cols-[96px_1fr]"
            : "lg:grid-cols-[300px_1fr]"
        }`}
      >

        {/* =====================================
            SIDEBAR
        ===================================== */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(320px,85vw)] transform flex-col bg-secondary px-5 py-6 shadow-lg transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:overflow-hidden lg:shadow-none ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >

          {/* =================================
              ADMIN LOGO / BRANDING
          ================================= */}
          <div
            className={`flex w-full shrink-0 items-center gap-3 ${
              sidebarCollapsed
                ? "lg:flex-col lg:justify-center"
                : "justify-between"
            }`}
          >

            <div
              className={`flex items-center gap-3 ${
                sidebarCollapsed ? "lg:flex-col" : ""
              }`}
            >
              {/* Logo Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-button text-2xl text-secondary shadow-md">
              <FaUserShield />
            </div>

            {/* School Information */}
            <div className={sidebarCollapsed ? "lg:hidden" : ""}>
              <h1 className="text-2xl font-extrabold text-primary">
                Admin Portal
              </h1>

              <p className="mt-1 text-sm text-primary/70">
                Golden Castle School
              </p>
            </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={
                  sidebarCollapsed
                    ? "Expand admin sidebar"
                    : "Collapse admin sidebar"
                }
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() =>
                  setSidebarCollapsed((currentState) => !currentState)
                }
                className="hidden h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 hover:bg-button hover:text-secondary lg:flex"
              >
                {sidebarCollapsed ? <FaAnglesRight /> : <FaAnglesLeft />}
              </button>
              <button
                type="button"
                aria-label="Close admin menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary lg:hidden"
              >
                <FaXmark />
              </button>
            </div>
          </div>

          {/* =================================
              NAVIGATION LINKS

              Mobile:
              Horizontal scrolling

              Desktop:
              Vertical sidebar menu
          ================================= */}
          <nav className="portal-sidebar-scroll mt-8 flex flex-col gap-3 overflow-y-auto pb-2 lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:pb-0">

            {adminLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                title={sidebarCollapsed ? link.label : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass}
              >
                <span className="text-lg">{link.icon}</span>
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>
                  {link.label}
                </span>
              </NavLink>
            ))}
          </nav>

       

          {/* =================================
          LOGOUT BUTTON
          ================================= */}
          <button
            type="button"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
            className="mt-6 flex w-full shrink-0 cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] lg:mt-auto"
          >
            <FaRightFromBracket />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Logout</span>
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

