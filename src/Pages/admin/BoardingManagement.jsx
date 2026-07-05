import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBed,
  FaMoneyBillWave,
  FaPenToSquare,
  FaTrashCan,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import {
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";
import { isSecondaryClass } from "../../utils/classSections.js";
import { sortStudentsByName } from "../../utils/students.js";

const DEFAULT_SESSION = "2025/2026";

const initialHouseForm = {
  name: "",
  gender: "",
  capacity: "",
  status: "active",
};

const initialStructureForm = {
  house: "",
  session: DEFAULT_SESSION,
  term: "",
  items: [{ name: "Boarding Fee", amount: "" }],
};

const initialEnrollmentForm = {
  session: DEFAULT_SESSION,
  term: "",
  class_record: "",
  house: "",
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

const getRecordId = (record) => record?._id || record || "";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

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

const studentBelongsToTermClass = (student, classRecord, session, term) => {
  const enrollment = getStudentEffectiveTermEnrollment(student, session, term);

  if (!enrollment || !classRecord) {
    return false;
  }

  return (
    getRecordId(enrollment.class_record) === getRecordId(classRecord) ||
    normalizeClassName(enrollment.class) === normalizeClassName(classRecord.name)
  );
};

const inputClass =
  "w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

const buttonClass =
  "inline-flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70";

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-lg bg-secondary p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-primary/60">{title}</p>
          <p className="mt-3 text-3xl font-extrabold text-primary">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BoardingManagement() {
  const [houses, setHouses] = useState([]);
  const [structures, setStructures] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [houseForm, setHouseForm] = useState(initialHouseForm);
  const [structureForm, setStructureForm] = useState(initialStructureForm);
  const [enrollmentForm, setEnrollmentForm] = useState(initialEnrollmentForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [editingHouseId, setEditingHouseId] = useState("");
  const [editingStructureId, setEditingStructureId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({
    session: DEFAULT_SESSION,
    term: "",
    house: "",
  });

  const fetchBoardingData = useCallback(async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value))
      );
      const [
        housesResponse,
        structuresResponse,
        enrollmentsResponse,
        paymentsResponse,
        studentsResponse,
        classesResponse,
      ] = await Promise.all([
        API.get("/boarding-management/houses"),
        API.get("/boarding-management/fee-structures", { params }),
        API.get("/boarding-management/enrollments", { params }),
        API.get("/boarding-management/payments", { params }),
        API.get("/students"),
        API.get("/classes"),
      ]);

      setHouses(housesResponse.data || []);
      setStructures(structuresResponse.data || []);
      setEnrollments(enrollmentsResponse.data || []);
      setPayments(paymentsResponse.data || []);
      setStudents(studentsResponse.data || []);
      setClasses(classesResponse.data || []);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to load boarding records.",
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBoardingData();
  }, [fetchBoardingData]);

  const classOptions = useMemo(
    () =>
      classes.filter(
        (classRecord) =>
          classRecord.session === enrollmentForm.session &&
          isSecondaryClass(classRecord)
      ),
    [classes, enrollmentForm.session]
  );

  const selectedClass = useMemo(
    () =>
      classes.find(
        (classRecord) => getRecordId(classRecord) === enrollmentForm.class_record
      ),
    [classes, enrollmentForm.class_record]
  );

  const selectableStudents = useMemo(() => {
    if (!selectedClass || !enrollmentForm.session || !enrollmentForm.term) {
      return [];
    }

    return sortStudentsByName(
      students.filter(
        (student) =>
          isActiveStudent(student) &&
          studentBelongsToTermClass(
            student,
            selectedClass,
            enrollmentForm.session,
            enrollmentForm.term
          )
      )
    );
  }, [enrollmentForm.session, enrollmentForm.term, selectedClass, students]);

  const existingBoardingStudentIds = useMemo(() => {
    if (!enrollmentForm.session || !enrollmentForm.term) {
      return new Set();
    }

    return new Set(
      enrollments
        .filter(
          (enrollment) =>
            enrollment.session === enrollmentForm.session &&
            enrollment.term === enrollmentForm.term
        )
        .map((enrollment) => getRecordId(enrollment.student))
        .filter(Boolean)
    );
  }, [enrollmentForm.session, enrollmentForm.term, enrollments]);

  const availableBoardingStudents = useMemo(
    () =>
      selectableStudents.filter(
        (student) => !existingBoardingStudentIds.has(getRecordId(student))
      ),
    [existingBoardingStudentIds, selectableStudents]
  );

  const selectedBoardingStudentCount = enrollmentForm.student_ids.length;

  const toggleBoardingStudent = (studentId) => {
    setEnrollmentForm((form) => {
      const selectedIds = new Set(form.student_ids);

      if (selectedIds.has(studentId)) {
        selectedIds.delete(studentId);
      } else {
        selectedIds.add(studentId);
      }

      return {
        ...form,
        student_ids: Array.from(selectedIds),
      };
    });
  };

  const selectAllAvailableBoardingStudents = () => {
    setEnrollmentForm((form) => ({
      ...form,
      student_ids: availableBoardingStudents.map((student) => student._id),
    }));
  };

  const clearSelectedBoardingStudents = () => {
    setEnrollmentForm((form) => ({
      ...form,
      student_ids: [],
    }));
  };

  const structureByHouse = useMemo(() => {
    const map = new Map();
    structures.forEach((structure) => {
      map.set(getRecordId(structure.house), Number(structure.amount || 0));
    });
    return map;
  }, [structures]);

  const paidByEnrollment = useMemo(() => {
    const map = new Map();
    payments.forEach((payment) => {
      const enrollmentId = getRecordId(payment.enrollment);
      map.set(enrollmentId, (map.get(enrollmentId) || 0) + Number(payment.amount || 0));
    });
    return map;
  }, [payments]);

  const summary = useMemo(() => {
    return enrollments.reduce(
      (total, enrollment) => {
        if (enrollment.status !== "active") {
          return total;
        }

        const expected = structureByHouse.get(getRecordId(enrollment.house)) || 0;
        const paid = paidByEnrollment.get(getRecordId(enrollment)) || 0;
        const balance = Math.max(expected - paid, 0);

        return {
          active: total.active + 1,
          expected: total.expected + expected,
          paid: total.paid + paid,
          balance: total.balance + balance,
        };
      },
      { active: 0, expected: 0, paid: 0, balance: 0 }
    );
  }, [enrollments, paidByEnrollment, structureByHouse]);

  const handleHouseSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting("house");
      const payload = {
        ...houseForm,
        capacity: Number(houseForm.capacity || 0),
      };

      if (editingHouseId) {
        await API.put(`/boarding-management/houses/${editingHouseId}`, payload);
      } else {
        await API.post("/boarding-management/houses", payload);
      }

      setHouseForm(initialHouseForm);
      setEditingHouseId("");
      setStatus({ type: "success", message: "Boarding house saved successfully." });
      fetchBoardingData();
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to save boarding house.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleStructureSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting("structure");
      const payload = {
        ...structureForm,
        items: structureForm.items.map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
        })),
      };

      if (editingStructureId) {
        await API.put(
          `/boarding-management/fee-structures/${editingStructureId}`,
          payload
        );
      } else {
        await API.post("/boarding-management/fee-structures", payload);
      }

      setStructureForm(initialStructureForm);
      setEditingStructureId("");
      setStatus({
        type: "success",
        message: "Boarding payment structure saved successfully.",
      });
      fetchBoardingData();
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to save boarding payment structure.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleEnrollmentSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting("enrollment");
      const response = await API.post("/boarding-management/enrollments", enrollmentForm);
      setEnrollmentForm(initialEnrollmentForm);
      setStatus({
        type: "success",
        message: response.data?.message || "Students registered for boarding.",
      });
      fetchBoardingData();
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to register boarding students.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting("payment");
      await API.post("/boarding-management/payments", {
        ...paymentForm,
        amount: Number(paymentForm.amount || 0),
      });
      setPaymentForm(initialPaymentForm);
      setStatus({ type: "success", message: "Boarding payment recorded." });
      fetchBoardingData();
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to record boarding payment.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleDeleteRequest = (endpoint, record, label) => {
    setDeleteTarget({
      endpoint,
      id: getRecordId(record),
      label,
      detail:
        record?.name ||
        record?.house?.name ||
        record?.student?.full_name ||
        record?.session ||
        "Selected boarding record",
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.endpoint || !deleteTarget?.id) {
      return;
    }

    try {
      setSubmitting(`delete-${deleteTarget.id}`);
      await API.delete(
        `/boarding-management/${deleteTarget.endpoint}/${deleteTarget.id}`
      );
      setStatus({
        type: "success",
        message: `${deleteTarget.label || "Boarding record"} deleted.`,
      });
      setDeleteTarget(null);
      fetchBoardingData();
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to delete boarding record.",
      });
    } finally {
      setSubmitting("");
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
      ...(name === "session"
        ? { term: normalizeTermForSession(currentFilters.term, value) }
        : {}),
    }));
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.label || "Boarding Record"}`}
        message="This action will permanently remove this boarding management record if it has no linked protected records."
        details={deleteTarget?.detail || ""}
        confirmLabel={`Delete ${deleteTarget?.label || "Record"}`}
        loading={submitting === `delete-${deleteTarget?.id}`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaBed />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">
          Boarding Management
        </h2>
        <p className="mt-3 max-w-3xl text-secondary/75">
          Manage boarding houses, student boarding registration, payment
          structures, and boarding payment records.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Houses" value={loading ? "..." : houses.length} icon={<FaBed />} />
        <StatCard title="Boarding Students" value={loading ? "..." : summary.active} icon={<FaUsers />} />
        <StatCard title="Amount Paid" value={loading ? "..." : formatCurrency(summary.paid)} icon={<FaMoneyBillWave />} />
        <StatCard title="Outstanding" value={loading ? "..." : formatCurrency(summary.balance)} icon={<FaMoneyBillWave />} />
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <select name="session" value={filters.session} onChange={handleFilterChange} className={inputClass}>
            {[DEFAULT_SESSION, ...new Set(classes.map((item) => item.session).filter(Boolean))].map((session) => (
              <option key={session} value={session}>{session}</option>
            ))}
          </select>
          <select name="term" value={filters.term} onChange={handleFilterChange} className={inputClass}>
            <option value="">All terms</option>
            {getVisibleTermsForSession(filters.session).map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          <select name="house" value={filters.house} onChange={handleFilterChange} className={inputClass}>
            <option value="">All houses</option>
            {houses.map((house) => (
              <option key={house._id} value={house._id}>{house.name}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
        <form onSubmit={handleHouseSubmit} className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary">Boarding House</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className={inputClass} placeholder="House name" value={houseForm.name} onChange={(event) => setHouseForm((form) => ({ ...form, name: event.target.value }))} />
            <select className={inputClass} value={houseForm.gender} onChange={(event) => setHouseForm((form) => ({ ...form, gender: event.target.value }))}>
              <option value="">Gender type</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Mixed">Mixed</option>
            </select>
            <input className={inputClass} type="number" min="0" placeholder="Capacity" value={houseForm.capacity} onChange={(event) => setHouseForm((form) => ({ ...form, capacity: event.target.value }))} />
            <select className={inputClass} value={houseForm.status} onChange={(event) => setHouseForm((form) => ({ ...form, status: event.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button className={`${buttonClass} mt-5`} disabled={submitting === "house"}>
            <FaArrowRight />
            {editingHouseId ? "Update House" : "Save House"}
          </button>
        </form>

        <form onSubmit={handleStructureSubmit} className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary">Boarding Payment Structure</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <select className={inputClass} value={structureForm.house} onChange={(event) => setStructureForm((form) => ({ ...form, house: event.target.value }))}>
              <option value="">Select house</option>
              {houses.map((house) => <option key={house._id} value={house._id}>{house.name}</option>)}
            </select>
            <input className={inputClass} value={structureForm.session} onChange={(event) => setStructureForm((form) => ({ ...form, session: event.target.value, term: normalizeTermForSession(form.term, event.target.value) }))} />
            <select className={inputClass} value={structureForm.term} onChange={(event) => setStructureForm((form) => ({ ...form, term: event.target.value }))}>
              <option value="">Select term</option>
              {getVisibleTermsForSession(structureForm.session).map((term) => <option key={term} value={term}>{term}</option>)}
            </select>
            <input className={inputClass} type="number" min="0" placeholder="Amount" value={structureForm.items[0]?.amount || ""} onChange={(event) => setStructureForm((form) => ({ ...form, items: [{ name: "Boarding Fee", amount: event.target.value }] }))} />
          </div>
          <button className={`${buttonClass} mt-5`} disabled={submitting === "structure"}>
            <FaArrowRight />
            {editingStructureId ? "Update Structure" : "Save Structure"}
          </button>
        </form>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
        <form onSubmit={handleEnrollmentSubmit} className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary">Register Boarding Students</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className={inputClass} value={enrollmentForm.session} onChange={(event) => setEnrollmentForm((form) => ({ ...form, session: event.target.value, term: normalizeTermForSession(form.term, event.target.value), class_record: "", student_ids: [] }))} />
            <select className={inputClass} value={enrollmentForm.term} onChange={(event) => setEnrollmentForm((form) => ({ ...form, term: event.target.value, student_ids: [] }))}>
              <option value="">Select term</option>
              {getVisibleTermsForSession(enrollmentForm.session).map((term) => <option key={term} value={term}>{term}</option>)}
            </select>
            <select className={inputClass} value={enrollmentForm.class_record} onChange={(event) => setEnrollmentForm((form) => ({ ...form, class_record: event.target.value, student_ids: [] }))}>
              <option value="">Select class</option>
              {classOptions.map((classRecord) => <option key={classRecord._id} value={classRecord._id}>{classRecord.name.toUpperCase()}</option>)}
            </select>
            <select className={inputClass} value={enrollmentForm.house} onChange={(event) => setEnrollmentForm((form) => ({ ...form, house: event.target.value }))}>
              <option value="">Select house</option>
              {houses.filter((house) => house.status === "active").map((house) => <option key={house._id} value={house._id}>{house.name}</option>)}
            </select>
            <div className="md:col-span-2">
              <div className="mb-3 flex flex-col justify-between gap-3 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 md:flex-row md:items-center">
                <p className="font-bold text-primary">
                  {selectedBoardingStudentCount} student
                  {selectedBoardingStudentCount === 1 ? "" : "s"} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllAvailableBoardingStudents}
                    disabled={availableBoardingStudents.length === 0}
                    className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Select Available
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedBoardingStudents}
                    disabled={selectedBoardingStudentCount === 0}
                    className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-primary/10">
                {!enrollmentForm.class_record || !enrollmentForm.term ? (
                  <div className="px-5 py-6 text-primary/70">
                    Select a class and term to choose boarding students.
                  </div>
                ) : selectableStudents.length === 0 ? (
                  <div className="px-5 py-6 text-primary/70">
                    No active student is available for this class and term.
                  </div>
                ) : (
                  selectableStudents.map((student) => {
                    const studentId = getRecordId(student);
                    const alreadyRegistered =
                      existingBoardingStudentIds.has(studentId);
                    const selected =
                      enrollmentForm.student_ids.includes(studentId);

                    return (
                      <label
                        key={studentId}
                        className={`flex cursor-pointer items-center gap-4 border-b border-primary/10 px-5 py-4 last:border-b-0 ${
                          alreadyRegistered ? "bg-primary/5 opacity-60" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={alreadyRegistered}
                          onChange={() => toggleBoardingStudent(studentId)}
                          className="h-5 w-5 accent-button"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-primary">
                            {student.full_name}
                          </span>
                          <span className="block text-sm text-primary/60">
                            {student.admission_no}
                            {alreadyRegistered
                              ? " | Already registered for boarding"
                              : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <button
            className={`${buttonClass} mt-5`}
            disabled={
              submitting === "enrollment" ||
              selectedBoardingStudentCount === 0
            }
          >
            <FaUsers />
            Register Students
          </button>
        </form>

        <form onSubmit={handlePaymentSubmit} className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary">Record Boarding Payment</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <select className={`${inputClass} md:col-span-2`} value={paymentForm.enrollment} onChange={(event) => setPaymentForm((form) => ({ ...form, enrollment: event.target.value }))}>
              <option value="">Select boarding student</option>
              {enrollments.filter((enrollment) => enrollment.status === "active").map((enrollment) => (
                <option key={enrollment._id} value={enrollment._id}>
                  {enrollment.student?.full_name} - {enrollment.house?.name} - {enrollment.session} {enrollment.term}
                </option>
              ))}
            </select>
            <input className={inputClass} type="number" min="0" placeholder="Amount" value={paymentForm.amount} onChange={(event) => setPaymentForm((form) => ({ ...form, amount: event.target.value }))} />
            <input className={inputClass} type="date" value={paymentForm.payment_date} onChange={(event) => setPaymentForm((form) => ({ ...form, payment_date: event.target.value }))} />
            <input className={inputClass} placeholder="Payment method" value={paymentForm.payment_method} onChange={(event) => setPaymentForm((form) => ({ ...form, payment_method: event.target.value }))} />
            <input className={inputClass} placeholder="Note" value={paymentForm.note} onChange={(event) => setPaymentForm((form) => ({ ...form, note: event.target.value }))} />
          </div>
          <button className={`${buttonClass} mt-5`} disabled={submitting === "payment"}>
            <FaMoneyBillWave />
            Record Payment
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <h3 className="text-2xl font-extrabold text-primary">Boarding Houses</h3>
        <div className="mt-5 overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">House</th>
                <th className="px-5 py-4 font-bold">Gender</th>
                <th className="px-5 py-4 font-bold">Capacity</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? <TableSkeleton columns={5} /> : houses.map((house) => (
                <tr key={house._id} className="text-primary/80">
                  <td className="px-5 py-4 font-bold text-primary">{house.name}</td>
                  <td className="px-5 py-4">{house.gender || "Not set"}</td>
                  <td className="px-5 py-4">{house.capacity || 0}</td>
                  <td className="px-5 py-4">{house.status}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditingHouseId(house._id); setHouseForm({ name: house.name || "", gender: house.gender || "", capacity: house.capacity?.toString() || "", status: house.status || "active" }); }} className="rounded-xl bg-primary/10 p-3 text-primary"><FaPenToSquare /></button>
                      <button type="button" onClick={() => handleDeleteRequest("houses", house, "Boarding House")} className="rounded-xl bg-red-500/10 p-3 text-red-700"><FaTrashCan /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <h3 className="text-2xl font-extrabold text-primary">
          Boarding Payment Structures
        </h3>
        <div className="mt-5 overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">House</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Amount</th>
                <th className="px-5 py-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? <TableSkeleton columns={5} /> : structures.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="5">
                    No boarding payment structure matches this filter.
                  </td>
                </tr>
              ) : structures.map((structure) => (
                <tr key={structure._id} className="text-primary/80">
                  <td className="px-5 py-4 font-bold text-primary">
                    {structure.house?.name || "House not set"}
                  </td>
                  <td className="px-5 py-4">{structure.session}</td>
                  <td className="px-5 py-4">{structure.term}</td>
                  <td className="px-5 py-4">{formatCurrency(structure.amount)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStructureId(structure._id);
                          setStructureForm({
                            house: getRecordId(structure.house),
                            session: structure.session || DEFAULT_SESSION,
                            term: structure.term || "",
                            items: structure.items?.length
                              ? structure.items.map((item) => ({
                                  name: item.name || "Boarding Fee",
                                  amount: item.amount?.toString() || "",
                                }))
                              : [{ name: "Boarding Fee", amount: "" }],
                          });
                        }}
                        className="rounded-xl bg-primary/10 p-3 text-primary"
                      >
                        <FaPenToSquare />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest("fee-structures", structure, "Payment Structure")}
                        className="rounded-xl bg-red-500/10 p-3 text-red-700"
                      >
                        <FaTrashCan />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <h3 className="text-2xl font-extrabold text-primary">Boarding Registrations</h3>
        <div className="mt-5 overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">House</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? <TableSkeleton columns={6} /> : enrollments.length === 0 ? (
                <tr><td className="px-5 py-6 text-primary/70" colSpan="6">No boarding registration matches this filter.</td></tr>
              ) : enrollments.map((enrollment) => (
                <tr key={enrollment._id} className="text-primary/80">
                  <td className="px-5 py-4 font-bold text-primary">{enrollment.student?.full_name}</td>
                  <td className="px-5 py-4">{enrollment.class}</td>
                  <td className="px-5 py-4">{enrollment.house?.name}</td>
                  <td className="px-5 py-4">{enrollment.session}</td>
                  <td className="px-5 py-4">{enrollment.term}</td>
                  <td className="px-5 py-4">{enrollment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <h3 className="text-2xl font-extrabold text-primary">Boarding Payment Records</h3>
        <div className="mt-5 overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">House</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Amount</th>
                <th className="px-5 py-4 font-bold">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loading ? <TableSkeleton columns={6} /> : payments.length === 0 ? (
                <tr><td className="px-5 py-6 text-primary/70" colSpan="6">No boarding payment matches this filter.</td></tr>
              ) : payments.map((payment) => (
                <tr key={payment._id} className="text-primary/80">
                  <td className="px-5 py-4 font-bold text-primary">{payment.student?.full_name}</td>
                  <td className="px-5 py-4">{payment.house?.name}</td>
                  <td className="px-5 py-4">{payment.session}</td>
                  <td className="px-5 py-4">{payment.term}</td>
                  <td className="px-5 py-4">{formatCurrency(payment.amount)}</td>
                  <td className="px-5 py-4">{payment.receipt_no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default BoardingManagement;

