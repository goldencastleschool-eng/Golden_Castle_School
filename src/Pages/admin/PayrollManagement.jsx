import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCirclePause,
  FaCirclePlay,
  FaLayerGroup,
  FaMoneyBillWave,
  FaPenToSquare,
  FaReceipt,
  FaTrashCan,
  FaUserTie,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import AdminStatCard from "../../components/common/AdminStatCard.jsx";

const DEFAULT_SESSION = "2025/2026";
const PAGE_SIZE = 25;
const categories = [
  {
    value: "academic",
    label: "Academic",
  },
  {
    value: "non_academic",
    label: "Non Academic",
  },
];
const staffStatuses = ["active", "inactive", "resigned", "suspended"];
const monthlyPeriods = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const termlyPeriods = ["First Term", "Second Term", "Third Term"];

const inputClass =
  "w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

const smallButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60";

const initialLevelForm = {
  category: "academic",
  name: "",
  status: "active",
};

const initialStaffForm = {
  full_name: "",
  category: "academic",
  level: "",
  job_title: "",
  phone: "",
  employment_date: "",
  linked_teacher: "",
  status: "active",
  note: "",
};

const initialStructureForm = {
  category: "academic",
  level: "",
  session: DEFAULT_SESSION,
  period_type: "monthly",
  period: "January",
  earnings: [
    {
      name: "Basic Salary",
      amount: "",
    },
  ],
  deductions: [],
};

const initialAssignmentForm = {
  structure: "",
  staff_ids: [],
};

const initialPaymentForm = {
  assignment: "",
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

const getRecordId = (record) => record?._id || record || "";

const getCategoryLabel = (value) =>
  categories.find((category) => category.value === value)?.label || value;

const getPeriodOptions = (periodType) =>
  periodType === "termly" ? termlyPeriods : monthlyPeriods;

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

function PayrollManagement() {
  const [levels, setLevels] = useState([]);
  const [staff, setStaff] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [structures, setStructures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [levelForm, setLevelForm] = useState(initialLevelForm);
  const [staffForm, setStaffForm] = useState(initialStaffForm);
  const [structureForm, setStructureForm] = useState(initialStructureForm);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [editingLevelId, setEditingLevelId] = useState("");
  const [editingStaffId, setEditingStaffId] = useState("");
  const [editingStructureId, setEditingStructureId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [assignmentTotal, setAssignmentTotal] = useState(0);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [filters, setFilters] = useState({
    session: DEFAULT_SESSION,
    period_type: "monthly",
    period: "January",
    category: "",
  });

  const fetchPayrollData = useCallback(async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });
      const listFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value))
      );

      const [
        levelsResponse,
        staffResponse,
        structuresResponse,
        assignmentsResponse,
        paymentsResponse,
        teachersResponse,
      ] = await Promise.all([
        API.get("/payroll/levels"),
        API.get("/payroll/staff"),
        API.get("/payroll/structures"),
        API.get("/payroll/assignments", {
          params: {
            ...listFilters,
            limit: PAGE_SIZE,
            page: assignmentPage,
          },
        }),
        API.get("/payroll/payments", {
          params: {
            ...listFilters,
            limit: PAGE_SIZE,
            page: paymentPage,
          },
        }),
        API.get("/teachers"),
      ]);

      setLevels(levelsResponse.data || []);
      setStaff(staffResponse.data || []);
      setStructures(structuresResponse.data || []);
      setAssignments(assignmentsResponse.data || []);
      setPayments(paymentsResponse.data || []);
      setAssignmentTotal(
        Number(assignmentsResponse.headers?.["x-total-count"] || 0)
      );
      setPaymentTotal(
        Number(paymentsResponse.headers?.["x-total-count"] || 0)
      );
      setTeachers(teachersResponse.data || []);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load payroll records.",
      });
    } finally {
      setLoading(false);
    }
  }, [assignmentPage, filters, paymentPage]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const levelOptionsForStaff = useMemo(
    () =>
      levels.filter(
        (level) =>
          level.category === staffForm.category && level.status !== "inactive"
      ),
    [levels, staffForm.category]
  );

  const levelOptionsForStructure = useMemo(
    () =>
      levels.filter(
        (level) =>
          level.category === structureForm.category &&
          level.status !== "inactive"
      ),
    [levels, structureForm.category]
  );

  const sessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_SESSION,
        ...structures.map((structure) => structure.session).filter(Boolean),
        ...assignments.map((assignment) => assignment.session).filter(Boolean),
        ...payments.map((payment) => payment.session).filter(Boolean),
      ]),
    ].sort();
  }, [assignments, payments, structures]);

  const paidByAssignment = useMemo(() => {
    const paymentMap = new Map();

    payments.forEach((payment) => {
      const assignmentId = getRecordId(payment.assignment);

      paymentMap.set(
        assignmentId,
        (paymentMap.get(assignmentId) || 0) + Number(payment.amount || 0)
      );
    });

    return paymentMap;
  }, [payments]);

  const assignmentRows = useMemo(() => {
    return assignments
      .filter((assignment) => {
        const matchesSession =
          !filters.session || assignment.session === filters.session;
        const matchesPeriodType =
          !filters.period_type || assignment.period_type === filters.period_type;
        const matchesPeriod = !filters.period || assignment.period === filters.period;
        const matchesCategory =
          !filters.category || assignment.category === filters.category;

        return (
          matchesSession &&
          matchesPeriodType &&
          matchesPeriod &&
          matchesCategory
        );
      })
      .map((assignment) => {
        const paid = paidByAssignment.get(assignment._id) || 0;
        const balance = Math.max(Number(assignment.net_amount || 0) - paid, 0);

        return {
          ...assignment,
          paid,
          balance,
        };
      })
      .sort(
        (firstAssignment, secondAssignment) =>
          new Date(secondAssignment.createdAt || 0) -
          new Date(firstAssignment.createdAt || 0)
      );
  }, [
    assignments,
    filters.category,
    filters.period,
    filters.period_type,
    filters.session,
    paidByAssignment,
  ]);

  const paymentRows = useMemo(() => {
    return payments
      .filter((payment) => {
        const matchesSession =
          !filters.session || payment.session === filters.session;
        const matchesPeriodType =
          !filters.period_type || payment.period_type === filters.period_type;
        const matchesPeriod = !filters.period || payment.period === filters.period;
        const matchesCategory =
          !filters.category || payment.category === filters.category;

        return (
          matchesSession &&
          matchesPeriodType &&
          matchesPeriod &&
          matchesCategory
        );
      })
      .sort(
        (firstPayment, secondPayment) =>
          new Date(secondPayment.payment_date || 0) -
          new Date(firstPayment.payment_date || 0)
      );
  }, [filters.category, filters.period, filters.period_type, filters.session, payments]);

  const visibleAssignmentPage = assignmentPage;
  const visiblePaymentPage = paymentPage;
  const paginatedAssignments = assignmentRows;
  const paginatedPayments = paymentRows;

  const totals = useMemo(() => {
    const activeAssignments = assignmentRows.filter(
      (assignment) => assignment.status === "active"
    );

    return {
      activeStaff: staff.filter((staffRecord) => staffRecord.status === "active")
        .length,
      assignedStaff: activeAssignments.length,
      expected: activeAssignments.reduce(
        (sum, assignment) => sum + Number(assignment.net_amount || 0),
        0
      ),
      outstanding: activeAssignments.reduce(
        (sum, assignment) => sum + Number(assignment.balance || 0),
        0
      ),
    };
  }, [assignmentRows, staff]);

  const selectedAssignmentStructure = useMemo(
    () =>
      structures.find((structure) => structure._id === assignmentForm.structure),
    [assignmentForm.structure, structures]
  );

  const existingAssignedStaffIds = useMemo(() => {
    if (!selectedAssignmentStructure) {
      return new Set();
    }

    return new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.session === selectedAssignmentStructure.session &&
            assignment.period_type === selectedAssignmentStructure.period_type &&
            assignment.period === selectedAssignmentStructure.period
        )
        .map((assignment) => getRecordId(assignment.staff))
    );
  }, [assignments, selectedAssignmentStructure]);

  const availableAssignmentStaff = useMemo(() => {
    if (!selectedAssignmentStructure) {
      return [];
    }

    return staff
      .filter((staffRecord) => {
        const levelId = getRecordId(staffRecord.level);

        return (
          staffRecord.status === "active" &&
          staffRecord.category === selectedAssignmentStructure.category &&
          levelId === getRecordId(selectedAssignmentStructure.level) &&
          !existingAssignedStaffIds.has(staffRecord._id)
        );
      })
      .sort((firstStaff, secondStaff) =>
        (firstStaff.full_name || "").localeCompare(secondStaff.full_name || "")
      );
  }, [existingAssignedStaffIds, selectedAssignmentStructure, staff]);

  const payableAssignments = useMemo(
    () =>
      assignmentRows.filter(
        (assignment) => assignment.status === "active" && assignment.balance > 0
      ),
    [assignmentRows]
  );

  const selectedPaymentAssignment = useMemo(
    () =>
      payableAssignments.find(
        (assignment) => assignment._id === paymentForm.assignment
      ),
    [payableAssignments, paymentForm.assignment]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => {
      const nextFilters = {
        ...currentFilters,
        [name]: value,
      };

      if (name === "period_type") {
        nextFilters.period = getPeriodOptions(value)[0];
      }

      return nextFilters;
    });
    setAssignmentPage(1);
    setPaymentPage(1);
  };

  const handleLevelChange = (event) => {
    const { name, value } = event.target;

    setLevelForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleStaffChange = (event) => {
    const { name, value } = event.target;

    setStaffForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "category" ? { level: "", linked_teacher: "" } : {}),
    }));
  };

  const handleStructureChange = (event) => {
    const { name, value } = event.target;

    setStructureForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [name]: value,
      };

      if (name === "category") {
        nextForm.level = "";
      }

      if (name === "period_type") {
        nextForm.period = getPeriodOptions(value)[0];
      }

      return nextForm;
    });
  };

  const handleStructureItemChange = (collection, index, field, value) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      [collection]: currentForm[collection].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const handleAddStructureItem = (collection) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      [collection]: [
        ...currentForm[collection],
        {
          name: "",
          amount: "",
        },
      ],
    }));
  };

  const handleRemoveStructureItem = (collection, index) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      [collection]: currentForm[collection].filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const handleAssignmentStructureChange = (event) => {
    setAssignmentForm({
      structure: event.target.value,
      staff_ids: [],
    });
  };

  const handleStaffToggle = (staffId) => {
    setAssignmentForm((currentForm) => ({
      ...currentForm,
      staff_ids: currentForm.staff_ids.includes(staffId)
        ? currentForm.staff_ids.filter((currentId) => currentId !== staffId)
        : [...currentForm.staff_ids, staffId],
    }));
  };

  const handleSelectAllStaff = () => {
    setAssignmentForm((currentForm) => ({
      ...currentForm,
      staff_ids: availableAssignmentStaff.map((staffRecord) => staffRecord._id),
    }));
  };

  const handleClearStaffSelection = () => {
    setAssignmentForm((currentForm) => ({
      ...currentForm,
      staff_ids: [],
    }));
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;
    const nextForm = {
      ...paymentForm,
      [name]: value,
    };

    if (name === "assignment") {
      const assignment = payableAssignments.find(
        (assignmentRow) => assignmentRow._id === value
      );

      nextForm.amount = assignment?.balance ? assignment.balance.toString() : "";
    }

    setPaymentForm(nextForm);
  };

  const handleLevelSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("level");
    setStatus({ type: "", message: "" });

    try {
      const response = editingLevelId
        ? await API.put(`/payroll/levels/${editingLevelId}`, levelForm)
        : await API.post("/payroll/levels", levelForm);

      setLevels((currentLevels) =>
        editingLevelId
          ? currentLevels.map((level) =>
              level._id === response.data._id ? response.data : level
            )
          : [response.data, ...currentLevels]
      );
      setLevelForm(initialLevelForm);
      setEditingLevelId("");
      setStatus({
        type: "success",
        message: editingLevelId
          ? "Staff level updated successfully."
          : "Staff level created successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save staff level.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleStaffSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("staff");
    setStatus({ type: "", message: "" });

    try {
      const response = editingStaffId
        ? await API.put(`/payroll/staff/${editingStaffId}`, staffForm)
        : await API.post("/payroll/staff", staffForm);

      setStaff((currentStaff) =>
        editingStaffId
          ? currentStaff.map((staffRecord) =>
              staffRecord._id === response.data._id ? response.data : staffRecord
            )
          : [response.data, ...currentStaff]
      );
      setStaffForm(initialStaffForm);
      setEditingStaffId("");
      setStatus({
        type: "success",
        message: editingStaffId
          ? "Payroll staff updated successfully."
          : "Payroll staff added successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save payroll staff.",
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
      earnings: structureForm.earnings.map((item) => ({
        name: item.name,
        amount: Number(item.amount),
      })),
      deductions: structureForm.deductions.map((item) => ({
        name: item.name,
        amount: Number(item.amount),
      })),
    };

    try {
      const response = editingStructureId
        ? await API.put(`/payroll/structures/${editingStructureId}`, payload)
        : await API.post("/payroll/structures", payload);

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
          ? "Payroll structure updated successfully."
          : "Payroll structure created successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save payroll structure.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleAssignmentSubmit = async (event) => {
    event.preventDefault();
    setSubmitting("assignment");
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post("/payroll/assignments", assignmentForm);

      await fetchPayrollData();
      setAssignmentForm(initialAssignmentForm);
      setStatus({
        type: "success",
        message: response.data?.message || "Payroll assignment created successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to assign payroll structure.",
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
      const response = await API.post("/payroll/payments", {
        ...paymentForm,
        amount: Number(paymentForm.amount),
      });

      setPayments((currentPayments) => [response.data, ...currentPayments]);
      setPaymentForm(initialPaymentForm);
      setStatus({
        type: "success",
        message: "Payroll payment recorded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to record payroll payment.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleEditLevel = (level) => {
    setLevelForm({
      category: level.category,
      name: level.name,
      status: level.status || "active",
    });
    setEditingLevelId(level._id);
  };

  const handleEditStaff = (staffRecord) => {
    setStaffForm({
      full_name: staffRecord.full_name || "",
      category: staffRecord.category || "academic",
      level: getRecordId(staffRecord.level),
      job_title: staffRecord.job_title || "",
      phone: staffRecord.phone || "",
      employment_date: staffRecord.employment_date
        ? staffRecord.employment_date.slice(0, 10)
        : "",
      linked_teacher: getRecordId(staffRecord.linked_teacher),
      status: staffRecord.status || "active",
      note: staffRecord.note || "",
    });
    setEditingStaffId(staffRecord._id);
  };

  const handleEditStructure = (structure) => {
    setStructureForm({
      category: structure.category || "academic",
      level: getRecordId(structure.level),
      session: structure.session || DEFAULT_SESSION,
      period_type: structure.period_type || "monthly",
      period: structure.period || "January",
      earnings: structure.earnings?.length
        ? structure.earnings.map((item) => ({
            name: item.name,
            amount: item.amount,
          }))
        : initialStructureForm.earnings,
      deductions: (structure.deductions || []).map((item) => ({
        name: item.name,
        amount: item.amount,
      })),
    });
    setEditingStructureId(structure._id);
  };

  const handleAssignmentStatus = async (assignment, statusValue) => {
    setSubmitting(`assignment-${assignment._id}`);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.put(`/payroll/assignments/${assignment._id}`, {
        status: statusValue,
      });

      setAssignments((currentAssignments) =>
        currentAssignments.map((assignmentRecord) =>
          assignmentRecord._id === response.data._id
            ? response.data
            : assignmentRecord
        )
      );
      setStatus({
        type: "success",
        message: "Payroll assignment status updated successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update payroll assignment.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleDelete = async ({ endpoint, id, collection }) => {
    const confirmed = window.confirm("Delete this payroll record?");

    if (!confirmed) {
      return;
    }

    setSubmitting(`${endpoint}-${id}`);
    setStatus({ type: "", message: "" });

    try {
      await API.delete(`/payroll/${endpoint}/${id}`);

      const removeRecord = (records) =>
        records.filter((record) => record._id !== id);

      if (collection === "levels") {
        setLevels(removeRecord);
      }

      if (collection === "staff") {
        setStaff(removeRecord);
      }

      if (collection === "structures") {
        setStructures(removeRecord);
      }

      if (collection === "assignments") {
        setAssignments(removeRecord);
      }

      if (collection === "payments") {
        setPayments(removeRecord);
      }

      setStatus({
        type: "success",
        message: "Payroll record deleted successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete payroll record.",
      });
    } finally {
      setSubmitting("");
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />

      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-secondary p-6 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-button">
              Staff Payroll
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-primary md:text-4xl">
              Payroll Management
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <select
              className={inputClass}
              name="session"
              value={filters.session}
              onChange={handleFilterChange}
            >
              {sessionOptions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              name="period_type"
              value={filters.period_type}
              onChange={handleFilterChange}
            >
              <option value="monthly">Monthly</option>
              <option value="termly">Termly</option>
            </select>
            <select
              className={inputClass}
              name="period"
              value={filters.period}
              onChange={handleFilterChange}
            >
              {getPeriodOptions(filters.period_type).map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All staff</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Active Staff"
            value={totals.activeStaff}
            icon={<FaUsers />}
          />
          <AdminStatCard
            title="Assigned Staff"
            value={totals.assignedStaff}
            icon={<FaUserTie />}
            tone="muted"
          />
          <AdminStatCard
            title="Expected Payroll"
            value={formatCurrency(totals.expected)}
            icon={<FaMoneyBillWave />}
            tone="green"
          />
          <AdminStatCard
            title="Outstanding"
            value={formatCurrency(totals.outstanding)}
            icon={<FaReceipt />}
            tone="red"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleLevelSubmit}
            className="rounded-[2rem] bg-secondary p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-extrabold text-primary">
              Staff Levels
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <select
                className={inputClass}
                name="category"
                value={levelForm.category}
                onChange={handleLevelChange}
                required
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                name="name"
                value={levelForm.name}
                onChange={handleLevelChange}
                placeholder="Level name"
                required
              />
              <select
                className={inputClass}
                name="status"
                value={levelForm.status}
                onChange={handleLevelChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting === "level"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "level"
                ? "Saving level..."
                : editingLevelId
                ? "Update Level"
                : "Create Level"}
              <FaArrowRight />
            </button>
          </form>

          <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-primary">
              Level Records
            </h3>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-primary/10 text-primary">
                  <tr>
                    <th className="px-5 py-4">Level</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 text-primary/80">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="4">
                        Loading staff levels...
                      </td>
                    </tr>
                  ) : levels.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="4">
                        No staff level has been created yet.
                      </td>
                    </tr>
                  ) : (
                    levels.map((level) => (
                      <tr key={level._id}>
                        <td className="px-5 py-4 font-bold text-primary">
                          {level.name}
                        </td>
                        <td className="px-5 py-4">
                          {getCategoryLabel(level.category)}
                        </td>
                        <td className="px-5 py-4 capitalize">{level.status}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditLevel(level)}
                              className={`${smallButtonClass} bg-button text-secondary`}
                            >
                              <FaPenToSquare />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete({
                                  endpoint: "levels",
                                  id: level._id,
                                  collection: "levels",
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
        </div>

        <section className="mt-8 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Payroll Staff
          </h3>
          <form onSubmit={handleStaffSubmit} className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input
                className={inputClass}
                name="full_name"
                value={staffForm.full_name}
                onChange={handleStaffChange}
                placeholder="Staff full name"
                required
              />
              <select
                className={inputClass}
                name="category"
                value={staffForm.category}
                onChange={handleStaffChange}
                required
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                name="level"
                value={staffForm.level}
                onChange={handleStaffChange}
                required
              >
                <option value="">Select level</option>
                {levelOptionsForStaff.map((level) => (
                  <option key={level._id} value={level._id}>
                    {level.name}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                name="job_title"
                value={staffForm.job_title}
                onChange={handleStaffChange}
                placeholder="Job title"
              />
              <input
                className={inputClass}
                name="phone"
                value={staffForm.phone}
                onChange={handleStaffChange}
                placeholder="Phone"
              />
              <input
                className={inputClass}
                name="employment_date"
                value={staffForm.employment_date}
                onChange={handleStaffChange}
                type="date"
              />
              {staffForm.category === "academic" && (
                <select
                  className={inputClass}
                  name="linked_teacher"
                  value={staffForm.linked_teacher}
                  onChange={handleStaffChange}
                >
                  <option value="">Linked teacher account</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
              )}
              <select
                className={inputClass}
                name="status"
                value={staffForm.status}
                onChange={handleStaffChange}
              >
                {staffStatuses.map((staffStatus) => (
                  <option key={staffStatus} value={staffStatus}>
                    {staffStatus}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                name="note"
                value={staffForm.note}
                onChange={handleStaffChange}
                placeholder="Note"
              />
            </div>
            <button
              type="submit"
              disabled={submitting === "staff"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "staff"
                ? "Saving staff..."
                : editingStaffId
                ? "Update Staff"
                : "Add Staff"}
              <FaArrowRight />
            </button>
          </form>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4">Staff</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Level</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      Loading payroll staff...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No payroll staff has been added yet.
                    </td>
                  </tr>
                ) : (
                  staff.map((staffRecord) => (
                    <tr key={staffRecord._id}>
                      <td className="px-5 py-4 font-bold text-primary">
                        {staffRecord.full_name}
                        <span className="block text-xs font-semibold text-primary/50">
                          {staffRecord.job_title || "No job title"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {getCategoryLabel(staffRecord.category)}
                      </td>
                      <td className="px-5 py-4">
                        {staffRecord.level?.name || "Deleted level"}
                      </td>
                      <td className="px-5 py-4">
                        {staffRecord.phone || "Not set"}
                      </td>
                      <td className="px-5 py-4 capitalize">
                        {staffRecord.status}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditStaff(staffRecord)}
                            className={`${smallButtonClass} bg-button text-secondary`}
                          >
                            <FaPenToSquare />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete({
                                endpoint: "staff",
                                id: staffRecord._id,
                                collection: "staff",
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

        <section className="mt-8 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Payroll Structure
          </h3>
          <form onSubmit={handleStructureSubmit} className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <select
                className={inputClass}
                name="category"
                value={structureForm.category}
                onChange={handleStructureChange}
                required
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                name="level"
                value={structureForm.level}
                onChange={handleStructureChange}
                required
              >
                <option value="">Select level</option>
                {levelOptionsForStructure.map((level) => (
                  <option key={level._id} value={level._id}>
                    {level.name}
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
                name="period_type"
                value={structureForm.period_type}
                onChange={handleStructureChange}
                required
              >
                <option value="monthly">Monthly</option>
                <option value="termly">Termly</option>
              </select>
              <select
                className={inputClass}
                name="period"
                value={structureForm.period}
                onChange={handleStructureChange}
                required
              >
                {getPeriodOptions(structureForm.period_type).map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-extrabold text-primary">Earnings</h4>
                  <button
                    type="button"
                    onClick={() => handleAddStructureItem("earnings")}
                    className={`${smallButtonClass} bg-button text-secondary`}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {structureForm.earnings.map((item, index) => (
                    <div
                      key={`earning-${index}`}
                      className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]"
                    >
                      <input
                        className={inputClass}
                        value={item.name}
                        onChange={(event) =>
                          handleStructureItemChange(
                            "earnings",
                            index,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Item"
                        required
                      />
                      <input
                        className={inputClass}
                        value={item.amount}
                        onChange={(event) =>
                          handleStructureItemChange(
                            "earnings",
                            index,
                            "amount",
                            event.target.value
                          )
                        }
                        type="number"
                        min="0"
                        placeholder="Amount"
                        required
                      />
                      <button
                        type="button"
                        disabled={structureForm.earnings.length === 1}
                        onClick={() => handleRemoveStructureItem("earnings", index)}
                        className={`${smallButtonClass} bg-red-500/10 text-red-200`}
                      >
                        <FaTrashCan />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-extrabold text-primary">Deductions</h4>
                  <button
                    type="button"
                    onClick={() => handleAddStructureItem("deductions")}
                    className={`${smallButtonClass} bg-button text-secondary`}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {structureForm.deductions.length === 0 ? (
                    <p className="rounded-2xl bg-secondary/60 px-5 py-4 text-sm font-semibold text-primary/60">
                      No deductions added.
                    </p>
                  ) : (
                    structureForm.deductions.map((item, index) => (
                      <div
                        key={`deduction-${index}`}
                        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]"
                      >
                        <input
                          className={inputClass}
                          value={item.name}
                          onChange={(event) =>
                            handleStructureItemChange(
                              "deductions",
                              index,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Item"
                          required
                        />
                        <input
                          className={inputClass}
                          value={item.amount}
                          onChange={(event) =>
                            handleStructureItemChange(
                              "deductions",
                              index,
                              "amount",
                              event.target.value
                            )
                          }
                          type="number"
                          min="0"
                          placeholder="Amount"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveStructureItem("deductions", index)
                          }
                          className={`${smallButtonClass} bg-red-500/10 text-red-200`}
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting === "structure"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "structure"
                ? "Saving structure..."
                : editingStructureId
                ? "Update Structure"
                : "Create Structure"}
              <FaArrowRight />
            </button>
          </form>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4">Level</th>
                  <th className="px-5 py-4">Period</th>
                  <th className="px-5 py-4">Gross</th>
                  <th className="px-5 py-4">Deductions</th>
                  <th className="px-5 py-4">Net Pay</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {structures.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No payroll structure has been created yet.
                    </td>
                  </tr>
                ) : (
                  structures.map((structure) => (
                    <tr key={structure._id}>
                      <td className="px-5 py-4 font-bold text-primary">
                        {structure.level?.name || "Deleted level"}
                        <span className="block text-xs font-semibold text-primary/50">
                          {getCategoryLabel(structure.category)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {structure.session} - {structure.period}
                      </td>
                      <td className="px-5 py-4">
                        {formatCurrency(structure.gross_amount)}
                      </td>
                      <td className="px-5 py-4">
                        {formatCurrency(structure.deduction_amount)}
                      </td>
                      <td className="px-5 py-4 font-bold text-primary">
                        {formatCurrency(structure.net_amount)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
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
                                endpoint: "structures",
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

        <section className="mt-8 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Assign Payroll
          </h3>
          <form onSubmit={handleAssignmentSubmit} className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto]">
              <select
                className={inputClass}
                name="structure"
                value={assignmentForm.structure}
                onChange={handleAssignmentStructureChange}
                required
              >
                <option value="">Select payroll structure</option>
                {structures.map((structure) => (
                  <option key={structure._id} value={structure._id}>
                    {structure.level?.name || "Deleted level"} - {structure.session} -{" "}
                    {structure.period} - {formatCurrency(structure.net_amount)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSelectAllStaff}
                disabled={availableAssignmentStaff.length === 0}
                className={`${smallButtonClass} bg-primary/10 px-5 py-4 text-primary`}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearStaffSelection}
                disabled={assignmentForm.staff_ids.length === 0}
                className={`${smallButtonClass} bg-primary/10 px-5 py-4 text-primary`}
              >
                Clear
              </button>
            </div>

            <div className="mt-5 max-h-72 overflow-y-auto rounded-2xl border border-primary/10 bg-primary/5">
              {availableAssignmentStaff.length === 0 ? (
                <p className="px-5 py-5 text-primary/70">
                  No active unassigned staff matches the selected payroll structure.
                </p>
              ) : (
                availableAssignmentStaff.map((staffRecord) => (
                  <label
                    key={staffRecord._id}
                    className="flex cursor-pointer items-center gap-4 border-b border-primary/10 px-5 py-4 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={assignmentForm.staff_ids.includes(staffRecord._id)}
                      onChange={() => handleStaffToggle(staffRecord._id)}
                      className="h-5 w-5 accent-button"
                    />
                    <span>
                      <span className="block font-bold text-primary">
                        {staffRecord.full_name}
                      </span>
                      <span className="text-sm text-primary/60">
                        {staffRecord.job_title || staffRecord.level?.name}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <button
              type="submit"
              disabled={
                submitting === "assignment" ||
                assignmentForm.staff_ids.length === 0
              }
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "assignment"
                ? "Assigning payroll..."
                : `Assign ${assignmentForm.staff_ids.length} Staff`}
              <FaArrowRight />
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-[2rem] bg-secondary p-6 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Payroll Assignments
          </h3>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4">Staff</th>
                  <th className="px-5 py-4">Level</th>
                  <th className="px-5 py-4">Period</th>
                  <th className="px-5 py-4">Net Pay</th>
                  <th className="px-5 py-4">Paid</th>
                  <th className="px-5 py-4">Balance</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 text-primary/80">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="8">
                      Loading payroll assignments...
                    </td>
                  </tr>
                ) : paginatedAssignments.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="8">
                      No payroll assignment matches this filter.
                    </td>
                  </tr>
                ) : (
                  paginatedAssignments.map((assignment) => (
                    <tr key={assignment._id}>
                      <td className="px-5 py-4 font-bold text-primary">
                        {assignment.staff?.full_name || "Deleted staff"}
                        <span className="block text-xs font-semibold text-primary/50">
                          {assignment.staff?.job_title || "No job title"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {assignment.level_name ||
                          assignment.level?.name ||
                          "Deleted level"}
                      </td>
                      <td className="px-5 py-4">
                        {assignment.session} - {assignment.period}
                      </td>
                      <td className="px-5 py-4 font-bold text-primary">
                        {formatCurrency(assignment.net_amount)}
                      </td>
                      <td className="px-5 py-4">
                        {formatCurrency(assignment.paid)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            assignment.balance > 0
                              ? "bg-red-500/10 text-red-200"
                              : "bg-green-500/10 text-green-200"
                          }`}
                        >
                          {formatCurrency(assignment.balance)}
                        </span>
                      </td>
                      <td className="px-5 py-4 capitalize">{assignment.status}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={submitting === `assignment-${assignment._id}`}
                            onClick={() =>
                              handleAssignmentStatus(
                                assignment,
                                assignment.status === "active" ? "paused" : "active"
                              )
                            }
                            className={`${smallButtonClass} bg-primary/10 text-primary`}
                          >
                            {assignment.status === "active" ? (
                              <FaCirclePause />
                            ) : (
                              <FaCirclePlay />
                            )}
                            {assignment.status === "active" ? "Pause" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete({
                                endpoint: "assignments",
                                id: assignment._id,
                                collection: "assignments",
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
            page={visibleAssignmentPage}
            totalItems={assignmentTotal}
            onPageChange={setAssignmentPage}
          />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={handlePaymentSubmit}
            className="rounded-[2rem] bg-secondary p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-extrabold text-primary">
              Record Payroll Payment
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <select
                className={inputClass}
                name="assignment"
                value={paymentForm.assignment}
                onChange={handlePaymentChange}
                required
              >
                <option value="">Select staff payroll</option>
                {payableAssignments.map((assignment) => (
                  <option key={assignment._id} value={assignment._id}>
                    {assignment.staff?.full_name} - {assignment.period} -{" "}
                    {formatCurrency(assignment.balance)}
                  </option>
                ))}
              </select>
              {selectedPaymentAssignment && (
                <div className="rounded-2xl bg-primary/5 p-5 text-primary">
                  <p className="text-sm font-bold text-primary/60">Balance</p>
                  <p className="mt-2 text-2xl font-extrabold">
                    {formatCurrency(selectedPaymentAssignment.balance)}
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
              {submitting === "payment"
                ? "Recording payment..."
                : "Record Payment"}
              <FaArrowRight />
            </button>
          </form>

          <section className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-primary">
              Payroll Payments
            </h3>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-primary/10 text-primary">
                  <tr>
                    <th className="px-5 py-4">Staff</th>
                    <th className="px-5 py-4">Period</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Reference</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 text-primary/80">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td className="px-5 py-6 text-primary/70" colSpan="6">
                        No payroll payment matches this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-5 py-4 font-bold text-primary">
                          {payment.staff?.full_name || "Deleted staff"}
                          <span className="block text-xs font-semibold text-primary/50">
                            {payment.level_name ||
                              payment.level?.name ||
                              "Deleted level"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {payment.session} - {payment.period}
                        </td>
                        <td className="px-5 py-4 font-bold text-primary">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-5 py-4">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-5 py-4">
                          {payment.reference_no || "Not set"}
                        </td>
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

export default PayrollManagement;
