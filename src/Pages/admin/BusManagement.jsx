import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBus,
  FaMoneyBillWave,
  FaPenToSquare,
  FaRoute,
  FaTrashCan,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import { sortStudentsByName } from "../../utils/students.js";

const DEFAULT_SESSION = "2025/2026";
const PAGE_SIZE = 25;
const terms = ["First Term", "Second Term", "Third Term"];

const initialBusForm = {
  name: "",
  plate_number: "",
  driver_name: "",
  driver_phone: "",
  capacity: "",
  status: "active",
};

const initialRouteForm = {
  name: "",
  bus: "",
  pickup_points: "",
  status: "active",
};

const initialStructureForm = {
  route: "",
  session: DEFAULT_SESSION,
  term: "",
  items: [
    {
      name: "Bus Fee",
      amount: "",
    },
  ],
};

const initialEnrollmentForm = {
  session: DEFAULT_SESSION,
  term: "",
  class_record: "",
  route: "",
  pickup_point: "",
  student_ids: [],
};

const initialPaymentForm = {
  enrollment: "",
  amount: "",
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: "",
  note: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (dateValue) =>
  dateValue ? new Date(dateValue).toLocaleDateString() : "Not set";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const getRecordId = (record) => record?._id || record || "";

const isActiveStudent = (student) =>
  !student.status || student.status === "active";

const inputClass =
  "w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

const smallButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60";

function PaginationControls({ page, totalItems, onPageChange }) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  if (totalPages <= 1) {
    return null;
  }

  const visiblePage = Math.min(page, totalPages);
  const startItem = (visiblePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(visiblePage * PAGE_SIZE, totalItems);

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-primary/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-primary/60">
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={visiblePage === 1}
          onClick={() => onPageChange(visiblePage - 1)}
          className={`${smallButtonClass} bg-primary/10 text-primary`}
        >
          Previous
        </button>
        <span className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary">
          Page {visiblePage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={visiblePage === totalPages}
          onClick={() => onPageChange(visiblePage + 1)}
          className={`${smallButtonClass} bg-primary/10 text-primary`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-primary/60">{title}</p>
          <p className="mt-3 text-3xl font-extrabold text-primary">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BusManagement() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [structures, setStructures] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [busForm, setBusForm] = useState(initialBusForm);
  const [routeForm, setRouteForm] = useState(initialRouteForm);
  const [structureForm, setStructureForm] = useState(initialStructureForm);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [editingBusId, setEditingBusId] = useState("");
  const [editingRouteId, setEditingRouteId] = useState("");
  const [editingStructureId, setEditingStructureId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [enrollmentTotal, setEnrollmentTotal] = useState(0);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [filters, setFilters] = useState({
    session: DEFAULT_SESSION,
    term: "",
    route: "",
  });

  const fetchBusData = async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });
      const enrollmentParams = {
        limit: PAGE_SIZE,
        page: enrollmentPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => Boolean(value))
        ),
      };
      const paymentParams = {
        limit: PAGE_SIZE,
        page: paymentPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => Boolean(value))
        ),
      };

      const [
        busesResponse,
        routesResponse,
        structuresResponse,
        enrollmentsResponse,
        paymentsResponse,
        studentsResponse,
        classesResponse,
      ] = await Promise.all([
        API.get("/bus-management/buses"),
        API.get("/bus-management/routes"),
        API.get("/bus-management/fee-structures"),
        API.get("/bus-management/enrollments", { params: enrollmentParams }),
        API.get("/bus-management/payments", { params: paymentParams }),
        API.get("/students"),
        API.get("/classes"),
      ]);

      setBuses(busesResponse.data || []);
      setRoutes(routesResponse.data || []);
      setStructures(structuresResponse.data || []);
      setEnrollments(enrollmentsResponse.data || []);
      setPayments(paymentsResponse.data || []);
      setEnrollmentTotal(
        Number(enrollmentsResponse.headers?.["x-total-count"] || 0)
      );
      setPaymentTotal(
        Number(paymentsResponse.headers?.["x-total-count"] || 0)
      );
      setStudents(studentsResponse.data || []);
      setClasses(classesResponse.data || []);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load bus management records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusData();
  }, [enrollmentPage, filters, paymentPage]);

  const sessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_SESSION,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
        ...students.map((student) => student.current_session).filter(Boolean),
        ...structures.map((structure) => structure.session).filter(Boolean),
        ...enrollments.map((enrollment) => enrollment.session).filter(Boolean),
        ...payments.map((payment) => payment.session).filter(Boolean),
      ]),
    ].sort();
  }, [classes, enrollments, payments, students, structures]);

  const enrollmentClasses = useMemo(
    () =>
      classes.filter(
        (classRecord) => classRecord.session === enrollmentForm.session
      ),
    [classes, enrollmentForm.session]
  );

  const selectedEnrollmentClass = useMemo(
    () =>
      classes.find(
        (classRecord) => classRecord._id === enrollmentForm.class_record
      ),
    [classes, enrollmentForm.class_record]
  );

  const selectedEnrollmentRoute = useMemo(
    () => routes.find((route) => route._id === enrollmentForm.route),
    [enrollmentForm.route, routes]
  );

  const classStudentOptions = useMemo(() => {
    if (!selectedEnrollmentClass) {
      return [];
    }

    return sortStudentsByName(
      students.filter((student) => {
        const studentClassRecordId = getRecordId(student.class_record);

        return (
          isActiveStudent(student) &&
          student.current_session === enrollmentForm.session &&
          (
            studentClassRecordId === selectedEnrollmentClass._id ||
            normalizeClassName(student.class) ===
            normalizeClassName(selectedEnrollmentClass.name)
          )
        );
      })
    );
  }, [enrollmentForm.session, selectedEnrollmentClass, students]);

  const existingEnrollmentStudentIds = useMemo(() => {
    return new Set(
      enrollments
        .filter(
          (enrollment) =>
            enrollment.session === enrollmentForm.session &&
            enrollment.term === enrollmentForm.term
        )
        .map((enrollment) => getRecordId(enrollment.student))
    );
  }, [enrollmentForm.session, enrollmentForm.term, enrollments]);

  const availableStudentOptions = useMemo(
    () =>
      classStudentOptions.filter(
        (student) => !existingEnrollmentStudentIds.has(student._id)
      ),
    [classStudentOptions, existingEnrollmentStudentIds]
  );

  const structureByKey = useMemo(() => {
    const structureMap = new Map();

    structures.forEach((structure) => {
      structureMap.set(
        [
          getRecordId(structure.route),
          structure.session,
          structure.term,
        ].join("|"),
        structure
      );
    });

    return structureMap;
  }, [structures]);

  const paidByEnrollment = useMemo(() => {
    const paymentMap = new Map();

    payments.forEach((payment) => {
      const enrollmentId = getRecordId(payment.enrollment);

      paymentMap.set(
        enrollmentId,
        (paymentMap.get(enrollmentId) || 0) + Number(payment.amount || 0)
      );
    });

    return paymentMap;
  }, [payments]);

  const enrollmentRows = useMemo(() => {
    return enrollments
      .filter((enrollment) => {
        const matchesSession =
          !filters.session || enrollment.session === filters.session;
        const matchesTerm = !filters.term || enrollment.term === filters.term;
        const matchesRoute =
          !filters.route || getRecordId(enrollment.route) === filters.route;

        return matchesSession && matchesTerm && matchesRoute;
      })
      .map((enrollment) => {
        const routeId = getRecordId(enrollment.route);
        const structure = structureByKey.get(
          [routeId, enrollment.session, enrollment.term].join("|")
        );
        const expected = Number(structure?.amount || 0);
        const paid = paidByEnrollment.get(enrollment._id) || 0;
        const balance = Math.max(expected - paid, 0);

        return {
          ...enrollment,
          expected,
          paid,
          balance,
        };
      })
      .sort((firstEnrollment, secondEnrollment) =>
        new Date(secondEnrollment.createdAt || 0) -
        new Date(firstEnrollment.createdAt || 0)
      );
  }, [
    enrollments,
    filters.route,
    filters.session,
    filters.term,
    paidByEnrollment,
    structureByKey,
  ]);

  const activeEnrollmentRows = useMemo(
    () => enrollmentRows.filter((enrollment) => enrollment.status === "active"),
    [enrollmentRows]
  );

  const selectedPaymentEnrollment = useMemo(
    () =>
      activeEnrollmentRows.find(
        (enrollment) => enrollment._id === paymentForm.enrollment
      ),
    [activeEnrollmentRows, paymentForm.enrollment]
  );

  const paymentRows = useMemo(() => {
    return payments
      .filter((payment) => {
        const matchesSession =
          !filters.session || payment.session === filters.session;
        const matchesTerm = !filters.term || payment.term === filters.term;
        const matchesRoute =
          !filters.route || getRecordId(payment.route) === filters.route;

        return matchesSession && matchesTerm && matchesRoute;
      })
      .sort(
        (firstPayment, secondPayment) =>
          new Date(secondPayment.payment_date || 0) -
          new Date(firstPayment.payment_date || 0)
      );
  }, [filters.route, filters.session, filters.term, payments]);

  const visibleEnrollmentPage = enrollmentPage;
  const visiblePaymentPage = paymentPage;
  const paginatedEnrollments = enrollmentRows;
  const paginatedPayments = paymentRows;

  const totals = useMemo(() => {
    const activeRows = enrollmentRows.filter(
      (enrollment) => enrollment.status === "active"
    );

    return {
      activeEnrollments: activeRows.length,
      expected: activeRows.reduce(
        (sum, enrollment) => sum + Number(enrollment.expected || 0),
        0
      ),
      paid: activeRows.reduce(
        (sum, enrollment) => sum + Number(enrollment.paid || 0),
        0
      ),
      balance: activeRows.reduce(
        (sum, enrollment) => sum + Number(enrollment.balance || 0),
        0
      ),
    };
  }, [enrollmentRows]);

  const handleFilterChange = (field, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
    setEnrollmentPage(1);
    setPaymentPage(1);
  };

  const handleBusChange = (event) => {
    const { name, value } = event.target;
    setBusForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleRouteChange = (event) => {
    const { name, value } = event.target;
    setRouteForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleStructureChange = (event) => {
    const { name, value } = event.target;
    setStructureForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleStructureItemChange = (index, field, value) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const handleAddStructureItem = () => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      items: [
        ...currentForm.items,
        {
          name: "",
          amount: "",
        },
      ],
    }));
  };

  const handleRemoveStructureItem = (index) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      items:
        currentForm.items.length > 1
          ? currentForm.items.filter((_, itemIndex) => itemIndex !== index)
          : currentForm.items,
    }));
  };

  const handleEnrollmentChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setEnrollmentForm((currentForm) => ({
        ...currentForm,
        session: value,
        class_record: "",
        student_ids: [],
      }));
      return;
    }

    if (name === "class_record") {
      setEnrollmentForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        student_ids: [],
      }));
      return;
    }

    if (name === "route") {
      setEnrollmentForm((currentForm) => ({
        ...currentForm,
        route: value,
        pickup_point: "",
      }));
      return;
    }

    setEnrollmentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;
    const nextForm = {
      ...paymentForm,
      [name]: value,
    };

    if (name === "enrollment") {
      const enrollment = activeEnrollmentRows.find(
        (enrollmentRow) => enrollmentRow._id === value
      );

      nextForm.amount = enrollment?.balance ? enrollment.balance.toString() : "";
    }

    setPaymentForm(nextForm);
  };

  const handleStudentToggle = (studentId) => {
    setEnrollmentForm((currentForm) => ({
      ...currentForm,
      student_ids: currentForm.student_ids.includes(studentId)
        ? currentForm.student_ids.filter((currentId) => currentId !== studentId)
        : [...currentForm.student_ids, studentId],
    }));
  };

  const handleSelectAllStudents = () => {
    setEnrollmentForm((currentForm) => ({
      ...currentForm,
      student_ids: availableStudentOptions.map((student) => student._id),
    }));
  };

  const handleClearStudents = () => {
    setEnrollmentForm((currentForm) => ({
      ...currentForm,
      student_ids: [],
    }));
  };

  const handleBusSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("bus");
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        ...busForm,
        capacity: Number(busForm.capacity || 0),
      };
      const response = editingBusId
        ? await API.put(`/bus-management/buses/${editingBusId}`, payload)
        : await API.post("/bus-management/buses", payload);

      setBuses((currentBuses) =>
        editingBusId
          ? currentBuses.map((bus) =>
              bus._id === response.data._id ? response.data : bus
            )
          : [response.data, ...currentBuses]
      );
      setBusForm(initialBusForm);
      setEditingBusId("");
      setStatus({
        type: "success",
        message: editingBusId ? "Bus updated successfully." : "Bus registered successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save bus record.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleRouteSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("route");
    setStatus({ type: "", message: "" });

    try {
      const response = editingRouteId
        ? await API.put(`/bus-management/routes/${editingRouteId}`, routeForm)
        : await API.post("/bus-management/routes", routeForm);

      setRoutes((currentRoutes) =>
        editingRouteId
          ? currentRoutes.map((route) =>
              route._id === response.data._id ? response.data : route
            )
          : [response.data, ...currentRoutes]
      );
      setRouteForm(initialRouteForm);
      setEditingRouteId("");
      setStatus({
        type: "success",
        message: editingRouteId
          ? "Bus route updated successfully."
          : "Bus route created successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save bus route.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleStructureSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("structure");
    setStatus({ type: "", message: "" });

    const payload = {
      ...structureForm,
      items: structureForm.items.map((item) => ({
        name: item.name,
        amount: Number(item.amount),
      })),
    };

    try {
      const response = editingStructureId
        ? await API.put(
            `/bus-management/fee-structures/${editingStructureId}`,
            payload
          )
        : await API.post("/bus-management/fee-structures", payload);

      setStructures((currentStructures) =>
        editingStructureId
          ? currentStructures.map((structure) =>
              structure._id === response.data._id ? response.data : structure
            )
          : [response.data, ...currentStructures]
      );
      setStructureForm(initialStructureForm);
      setEditingStructureId("");
      setStatus({
        type: "success",
        message: editingStructureId
          ? "Bus payment structure updated successfully."
          : "Bus payment structure created successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save bus payment structure.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleEnrollmentSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("enrollment");
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post(
        "/bus-management/enrollments",
        enrollmentForm
      );
      await fetchBusData();
      setEnrollmentForm({
        ...initialEnrollmentForm,
        session: enrollmentForm.session,
        term: enrollmentForm.term,
        class_record: enrollmentForm.class_record,
        route: enrollmentForm.route,
        pickup_point: enrollmentForm.pickup_point,
      });
      setStatus({
        type: "success",
        message:
          response.data?.message || "Selected students enrolled for bus transport.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to enroll selected students.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("payment");
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post("/bus-management/payments", {
        ...paymentForm,
        amount: Number(paymentForm.amount),
      });

      setPayments((currentPayments) => [response.data, ...currentPayments]);
      setPaymentForm(initialPaymentForm);
      setStatus({
        type: "success",
        message: "Bus payment recorded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to record bus payment.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleEditBus = (bus) => {
    setEditingBusId(bus._id);
    setBusForm({
      name: bus.name || "",
      plate_number: bus.plate_number || "",
      driver_name: bus.driver_name || "",
      driver_phone: bus.driver_phone || "",
      capacity: bus.capacity?.toString() || "",
      status: bus.status || "active",
    });
  };

  const handleEditRoute = (route) => {
    setEditingRouteId(route._id);
    setRouteForm({
      name: route.name || "",
      bus: getRecordId(route.bus),
      pickup_points: (route.pickup_points || []).join("\n"),
      status: route.status || "active",
    });
  };

  const handleEditStructure = (structure) => {
    setEditingStructureId(structure._id);
    setStructureForm({
      route: getRecordId(structure.route),
      session: structure.session || DEFAULT_SESSION,
      term: structure.term || "",
      items:
        structure.items?.length > 0
          ? structure.items.map((item) => ({
              name: item.name || "",
              amount: item.amount?.toString() || "",
            }))
          : initialStructureForm.items,
    });
  };

  const handleEnrollmentStatus = async (enrollment, nextStatus) => {
    setSubmitting(`enrollment-${enrollment._id}`);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.put(`/bus-management/enrollments/${enrollment._id}`, {
        route: getRecordId(enrollment.route),
        pickup_point: enrollment.pickup_point,
        status: nextStatus,
        stop_reason: nextStatus === "active" ? "" : "Updated by admin",
      });

      setEnrollments((currentEnrollments) =>
        currentEnrollments.map((currentEnrollment) =>
          currentEnrollment._id === response.data._id
            ? response.data
            : currentEnrollment
        )
      );
      setStatus({
        type: "success",
        message: "Bus enrollment updated successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update bus enrollment.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleDelete = async ({ endpoint, id, collection }) => {
    const confirmed = window.confirm("Delete this bus management record?");

    if (!confirmed) {
      return;
    }

    setSubmitting(`delete-${id}`);
    setStatus({ type: "", message: "" });

    try {
      await API.delete(`/bus-management/${endpoint}/${id}`);

      if (collection === "buses") {
        setBuses((currentBuses) => currentBuses.filter((bus) => bus._id !== id));
      }

      if (collection === "routes") {
        setRoutes((currentRoutes) =>
          currentRoutes.filter((route) => route._id !== id)
        );
      }

      if (collection === "structures") {
        setStructures((currentStructures) =>
          currentStructures.filter((structure) => structure._id !== id)
        );
      }

      if (collection === "enrollments") {
        setEnrollments((currentEnrollments) =>
          currentEnrollments.filter((enrollment) => enrollment._id !== id)
        );
      }

      if (collection === "payments") {
        setPayments((currentPayments) =>
          currentPayments.filter((payment) => payment._id !== id)
        );
      }

      setStatus({
        type: "success",
        message: "Record deleted successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete record.",
      });
    } finally {
      setSubmitting("");
    }
  };

  return (
    <div className="px-6 py-10 lg:px-12">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaBus />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Bus Management
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Manage transport buses, routes, student bus enrollment, and bus fee
          payments.
        </p>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Registered Buses" value={buses.length} icon={<FaBus />} />
        <StatCard title="Routes" value={routes.length} icon={<FaRoute />} />
        <StatCard
          title="Active Bus Students"
          value={totals.activeEnrollments}
          icon={<FaUsers />}
        />
        <StatCard
          title="Outstanding"
          value={loading ? "..." : formatCurrency(totals.balance)}
          icon={<FaMoneyBillWave />}
        />
      </section>

      <section className="mb-8 rounded-[2rem] bg-secondary p-6 shadow-2xl">
        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_200px_200px_240px_auto] xl:items-end">
          <div>
            <h3 className="text-2xl font-extrabold text-primary">
              Bus Transport Summary
            </h3>
            <p className="mt-2 text-primary/70">
              {filters.session || "All sessions"}
              {filters.term ? ` - ${filters.term}` : ""}
            </p>
          </div>
          <select
            className={inputClass}
            name="session"
            value={filters.session}
            onChange={(event) =>
              handleFilterChange("session", event.target.value)
            }
          >
            <option value="">All sessions</option>
            {sessionOptions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            name="term"
            value={filters.term}
            onChange={(event) =>
              handleFilterChange("term", event.target.value)
            }
          >
            <option value="">All terms</option>
            {terms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            name="route"
            value={filters.route}
            onChange={(event) =>
              handleFilterChange("route", event.target.value)
            }
          >
            <option value="">All routes</option>
            {routes.map((route) => (
              <option key={route._id} value={route._id}>
                {route.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchBusData}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02]"
          >
            Refresh
            <FaArrowRight />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-primary/5 p-5">
            <p className="text-sm font-bold text-primary/60">Expected</p>
            <p className="mt-2 text-2xl font-extrabold text-primary">
              {formatCurrency(totals.expected)}
            </p>
          </div>
          <div className="rounded-2xl bg-green-500/10 p-5">
            <p className="text-sm font-bold text-green-300">Paid</p>
            <p className="mt-2 text-2xl font-extrabold text-green-200">
              {formatCurrency(totals.paid)}
            </p>
          </div>
          <div className="rounded-2xl bg-red-500/10 p-5">
            <p className="text-sm font-bold text-red-300">Balance</p>
            <p className="mt-2 text-2xl font-extrabold text-red-200">
              {formatCurrency(totals.balance)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8">
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <form
            onSubmit={handleBusSubmit}
            className="rounded-[2rem] bg-secondary p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-extrabold text-primary">
              {editingBusId ? "Edit Bus" : "Register Bus"}
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                className={inputClass}
                name="name"
                value={busForm.name}
                onChange={handleBusChange}
                placeholder="Bus name or number"
                required
              />
              <input
                className={inputClass}
                name="plate_number"
                value={busForm.plate_number}
                onChange={handleBusChange}
                placeholder="Plate number"
              />
              <input
                className={inputClass}
                name="driver_name"
                value={busForm.driver_name}
                onChange={handleBusChange}
                placeholder="Driver name"
              />
              <input
                className={inputClass}
                name="driver_phone"
                value={busForm.driver_phone}
                onChange={handleBusChange}
                placeholder="Driver phone"
              />
              <input
                className={inputClass}
                name="capacity"
                value={busForm.capacity}
                onChange={handleBusChange}
                placeholder="Capacity"
                type="number"
                min="0"
              />
              <select
                className={inputClass}
                name="status"
                value={busForm.status}
                onChange={handleBusChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting === "bus"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "bus"
                ? "Saving bus..."
                : editingBusId
                  ? "Save Bus"
                  : "Register Bus"}
              <FaArrowRight />
            </button>
            {editingBusId && (
              <button
                type="button"
                onClick={() => {
                  setEditingBusId("");
                  setBusForm(initialBusForm);
                }}
                className="mt-3 w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary"
              >
                Cancel Edit
              </button>
            )}
          </form>

          <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-primary">Bus Records</h3>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-primary/10 text-primary">
                  <tr>
                    <th className="px-5 py-4">Bus</th>
                    <th className="px-5 py-4">Plate</th>
                    <th className="px-5 py-4">Driver</th>
                    <th className="px-5 py-4">Capacity</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 text-primary/80">
                  {buses.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="6">
                        No bus has been registered yet.
                      </td>
                    </tr>
                  ) : (
                    buses.map((bus) => (
                      <tr key={bus._id}>
                        <td className="px-5 py-4 font-bold text-primary">
                          {bus.name}
                        </td>
                        <td className="px-5 py-4">{bus.plate_number || "Not set"}</td>
                        <td className="px-5 py-4">{bus.driver_name || "Not set"}</td>
                        <td className="px-5 py-4">{bus.capacity || 0}</td>
                        <td className="px-5 py-4">{bus.status}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditBus(bus)}
                              className={`${smallButtonClass} bg-button text-secondary`}
                            >
                              <FaPenToSquare />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete({
                                  endpoint: "buses",
                                  id: bus._id,
                                  collection: "buses",
                                })
                              }
                              className={`${smallButtonClass} bg-red-500/10 text-red-200`}
                            >
                              <FaTrashCan />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <form
            onSubmit={handleRouteSubmit}
            className="rounded-[2rem] bg-secondary p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-extrabold text-primary">
              {editingRouteId ? "Edit Route" : "Create Route"}
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <input
                className={inputClass}
                name="name"
                value={routeForm.name}
                onChange={handleRouteChange}
                placeholder="Route or pickup area name"
                required
              />
              <select
                className={inputClass}
                name="bus"
                value={routeForm.bus}
                onChange={handleRouteChange}
              >
                <option value="">No bus assigned</option>
                {buses.map((bus) => (
                  <option key={bus._id} value={bus._id}>
                    {bus.name} {bus.plate_number ? `- ${bus.plate_number}` : ""}
                  </option>
                ))}
              </select>
              <textarea
                className={inputClass}
                name="pickup_points"
                value={routeForm.pickup_points}
                onChange={handleRouteChange}
                placeholder="Pickup points, one per line"
                rows="4"
              />
              <select
                className={inputClass}
                name="status"
                value={routeForm.status}
                onChange={handleRouteChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting === "route"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "route"
                ? "Saving route..."
                : editingRouteId
                  ? "Save Route"
                  : "Create Route"}
              <FaArrowRight />
            </button>
            {editingRouteId && (
              <button
                type="button"
                onClick={() => {
                  setEditingRouteId("");
                  setRouteForm(initialRouteForm);
                }}
                className="mt-3 w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary"
              >
                Cancel Edit
              </button>
            )}
          </form>

          <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-primary">Routes</h3>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-primary/10 text-primary">
                  <tr>
                    <th className="px-5 py-4">Route</th>
                    <th className="px-5 py-4">Bus</th>
                    <th className="px-5 py-4">Pickup Points</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 text-primary/80">
                  {routes.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="5">
                        No bus route has been created yet.
                      </td>
                    </tr>
                  ) : (
                    routes.map((route) => (
                      <tr key={route._id}>
                        <td className="px-5 py-4 font-bold text-primary">
                          {route.name}
                        </td>
                        <td className="px-5 py-4">{route.bus?.name || "Unassigned"}</td>
                        <td className="px-5 py-4">
                          {(route.pickup_points || []).slice(0, 3).join(", ") ||
                            "Not set"}
                        </td>
                        <td className="px-5 py-4">{route.status}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditRoute(route)}
                              className={`${smallButtonClass} bg-button text-secondary`}
                            >
                              <FaPenToSquare />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete({
                                  endpoint: "routes",
                                  id: route._id,
                                  collection: "routes",
                                })
                              }
                              className={`${smallButtonClass} bg-red-500/10 text-red-200`}
                            >
                              <FaTrashCan />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Bus Payment Structure
          </h3>
          <form onSubmit={handleStructureSubmit} className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <select
                className={inputClass}
                name="route"
                value={structureForm.route}
                onChange={handleStructureChange}
                required
              >
                <option value="">Select route</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.name}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                name="session"
                value={structureForm.session}
                onChange={handleStructureChange}
                placeholder="Session"
                required
              />
              <select
                className={inputClass}
                name="term"
                value={structureForm.term}
                onChange={handleStructureChange}
                required
              >
                <option value="">Select term</option>
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 space-y-3">
              {structureForm.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]"
                >
                  <input
                    className={inputClass}
                    value={item.name}
                    onChange={(event) =>
                      handleStructureItemChange(index, "name", event.target.value)
                    }
                    placeholder="Fee item"
                    required
                  />
                  <input
                    className={inputClass}
                    value={item.amount}
                    onChange={(event) =>
                      handleStructureItemChange(index, "amount", event.target.value)
                    }
                    placeholder="Amount"
                    type="number"
                    min="0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStructureItem(index)}
                    className={`${smallButtonClass} bg-primary/10 text-primary`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={handleAddStructureItem}
                className={`${smallButtonClass} bg-primary/10 py-4 text-primary`}
              >
                Add Fee Item
              </button>
              <button
                type="submit"
                disabled={submitting === "structure"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
              >
                {submitting === "structure"
                  ? "Saving structure..."
                  : editingStructureId
                    ? "Save Structure"
                    : "Create Structure"}
                <FaArrowRight />
              </button>
            </div>
            {editingStructureId && (
              <button
                type="button"
                onClick={() => {
                  setEditingStructureId("");
                  setStructureForm(initialStructureForm);
                }}
                className="mt-3 w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary"
              >
                Cancel Edit
              </button>
            )}
          </form>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">Session</th>
                  <th className="px-5 py-4">Term</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Items</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {structures.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No bus payment structure has been created yet.
                    </td>
                  </tr>
                ) : (
                  structures.map((structure) => (
                    <tr key={structure._id}>
                      <td className="px-5 py-4 font-bold text-primary">
                        {structure.route?.name || "Deleted route"}
                      </td>
                      <td className="px-5 py-4">{structure.session}</td>
                      <td className="px-5 py-4">{structure.term}</td>
                      <td className="px-5 py-4 font-bold text-primary">
                        {formatCurrency(structure.amount)}
                      </td>
                      <td className="px-5 py-4">
                        {(structure.items || []).map((item) => item.name).join(", ")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditStructure(structure)}
                            className={`${smallButtonClass} bg-button text-secondary`}
                          >
                            <FaPenToSquare />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete({
                                endpoint: "fee-structures",
                                id: structure._id,
                                collection: "structures",
                              })
                            }
                            className={`${smallButtonClass} bg-red-500/10 text-red-200`}
                          >
                            <FaTrashCan />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Enroll Students for Bus
          </h3>
          <form onSubmit={handleEnrollmentSubmit} className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input
                className={inputClass}
                name="session"
                value={enrollmentForm.session}
                onChange={handleEnrollmentChange}
                placeholder="Session"
                required
              />
              <select
                className={inputClass}
                name="term"
                value={enrollmentForm.term}
                onChange={handleEnrollmentChange}
                required
              >
                <option value="">Select term</option>
                {terms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                name="class_record"
                value={enrollmentForm.class_record}
                onChange={handleEnrollmentChange}
                required
              >
                <option value="">Select class</option>
                {enrollmentClasses.map((classRecord) => (
                  <option key={classRecord._id} value={classRecord._id}>
                    {classRecord.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                name="route"
                value={enrollmentForm.route}
                onChange={handleEnrollmentChange}
                required
              >
                <option value="">Select route</option>
                {routes
                  .filter((route) => route.status !== "inactive")
                  .map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.name}
                    </option>
                  ))}
              </select>
              <select
                className={inputClass}
                name="pickup_point"
                value={enrollmentForm.pickup_point}
                onChange={handleEnrollmentChange}
              >
                <option value="">Pickup point</option>
                {(selectedEnrollmentRoute?.pickup_points || []).map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  disabled={availableStudentOptions.length === 0}
                  className={`${smallButtonClass} flex-1 bg-primary/10 py-4 text-primary`}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearStudents}
                  disabled={enrollmentForm.student_ids.length === 0}
                  className={`${smallButtonClass} flex-1 bg-primary/10 py-4 text-primary`}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-5 max-h-72 overflow-y-auto rounded-2xl border border-primary/10 bg-primary/5">
              {availableStudentOptions.length === 0 ? (
                <p className="px-5 py-5 text-primary/70">
                  No unenrolled active student matches the selected class, session,
                  and term.
                </p>
              ) : (
                availableStudentOptions.map((student) => (
                  <label
                    key={student._id}
                    className="flex cursor-pointer items-center gap-4 border-b border-primary/10 px-5 py-4 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={enrollmentForm.student_ids.includes(student._id)}
                      onChange={() => handleStudentToggle(student._id)}
                      className="h-5 w-5 accent-button"
                    />
                    <span>
                      <span className="block font-bold text-primary">
                        {student.full_name}
                      </span>
                      <span className="text-sm text-primary/60">
                        {student.admission_no}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <button
              type="submit"
              disabled={
                submitting === "enrollment" ||
                enrollmentForm.student_ids.length === 0
              }
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "enrollment"
                ? "Enrolling students..."
                : `Enroll ${enrollmentForm.student_ids.length} Student(s)`}
              <FaArrowRight />
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Bus Enrollments
          </h3>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[1060px] text-left text-sm">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">Session</th>
                  <th className="px-5 py-4">Term</th>
                  <th className="px-5 py-4">Expected</th>
                  <th className="px-5 py-4">Paid</th>
                  <th className="px-5 py-4">Balance</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {loading ? (
                  <TableSkeleton columns={10} />
                ) : paginatedEnrollments.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="10">
                      No bus enrollment matches this filter.
                    </td>
                  </tr>
                ) : (
                  paginatedEnrollments.map((enrollment) => (
                    <tr key={enrollment._id}>
                      <td className="px-5 py-4 font-bold text-primary">
                        {enrollment.student?.full_name || "Deleted student"}
                        <span className="block text-xs font-semibold text-primary/50">
                          {enrollment.student?.admission_no || "Not available"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {enrollment.class?.toUpperCase() || "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        {enrollment.route?.name || "Deleted route"}
                      </td>
                      <td className="px-5 py-4">{enrollment.session}</td>
                      <td className="px-5 py-4">{enrollment.term}</td>
                      <td className="px-5 py-4">
                        {formatCurrency(enrollment.expected)}
                      </td>
                      <td className="px-5 py-4 font-bold text-primary">
                        {formatCurrency(enrollment.paid)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            enrollment.balance > 0
                              ? "bg-red-500/10 text-red-200"
                              : "bg-green-500/10 text-green-200"
                          }`}
                        >
                          {formatCurrency(enrollment.balance)}
                        </span>
                      </td>
                      <td className="px-5 py-4">{enrollment.status}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={submitting === `enrollment-${enrollment._id}`}
                            onClick={() =>
                              handleEnrollmentStatus(
                                enrollment,
                                enrollment.status === "active" ? "stopped" : "active"
                              )
                            }
                            className={`${smallButtonClass} bg-primary/10 text-primary`}
                          >
                            {enrollment.status === "active" ? "Stop" : "Reactivate"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete({
                                endpoint: "enrollments",
                                id: enrollment._id,
                                collection: "enrollments",
                              })
                            }
                            className={`${smallButtonClass} bg-red-500/10 text-red-200`}
                          >
                            <FaTrashCan />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={visibleEnrollmentPage}
            totalItems={enrollmentTotal}
            onPageChange={setEnrollmentPage}
          />
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={handlePaymentSubmit}
            className="rounded-[2rem] bg-secondary p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-extrabold text-primary">
              Record Bus Payment
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <select
                className={inputClass}
                name="enrollment"
                value={paymentForm.enrollment}
                onChange={handlePaymentChange}
                required
              >
                <option value="">Select bus student</option>
                {activeEnrollmentRows.map((enrollment) => (
                  <option key={enrollment._id} value={enrollment._id}>
                    {enrollment.student?.full_name} - {enrollment.route?.name} -{" "}
                    {formatCurrency(enrollment.balance)}
                  </option>
                ))}
              </select>
              {selectedPaymentEnrollment && (
                <div className="rounded-2xl bg-primary/5 p-5 text-primary">
                  <p className="text-sm font-bold text-primary/60">Balance</p>
                  <p className="mt-2 text-2xl font-extrabold">
                    {formatCurrency(selectedPaymentEnrollment.balance)}
                  </p>
                </div>
              )}
              <input
                className={inputClass}
                name="amount"
                value={paymentForm.amount}
                onChange={handlePaymentChange}
                placeholder="Amount"
                type="number"
                min="0"
                required
              />
              <input
                className={inputClass}
                name="payment_date"
                value={paymentForm.payment_date}
                onChange={handlePaymentChange}
                type="date"
                required
              />
              <input
                className={inputClass}
                name="payment_method"
                value={paymentForm.payment_method}
                onChange={handlePaymentChange}
                placeholder="Payment method"
              />
              <textarea
                className={inputClass}
                name="note"
                value={paymentForm.note}
                onChange={handlePaymentChange}
                placeholder="Note"
                rows="3"
              />
            </div>
            <button
              type="submit"
              disabled={submitting === "payment"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "payment" ? "Recording payment..." : "Record Payment"}
              <FaArrowRight />
            </button>
          </form>

          <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-primary">
              Bus Payment Records
            </h3>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-primary/10 text-primary">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Route</th>
                    <th className="px-5 py-4">Session</th>
                    <th className="px-5 py-4">Term</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Receipt</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 text-primary/80">
                  {loading ? (
                    <TableSkeleton columns={8} />
                  ) : paginatedPayments.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="8">
                        No bus payment matches this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-5 py-4 font-bold text-primary">
                          {payment.student?.full_name || "Deleted student"}
                          <span className="block text-xs font-semibold text-primary/50">
                            {payment.student?.admission_no || "Not available"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {payment.route?.name || "Deleted route"}
                        </td>
                        <td className="px-5 py-4">{payment.session}</td>
                        <td className="px-5 py-4">{payment.term}</td>
                        <td className="px-5 py-4 font-bold text-primary">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-5 py-4">{formatDate(payment.payment_date)}</td>
                        <td className="px-5 py-4">{payment.receipt_no}</td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete({
                                endpoint: "payments",
                                id: payment._id,
                                collection: "payments",
                              })
                            }
                            className={`${smallButtonClass} bg-red-500/10 text-red-200`}
                          >
                            <FaTrashCan />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={visiblePaymentPage}
              totalItems={paymentTotal}
              onPageChange={setPaymentPage}
            />
          </section>
        </section>
      </div>
    </div>
  );
}

export default BusManagement;
