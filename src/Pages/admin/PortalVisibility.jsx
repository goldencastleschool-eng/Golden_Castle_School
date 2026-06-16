import { useEffect, useMemo, useState } from "react";
import {
  FaArrowsRotate,
  FaChalkboardUser,
  FaCircleCheck,
  FaClipboardCheck,
  FaEye,
  FaReceipt,
  FaTriangleExclamation,
  FaUserGraduate,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { CardSkeleton } from "../../components/common/Loading.jsx";

const statusStyles = {
  live: "bg-green-500/10 text-green-700",
  attention: "bg-yellow-500/10 text-yellow-700",
  not_configured: "bg-red-500/10 text-red-700",
};

const severityStyles = {
  critical: "bg-red-500/10 text-red-700",
  warning: "bg-yellow-500/10 text-yellow-700",
  info: "bg-primary/10 text-primary",
};

const checkIcons = {
  student_results: <FaClipboardCheck />,
  cumulative_results: <FaUserGraduate />,
  fee_receipts: <FaReceipt />,
  teacher_class_list: <FaChalkboardUser />,
  teacher_broadsheets: <FaClipboardCheck />,
  teacher_class_results: <FaClipboardCheck />,
};

const formatMetricValue = (value) =>
  typeof value === "number" ? value.toLocaleString() : value || "0";

const formatCheckedAt = (dateValue) =>
  dateValue ? new Date(dateValue).toLocaleString() : "Not checked yet";

const formatAccessWindow = (access = {}) => {
  if (!access.session && !access.term) {
    return "No active window";
  }

  if (!access.term) {
    return access.session;
  }

  return `${access.session} | ${access.term}`;
};

function PortalVisibility() {
  const [visibility, setVisibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchVisibility = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await API.get("/portal-visibility/admin");
      setVisibility(response.data || null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to load portal visibility checks."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisibility();
  }, []);

  const checks = useMemo(() => visibility?.checks || [], [visibility?.checks]);
  const issues = visibility?.issues || [];

  const portalGroups = useMemo(
    () => [
      {
        label: "Student Portal",
        checks: checks.filter((check) => check.portal === "student"),
      },
      {
        label: "Teacher Portal",
        checks: checks.filter((check) => check.portal === "teacher"),
      },
    ],
    [checks]
  );

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
            <FaEye />
          </div>
          <h2 className="text-4xl font-extrabold text-secondary">
            Portal Status
          </h2>
          <p className="mt-3 max-w-3xl text-secondary/75">
            Track what students and teachers can currently see in their portals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchVisibility({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <FaArrowsRotate className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Checking..." : "Refresh Status"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-secondary p-6 shadow-xl">
          <p className="text-sm font-bold uppercase text-primary/60">
            Live Checks
          </p>
          <p className="mt-3 text-3xl font-extrabold text-primary">
            {loading ? "..." : visibility?.summary?.live_checks || 0}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary p-6 shadow-xl">
          <p className="text-sm font-bold uppercase text-primary/60">
            Needs Attention
          </p>
          <p className="mt-3 text-3xl font-extrabold text-primary">
            {loading ? "..." : visibility?.summary?.attention_checks || 0}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary p-6 shadow-xl">
          <p className="text-sm font-bold uppercase text-primary/60">
            Not Configured
          </p>
          <p className="mt-3 text-3xl font-extrabold text-primary">
            {loading ? "..." : visibility?.summary?.not_configured_checks || 0}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary p-6 shadow-xl">
          <p className="text-sm font-bold uppercase text-primary/60">
            Last Checked
          </p>
          <p className="mt-3 text-base font-extrabold text-primary">
            {loading ? "..." : formatCheckedAt(visibility?.checked_at)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 2xl:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          {loading ? (
            <div className="rounded-[2rem] bg-secondary p-7 text-primary/70 shadow-2xl">
              Checking portal visibility...
            </div>
          ) : (
            portalGroups.map((group) => (
              <section key={group.label}>
                <h3 className="mb-4 text-2xl font-extrabold text-secondary">
                  {group.label}
                </h3>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {group.checks.map((check) => (
                    <article
                      key={check.key}
                      className="rounded-[2rem] bg-secondary p-6 shadow-2xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg text-primary">
                            {checkIcons[check.key] || <FaEye />}
                          </div>
                          <div>
                            <h4 className="text-xl font-extrabold text-primary">
                              {check.label}
                            </h4>
                            <p className="mt-2 text-sm leading-relaxed text-primary/65">
                              {check.description}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            statusStyles[check.status] ||
                            "bg-primary/10 text-primary"
                          }`}
                        >
                          {check.status_label}
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl border border-primary/10">
                        <div className="flex items-center justify-between gap-4 border-b border-primary/10 px-4 py-3">
                          <span className="text-sm font-bold text-primary/60">
                            Active Window
                          </span>
                          <span className="text-right text-sm font-extrabold text-primary">
                            {formatAccessWindow(check.access)}
                          </span>
                        </div>

                        {(check.metrics || []).map((metric) => (
                          <div
                            key={`${check.key}-${metric.label}`}
                            className="flex items-center justify-between gap-4 border-b border-primary/10 px-4 py-3 last:border-b-0"
                          >
                            <span className="text-sm font-semibold text-primary/65">
                              {metric.label}
                            </span>
                            <span className="text-right text-base font-extrabold text-primary">
                              {formatMetricValue(metric.value)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {(check.class_summary || []).length > 0 && (
                        <div className="mt-5">
                          <p className="text-sm font-bold uppercase text-primary/60">
                            Class Summary
                          </p>
                          <div className="portal-sidebar-scroll mt-3 max-h-80 overflow-y-auto rounded-2xl border border-primary/10">
                            {(check.class_summary || []).map((classRow) => (
                              <div
                                key={classRow.id}
                                className="border-b border-primary/10 p-4 last:border-b-0"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-extrabold text-primary">
                                      {classRow.class_name}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-primary/55">
                                      {[classRow.session, classRow.term]
                                        .filter(Boolean)
                                        .join(" | ") || "No active window"}
                                    </p>
                                    {classRow.detail && (
                                      <p className="mt-2 text-xs text-primary/60">
                                        {classRow.detail}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                      statusStyles[classRow.status] ||
                                      "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {classRow.status_label}
                                  </span>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                  <div className="rounded-xl bg-primary/5 px-2 py-3">
                                    <p className="font-semibold text-primary/55">
                                      {classRow.expected_label}
                                    </p>
                                    <p className="mt-1 text-base font-extrabold text-primary">
                                      {formatMetricValue(
                                        classRow.expected_count
                                      )}
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-primary/5 px-2 py-3">
                                    <p className="font-semibold text-primary/55">
                                      {classRow.visible_label}
                                    </p>
                                    <p className="mt-1 text-base font-extrabold text-primary">
                                      {formatMetricValue(
                                        classRow.visible_count
                                      )}
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-primary/5 px-2 py-3">
                                    <p className="font-semibold text-primary/55">
                                      {classRow.missing_label}
                                    </p>
                                    <p className="mt-1 text-base font-extrabold text-primary">
                                      {formatMetricValue(
                                        classRow.missing_count
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(check.samples || []).length > 0 && (
                        <div className="mt-5 space-y-4">
                          {check.samples.map((sample) => (
                            <div key={`${check.key}-${sample.label}`}>
                              <p className="text-sm font-bold uppercase text-primary/60">
                                {sample.label}
                              </p>
                              <div className="mt-2 space-y-2">
                                {sample.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 border-b border-primary/10 py-2 text-sm last:border-b-0"
                                  >
                                    <span className="font-semibold text-primary">
                                      {item.name}
                                    </span>
                                    <span className="text-right text-primary/60">
                                      {item.detail}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <aside className="rounded-[2rem] bg-secondary p-7 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold text-primary">
                Fix First
              </h3>
              <p className="mt-2 text-sm text-primary/65">
                {loading
                  ? "Checking current portal issues..."
                  : `${issues.length} issue${
                      issues.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {issues.length === 0 && !loading ? (
                <FaCircleCheck />
              ) : (
                <FaTriangleExclamation />
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <CardSkeleton count={3} />
            ) : issues.length === 0 ? (
              <div className="rounded-2xl bg-green-500/10 p-5 text-green-700">
                All monitored portal visibility checks are clear.
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-2xl border border-primary/10 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-extrabold text-primary">
                      {issue.feature}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        severityStyles[issue.severity] ||
                        severityStyles.info
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-primary/75">
                    {issue.message}
                  </p>
                  {issue.action && (
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-primary">
                      {issue.action}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PortalVisibility;
