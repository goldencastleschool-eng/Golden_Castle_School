import { useEffect, useState } from "react";
import {
  FaBookOpen,
  FaFilePdf,
  FaGraduationCap,
  FaIdCard,
  FaArrowUpRightDots,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { CardSkeleton } from "../../components/common/Loading.jsx";
import PortalWelcomeBanner from "../../components/common/PortalWelcomeBanner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function StudentDashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [promotionStatus, setPromotionStatus] = useState(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingResults(true);
        setError("");
        const [resultsResponse, promotionResponse] = await Promise.all([
          API.get(`/results/student/${user.id}`),
          API.get("/students/me/promotion-status"),
        ]);
        setResults(resultsResponse.data || []);
        setPromotionStatus(promotionResponse.data || null);
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
      fetchDashboardData();
    }
  }, [user?.id]);

  const latestResult = results[0];
  const promotionStatusLabel =
    promotionStatus?.status === "demoted"
      ? "Demoted"
      : promotionStatus?.status === "graduated"
        ? "Graduated"
        : promotionStatus?.status === "promoted"
          ? "Promoted"
          : "Not published";

  return (
    <div className="min-h-screen bg-background">
      <section className="px-4 pt-6 sm:px-6 lg:px-10">
        <PortalWelcomeBanner
          icon={<FaGraduationCap />}
          eyebrow="Student Result Portal"
          title="Welcome,"
          name={user?.full_name || "Student"}
          description="View your student profile and check whether academic result records have been published to your account."
          metaItems={[
            {
              label: "Admission No.",
              value: user?.admission_no || "Not available",
            },
            {
              label: "Class",
              value: user?.class || "Not available",
            },
          ]}
        />
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6">
          {loadingResults ? (
            <CardSkeleton count={4} />
          ) : (
          <>
          <div className="rounded-lg bg-secondary p-5 shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaIdCard />
            </div>
            <p className="font-medium text-primary/70">Admission Number</p>
            <h3 className="mt-3 break-words text-2xl font-extrabold text-primary sm:text-3xl">
              {user?.admission_no || "Not available"}
            </h3>
          </div>

          <div className="rounded-lg bg-secondary p-5 shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaBookOpen />
            </div>
            <p className="font-medium text-primary/70">Class</p>
            <h3 className="mt-3 break-words text-2xl font-extrabold text-primary sm:text-3xl">
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
            <h3 className="mt-3 break-words text-2xl font-extrabold text-primary sm:text-3xl">
              {results.length}
            </h3>
          </div>

          <div className="rounded-lg bg-secondary p-5 shadow-md">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaArrowUpRightDots />
            </div>
            <p className="font-medium text-primary/70">Promotion Status</p>
            <h3 className="mt-3 text-2xl font-extrabold text-primary">
              {promotionStatusLabel}
            </h3>
            <p className="mt-3 text-sm font-semibold text-primary/60">
              {promotionStatus
                ? `${promotionStatus.to_session} - ${promotionStatus.to_class}`
                : "Awaiting admin publication"}
            </p>
          </div>
          </>
          )}
        </div>

        <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary sm:text-3xl">
            Academic Status
          </h3>
          <p className="mt-3 text-primary/70">
            Your latest published promotion, demotion, or graduation decision.
          </p>

          <div className="mt-7 rounded-lg border border-primary/10 bg-primary/5 p-6">
            {loadingResults ? (
              <div className="animate-pulse">
                <div className="h-7 w-44 rounded-full bg-primary/15"></div>
                <div className="mt-4 h-4 w-72 rounded-full bg-primary/10"></div>
                <div className="mt-3 h-4 w-56 rounded-full bg-primary/10"></div>
              </div>
            ) : promotionStatus ? (
              <div>
                <div className="inline-flex rounded-full bg-button/15 px-4 py-2 text-sm font-bold text-button">
                  {promotionStatusLabel}
                </div>
                <h4 className="mt-4 text-2xl font-extrabold text-primary">
                  {promotionStatus.to_session} - {promotionStatus.to_class}
                </h4>
                <p className="mt-2 text-primary/70">
                  Previous class: {promotionStatus.from_session} -{" "}
                  {promotionStatus.from_class}
                </p>
                {promotionStatus.remark && (
                  <p className="mt-4 text-sm text-primary/60">
                    {promotionStatus.remark}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-primary/70">
                No promotion or demotion status has been published to your
                account yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary sm:text-3xl">
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

