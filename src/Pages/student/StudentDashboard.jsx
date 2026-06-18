import { useEffect, useState } from "react";
import {
  FaBookOpen,
  FaFilePdf,
  FaGraduationCap,
  FaIdCard,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { CardSkeleton } from "../../components/common/Loading.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function StudentDashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoadingResults(true);
        setError("");
        const response = await API.get(`/results/student/${user.id}`);
        setResults(response.data || []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load your result records."
        );
      } finally {
        setLoadingResults(false);
      }
    };

    if (user?.id) {
      fetchResults();
    }
  }, [user?.id]);

  const latestResult = results[0];

  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative overflow-hidden bg-secondary px-6 py-8 lg:px-10">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-button/20 blur-3xl"></div>

        <div className="hidden md:block relative max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-primary/10 bg-primary/10 px-5 py-3 text-primary">
            <FaGraduationCap className="text-button" />
            <span className="font-semibold">Student Result Portal</span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight text-primary md:text-4xl">
            Welcome,{" "}
            <span className="text-button">{user?.full_name || "Student"}</span>
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-primary/70">
            View your student profile and check whether academic result records
            have been published to your account.
          </p>
        </div>
      </section>

      <section className="px-6 py-8 lg:px-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {loadingResults ? (
            <CardSkeleton count={3} />
          ) : (
          <>
          <div className="rounded-lg bg-secondary p-5 shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaIdCard />
            </div>
            <p className="font-medium text-primary/70">Admission Number</p>
            <h3 className="mt-3 text-3xl font-extrabold text-primary">
              {user?.admission_no || "Not available"}
            </h3>
          </div>

          <div className="rounded-lg bg-secondary p-5 shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaBookOpen />
            </div>
            <p className="font-medium text-primary/70">Class</p>
            <h3 className="mt-3 text-3xl font-extrabold text-primary">
              {user?.class || "Not available"}
            </h3>
            <p className="mt-3 text-sm font-semibold text-primary/60">
              {user?.current_session || "Session not available"}
            </p>
          </div>

          <div className="rounded-lg bg-secondary p-5 shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaFilePdf />
            </div>
            <p className="font-medium text-primary/70">Available Results</p>
            <h3 className="mt-3 text-3xl font-extrabold text-primary">
              {results.length}
            </h3>
          </div>
          </>
          )}
        </div>

        <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-3xl font-extrabold text-primary">
            Latest Result
          </h3>
          <p className="mt-3 text-primary/70">
            Your most recently uploaded academic result record.
          </p>

          <div className="mt-7 rounded-lg border border-primary/10 bg-primary/5 p-6">
            {loadingResults ? (
              <div className="animate-pulse">
                <div className="h-7 w-40 rounded-full bg-primary/15"></div>
                <div className="mt-4 h-4 w-64 rounded-full bg-primary/10"></div>
                <div className="mt-3 h-4 w-52 rounded-full bg-primary/10"></div>
              </div>
            ) : latestResult ? (
              <div>
                <h4 className="text-2xl font-extrabold text-primary">
                  {latestResult.term}
                </h4>
                <p className="mt-2 text-primary/70">
                  {latestResult.session} - {latestResult.class}
                </p>
                <p className="mt-4 text-sm text-primary/60">
                  Use the My Results item in the sidebar to open the PDF viewer.
                </p>
              </div>
            ) : (
              <p className="text-primary/70">
                No result has been uploaded to your account yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

export default StudentDashboard;

