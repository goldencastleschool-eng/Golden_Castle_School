import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaChartPie,
  FaFileLines,
  FaPrint,
  FaTriangleExclamation,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import { SCHOOL_NAME, schoolLogo } from "../../utils/printBranding.js";

const DEFAULT_REPORT_SESSION = "2025/2026";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

function AdminReport() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([]);
  const [cumulativeResults, setCumulativeResults] = useState([]);
  const [reportFilter, setReportFilter] = useState({
    session: DEFAULT_REPORT_SESSION,
    term: "",
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setStatus({ type: "", message: "" });

        const [
          studentsRequest,
          classesRequest,
          resultsRequest,
          cumulativeResultsRequest,
          accessRequest,
        ] = await Promise.allSettled([
          API.get("/students"),
          API.get("/classes"),
          API.get("/results"),
          API.get("/cumulative-results"),
          API.get("/result-access"),
        ]);

        if (studentsRequest.status === "rejected") {
          throw new Error(
            studentsRequest.reason?.response?.data?.message ||
              "Unable to load student records."
          );
        }

        if (classesRequest.status === "rejected") {
          throw new Error(
            classesRequest.reason?.response?.data?.message ||
              "Unable to load class records."
          );
        }

        if (resultsRequest.status === "rejected") {
          throw new Error(
            resultsRequest.reason?.response?.data?.message ||
              "Unable to load result records."
          );
        }

        setStudents(studentsRequest.value.data || []);
        setClasses(classesRequest.value.data || []);
        setResults(resultsRequest.value.data || []);
        setCumulativeResults(
          cumulativeResultsRequest.status === "fulfilled"
            ? cumulativeResultsRequest.value.data || []
            : []
        );
        setReportFilter((currentFilter) => ({
          session: currentFilter.session || DEFAULT_REPORT_SESSION,
          term:
            accessRequest.status === "fulfilled"
              ? accessRequest.value.data?.term || currentFilter.term || ""
              : currentFilter.term || "",
        }));
      } catch (requestError) {
        setStatus({
          type: "error",
          message:
            requestError.message ||
            requestError.response?.data?.message ||
            "Unable to load admin report.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const sessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_REPORT_SESSION,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
        ...students.map((student) => student.current_session).filter(Boolean),
        ...students.map((student) => student.left_session).filter(Boolean),
        ...results.map((result) => result.session).filter(Boolean),
        ...cumulativeResults.map((result) => result.session).filter(Boolean),
      ]),
    ].sort();
  }, [classes, cumulativeResults, results, students]);

  const reportClasses = useMemo(
    () =>
      classes.filter(
        (classRecord) => classRecord.session === reportFilter.session
      ),
    [classes, reportFilter.session]
  );

  const reportStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.current_session === reportFilter.session &&
          student.status === "active"
      ),
    [reportFilter.session, students]
  );

  const leftSchoolStudents = useMemo(
    () =>
      students
        .filter(
          (student) =>
            student.status === "left" &&
            student.left_session === reportFilter.session &&
            (!reportFilter.term || student.left_term === reportFilter.term)
        )
        .sort(
          (firstStudent, secondStudent) =>
            new Date(secondStudent.left_at || secondStudent.updatedAt || 0) -
            new Date(firstStudent.left_at || firstStudent.updatedAt || 0)
        ),
    [reportFilter.session, reportFilter.term, students]
  );

  const reportResults = useMemo(
    () =>
      results.filter(
        (result) =>
          result.session === reportFilter.session &&
          (!reportFilter.term || result.term === reportFilter.term)
      ),
    [reportFilter.session, reportFilter.term, results]
  );

  const reportCumulativeResults = useMemo(
    () =>
      cumulativeResults.filter(
        (result) => result.session === reportFilter.session
      ),
    [cumulativeResults, reportFilter.session]
  );

  const classRows = useMemo(() => {
    return reportClasses.map((classRecord) => {
      const classStudents = reportStudents.filter(
        (student) =>
          normalizeClassName(student.class) === normalizeClassName(classRecord.name)
      );
      const classResults = reportResults.filter(
        (result) =>
          normalizeClassName(result.class) === normalizeClassName(classRecord.name)
      );
      const uploadedStudentIds = new Set(
        classResults.map((result) => result.student?._id || result.student)
      );
      const cumulativeStudentIds = new Set(
        reportCumulativeResults
          .filter(
            (result) =>
              normalizeClassName(result.class) === normalizeClassName(classRecord.name)
          )
          .map((result) => result.student?._id || result.student)
      );
      const missingCount = classStudents.filter(
        (student) => !uploadedStudentIds.has(student._id)
      ).length;
      const missingCumulativeCount = classStudents.filter(
        (student) => !cumulativeStudentIds.has(student._id)
      ).length;

      return {
        id: classRecord._id,
        name: classRecord.name,
        session: classRecord.session,
        students: classStudents.length,
        uploaded: uploadedStudentIds.size,
        missing: missingCount,
        cumulativeUploaded: cumulativeStudentIds.size,
        cumulativeMissing: missingCumulativeCount,
        coverage: classStudents.length
          ? Math.round((uploadedStudentIds.size / classStudents.length) * 100)
          : 0,
        cumulativeCoverage: classStudents.length
          ? Math.round((cumulativeStudentIds.size / classStudents.length) * 100)
          : 0,
      };
    });
  }, [reportClasses, reportCumulativeResults, reportResults, reportStudents]);

  const genderSummary = useMemo(() => {
    return reportStudents.reduce(
      (summary, student) => {
        const gender = student.gender || "Not Set";
        return {
          ...summary,
          [gender]: (summary[gender] || 0) + 1,
        };
      },
      {}
    );
  }, [reportStudents]);

  const missingUploadCount = classRows.reduce(
    (total, classRow) => total + classRow.missing,
    0
  );
  const uploadedStudentCount = classRows.reduce(
    (total, classRow) => total + classRow.uploaded,
    0
  );
  const overallCoverage = reportStudents.length
    ? Math.round((uploadedStudentCount / reportStudents.length) * 100)
    : 0;
  const cumulativeUploadedStudentCount = classRows.reduce(
    (total, classRow) => total + classRow.cumulativeUploaded,
    0
  );
  const cumulativeMissingCount = classRows.reduce(
    (total, classRow) => total + classRow.cumulativeMissing,
    0
  );
  const cumulativeCoverage = reportStudents.length
    ? Math.round((cumulativeUploadedStudentCount / reportStudents.length) * 100)
    : 0;

  const recentStudents = [...reportStudents]
    .sort((firstStudent, secondStudent) => {
      return new Date(secondStudent.createdAt || 0) - new Date(firstStudent.createdAt || 0);
    })
    .slice(0, 8);

  const statCards = [
    {
      title: "Students",
      value: loading ? "..." : reportStudents.length,
      icon: <FaUsers />,
    },
    {
      title: "Classes",
      value: loading ? "..." : reportClasses.length,
      icon: <FaUserGraduate />,
    },
    {
      title: "Coverage",
      value: loading ? "..." : `${overallCoverage}%`,
      icon: <FaChartPie />,
    },
    {
      title: "Awaiting Upload",
      value: loading ? "..." : missingUploadCount,
      icon: <FaTriangleExclamation />,
    },
    {
      title: "Cumulative PDFs",
      value: loading ? "..." : reportCumulativeResults.length,
      icon: <FaFileLines />,
    },
    {
      title: "Left School",
      value: loading ? "..." : leftSchoolStudents.length,
      icon: <FaUserGraduate />,
    },
  ];

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setReportFilter((currentFilter) => ({
      ...currentFilter,
      [name]: value,
    }));
  };

  const handlePrintReport = () => {
    if (typeof window.print !== "function") {
      setStatus({
        type: "error",
        message: "Printing is not available in this browser.",
      });
      return;
    }

    window.focus();
    window.print();
  };

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="hidden items-center gap-4 border-b border-primary pb-5 print:mb-6 print:flex">
        <img
          src={schoolLogo}
          alt={`${SCHOOL_NAME} logo`}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-extrabold text-primary">
            {SCHOOL_NAME}
          </h1>
          <p className="mt-1 text-sm font-bold uppercase text-primary/70">
            Admin Report
          </p>
          <p className="mt-1 text-sm text-primary/60">
            {reportFilter.session}
            {reportFilter.term ? ` - ${reportFilter.term}` : ""}
          </p>
        </div>
      </div>

      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaFileLines />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Admin Report
        </h2>
        <p className="mt-3 max-w-3xl text-secondary/75">
          Standard academic operations report for enrollment, class records,
          result uploads, and outstanding result coverage.
        </p>
      </div>

      <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_240px_240px_auto] lg:items-end">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Report Controls
            </h3>
            <p className="mt-2 text-primary/70">
              Report generated for {reportFilter.session}
              {reportFilter.term ? ` - ${reportFilter.term}` : ""}.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Session
            </label>
            <select
              name="session"
              value={reportFilter.session}
              onChange={handleFilterChange}
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              {sessionOptions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Term
            </label>
            <select
              name="term"
              value={reportFilter.term}
              onChange={handleFilterChange}
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              <option value="">All terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrintReport}
            aria-label="Print admin report"
            className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <FaPrint />
            Print
          </button>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.title} className="rounded-[2rem] bg-secondary p-7 shadow-xl">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="font-medium text-primary/70">{card.title}</p>
                <h3 className="mt-4 text-4xl font-extrabold text-primary">
                  {card.value}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_.8fr]">
        <div className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <h3 className="text-3xl font-extrabold text-primary">
            Class Performance Summary
          </h3>
          <p className="mt-2 text-primary/70">
            Enrollment and result upload coverage by class.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Students</th>
                  <th className="px-5 py-4 font-bold">Uploaded</th>
                  <th className="px-5 py-4 font-bold">Missing</th>
                  <th className="px-5 py-4 font-bold">Coverage</th>
                  <th className="px-5 py-4 font-bold">Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loading ? (
                  <TableSkeleton columns={6} />
                ) : classRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No class record found for this session.
                    </td>
                  </tr>
                ) : (
                  classRows.map((classRow) => (
                    <tr key={classRow.id} className="text-primary/80">
                      <td className="px-5 py-4 font-bold uppercase text-primary">
                        {classRow.name}
                      </td>
                      <td className="px-5 py-4">{classRow.students}</td>
                      <td className="px-5 py-4">{classRow.uploaded}</td>
                      <td className="px-5 py-4">{classRow.missing}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-28 overflow-hidden rounded-full bg-primary/10">
                            <div
                              className="h-full rounded-full bg-button"
                              style={{ width: `${classRow.coverage}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-primary">
                            {classRow.coverage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-primary">
                            {classRow.cumulativeUploaded} / {classRow.students}
                          </span>
                          <span className="text-sm text-primary/60">
                            {classRow.cumulativeCoverage}% uploaded
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <h3 className="text-3xl font-extrabold text-primary">
            Student Summary
          </h3>
          <p className="mt-2 text-primary/70">
            Gender distribution for the selected session.
          </p>

          <div className="mt-6 space-y-4">
            {Object.keys(genderSummary).length === 0 ? (
              <p className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                No student record found for this session.
              </p>
            ) : (
              Object.entries(genderSummary).map(([gender, count]) => (
                <div
                  key={gender}
                  className="flex items-center justify-between rounded-2xl bg-primary/5 p-5 text-primary"
                >
                  <span className="font-bold">{gender}</span>
                  <span className="text-2xl font-extrabold">{count}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-primary/5 p-5 text-primary">
            <p className="text-sm font-bold uppercase text-primary/60">
              Cumulative Coverage
            </p>
            <p className="mt-3 text-4xl font-extrabold">
              {cumulativeCoverage}%
            </p>
            <p className="mt-2 text-sm text-primary/60">
              {cumulativeUploadedStudentCount} uploaded, {cumulativeMissingCount} awaiting upload.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Recent Registrations
          </h3>
          <p className="mt-2 text-primary/70">
            Latest student registrations for the selected session.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Admission No.</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Gender</th>
                <th className="px-5 py-4 font-bold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {recentStudents.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="5">
                    No recent registration found for this session.
                  </td>
                </tr>
              ) : (
                recentStudents.map((student) => (
                  <tr key={student._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {student.full_name}
                    </td>
                    <td className="px-5 py-4">{student.admission_no}</td>
                    <td className="px-5 py-4">{student.class}</td>
                    <td className="px-5 py-4">{student.gender || "Not set"}</td>
                    <td className="px-5 py-4">
                      {student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Left School Records
          </h3>
          <p className="mt-2 text-primary/70">
            Recent students marked as left school for the selected session and
            term.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Admission No.</th>
                <th className="px-5 py-4 font-bold">Previous Class</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {leftSchoolStudents.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="6">
                    No left school record found for this filter.
                  </td>
                </tr>
              ) : (
                leftSchoolStudents.slice(0, 15).map((student) => (
                  <tr key={student._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {student.full_name}
                    </td>
                    <td className="px-5 py-4">{student.admission_no}</td>
                    <td className="px-5 py-4">
                      {student.left_class || student.class || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      {student.left_session || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      {student.left_term || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      {student.left_at
                        ? new Date(student.left_at).toLocaleDateString()
                        : "Not available"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handlePrintReport}
          aria-label="Print admin report"
          className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
        >
          Print Report
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
}

export default AdminReport;
