import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaPenToSquare,
  FaReceipt,
  FaTrashCan,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const DEFAULT_SESSION = "2025/2026";

const initialFeeForm = {
  student: "",
  session: DEFAULT_SESSION,
  class_record: "",
  term: "",
  amount: "",
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: "",
  receipt_no: "",
  note: "",
};

const initialStructureForm = {
  session: DEFAULT_SESSION,
  class_record: "",
  term: "",
  amount: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (dateValue) =>
  dateValue ? new Date(dateValue).toLocaleDateString() : "Not set";

const toDateInputValue = (dateValue) =>
  dateValue ? new Date(dateValue).toISOString().slice(0, 10) : "";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const isActiveStudent = (student) =>
  !student.status || student.status === "active";

const getRecordId = (record) => record?._id || record || "";

const findFeeStructure = (feeStructures, classRecordId, session, term) =>
  feeStructures.find(
    (feeStructure) =>
      getRecordId(feeStructure.class_record) === classRecordId &&
      feeStructure.session === session &&
      feeStructure.term === term
  );

function FeeManagement() {
  const [fees, setFees] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeForm, setFeeForm] = useState(initialFeeForm);
  const [structureForm, setStructureForm] = useState(initialStructureForm);
  const [editingFeeId, setEditingFeeId] = useState("");
  const [editingStructureId, setEditingStructureId] = useState("");
  const [filters, setFilters] = useState({
    session: DEFAULT_SESSION,
    term: "",
    class_record: "",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [structureDeleteTarget, setStructureDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingStructure, setDeletingStructure] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const inputClass =
    "w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      const [feesResponse, feeStructuresResponse, studentsResponse, classesResponse] =
        await Promise.all([
          API.get("/fees"),
          API.get("/fee-structures"),
          API.get("/students"),
          API.get("/classes"),
        ]);

      setFees(feesResponse.data || []);
      setFeeStructures(feeStructuresResponse.data || []);
      setStudents(studentsResponse.data || []);
      setClasses(classesResponse.data || []);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load fee records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, []);

  const sessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_SESSION,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
        ...students.map((student) => student.current_session).filter(Boolean),
        ...fees.map((fee) => fee.session).filter(Boolean),
        ...feeStructures
          .map((feeStructure) => feeStructure.session)
          .filter(Boolean),
      ]),
    ].sort();
  }, [classes, feeStructures, fees, students]);

  const formClasses = useMemo(
    () => classes.filter((classRecord) => classRecord.session === feeForm.session),
    [classes, feeForm.session]
  );

  const filterClasses = useMemo(
    () => classes.filter((classRecord) => classRecord.session === filters.session),
    [classes, filters.session]
  );

  const structureClasses = useMemo(
    () =>
      classes.filter(
        (classRecord) => classRecord.session === structureForm.session
      ),
    [classes, structureForm.session]
  );

  const formStudents = useMemo(() => {
    const selectedClass = classes.find(
      (classRecord) => classRecord._id === feeForm.class_record
    );

    return students
      .filter((student) => {
        if (!isActiveStudent(student) || student.current_session !== feeForm.session) {
          return false;
        }

        if (!selectedClass) {
          return false;
        }

        const studentClassRecordId =
          student.class_record?._id || student.class_record || "";

        return (
          studentClassRecordId === selectedClass._id ||
          normalizeClassName(student.class) === normalizeClassName(selectedClass.name)
        );
      })
      .sort((firstStudent, secondStudent) =>
        (firstStudent.full_name || "").localeCompare(secondStudent.full_name || "")
      );
  }, [classes, feeForm.class_record, feeForm.session, students]);

  const selectedFormClass = useMemo(
    () =>
      classes.find((classRecord) => classRecord._id === feeForm.class_record),
    [classes, feeForm.class_record]
  );

  const selectedFormStructure = findFeeStructure(
    feeStructures,
    feeForm.class_record,
    feeForm.session,
    feeForm.term
  );

  const selectedStudentPaidForTerm = useMemo(() => {
    if (!feeForm.student || !feeForm.session || !feeForm.term) {
      return 0;
    }

    return fees
      .filter((fee) => {
        const feeStudentId = fee.student?._id || fee.student;

        return (
          feeStudentId === feeForm.student &&
          fee.session === feeForm.session &&
          fee.term === feeForm.term &&
          fee._id !== editingFeeId
        );
      })
      .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  }, [editingFeeId, feeForm.session, feeForm.student, feeForm.term, fees]);

  const selectedStudentProjectedPaid =
    selectedStudentPaidForTerm + Number(feeForm.amount || 0);

  const selectedStudentProjectedBalance = selectedFormStructure
    ? Math.max(
        Number(selectedFormStructure.amount || 0) - selectedStudentProjectedPaid,
        0
      )
    : 0;

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setFeeForm((currentForm) => ({
        ...currentForm,
        session: value,
        class_record: "",
        student: "",
      }));
      return;
    }

    if (name === "class_record") {
      setFeeForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        student: "",
      }));
      return;
    }

    setFeeForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleStructureChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setStructureForm((currentForm) => ({
        ...currentForm,
        session: value,
        class_record: "",
      }));
      return;
    }

    setStructureForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleStructureSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const payload = {
      ...structureForm,
      amount: Number(structureForm.amount),
    };

    try {
      if (editingStructureId) {
        await API.put(`/fee-structures/${editingStructureId}`, payload);
      } else {
        await API.post("/fee-structures", payload);
      }

      setStructureForm({
        ...initialStructureForm,
        session: structureForm.session || DEFAULT_SESSION,
      });
      setEditingStructureId("");
      setStatus({
        type: "success",
        message: editingStructureId
          ? "Payment structure updated successfully."
          : "Payment structure created successfully.",
      });
      await fetchFeeData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save payment structure.",
      });
    }
  };

  const handleEditStructure = (feeStructure) => {
    setEditingStructureId(feeStructure._id);
    setStructureForm({
      session: feeStructure.session || DEFAULT_SESSION,
      class_record: getRecordId(feeStructure.class_record),
      term: feeStructure.term || "",
      amount: feeStructure.amount || "",
    });
    setStatus({ type: "", message: "" });
  };

  const handleCancelStructureEdit = () => {
    setEditingStructureId("");
    setStructureForm(initialStructureForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
      setStatus({ type: "", message: "" });

    if (!feeForm.class_record) {
      setStatus({
        type: "error",
        message: "Select a class before choosing a student payment record.",
      });
      setSubmitting(false);
      return;
    }

    if (!selectedFormStructure) {
      setStatus({
        type: "error",
        message:
          "Create a matching payment structure for this class, session, and term before recording payment.",
      });
      setSubmitting(false);
      return;
    }

    const payload = {
      student: feeForm.student,
      session: feeForm.session,
      term: feeForm.term,
      amount: Number(feeForm.amount),
      payment_date: feeForm.payment_date,
      payment_method: feeForm.payment_method,
      receipt_no: feeForm.receipt_no,
      note: feeForm.note,
    };

    try {
      if (editingFeeId) {
        await API.put(`/fees/${editingFeeId}`, payload);
      } else {
        await API.post("/fees", payload);
      }

      setFeeForm({
        ...initialFeeForm,
        session: feeForm.session || DEFAULT_SESSION,
      });
      setEditingFeeId("");
      setStatus({
        type: "success",
        message: editingFeeId
          ? "Fee payment updated successfully."
          : "Fee payment recorded successfully.",
      });
      await fetchFeeData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save fee payment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (fee) => {
    const student = fee.student || {};
    const matchingClass = classes.find(
      (classRecord) =>
        classRecord.session === fee.session &&
        normalizeClassName(classRecord.name) === normalizeClassName(student.class)
    );

    setEditingFeeId(fee._id);
    setFeeForm({
      student: student._id || student,
      session: fee.session || DEFAULT_SESSION,
      class_record: matchingClass?._id || "",
      term: fee.term || "",
      amount: fee.amount || "",
      payment_date: toDateInputValue(fee.payment_date),
      payment_method: fee.payment_method || "",
      receipt_no: fee.receipt_no || "",
      note: fee.note || "",
    });
    setStatus({ type: "", message: "" });
  };

  const handleCancelEdit = () => {
    setEditingFeeId("");
    setFeeForm(initialFeeForm);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setFilters((currentFilters) => ({
        ...currentFilters,
        session: value,
        class_record: "",
      }));
      return;
    }

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    setDeleting(true);

    try {
      await API.delete(`/fees/${deleteTarget._id}`);
      setDeleteTarget(null);
      setStatus({
        type: "success",
        message: "Fee payment deleted successfully.",
      });
      await fetchFeeData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete fee payment.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleStructureDeleteConfirm = async () => {
    if (!structureDeleteTarget?._id) {
      return;
    }

    setDeletingStructure(true);

    try {
      await API.delete(`/fee-structures/${structureDeleteTarget._id}`);
      setStructureDeleteTarget(null);
      setStatus({
        type: "success",
        message: "Payment structure deleted successfully.",
      });
      await fetchFeeData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete payment structure.",
      });
    } finally {
      setDeletingStructure(false);
    }
  };

  const filteredFees = useMemo(() => {
    const selectedClass = classes.find(
      (classRecord) => classRecord._id === filters.class_record
    );
    const searchValue = filters.search.trim().toLowerCase();

    return fees.filter((fee) => {
      const student = fee.student || {};
      const matchesSession = !filters.session || fee.session === filters.session;
      const matchesTerm = !filters.term || fee.term === filters.term;
      const matchesClass =
        !selectedClass ||
        normalizeClassName(student.class) === normalizeClassName(selectedClass.name);
      const searchableText = [
        student.full_name,
        student.admission_no,
        student.class,
        fee.session,
        fee.term,
        fee.receipt_no,
        fee.payment_method,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesSession &&
        matchesTerm &&
        matchesClass &&
        (!searchValue || searchableText.includes(searchValue))
      );
    });
  }, [classes, fees, filters]);

  const totalPaid = filteredFees.reduce(
    (sum, fee) => sum + Number(fee.amount || 0),
    0
  );

  const selectedFilterClass = classes.find(
    (classRecord) => classRecord._id === filters.class_record
  );
  const selectedFilterStructure = findFeeStructure(
    feeStructures,
    filters.class_record,
    filters.session,
    filters.term
  );

  const balanceRows = useMemo(() => {
    if (!selectedFilterClass || !filters.session || !filters.term) {
      return [];
    }

    return students
      .filter((student) => {
        const studentClassRecordId =
          student.class_record?._id || student.class_record || "";

        return (
          isActiveStudent(student) &&
          student.current_session === filters.session &&
          (studentClassRecordId === selectedFilterClass._id ||
            normalizeClassName(student.class) ===
              normalizeClassName(selectedFilterClass.name))
        );
      })
      .sort((firstStudent, secondStudent) =>
        (firstStudent.full_name || "").localeCompare(secondStudent.full_name || "")
      )
      .map((student) => {
        const paid = fees
          .filter((fee) => {
            const feeStudentId = fee.student?._id || fee.student;

            return (
              feeStudentId === student._id &&
              fee.session === filters.session &&
              fee.term === filters.term
            );
          })
          .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
        const expected = Number(selectedFilterStructure?.amount || 0);

        return {
          student,
          expected,
          paid,
          balance: Math.max(expected - paid, 0),
        };
      });
  }, [
    fees,
    filters.session,
    filters.term,
    selectedFilterClass,
    selectedFilterStructure,
    students,
  ]);
  const totalExpected = balanceRows.reduce(
    (sum, row) => sum + Number(row.expected || 0),
    0
  );
  const totalTrackedPaid = balanceRows.reduce(
    (sum, row) => sum + Number(row.paid || 0),
    0
  );
  const totalBalance = balanceRows.reduce(
    (sum, row) => sum + Number(row.balance || 0),
    0
  );

  return (
    <div className="px-6 py-10 lg:px-12">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete Fee Payment"
        message="This action will remove this fee payment record from the student's account history."
        details={
          deleteTarget
            ? `${deleteTarget.student?.full_name || "Student"} - ${formatCurrency(
                deleteTarget.amount
              )}`
            : ""
        }
        confirmLabel="Delete Payment"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <AdminDeleteModal
        open={Boolean(structureDeleteTarget)}
        title="Delete Payment Structure"
        message="This action will remove the expected fee setup for this class, session, and term."
        details={
          structureDeleteTarget
            ? `${structureDeleteTarget.class_record?.name?.toUpperCase() || "Class"} - ${structureDeleteTarget.session} - ${structureDeleteTarget.term}`
            : ""
        }
        confirmLabel="Delete Structure"
        loading={deletingStructure}
        onCancel={() => setStructureDeleteTarget(null)}
        onConfirm={handleStructureDeleteConfirm}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaReceipt />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Fee Management
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Record student fee payments by session, term, and payment date.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Payment Structure
              </h3>
              <p className="mt-3 max-w-2xl text-primary/70">
                Set the expected fee for each existing class record by session
                and term. Balances are calculated from the selected class
                directly.
              </p>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-primary/10 text-primary">
                    <tr>
                      <th className="px-5 py-4 font-bold">Class</th>
                      <th className="px-5 py-4 font-bold">Session</th>
                      <th className="px-5 py-4 font-bold">Term</th>
                      <th className="px-5 py-4 font-bold">Expected Fee</th>
                      <th className="px-5 py-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {feeStructures.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-primary/70" colSpan="5">
                          No payment structure has been created yet.
                        </td>
                      </tr>
                    ) : (
                      feeStructures.map((feeStructure) => (
                        <tr key={feeStructure._id} className="text-primary/80">
                          <td className="px-5 py-4 font-bold text-primary">
                            {feeStructure.class_record?.name?.toUpperCase() ||
                              "Deleted class"}
                          </td>
                          <td className="px-5 py-4">{feeStructure.session}</td>
                          <td className="px-5 py-4">{feeStructure.term}</td>
                          <td className="px-5 py-4 font-bold text-primary">
                            {formatCurrency(feeStructure.amount)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditStructure(feeStructure)}
                                className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStructureDeleteTarget(feeStructure)
                                }
                                className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200"
                              >
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
            </div>

            <form onSubmit={handleStructureSubmit} className="space-y-4">
              <input
                className={inputClass}
                name="session"
                value={structureForm.session}
                onChange={handleStructureChange}
                placeholder="Session e.g. 2025/2026"
                required
              />
              <select
                className={inputClass}
                name="class_record"
                value={structureForm.class_record}
                onChange={handleStructureChange}
                disabled={!structureForm.session}
                required
              >
                <option value="">
                  {structureForm.session ? "Select class" : "Enter session first"}
                </option>
                {structureClasses.map((classRecord) => (
                  <option key={classRecord._id} value={classRecord._id}>
                    {classRecord.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                name="term"
                value={structureForm.term}
                onChange={handleStructureChange}
                required
              >
                <option value="">Select term</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
              <input
                className={inputClass}
                name="amount"
                type="number"
                min="0"
                value={structureForm.amount}
                onChange={handleStructureChange}
                placeholder="Expected fee amount"
                required
              />
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {editingStructureId ? "Save Structure" : "Create Structure"}
                <FaArrowRight />
              </button>
              {editingStructureId && (
                <button
                  type="button"
                  onClick={handleCancelStructureEdit}
                  className="w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-secondary p-8 shadow-2xl"
        >
          <h3 className="text-3xl font-extrabold text-primary">
            {editingFeeId ? "Edit Fee Payment" : "Record Fee Payment"}
          </h3>
          <p className="mt-3 text-primary/70">
            Select an existing student, then attach the payment to the correct
            session and term.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <select
              className={inputClass}
              name="session"
              value={feeForm.session}
              onChange={handleChange}
              required
            >
              <option value="">Select session</option>
              {sessionOptions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              name="class_record"
              value={feeForm.class_record}
              onChange={handleChange}
              disabled={!feeForm.session}
              required
            >
              <option value="">
                {feeForm.session ? "Select class" : "Select session first"}
              </option>
              {formClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              name="student"
              value={feeForm.student}
              onChange={handleChange}
              disabled={!feeForm.class_record}
              required
            >
              <option value="">
                {feeForm.class_record
                  ? "Select student"
                  : "Select class first"}
              </option>
              {formStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.full_name} - {student.admission_no}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              name="term"
              value={feeForm.term}
              onChange={handleChange}
              required
            >
              <option value="">Select term</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>

            <input
              className={inputClass}
              name="amount"
              type="number"
              min="0"
              value={feeForm.amount}
              onChange={handleChange}
              placeholder="Amount paid"
              required
            />

            <input
              className={inputClass}
              name="payment_date"
              type="date"
              value={feeForm.payment_date}
              onChange={handleChange}
              required
            />

            <select
              className={inputClass}
              name="payment_method"
              value={feeForm.payment_method}
              onChange={handleChange}
            >
              <option value="">Payment method</option>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="POS">POS</option>
              <option value="Bank Deposit">Bank Deposit</option>
            </select>

            <input
              className={inputClass}
              name="receipt_no"
              value={feeForm.receipt_no}
              onChange={handleChange}
              placeholder="Receipt number"
            />

            <textarea
              className={`${inputClass} lg:col-span-2`}
              name="note"
              value={feeForm.note}
              onChange={handleChange}
              placeholder="Optional note"
              rows="3"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
            <p className="text-sm font-bold uppercase text-primary/60">
              Expected Payment
            </p>
            <p className="mt-2 text-primary/75">
              {selectedFormClass
                ? `Class: ${selectedFormClass.name.toUpperCase()}`
                : "Select a class to load the expected payment."}
            </p>
            {selectedFormStructure ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold text-primary/60">
                    Expected
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-primary">
                    {formatCurrency(selectedFormStructure.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary/60">
                    Paid After This Record
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-primary">
                    {formatCurrency(selectedStudentProjectedPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary/60">
                    Balance
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-primary">
                    {formatCurrency(selectedStudentProjectedBalance)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold text-primary/60">
                No matching payment structure found for this class, session,
                and term yet.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? "Saving payment..."
              : editingFeeId
                ? "Save Payment"
                : "Record Payment"}
            {!submitting && <FaArrowRight />}
          </button>

          {editingFeeId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="mt-4 w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              Cancel Edit
            </button>
          )}
        </form>

        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Payments
              </p>
              <p className="mt-3 text-4xl font-extrabold text-primary">
                {loading ? "..." : filteredFees.length}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Total Paid
              </p>
              <p className="mt-3 text-4xl font-extrabold text-primary">
                {loading ? "..." : formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Session
              </p>
              <p className="mt-3 text-4xl font-extrabold text-primary">
                {filters.session || "All"}
              </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_220px_220px_1fr_auto] xl:items-end">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Payment Records
              </h3>
              <p className="mt-2 text-primary/70">
                Filter payments by session, term, class, or student details.
              </p>
            </div>

            <select
              className={inputClass}
              name="session"
              value={filters.session}
              onChange={handleFilterChange}
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
              onChange={handleFilterChange}
            >
              <option value="">All terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>

            <select
              className={inputClass}
              name="class_record"
              value={filters.class_record}
              onChange={handleFilterChange}
              disabled={!filters.session}
            >
              <option value="">All classes</option>
              {filterClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchFeeData}
              className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-semibold text-secondary shadow-lg transition-all duration-300 hover:scale-105"
            >
              Refresh
              <FaArrowRight />
            </button>
          </div>

          <input
            className="mb-6 w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search student, admission number, receipt, or payment method"
          />

          <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 p-5">
            <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div>
                <p className="text-sm font-bold uppercase text-primary/60">
                  Class
                </p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {selectedFilterClass?.name?.toUpperCase() || "Select class"}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase text-primary/60">
                  Expected Total
                </p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {formatCurrency(totalExpected)}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase text-primary/60">
                  Paid Total
                </p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {formatCurrency(totalTrackedPaid)}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold uppercase text-primary/60">
                  Balance Total
                </p>
                <p className="mt-2 text-2xl font-extrabold text-primary">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>

            {!selectedFilterClass || !filters.term ? (
              <p className="text-primary/70">
                Select a class and term to view student balances for the
                selected session.
              </p>
            ) : !selectedFilterStructure ? (
              <p className="text-primary/70">
                No payment structure found for{" "}
                {selectedFilterClass.name.toUpperCase()},{" "}
                {filters.session}, {filters.term}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-secondary">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-primary/10 text-primary">
                    <tr>
                      <th className="px-5 py-4 font-bold">S/N</th>
                      <th className="px-5 py-4 font-bold">Student</th>
                      <th className="px-5 py-4 font-bold">Admission No.</th>
                      <th className="px-5 py-4 font-bold">Expected</th>
                      <th className="px-5 py-4 font-bold">Paid</th>
                      <th className="px-5 py-4 font-bold">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {balanceRows.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-primary/70" colSpan="6">
                          No active student found in this class.
                        </td>
                      </tr>
                    ) : (
                      balanceRows.map((row, index) => (
                        <tr key={row.student._id} className="text-primary/80">
                          <td className="px-5 py-4 font-bold text-primary">
                            {index + 1}
                          </td>
                          <td className="px-5 py-4 font-semibold text-primary">
                            {row.student.full_name}
                          </td>
                          <td className="px-5 py-4">
                            {row.student.admission_no}
                          </td>
                          <td className="px-5 py-4">
                            {formatCurrency(row.expected)}
                          </td>
                          <td className="px-5 py-4 font-bold text-primary">
                            {formatCurrency(row.paid)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-4 py-2 text-sm font-bold ${
                                row.balance > 0
                                  ? "bg-red-500/10 text-red-700"
                                  : "bg-green-500/10 text-green-700"
                              }`}
                            >
                              {formatCurrency(row.balance)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">S/N</th>
                  <th className="px-5 py-4 font-bold">Student</th>
                  <th className="px-5 py-4 font-bold">Admission No.</th>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Term</th>
                  <th className="px-5 py-4 font-bold">Amount</th>
                  <th className="px-5 py-4 font-bold">Date Paid</th>
                  <th className="px-5 py-4 font-bold">Method</th>
                  <th className="px-5 py-4 font-bold">Receipt</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="11">
                      Loading fee payments...
                    </td>
                  </tr>
                ) : filteredFees.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="11">
                      No fee payment matches this filter.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee, index) => (
                    <tr
                      key={fee._id}
                      className="text-primary/80 transition duration-300 hover:bg-primary/5"
                    >
                      <td className="px-5 py-4 font-bold text-primary">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary">
                        {fee.student?.full_name || "Deleted student"}
                      </td>
                      <td className="px-5 py-4">
                        {fee.student?.admission_no || "Not available"}
                      </td>
                      <td className="px-5 py-4">
                        {fee.student?.class || "Not set"}
                      </td>
                      <td className="px-5 py-4">{fee.session}</td>
                      <td className="px-5 py-4">{fee.term}</td>
                      <td className="px-5 py-4 font-bold text-primary">
                        {formatCurrency(fee.amount)}
                      </td>
                      <td className="px-5 py-4">
                        {formatDate(fee.payment_date)}
                      </td>
                      <td className="px-5 py-4">
                        {fee.payment_method || "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        {fee.receipt_no || "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(fee)}
                            className="flex items-center gap-2 rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                          >
                            <FaPenToSquare />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(fee)}
                            className="flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200"
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
    </div>
  );
}

export default FeeManagement;
