import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRightFromBracket,
  FaBus,
  FaChartPie,
  FaMoneyBillWave,
  FaRotateRight,
  FaUserCheck,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FIRST_IMPLEMENTED_SESSION,
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";

const DEFAULT_TERM = "Second Term";
const emptyList = [];
const emptySummary = {};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatFeeCategory = (feeCategory = "") =>
  feeCategory === "new" ? "Newly Admitted" : "Returning";

const formatDate = (dateValue) =>
  dateValue ? new Date(dateValue).toLocaleDateString() : "Not available";

const getRoleLabel = (role = "") => {
  if (role === "chairman") {
    return "Chairman";
  }

  if (role === "principal") {
    return "Principal";
  }

  return "Administrator";
};

const PAGE_SIZE = 10;

const inputClass =
  "w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20";

const tableHeadClass = "bg-primary/10 text-primary";
const tableCellClass = "px-5 py-4";

function PaginationControls({
  currentPage,
  totalItems,
  pageSize = PAGE_SIZE,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const buttonClass =
    "rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-primary/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-primary/60">
        Showing {startItem}-{endItem} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${buttonClass} bg-primary/10 text-primary`}
        >
          Previous
        </button>
        <span className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${buttonClass} bg-primary/10 text-primary`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, tone = "default" }) {
  const toneClasses = {
    default: "bg-button text-secondary",
    amber: "bg-button text-secondary",
    green: "bg-green-500/15 text-green-300",
    red: "bg-red-500/15 text-red-300",
  };

  return (
    <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-primary/60">{title}</p>
          <p className="mt-3 text-3xl font-extrabold text-primary">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
            toneClasses[tone] || toneClasses.default
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StudentTable({ title, students, loading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, totalPages);

  const paginatedStudents = useMemo(() => {
    const startIndex = (visiblePage - 1) * PAGE_SIZE;

    return students.slice(startIndex, startIndex + PAGE_SIZE);
  }, [students, visiblePage]);

  return (
    <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-2xl font-extrabold text-primary">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-primary/60">
            {loading ? "Loading..." : `${students.length} student(s)`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-primary/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className={tableCellClass}>S/N</th>
              <th className={tableCellClass}>Student</th>
              <th className={tableCellClass}>Admission No.</th>
              <th className={tableCellClass}>Class</th>
              <th className={tableCellClass}>Category</th>
              <th className={tableCellClass}>Expected</th>
              <th className={tableCellClass}>Paid</th>
              <th className={tableCellClass}>Balance</th>
              <th className={tableCellClass}>Status</th>
              <th className={tableCellClass}>Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10 text-primary/80">
            {loading ? (
              <tr>
                <td className="px-5 py-6 text-primary/70" colSpan="10">
                  Loading student records...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-primary/70" colSpan="10">
                  No student record found for this filter.
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, index) => (
                <tr key={student._id}>
                  <td className={tableCellClass}>
                    {(visiblePage - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className={`${tableCellClass} font-bold text-primary`}>
                    {student.full_name}
                  </td>
                  <td className={tableCellClass}>{student.admission_no}</td>
                  <td className={tableCellClass}>
                    {student.class?.toUpperCase() || "Not set"}
                  </td>
                  <td className={tableCellClass}>
                    {formatFeeCategory(student.fee_category)}
                  </td>
                  <td className={tableCellClass}>
                    {formatCurrency(student.expected)}
                  </td>
                  <td className={`${tableCellClass} font-bold text-primary`}>
                    {formatCurrency(student.paid)}
                  </td>
                  <td className={tableCellClass}>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        student.balance > 0
                          ? "bg-red-500/10 text-red-200"
                          : "bg-green-500/10 text-green-200"
                      }`}
                    >
                      {formatCurrency(student.balance)}
                    </span>
                  </td>
                  <td className={tableCellClass}>{student.payment_status}</td>
                  <td className={tableCellClass}>
                    {formatDate(student.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        currentPage={visiblePage}
        totalItems={students.length}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}

function ExecutiveReportPortal({ embedded = false, page = "fee" }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({
    session: FIRST_IMPLEMENTED_SESSION,
    term: DEFAULT_TERM,
    class_record: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classPage, setClassPage] = useState(1);

  const selectedSession = report?.selected_session || filters.session;
  const selectedTerm =
    normalizeTermForSession(report?.selected_term || filters.term, selectedSession) ||
    getVisibleTermsForSession(selectedSession)[0] ||
    "";
  const selectedClassRecord =
    report?.selected_class_record || filters.class_record;

  const fetchReport = useCallback(async (nextFilters) => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/reports/overview", {
        params: nextFilters,
      });

      setReport(response.data);
      const selectedSession =
        response.data.selected_session || nextFilters.session;
      setFilters({
        session: selectedSession,
        term:
          normalizeTermForSession(
            response.data.selected_term || nextFilters.term,
            selectedSession
          ) ||
          getVisibleTermsForSession(selectedSession)[0] ||
          "",
        class_record:
          response.data.selected_class_record || nextFilters.class_record,
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport({
      session: FIRST_IMPLEMENTED_SESSION,
      term: DEFAULT_TERM,
      class_record: "",
    });
  }, [fetchReport]);

  useEffect(() => {
    if (!embedded && user?.role === "admin") {
      navigate("/admin/reports", { replace: true });
    }
  }, [embedded, navigate, user?.role]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = {
      ...filters,
      [name]: value,
    };

    if (name === "session") {
      nextFilters.class_record = "";
      nextFilters.term =
        normalizeTermForSession(nextFilters.term, value) ||
        getVisibleTermsForSession(value)[0] ||
        "";
    }

    setFilters(nextFilters);
    fetchReport(nextFilters);
  };

  const handleRefresh = () => {
    fetchReport(filters);
  };

  const handleLogout = async () => {
    await API.post("/auth/logout").catch(() => {});
    logout();
    navigate(user?.role === "admin" ? "/secure-admin-login" : "/executive-login");
  };

  const summary = report?.summary || emptySummary;
  const classSummaries = report?.class_summaries || emptyList;
  const classOptions = report?.class_options || emptyList;
  const newlyAdmittedStudents = report?.newly_admitted_students || emptyList;
  const returningStudents = report?.returning_students || emptyList;
  const busSummary = report?.bus_summary || emptySummary;
  const boardingSummary = report?.boarding_summary || emptySummary;
  const payrollSummary = report?.payroll_summary || emptySummary;
  const busReportRows = busSummary.route_rows || emptyList;
  const boardingReportRows = boardingSummary.house_rows || emptyList;
  const payrollReportRows = payrollSummary.category_rows || emptyList;
  const showPayroll = user?.role !== "chairman";
  const activePage = embedded ? "all" : page;
  const showFeePage = activePage === "all" || activePage === "fee";
  const showBusPage = activePage === "all" || activePage === "bus";
  const showBoardingPage = activePage === "all" || activePage === "boarding";
  const showPayrollPage =
    showPayroll && (activePage === "all" || activePage === "payroll");
  const executiveNavItems = [
    {
      label: "Fee Report",
      path: "/reports/fees",
      page: "fee",
    },
    {
      label: "Bus Report",
      path: "/reports/buses",
      page: "bus",
    },
    {
      label: "Boarding Report",
      path: "/reports/boarding",
      page: "boarding",
    },
    ...(showPayroll
      ? [
          {
            label: "Payroll Report",
            path: "/reports/payroll",
            page: "payroll",
          },
        ]
      : []),
  ];
  const classTotalPages = Math.max(1, Math.ceil(classSummaries.length / PAGE_SIZE));
  const visibleClassPage = Math.min(classPage, classTotalPages);

  const paginatedClassSummaries = useMemo(() => {
    const startIndex = (visibleClassPage - 1) * PAGE_SIZE;

    return classSummaries.slice(startIndex, startIndex + PAGE_SIZE);
  }, [classSummaries, visibleClassPage]);

  const paidPercentage = useMemo(() => {
    if (!summary.expected) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((Number(summary.paid || 0) / Number(summary.expected)) * 100)
    );
  }, [summary.expected, summary.paid]);

  const PageWrapper = embedded ? "div" : "main";

  return (
    <PageWrapper
      className={embedded ? "px-6 py-10 lg:px-12" : "min-h-screen bg-background"}
    >
      {!embedded && (
      <header className="bg-secondary shadow-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
              <FaChartPie />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary/60">
                Golden Castle School
              </p>
              <h1 className="text-2xl font-extrabold text-primary">
                Executive Reports
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-2">
              <p className="text-xs font-bold uppercase text-primary/60">
                Signed in as
              </p>
              <p className="font-bold text-primary">
                {user?.username || getRoleLabel(user?.role)}
                <span className="ml-2 text-sm font-semibold text-primary/60">
                  {getRoleLabel(user?.role)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-button px-4 py-3 font-bold text-secondary shadow-lg transition hover:scale-[1.02]"
            >
              <FaArrowRightFromBracket />
              Logout
            </button>
          </div>
        </div>
      </header>
      )}

      <div className={embedded ? "" : "mx-auto max-w-7xl px-5 py-8 lg:px-8"}>
        {embedded && (
          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
              <FaChartPie />
            </div>
            <h2 className="text-4xl font-extrabold text-secondary">
              Admin Report
            </h2>
            <p className="mt-3 max-w-2xl text-secondary/75">
              Review fee, bus, boarding, payroll, and student population reports.
            </p>
          </div>
        )}

        {!embedded && (
          <nav className="mb-6 flex flex-wrap gap-3">
            {executiveNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-2xl px-5 py-3 text-sm font-bold shadow-lg transition ${
                  activePage === item.page
                    ? "bg-button text-secondary"
                    : "bg-secondary text-primary hover:bg-button hover:text-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <section className="mb-6 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <div
            className={`grid grid-cols-1 gap-4 lg:items-end ${
              showFeePage
                ? "lg:grid-cols-[1fr_1fr_1fr_auto]"
                : "lg:grid-cols-[1fr_1fr_auto]"
            }`}
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-primary/60">
                Session
              </label>
              <select
                className={inputClass}
                name="session"
                value={selectedSession}
                onChange={handleFilterChange}
              >
                {(report?.available_sessions || []).map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-primary/60">
                Term
              </label>
              <select
                className={inputClass}
                name="term"
                value={selectedTerm}
                onChange={handleFilterChange}
              >
                {getVisibleTermsForSession(selectedSession)
                  .filter(
                    (term) =>
                      !(report?.available_terms?.length) ||
                      report.available_terms.includes(term)
                  )
                  .map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
              </select>
            </div>

            {showFeePage && (
            <div>
              <label className="mb-2 block text-sm font-bold text-primary/60">
                Class
              </label>
              <select
                className={inputClass}
                name="class_record"
                value={selectedClassRecord}
                onChange={handleFilterChange}
              >
                <option value="">All classes</option>
                {classOptions.map((classRecord) => (
                  <option key={classRecord._id} value={classRecord._id}>
                    {classRecord.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02]"
            >
              <FaRotateRight />
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 font-semibold text-red-200">
            {error}
          </div>
        )}

        {showFeePage && (
        <>
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Students"
            value={loading ? "..." : summary.total_students || 0}
            icon={<FaUsers />}
          />
          <SummaryCard
            title="Newly Admitted"
            value={loading ? "..." : summary.newly_admitted || 0}
            icon={<FaUserGraduate />}
            tone="green"
          />
          <SummaryCard
            title="Returning Students"
            value={loading ? "..." : summary.returning || 0}
            icon={<FaUserCheck />}
            tone="amber"
          />
          <SummaryCard
            title="Outstanding Students"
            value={loading ? "..." : summary.outstanding_students || 0}
            icon={<FaMoneyBillWave />}
            tone="red"
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-primary">
                  Fee Summary
                </h2>
                <p className="mt-1 text-sm font-semibold text-primary/60">
                  {selectedSession || "No session"} - {selectedTerm}
                </p>
              </div>
              <div className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">
                {loading ? "..." : `${paidPercentage}% paid`}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-primary/5 p-5">
                <p className="text-sm font-bold text-primary/60">Total Fee</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {loading ? "..." : formatCurrency(summary.expected)}
                </p>
              </div>
              <div className="rounded-2xl bg-green-500/10 p-5">
                <p className="text-sm font-bold text-green-300">Paid</p>
                <p className="mt-2 text-2xl font-extrabold text-green-200">
                  {loading ? "..." : formatCurrency(summary.paid)}
                </p>
              </div>
              <div className="rounded-2xl bg-red-500/10 p-5">
                <p className="text-sm font-bold text-red-300">Balance</p>
                <p className="mt-2 text-2xl font-extrabold text-red-200">
                  {loading ? "..." : formatCurrency(summary.balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <h2 className="text-2xl font-extrabold text-primary">
              Population Split
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm font-bold text-primary/70">
                  <span>Newly Admitted</span>
                  <span>{summary.newly_admitted || 0}</span>
                </div>
                <div className="h-3 rounded-full bg-primary/10">
                  <div
                    className="h-3 rounded-full bg-green-600"
                    style={{
                      width: `${
                        summary.total_students
                          ? (summary.newly_admitted / summary.total_students) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm font-bold text-primary/70">
                  <span>Returning</span>
                  <span>{summary.returning || 0}</span>
                </div>
                <div className="h-3 rounded-full bg-primary/10">
                  <div
                    className="h-3 rounded-full bg-button"
                    style={{
                      width: `${
                        summary.total_students
                          ? (summary.returning / summary.total_students) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        </>
        )}

        {(showBusPage || showBoardingPage || showPayrollPage) && (
        <section
          className={`mb-6 grid grid-cols-1 gap-4 ${
            [showBusPage, showBoardingPage, showPayrollPage].filter(Boolean).length > 1
              ? "xl:grid-cols-2"
              : ""
          }`}
        >
          {showBusPage && (
          <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-primary">
                  Bus Summary
                </h2>
                <p className="mt-1 text-sm font-semibold text-primary/60">
                  {selectedSession || "No session"} - {selectedTerm}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
                <FaBus />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-primary/5 p-5">
                <p className="text-sm font-bold text-primary/60">
                  Active Bus Students
                </p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {loading ? "..." : busSummary.active_enrollments || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-primary/5 p-5">
                <p className="text-sm font-bold text-primary/60">Routes</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {loading ? "..." : busSummary.routes || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-green-500/10 p-5">
                <p className="text-sm font-bold text-green-300">Paid</p>
                <p className="mt-2 text-2xl font-extrabold text-green-200">
                  {loading ? "..." : formatCurrency(busSummary.paid)}
                </p>
              </div>
              <div className="rounded-2xl bg-red-500/10 p-5">
                <p className="text-sm font-bold text-red-300">Balance</p>
                <p className="mt-2 text-2xl font-extrabold text-red-200">
                  {loading ? "..." : formatCurrency(busSummary.balance)}
                </p>
              </div>
            </div>
          </div>
          )}

          {showBoardingPage && (
          <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-primary">
                  Boarding Summary
                </h2>
                <p className="mt-1 text-sm font-semibold text-primary/60">
                  {selectedSession || "No session"} - {selectedTerm}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
                <FaUserGraduate />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-primary/5 p-5">
                <p className="text-sm font-bold text-primary/60">Boarding Students</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {loading ? "..." : boardingSummary.active_enrollments || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-primary/5 p-5">
                <p className="text-sm font-bold text-primary/60">Houses</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {loading ? "..." : boardingSummary.houses || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-green-500/10 p-5">
                <p className="text-sm font-bold text-green-300">Paid</p>
                <p className="mt-2 text-2xl font-extrabold text-green-200">
                  {loading ? "..." : formatCurrency(boardingSummary.paid)}
                </p>
              </div>
              <div className="rounded-2xl bg-red-500/10 p-5">
                <p className="text-sm font-bold text-red-300">Balance</p>
                <p className="mt-2 text-2xl font-extrabold text-red-200">
                  {loading ? "..." : formatCurrency(boardingSummary.balance)}
                </p>
              </div>
            </div>
          </div>
          )}

          {showPayrollPage && (
            <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-primary">
                    Payroll Summary
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-primary/60">
                    {selectedSession || "No session"} - {selectedTerm}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
                  <FaMoneyBillWave />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-primary/5 p-5">
                  <p className="text-sm font-bold text-primary/60">
                    Active Staff
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-primary">
                    {loading ? "..." : payrollSummary.active_staff || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-5">
                  <p className="text-sm font-bold text-primary/60">
                    Assigned Staff
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-primary">
                    {loading ? "..." : payrollSummary.assigned_staff || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-green-500/10 p-5">
                  <p className="text-sm font-bold text-green-300">Paid</p>
                  <p className="mt-2 text-2xl font-extrabold text-green-200">
                    {loading ? "..." : formatCurrency(payrollSummary.paid)}
                  </p>
                </div>
                <div className="rounded-2xl bg-red-500/10 p-5">
                  <p className="text-sm font-bold text-red-300">Balance</p>
                  <p className="mt-2 text-2xl font-extrabold text-red-200">
                    {loading ? "..." : formatCurrency(payrollSummary.balance)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
        )}

        {showBusPage && (
        <section className="mb-6 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-2xl font-extrabold text-primary">
              Bus Report
            </h2>
            <p className="mt-1 text-sm font-semibold text-primary/60">
              Route-level transport enrollment and payment report.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableCellClass}>Route</th>
                  <th className={tableCellClass}>Students</th>
                  <th className={tableCellClass}>Expected</th>
                  <th className={tableCellClass}>Paid</th>
                  <th className={tableCellClass}>Balance</th>
                  <th className={tableCellClass}>Outstanding Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      Loading bus report...
                    </td>
                  </tr>
                ) : busReportRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No bus record found for this filter.
                    </td>
                  </tr>
                ) : (
                  busReportRows.map((row) => (
                    <tr key={row.route_id || row.route}>
                      <td className={`${tableCellClass} font-bold text-primary`}>
                        {row.route}
                      </td>
                      <td className={tableCellClass}>{row.active_enrollments}</td>
                      <td className={tableCellClass}>
                        {formatCurrency(row.expected)}
                      </td>
                      <td className={`${tableCellClass} font-bold text-primary`}>
                        {formatCurrency(row.paid)}
                      </td>
                      <td className={tableCellClass}>
                        {formatCurrency(row.balance)}
                      </td>
                      <td className={tableCellClass}>
                        {row.outstanding_students}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {showBoardingPage && (
        <section className="mb-6 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-2xl font-extrabold text-primary">
              Boarding Report
            </h2>
            <p className="mt-1 text-sm font-semibold text-primary/60">
              House-level boarding registration and payment report.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableCellClass}>House</th>
                  <th className={tableCellClass}>Students</th>
                  <th className={tableCellClass}>Expected</th>
                  <th className={tableCellClass}>Paid</th>
                  <th className={tableCellClass}>Balance</th>
                  <th className={tableCellClass}>Outstanding Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      Loading boarding report...
                    </td>
                  </tr>
                ) : boardingReportRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No boarding record found for this filter.
                    </td>
                  </tr>
                ) : (
                  boardingReportRows.map((row) => (
                    <tr key={row.house_id || row.house}>
                      <td className={`${tableCellClass} font-bold text-primary`}>
                        {row.house}
                      </td>
                      <td className={tableCellClass}>{row.active_enrollments}</td>
                      <td className={tableCellClass}>{formatCurrency(row.expected)}</td>
                      <td className={`${tableCellClass} font-bold text-primary`}>
                        {formatCurrency(row.paid)}
                      </td>
                      <td className={tableCellClass}>{formatCurrency(row.balance)}</td>
                      <td className={tableCellClass}>{row.outstanding_students}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {showPayrollPage && (
          <section className="mb-6 rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-2xl font-extrabold text-primary">
                Payroll Report
              </h2>
              <p className="mt-1 text-sm font-semibold text-primary/60">
                Staff payroll by category and level for the selected filter.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-primary/10">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className={tableCellClass}>Category</th>
                    <th className={tableCellClass}>Level</th>
                    <th className={tableCellClass}>Assigned Staff</th>
                    <th className={tableCellClass}>Expected</th>
                    <th className={tableCellClass}>Paid</th>
                    <th className={tableCellClass}>Balance</th>
                    <th className={tableCellClass}>Outstanding Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 text-primary/80">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="7">
                        Loading payroll report...
                      </td>
                    </tr>
                  ) : payrollReportRows.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="7">
                        No payroll record found for this filter.
                      </td>
                    </tr>
                  ) : (
                    payrollReportRows.map((row) => (
                      <tr key={row.key || `${row.category}-${row.level_name}`}>
                        <td className={`${tableCellClass} font-bold text-primary`}>
                          {row.category === "non_academic"
                            ? "Non Academic"
                            : "Academic"}
                        </td>
                        <td className={tableCellClass}>{row.level_name}</td>
                        <td className={tableCellClass}>{row.assigned_staff}</td>
                        <td className={tableCellClass}>
                          {formatCurrency(row.expected)}
                        </td>
                        <td className={`${tableCellClass} font-bold text-primary`}>
                          {formatCurrency(row.paid)}
                        </td>
                        <td className={tableCellClass}>
                          {formatCurrency(row.balance)}
                        </td>
                        <td className={tableCellClass}>{row.outstanding_staff}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showFeePage && (
        <>
        <section className="mb-6 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-2xl font-extrabold text-primary">
              Class Report
            </h2>
            <p className="mt-1 text-sm font-semibold text-primary/60">
              {loading
                ? "Loading..."
                : `${classSummaries.length} class record(s)`}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableCellClass}>Class</th>
                  <th className={tableCellClass}>Population</th>
                  <th className={tableCellClass}>New</th>
                  <th className={tableCellClass}>Returning</th>
                  <th className={tableCellClass}>Total Fee</th>
                  <th className={tableCellClass}>Paid</th>
                  <th className={tableCellClass}>Balance</th>
                  <th className={tableCellClass}>Fully Paid</th>
                  <th className={tableCellClass}>Part Payment</th>
                  <th className={tableCellClass}>Unpaid</th>
                  <th className={tableCellClass}>No Structure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="11">
                      Loading class report...
                    </td>
                  </tr>
                ) : classSummaries.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="11">
                      No class record found for this filter.
                    </td>
                  </tr>
                ) : (
                  paginatedClassSummaries.map((classSummary) => (
                    <tr key={classSummary.class_record || classSummary.class}>
                      <td className={`${tableCellClass} font-bold text-primary`}>
                        {classSummary.class?.toUpperCase() || "Not set"}
                      </td>
                      <td className={tableCellClass}>
                        {classSummary.total_students}
                      </td>
                      <td className={tableCellClass}>
                        {classSummary.newly_admitted}
                      </td>
                      <td className={tableCellClass}>
                        {classSummary.returning}
                      </td>
                      <td className={tableCellClass}>
                        {formatCurrency(classSummary.expected)}
                      </td>
                      <td className={`${tableCellClass} font-bold text-primary`}>
                        {formatCurrency(classSummary.paid)}
                      </td>
                      <td className={tableCellClass}>
                        {formatCurrency(classSummary.balance)}
                      </td>
                      <td className={tableCellClass}>
                        {classSummary.fully_paid}
                      </td>
                      <td className={tableCellClass}>
                        {classSummary.part_payment}
                      </td>
                      <td className={tableCellClass}>{classSummary.unpaid}</td>
                      <td className={tableCellClass}>
                        {classSummary.no_structure}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={visibleClassPage}
            totalItems={classSummaries.length}
            onPageChange={setClassPage}
          />
        </section>

        <div className="grid grid-cols-1 gap-6">
          <StudentTable
            title="Newly Admitted Students"
            students={newlyAdmittedStudents}
            loading={loading}
          />
          <StudentTable
            title="Returning Students"
            students={returningStudents}
            loading={loading}
          />
        </div>
        </>
        )}
      </div>
    </PageWrapper>
  );
}

export default ExecutiveReportPortal;
