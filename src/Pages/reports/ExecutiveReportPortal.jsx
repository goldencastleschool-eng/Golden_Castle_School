import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRightFromBracket,
  FaChartPie,
  FaMoneyBillWave,
  FaRotateRight,
  FaUserCheck,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const terms = ["First Term", "Second Term", "Third Term"];

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

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#F85E00] focus:ring-2 focus:ring-[#F85E00]/20";

const tableHeadClass = "bg-slate-100 text-slate-700";
const tableCellClass = "px-4 py-3";

function SummaryCard({ title, value, icon, tone = "slate" }) {
  const toneClasses = {
    slate: "bg-slate-900 text-white",
    amber: "bg-[#F85E00] text-white",
    green: "bg-emerald-600 text-white",
    red: "bg-rose-600 text-white",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-extrabold text-slate-950">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
            toneClasses[tone] || toneClasses.slate
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StudentTable({ title, students, loading }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {loading ? "Loading..." : `${students.length} student(s)`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
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
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {loading ? (
              <tr>
                <td className="px-4 py-5 text-slate-500" colSpan="10">
                  Loading student records...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-slate-500" colSpan="10">
                  No student record found for this filter.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student._id}>
                  <td className={tableCellClass}>{index + 1}</td>
                  <td className={`${tableCellClass} font-bold text-slate-950`}>
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
                  <td className={`${tableCellClass} font-bold text-slate-950`}>
                    {formatCurrency(student.paid)}
                  </td>
                  <td className={tableCellClass}>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        student.balance > 0
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
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
    </section>
  );
}

function ExecutiveReportPortal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({
    session: "",
    term: "First Term",
    class_record: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedSession = report?.selected_session || filters.session;
  const selectedTerm = report?.selected_term || filters.term;
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
      setFilters({
        session: response.data.selected_session || nextFilters.session,
        term: response.data.selected_term || nextFilters.term,
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
      session: "",
      term: "First Term",
      class_record: "",
    });
  }, [fetchReport]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = {
      ...filters,
      [name]: value,
    };

    if (name === "session") {
      nextFilters.class_record = "";
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

  const summary = report?.summary || {};
  const classSummaries = report?.class_summaries || [];
  const classOptions = report?.class_options || [];
  const newlyAdmittedStudents = report?.newly_admitted_students || [];
  const returningStudents = report?.returning_students || [];

  const paidPercentage = useMemo(() => {
    if (!summary.expected) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((Number(summary.paid || 0) / Number(summary.expected)) * 100)
    );
  }, [summary.expected, summary.paid]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#69140E] text-xl text-white">
              <FaChartPie />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Golden Castle School
              </p>
              <h1 className="text-2xl font-extrabold text-slate-950">
                Executive Reports
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
              <p className="text-xs font-bold uppercase text-slate-500">
                Signed in as
              </p>
              <p className="font-bold text-slate-950">
                {user?.username || getRoleLabel(user?.role)}
                <span className="ml-2 text-sm font-semibold text-slate-500">
                  {getRoleLabel(user?.role)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#69140E] px-4 py-3 font-bold text-white transition hover:bg-[#F85E00]"
            >
              <FaArrowRightFromBracket />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
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
              <label className="mb-2 block text-sm font-bold text-slate-600">
                Term
              </label>
              <select
                className={inputClass}
                name="term"
                value={selectedTerm}
                onChange={handleFilterChange}
              >
                {(report?.available_terms || terms).map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
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

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F85E00] px-5 py-3 font-bold text-white transition hover:bg-[#69140E]"
            >
              <FaRotateRight />
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 font-semibold text-rose-700">
            {error}
          </div>
        )}

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
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  Fee Summary
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedSession || "No session"} · {selectedTerm}
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                {loading ? "..." : `${paidPercentage}% paid`}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">Total Fee</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">
                  {loading ? "..." : formatCurrency(summary.expected)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-700">Paid</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-800">
                  {loading ? "..." : formatCurrency(summary.paid)}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 p-4">
                <p className="text-sm font-bold text-rose-700">Balance</p>
                <p className="mt-2 text-2xl font-extrabold text-rose-800">
                  {loading ? "..." : formatCurrency(summary.balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-950">
              Population Split
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
                  <span>Newly Admitted</span>
                  <span>{summary.newly_admitted || 0}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-emerald-600"
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
                <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
                  <span>Returning</span>
                  <span>{summary.returning || 0}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-[#F85E00]"
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

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-slate-950">
              Class Report
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {loading
                ? "Loading..."
                : `${classSummaries.length} class record(s)`}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
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
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {loading ? (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan="11">
                      Loading class report...
                    </td>
                  </tr>
                ) : classSummaries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan="11">
                      No class record found for this filter.
                    </td>
                  </tr>
                ) : (
                  classSummaries.map((classSummary) => (
                    <tr key={classSummary.class_record || classSummary.class}>
                      <td className={`${tableCellClass} font-bold text-slate-950`}>
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
                      <td className={`${tableCellClass} font-bold text-slate-950`}>
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
      </div>
    </main>
  );
}

export default ExecutiveReportPortal;
