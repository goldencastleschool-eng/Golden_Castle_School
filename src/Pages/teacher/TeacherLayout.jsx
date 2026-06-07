import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaFilePdf,
  FaRightFromBracket,
} from "react-icons/fa6";

import { useAuth } from "../../context/AuthContext.jsx";
import API from "../../api/axios.jsx";

const teacherLinks = [
  {
    label: "Broadsheets",
    path: "/teacher",
    icon: <FaFilePdf />,
    end: true,
  },
];

function TeacherLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await API.post("/auth/logout").catch(() => {});
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-5 py-4 font-semibold transition-all duration-300 ${
      isActive
        ? "bg-button text-secondary shadow-lg"
        : "text-primary/80 hover:bg-primary/10 hover:text-primary"
    }`;

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="bg-secondary px-5 py-6 lg:sticky lg:top-0 lg:h-screen">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-2xl text-secondary shadow-xl">
              <FaBookOpen />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-primary">
                Teacher Portal
              </h1>
              <p className="mt-1 text-sm text-primary/70">
                Golden Castle School
              </p>
            </div>
          </div>

          <nav className="mt-8 flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {teacherLinks.map((link) => (
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

          <div className="mt-8 rounded-2xl border border-primary/10 bg-primary/5 p-5">
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

          <button
            onClick={handleLogout}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <FaRightFromBracket />
            Logout
          </button>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

export default TeacherLayout;
