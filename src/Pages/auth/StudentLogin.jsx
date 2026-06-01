import { useState } from "react";
import { FaArrowRight, FaBookOpen, FaIdCard, FaLock } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

import API from "../../api/axios.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

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
      const response = await API.post("/auth/student/login", formData);
      const { student } = response.data;
      const studentUser = {
        ...student,
        role: "student",
      };

      setUser(studentUser);
      navigate("/student");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Login failed. Please check your admission number and password."
      );
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
              <FaBookOpen />
            </div>
            <h2 className="mb-4 text-4xl font-extrabold">Student Portal</h2>
            <p className="max-w-md leading-relaxed text-primary/80">
              Sign in to view and download your academic result PDFs.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h2 className="text-4xl font-extrabold text-primary sm:text-5xl">
                Student Login
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary/70 sm:text-lg">
                Enter your admission number and password to continue.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-3 block font-medium text-primary">
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
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Login"}
                {!loading && <FaArrowRight />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudentLogin;
