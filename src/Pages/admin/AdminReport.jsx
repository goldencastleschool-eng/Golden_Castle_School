import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBus,
  FaChartPie,
  FaFileLines,
  FaMoneyBillWave,
  FaPrint,
  FaTriangleExclamation,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import {
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";
import { formatBusPaymentCategory } from "../../utils/busPaymentCategories.js";
import { SCHOOL_NAME, schoolLogo } from "../../utils/printBranding.js";

const DEFAULT_REPORT_SESSION = "2025/2026";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const getRecordId = (record) => record?._id || record || "";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

function AdminReport() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([]);
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
          accessRequest,
          busesRequest,
          busRoutesRequest,
          busStructuresRequest,
          busEnrollmentsRequest,
          busPaymentsRequest,
          boardingHousesRequest,
          boardingStructuresRequest,
          boardingEnrollmentsRequest,
          boardingPaymentsRequest,
          payrollStaffRequest,
          payrollAssignmentsRequest,
          payrollPaymentsRequest,
        ] = await Promise.allSettled([
          API.get("/students"),
          API.get("/classes"),
          API.get("/results"),
          API.get("/result-access"),
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
        setBuses(
          busesRequest.status === "fulfilled" ? busesRequest.value.data || [] : []
        );
        setBusRoutes(
          busRoutesRequest.status === "fulfilled"
            ? busRoutesRequest.value.data || []
            : []
        );
        setBusStructures(
          busStructuresRequest.status === "fulfilled"
            ? busStructuresRequest.value.data || []
            : []
        );
        setBusEnrollments(
          busEnrollmentsRequest.status === "fulfilled"
            ? busEnrollmentsRequest.value.data || []
            : []
        );
        setBusPayments(
          busPaymentsRequest.status === "fulfilled"
            ? busPaymentsRequest.value.data || []
            : []
        );
        setBoardingHouses(
          boardingHousesRequest.status === "fulfilled"
            ? boardingHousesRequest.value.data || []
            : []
        );
        setBoardingStructures(
          boardingStructuresRequest.status === "fulfilled"
            ? boardingStructuresRequest.value.data || []
            : []
        );
        setBoardingEnrollments(
          boardingEnrollmentsRequest.status === "fulfilled"
            ? boardingEnrollmentsRequest.value.data || []
            : []
        );
        setBoardingPayments(
          boardingPaymentsRequest.status === "fulfilled"
            ? boardingPaymentsRequest.value.data || []
            : []
        );
        setPayrollStaff(
          payrollStaffRequest.status === "fulfilled"
            ? payrollStaffRequest.value.data || []
            : []
        );
        setPayrollAssignments(
          payrollAssignmentsRequest.status === "fulfilled"
            ? payrollAssignmentsRequest.value.data || []
            : []
        );
        setPayrollPayments(
          payrollPaymentsRequest.status === "fulfilled"
            ? payrollPaymentsRequest.value.data || []
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
      ]),
    ].sort();
  }, [classes, results, students]);

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
      const missingCount = classStudents.filter(
        (student) => !uploadedStudentIds.has(student._id)
      ).length;

      return {
        id: classRecord._id || classRecord.name,
        name: classRecord.name,
        students: classStudents.length,
        uploaded: uploadedStudentIds.size,
        missing: missingCount,
        coverage: classStudents.length
          ? Math.round((uploadedStudentIds.size / classStudents.length) * 100)
          : 0,
      };
    });
  }, [reportClasses, reportResults, reportStudents]);

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

  const busSummary = useMemo(() => {
    const selectedEnrollments = busEnrollments.filter(
      (enrollment) =>
        enrollment.session === reportFilter.session &&
        (!reportFilter.term || enrollment.term === reportFilter.term) &&
        enrollment.status === "active"
    );
    const selectedStructures = busStructures.filter(
      (structure) =>
        structure.session === reportFilter.session &&
        (!reportFilter.term || structure.term === reportFilter.term)
    );
    const selectedPayments = busPayments.filter(
      (payment) =>
        payment.session === reportFilter.session &&
        (!reportFilter.term || payment.term === reportFilter.term)
    );
    const structureByRoute = new Map(
      selectedStructures.map((structure) => [
        [
          getRecordId(structure.route),
          structure.payment_category || "both",
        ].join("|"),
        Number(structure.amount || 0),
      ])
    );
    const paidByEnrollment = selectedPayments.reduce((paymentMap, payment) => {
      const enrollmentId = getRecordId(payment.enrollment);
      paymentMap.set(
        enrollmentId,
        (paymentMap.get(enrollmentId) || 0) + Number(payment.amount || 0)
      );

      return paymentMap;
    }, new Map());

    return selectedEnrollments.reduce(
      (summary, enrollment) => {
        const expected =
          structureByRoute.get(
            [
              getRecordId(enrollment.route),
              enrollment.payment_category || "both",
            ].join("|")
          ) || 0;
        const paid = paidByEnrollment.get(getRecordId(enrollment._id)) || 0;
        const balance = Math.max(expected - paid, 0);

        return {
          ...summary,
          activeEnrollments: summary.activeEnrollments + 1,
          expected: summary.expected + expected,
          paid: summary.paid + paid,
          balance: summary.balance + balance,
          outstandingStudents:
            summary.outstandingStudents + (balance > 0 ? 1 : 0),
        };
      },
      {
        buses: buses.length,
        activeBuses: buses.filter((bus) => bus.status === "active").length,
        routes: busRoutes.length,
        activeEnrollments: 0,
        expected: 0,
        paid: 0,
        balance: 0,
        outstandingStudents: 0,
        paymentRecords: selectedPayments.length,
      }
    );
  }, [
    busEnrollments,
    busPayments,
    busRoutes,
    busStructures,
    buses,
    reportFilter.session,
    reportFilter.term,
  ]);

  const payrollSummary = useMemo(() => {
    const selectedAssignments = payrollAssignments.filter(
      (assignment) =>
        assignment.session === reportFilter.session &&
        (!reportFilter.term || assignment.period === reportFilter.term) &&
        assignment.status === "active"
    );
    const selectedPayments = payrollPayments.filter(
      (payment) =>
        payment.session === reportFilter.session &&
        (!reportFilter.term || payment.period === reportFilter.term)
    );
    const paidByAssignment = selectedPayments.reduce((paymentMap, payment) => {
      const assignmentId = getRecordId(payment.assignment);
      paymentMap.set(
        assignmentId,
        (paymentMap.get(assignmentId) || 0) + Number(payment.amount || 0)
      );

      return paymentMap;
    }, new Map());

    return selectedAssignments.reduce(
      (summary, assignment) => {
        const expected = Number(assignment.net_amount || 0);
        const paid = paidByAssignment.get(getRecordId(assignment._id)) || 0;
        const balance = Math.max(expected - paid, 0);

        return {
          ...summary,
          assignedStaff: summary.assignedStaff + 1,
          expected: summary.expected + expected,
          paid: summary.paid + paid,
          balance: summary.balance + balance,
          outstandingStaff: summary.outstandingStaff + (balance > 0 ? 1 : 0),
        };
      },
      {
        activeStaff: payrollStaff.filter((staff) => staff.status === "active").length,
        assignedStaff: 0,
        expected: 0,
        paid: 0,
        balance: 0,
        outstandingStaff: 0,
        paymentRecords: selectedPayments.length,
      }
    );
  }, [
    payrollAssignments,
    payrollPayments,
    payrollStaff,
    reportFilter.session,
    reportFilter.term,
  ]);

  const busReportRows = useMemo(() => {
    const selectedEnrollments = busEnrollments.filter(
      (enrollment) =>
        enrollment.session === reportFilter.session &&
        (!reportFilter.term || enrollment.term === reportFilter.term) &&
        enrollment.status === "active"
    );
    const selectedStructures = busStructures.filter(
      (structure) =>
        structure.session === reportFilter.session &&
        (!reportFilter.term || structure.term === reportFilter.term)
    );
    const selectedPayments = busPayments.filter(
      (payment) =>
        payment.session === reportFilter.session &&
        (!reportFilter.term || payment.term === reportFilter.term)
    );
    const routeById = new Map(
      busRoutes.map((route) => [getRecordId(route), route])
    );
    const structureByRoute = new Map(
      selectedStructures.map((structure) => [
        getRecordId(structure.route),
        Number(structure.amount || 0),
      ])
    );
    const paidByEnrollment = selectedPayments.reduce((paymentMap, payment) => {
      const enrollmentId = getRecordId(payment.enrollment);
      paymentMap.set(
        enrollmentId,
        (paymentMap.get(enrollmentId) || 0) + Number(payment.amount || 0)
      );

      return paymentMap;
    }, new Map());
    const rowMap = new Map();

    selectedEnrollments.forEach((enrollment) => {
      const routeId = getRecordId(enrollment.route);
      const route = routeById.get(routeId);
      const paymentCategory = enrollment.payment_category || "both";
      const rowKey = [routeId || "no-route", paymentCategory].join("|");
      const expected = structureByRoute.get(rowKey) || 0;
      const paid = paidByEnrollment.get(getRecordId(enrollment)) || 0;
      const balance = Math.max(expected - paid, 0);

      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, {
          route_id: routeId,
          route: route?.name || enrollment.route?.name || "Route not set",
          payment_category: paymentCategory,
          payment_category_label: formatBusPaymentCategory(paymentCategory),
          active_enrollments: 0,
          expected: 0,
          paid: 0,
          balance: 0,
          outstanding_students: 0,
        });
      }

      const row = rowMap.get(rowKey);
      row.active_enrollments += 1;
      row.expected += expected;
      row.paid += paid;
      row.balance += balance;
      row.outstanding_students += balance > 0 ? 1 : 0;
    });

    return Array.from(rowMap.values()).sort(
      (firstRow, secondRow) =>
        firstRow.route.localeCompare(secondRow.route) ||
        firstRow.payment_category_label.localeCompare(
          secondRow.payment_category_label
        )
    );
  }, [
    busEnrollments,
    busPayments,
    busRoutes,
    busStructures,
    reportFilter.session,
    reportFilter.term,
  ]);

  const payrollReportRows = useMemo(() => {
    const selectedAssignments = payrollAssignments.filter(
      (assignment) =>
        assignment.session === reportFilter.session &&
        (!reportFilter.term || assignment.period === reportFilter.term) &&
        assignment.status === "active"
    );
    const selectedPayments = payrollPayments.filter(
      (payment) =>
        payment.session === reportFilter.session &&
        (!reportFilter.term || payment.period === reportFilter.term)
    );
    const paidByAssignment = selectedPayments.reduce((paymentMap, payment) => {
      const assignmentId = getRecordId(payment.assignment);
      paymentMap.set(
        assignmentId,
        (paymentMap.get(assignmentId) || 0) + Number(payment.amount || 0)
      );

      return paymentMap;
    }, new Map());
    const rowMap = new Map();

    selectedAssignments.forEach((assignment) => {
      const rowKey = `${assignment.category}|${assignment.level_name}`;
      const expected = Number(assignment.net_amount || 0);
      const paid = paidByAssignment.get(getRecordId(assignment)) || 0;
      const balance = Math.max(expected - paid, 0);

      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, {
          key: rowKey,
          category: assignment.category || "not_set",
          level_name: assignment.level_name || "Level not set",
          assigned_staff: 0,
          expected: 0,
          paid: 0,
          balance: 0,
          outstanding_staff: 0,
        });
      }

      const row = rowMap.get(rowKey);
      row.assigned_staff += 1;
      row.expected += expected;
      row.paid += paid;
      row.balance += balance;
      row.outstanding_staff += balance > 0 ? 1 : 0;
    });

    return Array.from(rowMap.values()).sort(
      (firstRow, secondRow) =>
        firstRow.category.localeCompare(secondRow.category) ||
        firstRow.level_name.localeCompare(secondRow.level_name)
    );
  }, [
    payrollAssignments,
    payrollPayments,
    reportFilter.session,
    reportFilter.term,
  ]);

  const boardingReportRows = useMemo(() => {
    const selectedEnrollments = boardingEnrollments.filter(
      (enrollment) =>
        enrollment.session === reportFilter.session &&
        (!reportFilter.term || enrollment.term === reportFilter.term) &&
        enrollment.status === "active"
    );
    const selectedStructures = boardingStructures.filter(
      (structure) =>
        structure.session === reportFilter.session &&
        (!reportFilter.term || structure.term === reportFilter.term)
    );
    const selectedPayments = boardingPayments.filter(
      (payment) =>
        payment.session === reportFilter.session &&
        (!reportFilter.term || payment.term === reportFilter.term)
    );
    const houseById = new Map(
      boardingHouses.map((house) => [getRecordId(house), house])
    );
    const structureByHouse = new Map(
      selectedStructures.map((structure) => [
        getRecordId(structure.house),
        Number(structure.amount || 0),
      ])
    );
    const paidByEnrollment = selectedPayments.reduce((paymentMap, payment) => {
      const enrollmentId = getRecordId(payment.enrollment);
      paymentMap.set(
        enrollmentId,
        (paymentMap.get(enrollmentId) || 0) + Number(payment.amount || 0)
      );

      return paymentMap;
    }, new Map());
    const rowMap = new Map();

    selectedEnrollments.forEach((enrollment) => {
      const houseId = getRecordId(enrollment.house);
      const house = houseById.get(houseId);
      const expected = structureByHouse.get(houseId) || 0;
      const paid = paidByEnrollment.get(getRecordId(enrollment)) || 0;
      const balance = Math.max(expected - paid, 0);

      if (!rowMap.has(houseId || "no-house")) {
        rowMap.set(houseId || "no-house", {
          house_id: houseId,
          house: house?.name || enrollment.house?.name || "House not set",
          active_enrollments: 0,
          expected: 0,
          paid: 0,
          balance: 0,
          outstanding_students: 0,
        });
      }

      const row = rowMap.get(houseId || "no-house");
      row.active_enrollments += 1;
      row.expected += expected;
      row.paid += paid;
      row.balance += balance;
      row.outstanding_students += balance > 0 ? 1 : 0;
    });

    return Array.from(rowMap.values()).sort((firstRow, secondRow) =>
      firstRow.house.localeCompare(secondRow.house)
    );
  }, [
    boardingEnrollments,
    boardingHouses,
    boardingPayments,
    boardingStructures,
    reportFilter.session,
    reportFilter.term,
  ]);

  const recentStudents = [...reportStudents]
    .sort((firstStudent, secondStudent) => {
      return new Date(secondStudent.createdAt || 0) - new Date(firstStudent.createdAt || 0);
    })
    .slice(0, 8);

  const genderSummary = useMemo(() => {
    return reportStudents.reduce((summary, student) => {
      const gender = student.gender || "Not set";

      return {
        ...summary,
        [gender]: (summary[gender] || 0) + 1,
      };
    }, {});
  }, [reportStudents]);

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
      ...(name === "session"
        ? { term: normalizeTermForSession(currentFilter.term, value) }
        : {}),
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
    <div className="px-6 py-8 lg:px-10">
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
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaFileLines />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">
          Admin Report
        </h2>
        <p className="mt-3 max-w-3xl text-secondary/75">
          Standard academic operations report for enrollment, class records,
          result uploads, and outstanding result coverage.
        </p>
      </div>

      <section className="rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-5">
            <h3 className="text-3xl font-extrabold text-primary">
              Report Controls
            </h3>
            <p className="mt-2 text-primary/70">
              Report generated for {reportFilter.session}
              {reportFilter.term ? ` - ${reportFilter.term}` : ""}.
            </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[240px_240px_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Session
            </label>
            <select
              name="session"
              value={reportFilter.session}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
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
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              <option value="">All terms</option>
              {getVisibleTermsForSession(reportFilter.session).map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrintReport}
            aria-label="Print admin report"
            className="flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            <FaPrint />
            Print
          </button>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.title} className="rounded-lg bg-secondary p-5 shadow-md">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="font-medium text-primary/70">{card.title}</p>
                <h3 className="mt-4 text-3xl font-extrabold text-primary">
                  {card.value}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Bus Summary
              </h3>
              <p className="mt-2 text-primary/70">
                Transport collection and enrollment for the selected filter.
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaBus />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-primary/5 p-5">
              <p className="text-sm font-bold text-primary/60">
                Active Bus Students
              </p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {loading ? "..." : busSummary.activeEnrollments}
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 p-5">
              <p className="text-sm font-bold text-primary/60">Routes</p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {loading ? "..." : busSummary.routes}
              </p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-5">
              <p className="text-sm font-bold text-green-300">Paid</p>
              <p className="mt-2 text-2xl font-extrabold text-green-200">
                {loading ? "..." : formatCurrency(busSummary.paid)}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-5">
              <p className="text-sm font-bold text-red-300">Balance</p>
              <p className="mt-2 text-2xl font-extrabold text-red-200">
                {loading ? "..." : formatCurrency(busSummary.balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Payroll Summary
              </h3>
              <p className="mt-2 text-primary/70">
                Staff payroll assignment and payment for the selected filter.
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-button text-xl text-secondary">
              <FaMoneyBillWave />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-primary/5 p-5">
              <p className="text-sm font-bold text-primary/60">Active Staff</p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {loading ? "..." : payrollSummary.activeStaff}
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 p-5">
              <p className="text-sm font-bold text-primary/60">
                Assigned Staff
              </p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {loading ? "..." : payrollSummary.assignedStaff}
              </p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-5">
              <p className="text-sm font-bold text-green-300">Paid</p>
              <p className="mt-2 text-2xl font-extrabold text-green-200">
                {loading ? "..." : formatCurrency(payrollSummary.paid)}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-5">
              <p className="text-sm font-bold text-red-300">Balance</p>
              <p className="mt-2 text-2xl font-extrabold text-red-200">
                {loading ? "..." : formatCurrency(payrollSummary.balance)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Bus Report
          </h3>
          <p className="mt-2 text-primary/70">
            Route-level transport enrollment and payment report.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[1020px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">Route</th>
                <th className="px-5 py-4 font-bold">Category</th>
                <th className="px-5 py-4 font-bold">Students</th>
                <th className="px-5 py-4 font-bold">Expected</th>
                <th className="px-5 py-4 font-bold">Paid</th>
                <th className="px-5 py-4 font-bold">Balance</th>
                <th className="px-5 py-4 font-bold">Outstanding Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? (
                <TableSkeleton columns={7} />
              ) : busReportRows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
                    No bus record found for this filter.
                  </td>
                </tr>
              ) : (
                busReportRows.map((row) => (
                  <tr
                    key={`${row.route_id || row.route}-${row.payment_category}`}
                    className="text-primary/80"
                  >
                    <td className="px-5 py-4 font-bold text-primary">
                      {row.route}
                    </td>
                    <td className="px-5 py-4">{row.payment_category_label}</td>
                    <td className="px-5 py-4">{row.active_enrollments}</td>
                    <td className="px-5 py-4">{formatCurrency(row.expected)}</td>
                    <td className="px-5 py-4 font-bold text-primary">
                      {formatCurrency(row.paid)}
                    </td>
                    <td className="px-5 py-4">{formatCurrency(row.balance)}</td>
                    <td className="px-5 py-4">{row.outstanding_students}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Payroll Report
          </h3>
          <p className="mt-2 text-primary/70">
            Staff payroll by category and level for the selected filter.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">Category</th>
                <th className="px-5 py-4 font-bold">Level</th>
                <th className="px-5 py-4 font-bold">Assigned Staff</th>
                <th className="px-5 py-4 font-bold">Expected</th>
                <th className="px-5 py-4 font-bold">Paid</th>
                <th className="px-5 py-4 font-bold">Balance</th>
                <th className="px-5 py-4 font-bold">Outstanding Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? (
                <TableSkeleton columns={7} />
              ) : payrollReportRows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
                    No payroll record found for this filter.
                  </td>
                </tr>
              ) : (
                payrollReportRows.map((row) => (
                  <tr key={row.key} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {row.category === "non_academic"
                        ? "Non Academic"
                        : "Academic"}
                    </td>
                    <td className="px-5 py-4">{row.level_name}</td>
                    <td className="px-5 py-4">{row.assigned_staff}</td>
                    <td className="px-5 py-4">{formatCurrency(row.expected)}</td>
                    <td className="px-5 py-4 font-bold text-primary">
                      {formatCurrency(row.paid)}
                    </td>
                    <td className="px-5 py-4">{formatCurrency(row.balance)}</td>
                    <td className="px-5 py-4">{row.outstanding_staff}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Boarding Report
          </h3>
          <p className="mt-2 text-primary/70">
            House-level boarding registration and payment report.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">House</th>
                <th className="px-5 py-4 font-bold">Students</th>
                <th className="px-5 py-4 font-bold">Expected</th>
                <th className="px-5 py-4 font-bold">Paid</th>
                <th className="px-5 py-4 font-bold">Balance</th>
                <th className="px-5 py-4 font-bold">Outstanding Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? (
                <TableSkeleton columns={6} />
              ) : boardingReportRows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="6">
                    No boarding record found for this filter.
                  </td>
                </tr>
              ) : (
                boardingReportRows.map((row) => (
                  <tr key={row.house_id || row.house} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {row.house}
                    </td>
                    <td className="px-5 py-4">{row.active_enrollments}</td>
                    <td className="px-5 py-4">{formatCurrency(row.expected)}</td>
                    <td className="px-5 py-4 font-bold text-primary">
                      {formatCurrency(row.paid)}
                    </td>
                    <td className="px-5 py-4">{formatCurrency(row.balance)}</td>
                    <td className="px-5 py-4">{row.outstanding_students}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_.8fr]">
        <div className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-3xl font-extrabold text-primary">
            Class Performance Summary
          </h3>
          <p className="mt-2 text-primary/70">
            Enrollment and result upload coverage by class.
          </p>

          <div className="mt-6 overflow-x-auto rounded-lg border border-primary/10">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Students</th>
                  <th className="px-5 py-4 font-bold">Uploaded</th>
                  <th className="px-5 py-4 font-bold">Missing</th>
                  <th className="px-5 py-4 font-bold">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loading ? (
                  <TableSkeleton columns={5} />
                ) : classRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="5">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-3xl font-extrabold text-primary">
            Student Summary
          </h3>
          <p className="mt-2 text-primary/70">
            Gender distribution for the selected session.
          </p>

          <div className="mt-6 space-y-4">
            {Object.keys(genderSummary).length === 0 ? (
              <p className="rounded-lg bg-primary/5 p-5 text-primary/70">
                No student record found for this session.
              </p>
            ) : (
              Object.entries(genderSummary).map(([gender, count]) => (
                <div
                  key={gender}
                  className="flex items-center justify-between rounded-lg bg-primary/5 p-5 text-primary"
                >
                  <span className="font-bold">{gender}</span>
                  <span className="text-2xl font-extrabold">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Recent Registrations
          </h3>
          <p className="mt-2 text-primary/70">
            Latest student registrations for the selected session.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
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

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Left School Records
          </h3>
          <p className="mt-2 text-primary/70">
            Recent students marked as left school for the selected session and
            term.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
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
          className="flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02]"
        >
          Print Report
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
}

export default AdminReport;

