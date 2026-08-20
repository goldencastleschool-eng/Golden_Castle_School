import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaAnglesLeft,
  FaAnglesRight,
  FaBars,
  FaBookOpen,
  FaFilePdf,
  FaGear,
  FaRightFromBracket,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";

import { useAuth } from "../../context/AuthContext.jsx";
import API from "../../api/axios.jsx";
import PortalNoticeGate from "../../components/common/PortalNoticeGate.jsx";
import { isFormTeacher } from "../../utils/teacherAssignments.js";
import { getPortalLoginPath } from "../../utils/portalHost.js";

const teacherLinks = [
  {
    label: "Broadsheets",
    path: "/teacher",
    icon: <FaFilePdf />,
    end: true,
  },
  {
    label: "Class Results",
    path: "/teacher/class-results",
    icon: <FaFilePdf />,
  },
  {
    label: "Cumulative",
    path: "/teacher/cumulative-results",
    icon: <FaFilePdf />,
  },
  {
    label: "Class List",
    path: "/teacher/class-list",
    icon: <FaUsers />,
    formTeacherOnly: true,
  },
  {
    label: "Academic AI",
    path: "/teacher/academic-ai",
    icon: <FaBookOpen />,
  },
  {
    label: "Settings",
    path: "/teacher/settings",
    icon: <FaGear />,
  },
];

function TeacherLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleTeacherLinks = teacherLinks.filter(
    (link) => !link.formTeacherOnly || (user && isFormTeacher(user))
  );

  const handleLogout = async () => {
    await API.post("/auth/logout").catch(() => {});
    await logout();
    navigate(getPortalLoginPath("/login"));
  };

  const linkClass = ({ isActive }) =>
    `flex shrink-0 items-center gap-3 rounded-lg px-5 py-4 font-semibold transition-all duration-300 lg:w-full ${
      sidebarCollapsed ? "lg:justify-center lg:px-0" : ""
    } ${
      isActive
        ? "bg-button text-secondary shadow-lg"
        : "text-primary/80 hover:bg-primary/10 hover:text-primary"
    }`;

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-secondary px-5 py-4 shadow-lg lg:hidden">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-button text-secondary">
            <FaBookOpen />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-extrabold text-primary">Teacher Portal</p>
            <p className="truncate text-xs font-semibold text-primary/60">
              {user?.full_name || "Golden Castle School"}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Open teacher menu"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-button text-secondary shadow-lg"
        >
          <FaBars />
        </button>
      </div>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close teacher menu overlay"
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
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(320px,85vw)] transform flex-col bg-secondary px-5 py-6 shadow-lg transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:overflow-hidden lg:shadow-none ${
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
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-button text-2xl text-secondary shadow-md">
                <FaBookOpen />
              </div>

              <div className={sidebarCollapsed ? "lg:hidden" : ""}>
                <h1 className="text-2xl font-extrabold text-primary">
                  Teacher Portal
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
                    ? "Expand teacher sidebar"
                    : "Collapse teacher sidebar"
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
                aria-label="Close teacher menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary lg:hidden"
              >
                <FaXmark />
              </button>
            </div>
          </div>


          <div
            className={`mt-8 rounded-lg border border-primary/10 bg-primary/5 p-5 ${
              sidebarCollapsed ? "lg:hidden" : ""
            }`}
          >
            <p className="text-sm font-semibold text-primary/60">
              Signed in as
            </p>
            <p className="mt-2 text-lg font-extrabold text-primary">
              {user?.full_name || "Teacher"}
            </p>
            <p className="mt-1 text-sm text-primary/60">
              {user?.assigned_class
                ? `${user.assigned_class.toUpperCase()} - ${user.session}`
                : "Assigned class"}
            </p>
          </div>

          <nav className="portal-sidebar-scroll mt-8 flex flex-col gap-3 overflow-y-auto pb-2 lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:pb-0">
            {visibleTeacherLinks.map((link) => (
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
            className="mt-6 flex w-full shrink-0 cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] lg:mt-auto"
          >
            <FaRightFromBracket />
            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Logout</span>
          </button>
        </aside>

        <section className="min-w-0">
          <PortalNoticeGate>
            <Outlet />
          </PortalNoticeGate>
        </section>
      </div>
    </main>
  );
}

export default TeacherLayout;

