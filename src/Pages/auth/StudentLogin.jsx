import { useState } from "react";
import { FaArrowRight, FaBookOpen, FaIdCard, FaLock } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";

import API, { setAuthToken } from "../../api/axios.jsx";
import { PageLoader } from "../../components/common/Loading.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getPortalLoginErrorMessage } from "../../utils/loginErrors.js";

const image =
  "https://res.cloudinary.com/dadane1xo/image/upload/q_auto/f_auto/v1777222544/shoolfrontgate_x1klhb.png";

function StudentLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    admission_no: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const response = await API.post("/auth/student/login", {
        ...formData,
        admission_no: formData.admission_no.trim(),
      });
      const { student, token } = response.data;
      const studentUser = {
        ...student,
        role: "student",
      };

      setAuthToken(token);
      setUser(studentUser);
      navigate("/student");
    } catch (requestError) {
      setError(getPortalLoginErrorMessage(requestError, "student"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message="Opening Student portal..." />;
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
              <FaBookOpen />
            </div>
            <h2 className="mb-3 text-3xl font-extrabold">Student Portal</h2>
            <p className="max-w-md leading-relaxed text-primary/80">
              Sign in to view and download your academic result PDFs.
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
                Student Login
              </h1>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-medium text-primary">
                  Admission Number
                </label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50">
                    <FaIdCard />
                  </div>
                  <input
                    type="text"
                    name="admission_no"
                    value={formData.admission_no}
                    onChange={handleChange}
                    placeholder="Enter admission number"
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
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button py-3.5 font-bold text-secondary shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? "Signing in..." : "Login"}
                {!loading && <FaArrowRight />}
              </button>
            </form>

            <div className="my-5 flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-primary/10"></div>
              <span className="text-sm text-primary/40">Student Access</span>
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

export default StudentLogin;
