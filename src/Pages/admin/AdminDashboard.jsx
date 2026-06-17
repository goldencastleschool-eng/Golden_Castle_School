import { useEffect, useMemo, useState } from "react";
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
import {
  FaArrowRight,
  FaBookOpen,
  FaBed,
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
import { isFormTeacher } from "../../utils/teacherAssignments.js";

const DEFAULT_COVERAGE_SESSION_FILTER = "2025/2026";
const DEFAULT_TERM_FILTER = "Third Term";
const PAGE_SIZE = 25;
const CHART_COLORS = {
  primary: "#1f2937",
  button: "#d4a017",
  paid: "#16a34a",
  outstanding: "#dc2626",
  soft: "#f3f4f6",
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

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const getRecordId = (record) => record?._id || record || "";

const isActiveStudent = (student) =>
  !student.status || student.status === "active";

const TERM_ORDER = ["First Term", "Second Term", "Third Term"];

const getTermIndex = (term = "") => {
  const termIndex = TERM_ORDER.indexOf(term);

  return termIndex === -1 ? TERM_ORDER.length : termIndex;
};

const getStudentEffectiveTermEnrollment = (student, session, term) => {
  const enrollments = Array.isArray(student?.fee_enrollments)
    ? student.fee_enrollments
    : [];
  const targetTermIndex = getTermIndex(term);

  return enrollments
    .filter(
      (enrollment) =>
        enrollment.session === session &&
        getTermIndex(enrollment.term) <= targetTermIndex
    )
    .sort(
      (firstEnrollment, secondEnrollment) =>
        getTermIndex(secondEnrollment.term) - getTermIndex(firstEnrollment.term)
    )[0];
};

const getStudentTermEnrollment = (student, session, term) => {
  const enrollments = Array.isArray(student?.fee_enrollments)
    ? student.fee_enrollments
    : [];

  return enrollments.find(
    (enrollment) =>
      enrollment.session === session &&
      enrollment.term === term
  );
};

const studentBelongsToEffectiveTermClass = (
  student,
  classRecord,
  session,
  term
) => {
  const enrollment = getStudentEffectiveTermEnrollment(student, session, term);

  if (!enrollment || !classRecord) {
    return false;
  }

  return (
    getRecordId(enrollment.class_record) === getRecordId(classRecord) ||
    normalizeClassName(enrollment.class) === normalizeClassName(classRecord.name)
  );
};

const countUniqueClassRecords = (records = []) =>
  new Set(
    records.map((record) => getRecordId(record.class_record) || record.class)
  ).size;

function ChartEmptyState({ message = "No chart data available for this filter." }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 px-5 text-center text-sm font-semibold text-primary/60">
      {message}
    </div>
  );
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-primary/10 bg-secondary px-4 py-3 text-sm shadow-xl">
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
    <div className="rounded-2xl border border-primary/10 bg-secondary px-4 py-3 text-sm shadow-xl">
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
    <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
      <div className="mb-5">
        <h4 className="text-xl font-extrabold text-primary">{title}</h4>
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
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classBroadsheets, setClassBroadsheets] = useState([]);
  const [classResults, setClassResults] = useState([]);
  const [fees, setFees] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [buses, setBuses] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [busStructures, setBusStructures] = useState([]);
  const [busEnrollments, setBusEnrollments] = useState([]);
  const [busPayments, setBusPayments] = useState([]);
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [boardingStructures, setBoardingStructures] = useState([]);
  const [boardingEnrollments, setBoardingEnrollments] = useState([]);
  const [boardingPayments, setBoardingPayments] = useState([]);
  const [payrollStaff, setPayrollStaff] = useState([]);
  const [payrollAssignments, setPayrollAssignments] = useState([]);
  const [payrollPayments, setPayrollPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coverageSessionFilter, setCoverageSessionFilter] = useState(
    DEFAULT_COVERAGE_SESSION_FILTER
  );
  const [coverageTermFilter, setCoverageTermFilter] = useState(
    DEFAULT_TERM_FILTER
  );
  const [populationSessionFilter, setPopulationSessionFilter] = useState(
    DEFAULT_COVERAGE_SESSION_FILTER
  );
  const [populationTermFilter, setPopulationTermFilter] = useState(
    DEFAULT_TERM_FILTER
  );
  const [status, setStatus] = useState({ type: "", message: "" });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const [
        studentsResponse,
        resultsResponse,
        classesResponse,
        teachersResponse,
        broadsheetsResponse,
        classResultsResponse,
        feesResponse,
        feeStructuresResponse,
        busesResponse,
        busRoutesResponse,
        busStructuresResponse,
        busEnrollmentsResponse,
        busPaymentsResponse,
        boardingHousesResponse,
        boardingStructuresResponse,
        boardingEnrollmentsResponse,
        boardingPaymentsResponse,
        payrollStaffResponse,
        payrollAssignmentsResponse,
        payrollPaymentsResponse,
      ] = await Promise.allSettled([
        API.get("/students"),
        API.get("/results"),
        API.get("/classes"),
        API.get("/teachers"),
        API.get("/class-broadsheets"),
        API.get("/class-results"),
        API.get("/fees"),
        API.get("/fee-structures"),
        API.get("/bus-management/buses"),
        API.get("/bus-management/routes"),
        API.get("/bus-management/fee-structures"),
        API.get("/bus-management/enrollments"),
        API.get("/bus-management/payments"),
        API.get("/boarding-management/houses"),
        API.get("/boarding-management/fee-structures"),
        API.get("/boarding-management/enrollments"),
        API.get("/boarding-management/payments"),
        API.get("/payroll/staff"),
        API.get("/payroll/assignments"),
        API.get("/payroll/payments"),
      ]);

      if (studentsResponse.status === "rejected") {
        throw new Error(
          studentsResponse.reason?.response?.data?.message ||
            studentsResponse.reason?.response?.data?.error ||
            "Unable to load student records."
        );
      }

      if (resultsResponse.status === "rejected") {
        throw new Error(
          resultsResponse.reason?.response?.data?.message ||
            resultsResponse.reason?.response?.data?.error ||
            "Unable to load result records."
        );
      }

      if (classesResponse.status === "rejected") {
        throw new Error(
          classesResponse.reason?.response?.data?.message ||
            classesResponse.reason?.response?.data?.error ||
            "Unable to load class records."
        );
      }

      setStudents(studentsResponse.value.data || []);
      setResults(resultsResponse.value.data || []);
      setClasses(classesResponse.value.data || []);
      setTeachers(
        teachersResponse.status === "fulfilled"
          ? teachersResponse.value.data || []
          : []
      );
      setClassBroadsheets(
        broadsheetsResponse.status === "fulfilled"
          ? broadsheetsResponse.value.data || []
          : []
      );
      setClassResults(
        classResultsResponse.status === "fulfilled"
          ? classResultsResponse.value.data || []
          : []
      );
      setFees(feesResponse.status === "fulfilled" ? feesResponse.value.data || [] : []);
      setFeeStructures(
        feeStructuresResponse.status === "fulfilled"
          ? feeStructuresResponse.value.data || []
          : []
      );
      setBuses(
        busesResponse.status === "fulfilled" ? busesResponse.value.data || [] : []
      );
      setBusRoutes(
        busRoutesResponse.status === "fulfilled"
          ? busRoutesResponse.value.data || []
          : []
      );
      setBusStructures(
        busStructuresResponse.status === "fulfilled"
          ? busStructuresResponse.value.data || []
          : []
      );
      setBusEnrollments(
        busEnrollmentsResponse.status === "fulfilled"
          ? busEnrollmentsResponse.value.data || []
          : []
      );
      setBusPayments(
        busPaymentsResponse.status === "fulfilled"
          ? busPaymentsResponse.value.data || []
          : []
      );
      setBoardingHouses(
        boardingHousesResponse.status === "fulfilled"
          ? boardingHousesResponse.value.data || []
          : []
      );
      setBoardingStructures(
        boardingStructuresResponse.status === "fulfilled"
          ? boardingStructuresResponse.value.data || []
          : []
      );
      setBoardingEnrollments(
        boardingEnrollmentsResponse.status === "fulfilled"
          ? boardingEnrollmentsResponse.value.data || []
          : []
      );
      setBoardingPayments(
        boardingPaymentsResponse.status === "fulfilled"
          ? boardingPaymentsResponse.value.data || []
          : []
      );
      setPayrollStaff(
        payrollStaffResponse.status === "fulfilled"
          ? payrollStaffResponse.value.data || []
          : []
      );
      setPayrollAssignments(
        payrollAssignmentsResponse.status === "fulfilled"
          ? payrollAssignmentsResponse.value.data || []
          : []
      );
      setPayrollPayments(
        payrollPaymentsResponse.status === "fulfilled"
          ? payrollPaymentsResponse.value.data || []
          : []
      );
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          "Unable to load dashboard records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePopulationSessionChange = (session) => {
    const normalizedTerm = normalizeTermForSession(populationTermFilter, session);

    setPopulationSessionFilter(session);
    setPopulationTermFilter(
      normalizedTerm || getVisibleTermsForSession(session)[0] || ""
    );
  };

  const handleCoverageSessionChange = (session) => {
    const normalizedTerm = normalizeTermForSession(coverageTermFilter, session);

    setCoverageSessionFilter(session);
    setCoverageTermFilter(
      normalizedTerm || getVisibleTermsForSession(session)[0] || ""
    );
  };

  const coverageResults = useMemo(() => {
    if (!coverageSessionFilter || !coverageTermFilter) {
      return [];
    }

    return results.filter(
      (result) =>
        result.session === coverageSessionFilter &&
        result.term === coverageTermFilter
    );
  }, [coverageSessionFilter, coverageTermFilter, results]);

  const coverageSessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_COVERAGE_SESSION_FILTER,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
      ]),
    ].sort();
  }, [classes]);

  const coverageTermOptions = useMemo(
    () => getVisibleTermsForSession(coverageSessionFilter),
    [coverageSessionFilter]
  );

  const populationSessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_COVERAGE_SESSION_FILTER,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
        ...students.map((student) => student.current_session).filter(Boolean),
        ...students.map((student) => student.graduation_session).filter(Boolean),
        ...students.map((student) => student.left_session).filter(Boolean),
        ...teachers.map((teacher) => teacher.session).filter(Boolean),
        ...classBroadsheets.map((broadsheet) => broadsheet.session).filter(Boolean),
        ...classResults.map((classResult) => classResult.session).filter(Boolean),
      ]),
    ].sort();
  }, [classBroadsheets, classResults, classes, students, teachers]);

  const populationTermOptions = useMemo(
    () => getVisibleTermsForSession(populationSessionFilter),
    [populationSessionFilter]
  );

  const coverageClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === coverageSessionFilter
    );
  }, [classes, coverageSessionFilter]);

  const activeSessionStudents = useMemo(() => {
    return students.filter(
      (student) =>
        isActiveStudent(student) &&
        getStudentEffectiveTermEnrollment(
          student,
          populationSessionFilter,
          populationTermFilter
        )
    );
  }, [populationSessionFilter, populationTermFilter, students]);

  const activeSessionClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === populationSessionFilter
    );
  }, [classes, populationSessionFilter]);

  const activeSessionTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) => teacher.session === populationSessionFilter
        && teacher.status !== "inactive"
    );
  }, [populationSessionFilter, teachers]);

  const inactiveSessionTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        teacher.session === populationSessionFilter &&
        teacher.status === "inactive"
    );
  }, [populationSessionFilter, teachers]);

  const activeSessionFormTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        teacher.session === populationSessionFilter &&
        teacher.status !== "inactive" &&
        isFormTeacher(teacher)
    );
  }, [populationSessionFilter, teachers]);

  const inactiveSessionFormTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        teacher.session === populationSessionFilter &&
        teacher.status === "inactive" &&
        isFormTeacher(teacher)
    );
  }, [populationSessionFilter, teachers]);

  const sessionClassBroadsheets = useMemo(() => {
    return classBroadsheets.filter(
      (broadsheet) =>
        broadsheet.session === populationSessionFilter &&
        broadsheet.term === populationTermFilter
    );
  }, [classBroadsheets, populationSessionFilter, populationTermFilter]);

  const sessionClassResults = useMemo(() => {
    return classResults.filter(
      (classResult) =>
        classResult.session === populationSessionFilter &&
        classResult.term === populationTermFilter
    );
  }, [classResults, populationSessionFilter, populationTermFilter]);

  const graduatedSessionStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.status === "graduated" &&
        (student.graduation_session || student.current_session) ===
          populationSessionFilter
    );
  }, [populationSessionFilter, students]);

  const leftSchoolSessionStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.status === "left" &&
        (student.left_session || student.current_session) ===
          populationSessionFilter &&
        student.left_term === populationTermFilter
    );
  }, [populationSessionFilter, populationTermFilter, students]);

  const activeGenderSummary = useMemo(() => {
    return activeSessionStudents.reduce(
      (summary, student) => {
        const gender = student.gender || "Not Set";

        return {
          ...summary,
          [gender]: (summary[gender] || 0) + 1,
        };
      },
      {}
    );
  }, [activeSessionStudents]);

  const newlyAdmittedStudents = useMemo(() => {
    return activeSessionStudents.filter((student) => {
      const termEnrollment = getStudentTermEnrollment(
        student,
        populationSessionFilter,
        populationTermFilter
      );

      return termEnrollment?.fee_category === "new";
    });
  }, [activeSessionStudents, populationSessionFilter, populationTermFilter]);

  const returningOldStudentsCount = Math.max(
    activeSessionStudents.length - newlyAdmittedStudents.length,
    0
  );

  const classBroadsheetCount = useMemo(
    () => countUniqueClassRecords(sessionClassBroadsheets),
    [sessionClassBroadsheets]
  );

  const classResultCount = useMemo(
    () => countUniqueClassRecords(sessionClassResults),
    [sessionClassResults]
  );

  const feeSummary = useMemo(() => {
    const sessionFees = fees.filter(
      (fee) =>
        fee.session === populationSessionFilter &&
        fee.term === populationTermFilter
    );

    const structureByClassAndCategory = new Map();

    feeStructures
      .filter(
        (structure) =>
          structure.session === populationSessionFilter &&
          structure.term === populationTermFilter
      )
      .forEach((structure) => {
        const classRecordId = getRecordId(structure.class_record);
        const feeCategory = structure.fee_category || "returning";
        const amount =
          Number(structure.amount || 0) ||
          (structure.items || []).reduce(
            (itemSum, item) => itemSum + Number(item.amount || 0),
            0
          );

        structureByClassAndCategory.set(
          `${classRecordId || "no-class"}|${feeCategory}`,
          amount
        );
      });

    const paidByStudent = new Map();

    sessionFees.forEach((fee) => {
      const studentId = getRecordId(fee.student);
      paidByStudent.set(
        studentId,
        (paidByStudent.get(studentId) || 0) +
          Number(fee.amount_paid || fee.amount || 0)
      );
    });

    const studentFeeRows = activeSessionStudents.map((student) => {
      const effectiveEnrollment = getStudentEffectiveTermEnrollment(
        student,
        populationSessionFilter,
        populationTermFilter
      );
      const termEnrollment = getStudentTermEnrollment(
        student,
        populationSessionFilter,
        populationTermFilter
      );
      const classRecordId =
        getRecordId(effectiveEnrollment?.class_record) ||
        getRecordId(student.class_record);
      const feeCategory = termEnrollment?.fee_category || "returning";
      const expected =
        structureByClassAndCategory.get(
          `${classRecordId || "no-class"}|${feeCategory}`
        ) || 0;
      const paid = paidByStudent.get(getRecordId(student)) || 0;

      return {
        expected,
        paid,
        outstanding: Math.max(expected - paid, 0),
      };
    });

    return {
      expected: studentFeeRows.reduce(
        (sum, row) => sum + Number(row.expected || 0),
        0
      ),
      paid: studentFeeRows.reduce((sum, row) => sum + Number(row.paid || 0), 0),
      outstanding: studentFeeRows.reduce(
        (sum, row) => sum + Number(row.outstanding || 0),
        0
      ),
      records: sessionFees.length,
    };
  }, [
    activeSessionStudents,
    feeStructures,
    fees,
    populationSessionFilter,
    populationTermFilter,
  ]);

  const busSummary = useMemo(() => {
    const sessionEnrollments = busEnrollments.filter(
      (enrollment) =>
        enrollment.session === populationSessionFilter &&
        enrollment.term === populationTermFilter &&
        enrollment.status === "active"
    );
    const structureByKey = new Map();

    busStructures.forEach((structure) => {
      structureByKey.set(
        [getRecordId(structure.route), structure.session, structure.term].join("|"),
        structure
      );
    });

    const paidByEnrollment = new Map();
    busPayments
      .filter(
        (payment) =>
          payment.session === populationSessionFilter &&
          payment.term === populationTermFilter
      )
      .forEach((payment) => {
        const enrollmentId = getRecordId(payment.enrollment);
        paidByEnrollment.set(
          enrollmentId,
          (paidByEnrollment.get(enrollmentId) || 0) + Number(payment.amount || 0)
        );
      });

    return sessionEnrollments.reduce(
      (summary, enrollment) => {
        const structure = structureByKey.get(
          [
            getRecordId(enrollment.route),
            enrollment.session,
            enrollment.term,
          ].join("|")
        );
        const expected = Number(structure?.amount || 0);
        const paid = paidByEnrollment.get(enrollment._id) || 0;

        return {
          activeEnrollments: summary.activeEnrollments + 1,
          expected: summary.expected + expected,
          paid: summary.paid + paid,
          outstanding: summary.outstanding + Math.max(expected - paid, 0),
        };
      },
      {
        activeEnrollments: 0,
        expected: 0,
        paid: 0,
        outstanding: 0,
      }
    );
  }, [
    busEnrollments,
    busPayments,
    busStructures,
    populationSessionFilter,
    populationTermFilter,
  ]);

  const boardingSummary = useMemo(() => {
    const sessionEnrollments = boardingEnrollments.filter(
      (enrollment) =>
        enrollment.session === populationSessionFilter &&
        enrollment.term === populationTermFilter &&
        enrollment.status === "active"
    );
    const structureByHouse = new Map();

    boardingStructures.forEach((structure) => {
      structureByHouse.set(
        [getRecordId(structure.house), structure.session, structure.term].join("|"),
        structure
      );
    });

    const paidByEnrollment = new Map();
    boardingPayments
      .filter(
        (payment) =>
          payment.session === populationSessionFilter &&
          payment.term === populationTermFilter
      )
      .forEach((payment) => {
        const enrollmentId = getRecordId(payment.enrollment);
        paidByEnrollment.set(
          enrollmentId,
          (paidByEnrollment.get(enrollmentId) || 0) + Number(payment.amount || 0)
        );
      });

    return sessionEnrollments.reduce(
      (summary, enrollment) => {
        const structure = structureByHouse.get(
          [
            getRecordId(enrollment.house),
            enrollment.session,
            enrollment.term,
          ].join("|")
        );
        const expected = Number(structure?.amount || 0);
        const paid = paidByEnrollment.get(enrollment._id) || 0;

        return {
          activeEnrollments: summary.activeEnrollments + 1,
          expected: summary.expected + expected,
          paid: summary.paid + paid,
          outstanding: summary.outstanding + Math.max(expected - paid, 0),
        };
      },
      {
        activeEnrollments: 0,
        expected: 0,
        paid: 0,
        outstanding: 0,
      }
    );
  }, [
    boardingEnrollments,
    boardingPayments,
    boardingStructures,
    populationSessionFilter,
    populationTermFilter,
  ]);

  const payrollSummary = useMemo(() => {
    const sessionAssignments = payrollAssignments.filter(
      (assignment) =>
        assignment.session === populationSessionFilter &&
        assignment.period === populationTermFilter
    );
    const paidByAssignment = new Map();

    payrollPayments
      .filter(
        (payment) =>
          payment.session === populationSessionFilter &&
          payment.period === populationTermFilter
      )
      .forEach((payment) => {
        const assignmentId = getRecordId(payment.assignment);
        paidByAssignment.set(
          assignmentId,
          (paidByAssignment.get(assignmentId) || 0) + Number(payment.amount || 0)
        );
      });

    return sessionAssignments.reduce(
      (summary, assignment) => {
        if (assignment.status !== "active") {
          return summary;
        }

        const expected = Number(assignment.net_amount || 0);
        const paid = paidByAssignment.get(assignment._id) || 0;

        return {
          activeStaff: summary.activeStaff,
          assignedStaff: summary.assignedStaff + 1,
          expected: summary.expected + expected,
          outstanding: summary.outstanding + Math.max(expected - paid, 0),
        };
      },
      {
        activeStaff: payrollStaff.filter(
          (staffRecord) => staffRecord.status === "active"
        ).length,
        assignedStaff: 0,
        expected: 0,
        outstanding: 0,
      }
    );
  }, [
    payrollAssignments,
    payrollPayments,
    payrollStaff,
    populationSessionFilter,
    populationTermFilter,
  ]);

  const classCoverage = useMemo(() => {
    return coverageClasses.map((classRecord) => {
      const className = classRecord.name;
      const classStudents = students.filter(
        (student) =>
          isActiveStudent(student) &&
            studentBelongsToEffectiveTermClass(
              student,
              classRecord,
              classRecord.session,
              coverageTermFilter
            )
      );
      const uploadedStudentIds = new Set(
        coverageResults
          .filter(
            (result) =>
              (getRecordId(result.class_record) === getRecordId(classRecord) ||
                normalizeClassName(result.class) === normalizeClassName(className)) &&
              result.session === classRecord.session
          )
          .map((result) => result.student?._id || result.student)
      );
      return {
        id: classRecord._id,
        className,
        session: classRecord.session,
        total: classStudents.length,
        uploaded: uploadedStudentIds.size,
      };
    });
  }, [coverageClasses, coverageResults, coverageTermFilter, students]);

  const populationChartData = useMemo(
    () => [
      {
        name: "Newly Admitted",
        value: newlyAdmittedStudents.length,
        fill: CHART_COLORS.paid,
      },
      {
        name: "Returning",
        value: returningOldStudentsCount,
        fill: CHART_COLORS.button,
      },
      {
        name: "Left",
        value: leftSchoolSessionStudents.length,
        fill: CHART_COLORS.outstanding,
      },
      {
        name: "Graduated",
        value: graduatedSessionStudents.length,
        fill: CHART_COLORS.blue,
      },
    ],
    [
      graduatedSessionStudents.length,
      leftSchoolSessionStudents.length,
      newlyAdmittedStudents.length,
      returningOldStudentsCount,
    ]
  );

  const genderChartData = useMemo(
    () =>
      Object.entries(activeGenderSummary)
        .map(([name, value], index) => ({
          name,
          value,
          fill:
            index === 0
              ? CHART_COLORS.button
              : index === 1
                ? CHART_COLORS.blue
                : CHART_COLORS.purple,
        }))
        .filter((item) => item.value > 0),
    [activeGenderSummary]
  );

  const financeChartData = useMemo(
    () => [
      {
        name: "Fees",
        expected: feeSummary.expected,
        paid: feeSummary.paid,
        outstanding: feeSummary.outstanding,
      },
      {
        name: "Bus",
        expected: busSummary.expected,
        paid: busSummary.paid,
        outstanding: busSummary.outstanding,
      },
      {
        name: "Boarding",
        expected: boardingSummary.expected,
        paid: boardingSummary.paid,
        outstanding: boardingSummary.outstanding,
      },
      {
        name: "Payroll",
        expected: payrollSummary.expected,
        paid: Math.max(payrollSummary.expected - payrollSummary.outstanding, 0),
        outstanding: payrollSummary.outstanding,
      },
    ],
    [boardingSummary, busSummary, feeSummary, payrollSummary]
  );

  const coverageChartData = useMemo(
    () =>
      classCoverage.map((item) => ({
        name: item.className?.toUpperCase(),
        uploaded: item.uploaded,
        missing: Math.max(item.total - item.uploaded, 0),
      })),
    [classCoverage]
  );

  const summaryGroups = [
    {
      title: "Student Summary",
      items: [
        {
          title: "Active Students",
          value: loading ? "..." : activeSessionStudents.length,
          icon: <FaUsers />,
        },
        {
          title: "Newly Admitted",
          value: loading ? "..." : newlyAdmittedStudents.length,
          icon: <FaUsers />,
        },
        {
          title: "Returning / Old Students",
          value: loading ? "..." : returningOldStudentsCount,
          icon: <FaUsers />,
        },
        {
          title: "Left Students",
          value: loading ? "..." : leftSchoolSessionStudents.length,
          icon: <FaUsers />,
        },
        {
          title: "Male Students",
          value: loading ? "..." : activeGenderSummary.Male || 0,
          icon: <FaUsers />,
        },
        {
          title: "Female Students",
          value: loading ? "..." : activeGenderSummary.Female || 0,
          icon: <FaUsers />,
        },
      ],
    },
    {
      title: "Class Summary",
      items: [
        {
          title: "Active Classes",
          value: loading ? "..." : activeSessionClasses.length,
          icon: <FaBookOpen />,
        },
        {
          title: "Class Broadsheets",
          value: loading ? "..." : classBroadsheetCount,
          icon: <FaBookOpen />,
        },
        {
          title: "Class Results",
          value: loading ? "..." : classResultCount,
          icon: <FaChartLine />,
        },
        {
          title: "Graduate List",
          value: loading ? "..." : graduatedSessionStudents.length,
          icon: <FaGraduationCap />,
        },
      ],
    },
    {
      title: "Form Teacher Summary",
      items: [
        {
          title: "Active Form Teachers",
          value: loading ? "..." : activeSessionFormTeachers.length,
          icon: <FaUsers />,
        },
        {
          title: "Deactivated Form Teachers",
          value: loading ? "..." : inactiveSessionFormTeachers.length,
          icon: <FaUsers />,
        },
      ],
    },
    {
      title: "Fee Summary",
      items: [
        {
          title: "Expected Fees",
          value: loading ? "..." : formatCurrency(feeSummary.expected),
          icon: <FaReceipt />,
        },
        {
          title: "Amount Paid",
          value: loading ? "..." : formatCurrency(feeSummary.paid),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Outstanding",
          value: loading ? "..." : formatCurrency(feeSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Payment Records",
          value: loading ? "..." : feeSummary.records,
          icon: <FaReceipt />,
        },
      ],
    },
    {
      title: "Bus Summary",
      items: [
        {
          title: "Registered Buses",
          value: loading ? "..." : buses.length,
          icon: <FaBus />,
        },
        {
          title: "Routes",
          value: loading ? "..." : busRoutes.length,
          icon: <FaBus />,
        },
        {
          title: "Active Bus Students",
          value: loading ? "..." : busSummary.activeEnrollments,
          icon: <FaUsers />,
        },
        {
          title: "Bus Outstanding",
          value: loading ? "..." : formatCurrency(busSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
      ],
    },
    {
      title: "Boarding Summary",
      items: [
        {
          title: "Boarding Houses",
          value: loading ? "..." : boardingHouses.length,
          icon: <FaBed />,
        },
        {
          title: "Boarding Students",
          value: loading ? "..." : boardingSummary.activeEnrollments,
          icon: <FaUsers />,
        },
        {
          title: "Boarding Paid",
          value: loading ? "..." : formatCurrency(boardingSummary.paid),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Boarding Outstanding",
          value: loading ? "..." : formatCurrency(boardingSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
      ],
    },
    {
      title: "Payroll Summary",
      items: [
        {
          title: "Active Payroll Staff",
          value: loading ? "..." : payrollSummary.activeStaff,
          icon: <FaUsers />,
        },
        {
          title: "Assigned Staff",
          value: loading ? "..." : payrollSummary.assignedStaff,
          icon: <FaUsers />,
        },
        {
          title: "Expected Payroll",
          value: loading ? "..." : formatCurrency(payrollSummary.expected),
          icon: <FaMoneyBillWave />,
        },
        {
          title: "Payroll Outstanding",
          value: loading ? "..." : formatCurrency(payrollSummary.outstanding),
          icon: <FaMoneyBillWave />,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />

      <section className="hidden relative overflow-hidden bg-secondary px-6 py-12 lg:block px-12">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-button/20 blur-3xl"></div>

        <div className=" relative max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-primary/10 bg-primary/10 px-5 py-3 text-primary">
            <FaChartLine className="text-button" />
            <span className="font-semibold">School Result Portal</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight text-primary md:text-6xl">
            Welcome Back,{" "}
            <span className="text-button">
              {user?.username || "Administrator"}
            </span>
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-primary/70">
            Track result upload coverage by class and control the session and
            term students can access from their portal.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-12">
        <div className="mb-5">
          <div className="mb-4">
            <h3 className="text-3xl font-extrabold text-secondary">
              Active Population Summary
            </h3>
            <p className="mt-2 text-sm font-semibold text-secondary/75">
              Showing active population data for {populationSessionFilter}
              {populationTermFilter ? ` - ${populationTermFilter}` : ""}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[260px_260px]">
            <div>
            <label className="mb-2 block text-sm font-semibold text-secondary/75">
              Session
            </label>
            <select
              value={populationSessionFilter}
              onChange={(event) =>
                handlePopulationSessionChange(event.target.value)
              }
              className="w-full rounded-2xl border border-secondary/10 bg-secondary px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              {populationSessionOptions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
            </div>

            <div>
            <label className="mb-2 block text-sm font-semibold text-secondary/75">
              Term
            </label>
            <select
              value={populationTermFilter}
              onChange={(event) => setPopulationTermFilter(event.target.value)}
              className="w-full rounded-2xl border border-secondary/10 bg-secondary px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              {populationTermOptions.map((term) => (
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {loading ? (
                  <CardSkeleton count={group.items.length} />
                ) : (
                  group.items.map((stat) => (
                    <div
                      key={stat.title}
                      className="group rounded-[2rem] bg-secondary p-7 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="flex items-center justify-between gap-5">
                        <div>
                          <p className="font-medium text-primary/70">
                            {stat.title}
                          </p>
                          <h3 className="mt-4 text-4xl font-extrabold text-primary">
                            {stat.value}
                          </h3>
                        </div>

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary shadow-lg transition-all duration-300 group-hover:scale-110">
                          {stat.icon}
                        </div>
                      </div>

                      <div className="mt-7 h-1 w-14 rounded-full bg-button transition-all duration-500 group-hover:w-24"></div>
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
            subtitle={`${populationSessionFilter} - ${populationTermFilter}`}
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
            subtitle={`${coverageSessionFilter} - ${coverageTermFilter}`}
          >
            {loading ? (
              <CardSkeleton count={1} />
            ) : coverageChartData.length === 0 ? (
              <ChartEmptyState />
            ) : (
              <div className="h-80">
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
              </div>
            )}
          </DashboardChartCard>
        </section>

        <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-8">
            <div className="mb-5">
              <h3 className="text-3xl font-extrabold text-primary">
                Result Upload Coverage
              </h3>
              <p className="mt-2 text-primary/70">
                Uploaded results out of registered students for{" "}
                {coverageSessionFilter}
                {coverageTermFilter ? ` - ${coverageTermFilter}` : ""}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[260px_260px]">
              <div>
              <label className="mb-2 block text-sm font-semibold text-primary/60">
                Session
              </label>
              <select
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                value={coverageSessionFilter}
                onChange={(event) =>
                  handleCoverageSessionChange(event.target.value)
                }
              >
                {coverageSessionOptions.map((session) => (
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
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                value={coverageTermFilter}
                onChange={(event) => setCoverageTermFilter(event.target.value)}
              >
                {coverageTermOptions.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
              </div>
            </div>
          </div>

          {classes.length === 0 ? (
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 text-primary/70">
              No class has been created yet. Create class records by session to
              view upload coverage.
            </div>
          ) : classCoverage.length === 0 ? (
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 text-primary/70">
              No class has been created for {coverageSessionFilter} yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-primary/10">
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
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-button px-4 py-3 text-sm font-bold text-secondary transition duration-300 hover:scale-[1.02] md:w-auto"
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
