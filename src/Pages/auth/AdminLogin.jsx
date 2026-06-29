import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaGraduationCap,
  FaIdCard,
  FaLock,
  FaChalkboardUser,
  FaUser,
  FaUserShield,
} from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";

import API from "../../api/axios.jsx";
import { PageLoader } from "../../components/common/Loading.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getPortalLoginErrorMessage } from "../../utils/loginErrors.js";

const image =
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222544/shoolfrontgate_x1klhb.png";

const roleOptions = [
  {
    label: "Student",
    value: "student",
    icon: <FaGraduationCap />,
  },
  {
    label: "Teacher",
    value: "teacher",
    icon: <FaChalkboardUser />,
  },
];

const adminRoleOption = {
  label: "Admin",
  value: "admin",
  icon: <FaUserShield />,
};

const executiveRoleOption = {
  label: "Principal/Chairman",
  value: "executive",
  icon: <FaUserShield />,
};

const reportRoles = ["principal", "chairman"];

function Login({ adminOnly = false, executiveOnly = false }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [role, setRole] = useState(() =>
    executiveOnly ? "executive" : adminOnly ? "admin" : "student"
  );
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isExecutive = role === "executive";
  const availableRoleOptions = executiveOnly
    ? [executiveRoleOption]
    : adminOnly
      ? [adminRoleOption]
      : roleOptions;
  const roleLabel = isStudent
    ? "Student"
    : isTeacher
      ? "Teacher"
      : isExecutive
        ? "Principal/Chairman"
        : "Admin";
  const pageTitle = executiveOnly
    ? "Executive Reports Login"
    : adminOnly
      ? "Secure Admin Login"
      : "Portal Login";
  const sideDescription = executiveOnly
    ? "Sign in through the separate reporting access point for school leadership."
    : adminOnly
      ? "Sign in through the secure administrator access point."
      : "Choose your portal role and sign in securely to continue.";

  useEffect(() => {
    setRole(executiveOnly ? "executive" : adminOnly ? "admin" : "student");
    setError("");
    setFormData({
      identifier: "",
      password: "",
    });
  }, [adminOnly, executiveOnly]);

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setError("");
    setFormData({
      identifier: "",
      password: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isStudent
        ? "/auth/student/login"
        : isTeacher
          ? "/auth/teacher/login"
          : isExecutive
            ? "/auth/executive/login"
            : "/auth/admin/login";
      const identifier = formData.identifier.trim();
      const payload = isStudent
        ? {
            admission_no: identifier,
            password: formData.password,
          }
        : {
            username: identifier,
            password: formData.password,
          };

      const response = await API.post(endpoint, payload);
      const { student, admin, teacher, executive, token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
      }
      const account = isStudent
        ? {
            ...student,
            role: "student",
          }
        : isTeacher
          ? {
              ...teacher,
              role: "teacher",
            }
          : isExecutive
            ? executive
            : admin;

      localStorage.setItem( "user",JSON.stringify(account));

      setUser(account);
      navigate(
        isStudent
          ? "/student"
          : isTeacher
            ? "/teacher"
            : isExecutive || reportRoles.includes(account?.role)
              ? "/reports"
              : "/admin"
      );
    } catch (requestError) {
      setError(getPortalLoginErrorMessage(requestError, role));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message={`Opening ${roleLabel} portal...`} />;
  }

  return (
    <section className="flex h-screen items-center justify-center overflow-hidden bg-background px-4 py-4 sm:px-6 lg:px-10">
      <div className="grid h-full max-h-[calc(100vh-2rem)] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-lg bg-secondary shadow-lg lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden h-full overflow-hidden lg:block">
          <img
            src={image}
            alt="Golden Castle International School gate"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
          <div className="absolute bottom-8 left-8 right-8 z-10 text-primary">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              {isStudent ? (
                <FaGraduationCap />
              ) : isTeacher ? (
                <FaChalkboardUser />
              ) : (
                <FaUserShield />
              )}
            </div>
            <h2 className="mb-3 text-3xl font-extrabold">Welcome Back</h2>
            <p className="max-w-md leading-relaxed text-primary/80">
              {sideDescription}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 items-center justify-center p-5 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <div className="mb-4 flex justify-end lg:hidden">
              <Link
                to="/"
                className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-button hover:text-secondary"
              >
                Home
              </Link>
            </div>

            <div className="mb-5 text-center">
              <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">
                {pageTitle}
              </h1>
            </div>

            <div
              className={`mb-5 grid grid-cols-1 gap-2 rounded-lg bg-primary/5 p-2 ${
                adminOnly || executiveOnly ? "" : "sm:grid-cols-2"
              }`}
            >
              {availableRoleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleChange(option.value)}
                  className={`flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 font-bold transition-all duration-300 ${
                    role === option.value
                      ? "bg-button text-secondary shadow-md"
                      : "text-primary hover:bg-primary/10"
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {error && (
              <div
                className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-medium text-primary">
                  {isStudent ? "Admission Number" : "Username"}
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50">
                    {isStudent ? <FaIdCard /> : <FaUser />}
                  </div>
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder={
                      isStudent ? "Enter admission number" : "Enter username"
                    }
                    required
                    className="w-full rounded-lg border border-primary/10 bg-primary/5 py-3.5 pl-14 pr-5 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium text-primary">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50">
                    <FaLock />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    className="w-full rounded-lg border border-primary/10 bg-primary/5 py-3.5 pl-14 pr-5 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button py-3.5 font-bold text-secondary shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? "Signing in..." : `Login as ${roleLabel}`}
                {!loading && (
                  <FaArrowRight className="transition duration-300 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {(adminOnly || executiveOnly) && (
              <p className="mt-4 text-center text-sm font-semibold text-primary/70">
                {adminOnly ? "Principal or chairman?" : "Administrator?"}{" "}
                <Link
                  to={adminOnly ? "/executive-login" : "/secure-admin-login"}
                  className="text-button underline-offset-4 hover:underline"
                >
                  {adminOnly
                    ? "Open executive reports login"
                    : "Open admin login"}
                </Link>
              </p>
            )}

            <div className="my-5 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-primary/10"></div>
              <span className="text-sm text-primary/40">Secure Access</span>
              <div className="h-[1px] flex-1 bg-primary/10"></div>
            </div>

            <p className="text-center text-sm leading-relaxed text-primary/60">
              Reach For Gold
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
