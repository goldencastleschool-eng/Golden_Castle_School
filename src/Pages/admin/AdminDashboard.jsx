import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  FaBed,
  FaBookOpen,
  FaBus,
  FaChartLine,
  FaGraduationCap,
  FaMoneyBillWave,
  FaReceipt,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { CardSkeleton } from "../../components/common/Loading.jsx";
import {
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";

const DEFAULT_SESSION_FILTER = "2025/2026";
const DEFAULT_TERM_FILTER = "Third Term";
const EMPTY_LIST = [];
const EMPTY_OBJECT = {};
const CHART_COLORS = {
  button: "#d4a017",
  paid: "#16a34a",
  outstanding: "#dc2626",
  muted: "#6b7280",
  blue: "#2563eb",
  purple: "#7c3aed",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const fetchAdminDashboardSummary = async ({ session, term }) => {
  const response = await API.get("/reports/admin-dashboard", {
    params: {
      session,
      term,
    },
  });

  return response.data;
};

function ChartEmptyState({ message = "No chart data available for this filter." }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-secondary/10 bg-secondary/60 px-5 text-center text-sm font-semibold text-primary/65">
      {message}
    </div>
  );
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary/10 bg-secondary px-4 py-3 text-sm shadow-md">
      <p className="mb-2 font-extrabold text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="font-semibold text-primary/70">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function NumberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary/10 bg-secondary px-4 py-3 text-sm shadow-md">
      <p className="mb-2 font-extrabold text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="font-semibold text-primary/70">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {Number(entry.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function DashboardChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg">
      <div className="mb-5">
        <h4 className="text-lg font-extrabold text-primary">{title}</h4>
        {subtitle && (
          <p className="mt-1 text-sm font-semibold text-primary/60">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [sessionFilter, setSessionFilter] = useState(DEFAULT_SESSION_FILTER);
  const [termFilter, setTermFilter] = useState(DEFAULT_TERM_FILTER);
  const [dismissedErrorMessage, setDismissedErrorMessage] = useState("");
  const {
    data: dashboardData,
    error: dashboardError,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-dashboard-summary", sessionFilter, termFilter],
    queryFn: () =>
      fetchAdminDashboardSummary({
        session: sessionFilter,
        term: termFilter,
      }),
    staleTime: 1000 * 60 * 3,
  });

  const loading = isLoading && !dashboardData;
  const selectedSession = dashboardData?.selected_session || sessionFilter;
  const selectedTerm = dashboardData?.selected_term || termFilter;
  const availableSessions =
    dashboardData?.available_sessions?.length > 0
      ? dashboardData.available_sessions
      : [sessionFilter];
  const availableTerms =
    dashboardData?.available_terms?.length > 0
      ? dashboardData.available_terms
      : getVisibleTermsForSession(sessionFilter);
  const summary = dashboardData?.summary || EMPTY_OBJECT;
  const studentSummary = summary.students || EMPTY_OBJECT;
  const classSummary = summary.classes || EMPTY_OBJECT;
  const teacherSummary = summary.teachers || EMPTY_OBJECT;
  const feeSummary = summary.fees || EMPTY_OBJECT;
  const busSummary = summary.bus || EMPTY_OBJECT;
  const boardingSummary = summary.boarding || EMPTY_OBJECT;
  const payrollSummary = summary.payroll || EMPTY_OBJECT;
  const charts = dashboardData?.charts || EMPTY_OBJECT;
  const classCoverage = dashboardData?.class_coverage || EMPTY_LIST;
  const dashboardErrorMessage =
    dashboardError?.response?.data?.message ||
    dashboardError?.response?.data?.error ||
    dashboardError?.message ||
    "Unable to load dashboard records.";
  const status =
    dashboardError && !isFetching && dismissedErrorMessage !== dashboardErrorMessage
      ? {
          type: "error",
          message: dashboardErrorMessage,
        }
      : {
          type: "",
          message: "",
        };

  const handleSessionChange = (session) => {
    const normalizedTerm = normalizeTermForSession(termFilter, session);

    setSessionFilter(session);
    setTermFilter(normalizedTerm || getVisibleTermsForSession(session)[0] || "");
  };

  const populationChartData = useMemo(
    () =>
      (charts.population || EMPTY_LIST).map((item) => ({
        ...item,
        fill:
          item.name === "Newly Admitted"
            ? CHART_COLORS.paid
            : item.name === "Returning"
              ? CHART_COLORS.button
              : item.name === "Graduated"
                ? CHART_COLORS.blue
                : CHART_COLORS.outstanding,
      })),
    [charts.population]
  );
  const genderChartData = useMemo(
    () =>
      (charts.gender || EMPTY_LIST).map((item, index) => ({
        ...item,
        fill:
          index === 0
            ? CHART_COLORS.button
            : index === 1
              ? CHART_COLORS.blue
              : CHART_COLORS.purple,
      })),
    [charts.gender]
  );
  const financeChartData = charts.finance || EMPTY_LIST;
  const coverageChartData = charts.coverage || EMPTY_LIST;
  const feeCategoryCounts = studentSummary.fee_category_counts || EMPTY_OBJECT;

  const summaryGroups = [
    {
      title: "Student Summary",
      items: [
        {
          title: "Active Students",
          value: studentSummary.active || 0,
          icon: <FaUsers />,
        },
        {
          title: "Newly Admitted",
          value: studentSummary.newly_admitted || 0,
          icon: <FaUsers />,
        },
        {
          title: "Returning Students",
          value: studentSummary.returning || 0,
          icon: <FaUsers />,
        },
        {
          title: "Left Students",
          value: studentSummary.left || 0,
          icon: <FaUsers />,
        },
        {
          title: "Male Students",
          value: studentSummary.gender_counts?.Male || 0,
          icon: <FaUsers />,
        },
        {
          title: "Female Students",
          value: studentSummary.gender_counts?.Female || 0,
          icon: <FaUsers />,
        },
        {
          title: "Scholarship Students",
          value: feeCategoryCounts.scholarship || 0,
          icon: <FaGraduationCap />,
        },
        {
          title: "Discounted Students",
          value: feeCategoryCounts.discounted || 0,
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Staff Children",
          value: feeCategoryCounts.staff_child || 0,
          icon: <FaUsers />,
        },
        {
          title: "VIP Students",
          value: feeCategoryCounts.vip || 0,
          icon: <FaUsers />,
        },
      ],
    },
    {
      title: "Class Summary",
      items: [
        {
          title: "Active Classes",
          value: classSummary.active || 0,
          icon: <FaBookOpen />,
        },
        {
          title: "Class Broadsheets",
          value: classSummary.broadsheets || 0,
          icon: <FaBookOpen />,
        },
        {
          title: "Class Results",
          value: classSummary.class_results || 0,
          icon: <FaChartLine />,
        },
        {
          title: "Graduate List",
          value: classSummary.graduate_list || 0,
          icon: <FaGraduationCap />,
        },
      ],
    },
    {
      title: "Form Teacher Summary",
      items: [
        {
          title: "Active Form Teachers",
          value: teacherSummary.active_form || 0,
          icon: <FaUsers />,
        },
        {
          title: "Deactivated Form Teachers",
          value: teacherSummary.inactive_form || 0,
          icon: <FaUsers />,
        },
      ],
    },
    {
      title: "Fee Summary",
      items: [
        {
          title: "Expected Fees",
          value: formatCurrency(feeSummary.expected),
          icon: <FaReceipt />,
        },
        {
          title: "Amount Paid",
          value: formatCurrency(feeSummary.paid),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Outstanding",
          value: formatCurrency(feeSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Students With Outstanding Fee",
          value: feeSummary.outstandingCount || 0,
          icon: <FaUsers />,
        },
        {
          title: "Payment Records",
          value: feeSummary.records || 0,
          icon: <FaReceipt />,
        },
      ],
    },
    {
      title: "Bus Summary",
      items: [
        {
          title: "Registered Buses",
          value: busSummary.registered_buses || 0,
          icon: <FaBus />,
        },
        {
          title: "Routes",
          value: busSummary.routes || 0,
          icon: <FaBus />,
        },
        {
          title: "Active Bus Students",
          value: busSummary.active_enrollments || 0,
          icon: <FaUsers />,
        },
        {
          title: "Bus Outstanding",
          value: formatCurrency(busSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
      ],
    },
    {
      title: "Boarding Summary",
      items: [
        {
          title: "Boarding Houses",
          value: boardingSummary.houses || 0,
          icon: <FaBed />,
        },
        {
          title: "Boarding Students",
          value: boardingSummary.active_enrollments || 0,
          icon: <FaUsers />,
        },
        {
          title: "Boarding Paid",
          value: formatCurrency(boardingSummary.paid),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Boarding Outstanding",
          value: formatCurrency(boardingSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
      ],
    },
    {
      title: "Payroll Summary",
      items: [
        {
          title: "Active Payroll Staff",
          value: payrollSummary.active_staff || 0,
          icon: <FaUsers />,
        },
        {
          title: "Assigned Staff",
          value: payrollSummary.assigned_staff || 0,
          icon: <FaUsers />,
        },
        {
          title: "Expected Payroll",
          value: formatCurrency(payrollSummary.expected),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Payroll Outstanding",
          value: formatCurrency(payrollSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <AdminNotification
        status={status}
        onDismiss={() => setDismissedErrorMessage(status.message)}
      />

      <section className="px-4 pt-6 sm:px-6 lg:px-12">
        <div className="rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                <FaChartLine className="text-button" />
                Admin Command Center
              </div>
              <h2 className="text-2xl font-extrabold leading-tight text-primary sm:text-3xl md:text-4xl">
                Welcome Back,{" "}
                <span className="break-words text-button">
                  {user?.username || "Administrator"}
                </span>
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-primary/70">
                Monitor population, fees, result coverage, transport, boarding, and payroll from one optimized operational view.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4 lg:min-w-[520px]">
              {[
                ["Students", studentSummary.active || 0],
                ["Classes", classSummary.active || 0],
                ["Fees Paid", formatCurrency(feeSummary.paid)],
                ["Outstanding", formatCurrency(feeSummary.outstanding)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-primary/10 p-4">
                  <p className="text-xs font-bold uppercase text-primary/60">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-base font-extrabold text-primary sm:text-lg">
                    {loading ? "..." : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-10">
        <div className="mb-6 rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg">
          <div className="mb-4">
            <h3 className="text-2xl font-extrabold text-primary">
              Active Population Summary
            </h3>
            <p className="mt-1 text-sm font-semibold text-primary/65">
              Showing active population data for {selectedSession}
              {selectedTerm ? ` - ${selectedTerm}` : ""}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[260px_260px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/65">
                Session
              </label>
              <select
                value={sessionFilter}
                onChange={(event) => handleSessionChange(event.target.value)}
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                {availableSessions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/65">
                Term
              </label>
              <select
                value={termFilter}
                onChange={(event) => setTermFilter(event.target.value)}
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                {availableTerms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {summaryGroups.map((group) => (
            <section key={group.title}>
              <h4 className="mb-4 text-xl font-extrabold text-secondary">
                {group.title}
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {loading ? (
                  <CardSkeleton count={group.items.length} />
                ) : (
                  group.items.map((stat) => (
                    <div
                      key={stat.title}
                      className="group rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-5">
                        <div>
                          <p className="font-medium text-primary/70">
                            {stat.title}
                          </p>
                          <h3 className="mt-3 text-2xl font-extrabold text-primary">
                            {stat.value}
                          </h3>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-button text-lg text-secondary shadow-md transition-all duration-300 group-hover:scale-105">
                          {stat.icon}
                        </div>
                      </div>

                      <div className="mt-5 h-1 w-12 rounded-full bg-button transition-all duration-500 group-hover:w-20"></div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardChartCard
            title="Population Movement"
            subtitle={`${selectedSession} - ${selectedTerm}`}
          >
            {loading ? (
              <CardSkeleton count={1} />
            ) : populationChartData.every((item) => item.value === 0) ? (
              <ChartEmptyState />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={populationChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f29371a" />
                    <XAxis dataKey="name" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} />
                    <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} />
                    <Tooltip content={<NumberTooltip />} />
                    <Bar dataKey="value" name="Students" radius={[10, 10, 0, 0]}>
                      {populationChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashboardChartCard>

          <DashboardChartCard
            title="Gender Distribution"
            subtitle="Active students for the selected session and term"
          >
            {loading ? (
              <CardSkeleton count={1} />
            ) : genderChartData.length === 0 ? (
              <ChartEmptyState />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {genderChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<NumberTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashboardChartCard>

          <DashboardChartCard
            title="Financial Overview"
            subtitle="Paid and outstanding values across major school collections"
          >
            {loading ? (
              <CardSkeleton count={1} />
            ) : financeChartData.every(
                (item) => item.paid === 0 && item.outstanding === 0
              ) ? (
              <ChartEmptyState />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f29371a" />
                    <XAxis dataKey="name" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} />
                    <YAxis tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend />
                    <Bar dataKey="paid" name="Paid" stackId="money" fill={CHART_COLORS.paid} radius={[0, 0, 6, 6]} />
                    <Bar dataKey="outstanding" name="Outstanding" stackId="money" fill={CHART_COLORS.outstanding} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </DashboardChartCard>

          <DashboardChartCard
            title="Result Upload Coverage"
            subtitle={`${selectedSession} - ${selectedTerm}`}
          >
            {loading ? (
              <CardSkeleton count={1} />
            ) : coverageChartData.length === 0 ? (
              <ChartEmptyState />
            ) : (
              <a
                href="#result-upload-coverage"
                aria-label="Jump to Result Upload Coverage"
                className="block h-80 rounded-lg outline-none transition duration-300 focus:ring-2 focus:ring-button/30"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coverageChartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f29371a" />
                    <XAxis type="number" tick={{ fill: CHART_COLORS.muted, fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                    />
                    <Tooltip content={<NumberTooltip />} />
                    <Legend />
                    <Bar dataKey="uploaded" name="Uploaded" stackId="coverage" fill={CHART_COLORS.paid} radius={[0, 8, 8, 0]} />
                    <Bar dataKey="missing" name="Missing" stackId="coverage" fill={CHART_COLORS.outstanding} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </a>
            )}
          </DashboardChartCard>
        </section>

        <section
          id="result-upload-coverage"
          className="mt-8 scroll-mt-6 rounded-lg border border-secondary/10 bg-secondary p-6 shadow-lg"
        >
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-primary">
              Result Upload Coverage
            </h3>
            <p className="mt-2 text-primary/70">
              Uploaded results out of registered students for {selectedSession}
              {selectedTerm ? ` - ${selectedTerm}` : ""}.
            </p>
          </div>

          {classCoverage.length === 0 ? (
            <div className="rounded-lg border border-primary/10 bg-primary/5 p-6 text-primary/70">
              No class has been created for {selectedSession} yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-primary/10">
              <div className="hidden grid-cols-[1.4fr_1fr_auto] gap-4 bg-primary/10 px-5 py-4 text-sm font-bold uppercase text-primary/60 md:grid">
                <span>Class</span>
                <span>Coverage</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-primary/10">
                {classCoverage.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-4 bg-primary/5 px-5 py-4 text-primary transition duration-300 hover:bg-primary/10 md:grid-cols-[1.4fr_1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="font-extrabold uppercase">{item.className}</p>
                      <p className="mt-1 text-sm font-semibold text-primary/55">
                        {item.session}
                      </p>
                    </div>

                    <div>
                      <p className="text-lg font-extrabold">
                        {item.uploaded} / {item.total}
                      </p>
                      <p className="text-sm font-semibold text-primary/55">
                        results uploaded
                      </p>
                    </div>

                    <Link
                      to={`/admin/classes/${item.id}/coverage`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-button px-4 py-3 text-sm font-bold text-secondary transition duration-300 hover:scale-[1.02] md:w-auto"
                    >
                      Coverage Overview
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export default AdminDashboard;
