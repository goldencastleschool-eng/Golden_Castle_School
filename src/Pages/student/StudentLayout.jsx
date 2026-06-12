import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaAnglesLeft,
  FaAnglesRight,
  FaBars,
  FaBookOpen,
  FaFilePdf,
  FaGear,
  FaGraduationCap,
  FaReceipt,
  FaRightFromBracket,
  FaXmark,
} from "react-icons/fa6";

import { useAuth } from "../../context/AuthContext.jsx";
import API from "../../api/axios.jsx";

const studentLinks = [
  {
    label: "Dashboard",
    path: "/student",
    icon: <FaGraduationCap />,
    end: true,
  },
  {
    label: "My Results",
    path: "/student/results",
    icon: <FaFilePdf />,
  },
  {
    label: "Cumulative",
    path: "/student/cumulative-results",
    icon: <FaFilePdf />,
  },
  {
    label: "My Fees",
    path: "/student/fees",
    icon: <FaReceipt />,
  },
  {
    label: "Settings",
    path: "/student/settings",
    icon: <FaGear />,
  },
];

function StudentLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await API.post("/auth/logout").catch(() => {});
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex shrink-0 items-center gap-3 rounded-2xl px-5 py-4 font-semibold transition-all duration-300 lg:w-full ${
      sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
    } ${
      isActive
        ? "bg-button text-secondary shadow-lg"
        : "text-primary/80 hover:bg-primary/10 hover:text-primary"
    }`;

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-secondary px-5 py-4 shadow-lg lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-button text-secondary">
            <FaBookOpen />
          </div>
          <div>
            <p className="text-lg font-extrabold text-primary">Student Portal</p>
            <p className="text-xs font-semibold text-primary/60">
              Golden Castle School
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Open student menu"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-button text-secondary shadow-lg"
        >
          <FaBars />
        </button>
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close student menu overlay"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      )}

      <div
        className={`grid min-h-screen grid-cols-1 transition-[grid-template-columns] duration-300 ease-in-out ${
          sidebarCollapsed
            ? "lg:grid-cols-[96px_1fr]"
            : "lg:grid-cols-[300px_1fr]"
        }`}
      >
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(320px,85vw)] transform flex-col bg-secondary px-5 py-6 shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:overflow-hidden lg:shadow-none ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-2xl text-secondary shadow-xl">
                <FaBookOpen />
              </div>

              <div className={sidebarCollapsed ? "lg:hidden" : ""}>
                <h1 className="text-2xl font-extrabold text-primary">
                  Student Portal
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
                    ? "Expand student sidebar"
                    : "Collapse student sidebar"
                }
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() =>
                  setSidebarCollapsed((currentState) => !currentState)
                }
                className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 hover:bg-button hover:text-secondary lg:flex"
              >
                {sidebarCollapsed ? <FaAnglesRight /> : <FaAnglesLeft />}
              </button>
              <button
                type="button"
                aria-label="Close student menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary lg:hidden"
              >
                <FaXmark />
              </button>
            </div>
          </div>

          <div
            className={`mt-8 rounded-2xl border border-primary/10 bg-primary/5 p-5 ${
              sidebarCollapsed ? "lg:hidden" : ""
            }`}
          >
            <p className="text-sm font-semibold text-primary/60">
              Signed in as
            </p>
            <p className="mt-2 text-lg font-extrabold text-primary">
              {user?.full_name || "Student"}
            </p>
            <p className="mt-1 text-sm text-primary/60">
              {user?.admission_no || "Admission number"}
            </p>
          </div>


          <nav className="portal-sidebar-scroll mt-8 flex flex-col gap-3 overflow-y-auto pb-2 lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:pb-0">
            {studentLinks.map((link) => (
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

      
          <button
            type="button"
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
            className="mt-6 flex w-full shrink-0 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] lg:mt-auto"
          >
            <FaRightFromBracket />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Logout</span>
          </button>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default StudentLayout;
