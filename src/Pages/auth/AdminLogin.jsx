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
import { useAuth } from "../../context/AuthContext.jsx";

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

const getLoginErrorMessage = (requestError, loginRole) => {
  const responseData = requestError.response?.data;

  if (typeof responseData === "string") {
    if (requestError.response?.status === 404) {
      if (loginRole === "executive") {
        return "Executive reports login is not available on the backend yet. Please deploy the latest backend.";
      }

      if (loginRole === "teacher") {
        return "Teacher login is not available on the backend yet. Please deploy the latest backend.";
      }

      if (loginRole === "admin") {
        return "Admin login is not available on the backend yet. Please deploy the latest backend.";
      }

      return "This login is not available on the backend yet. Please deploy the latest backend.";
    }

    return "Login failed. Please try again.";
  }

  return (
    responseData?.message ||
    responseData?.error ||
    "Login failed. Please check your credentials."
  );
};

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
  const pageDescription = executiveOnly
    ? "Principal and chairman accounts sign in here to view read-only school reports."
    : adminOnly
      ? "Administrator access is available only through this secure URL."
      : "Sign in as a student or teacher.";
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
      if (!requestError.response) {
        setError("Network error. Please make sure the backend is running.");
      } else {
        setError(getLoginErrorMessage(requestError, role));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-10">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-button/10 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"></div>

      <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 overflow-hidden rounded-[2rem] bg-secondary shadow-2xl lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <img
            src={image}
            alt="Golden Castle International School gate"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
          <div className="absolute bottom-10 left-10 z-10 text-primary">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-2xl text-secondary">
              {isStudent ? (
                <FaGraduationCap />
              ) : isTeacher ? (
                <FaChalkboardUser />
              ) : (
                <FaUserShield />
              )}
            </div>
            <h2 className="mb-4 text-4xl font-extrabold">Welcome Back</h2>
            <p className="max-w-md leading-relaxed text-primary/80">
              {sideDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-4xl font-extrabold text-primary sm:text-5xl">
                {pageTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary/70 sm:text-lg">
                {pageDescription}
              </p>
            </div>

            <div
              className={`mb-8 grid grid-cols-1 gap-3 rounded-2xl bg-primary/5 p-2 ${
                adminOnly || executiveOnly ? "" : "sm:grid-cols-2"
              }`}
            >
              {availableRoleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleChange(option.value)}
                  className={`flex items-center justify-center gap-3 rounded-2xl px-4 py-4 font-bold transition-all duration-300 ${
                    role === option.value
                      ? "bg-button text-secondary shadow-lg"
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
                className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-3 block font-medium text-primary">
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
                    className="w-full rounded-2xl border border-primary/10 bg-primary/5 py-4 pl-14 pr-5 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block font-medium text-primary">
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
                    className="w-full rounded-2xl border border-primary/10 bg-primary/5 py-4 pl-14 pr-5 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : `Login as ${roleLabel}`}
                {!loading && (
                  <FaArrowRight className="transition duration-300 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {(adminOnly || executiveOnly) && (
              <p className="mt-6 text-center text-sm font-semibold text-primary/70">
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

            <div className="my-8 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-primary/10"></div>
              <span className="text-sm text-primary/40">Secure Access</span>
              <div className="h-[1px] flex-1 bg-primary/10"></div>
            </div>

            <p className="text-center text-sm leading-relaxed text-primary/60">
              (c) 2026 Golden Castle International School
              <br />
              Reach For Gold
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
