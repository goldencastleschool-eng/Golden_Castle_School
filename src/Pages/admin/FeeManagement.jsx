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

const newStudentFeeItems = [
  { name: "Admission Form", amount: "10000" },
  { name: "Registration Fee", amount: "59000" },
  { name: "School Uniforms", amount: "16000" },
  { name: "P.E Wear", amount: "6000" },
  { name: "Cardigan", amount: "5000" },
  { name: "Stockings & Tie", amount: "4000" },
  { name: "Books", amount: "35000" },
];

const returningStudentFeeItems = [
  { name: "School Fee", amount: "43000" },
];

const initialStructureForm = {
  session: DEFAULT_SESSION,
  class_record: "",
  term: "",
  new_items: newStudentFeeItems,
  returning_items: returningStudentFeeItems,
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

const escapeHtml = (value = "") =>
  value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getRecordId = (record) => record?._id || record || "";

const getStudentFeeEnrollment = (student, session, term = "") => {
  const enrollments = Array.isArray(student?.fee_enrollments)
    ? student.fee_enrollments
    : [];

  return enrollments.find(
    (enrollment) =>
      enrollment.session === session &&
      (!term || enrollment.term === term)
  );
};

const getStudentFeeCategory = (student, session, term) =>
  getStudentFeeEnrollment(student, session, term)?.fee_category || "returning";

const formatFeeCategory = (feeCategory = "") =>
  feeCategory === "new" ? "Newly Admitted" : "Returning/Old";

const getStructureTotal = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

const findFeeStructure = (
  feeStructures,
  classRecordId,
  session,
  term,
  feeCategory
) =>
  feeStructures.find(
    (feeStructure) =>
      getRecordId(feeStructure.class_record) === classRecordId &&
      feeStructure.session === session &&
      feeStructure.term === term &&
      (feeStructure.fee_category || "returning") === feeCategory
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
  const selectedFormStudent = useMemo(
    () => students.find((student) => student._id === feeForm.student),
    [feeForm.student, students]
  );
  const selectedFormEnrollment =
    selectedFormStudent && feeForm.session && feeForm.term
      ? getStudentFeeEnrollment(selectedFormStudent, feeForm.session, feeForm.term)
      : null;
  const selectedFormFeeCategory =
    selectedFormStudent && feeForm.session && feeForm.term
      ? selectedFormEnrollment?.fee_category || "returning"
      : "";

  const selectedFormStructure = findFeeStructure(
    feeStructures,
    feeForm.class_record,
    feeForm.session,
    feeForm.term,
    selectedFormFeeCategory
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
  const selectedStructureClass = classes.find(
    (classRecord) => classRecord._id === structureForm.class_record
  );
  const structureCategoryStatus = ["new", "returning"].map((feeCategory) => ({
    feeCategory,
    structure: findFeeStructure(
      feeStructures,
      structureForm.class_record,
      structureForm.session,
      structureForm.term,
      feeCategory
    ),
  }));

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

  const handleStructureItemChange = (categoryKey, index, field, value) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      [categoryKey]: currentForm[categoryKey].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const handleAddStructureItem = (categoryKey) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      [categoryKey]: [
        ...currentForm[categoryKey],
        {
          name: "",
          amount: "",
        },
      ],
    }));
  };

  const handleRemoveStructureItem = (categoryKey, index) => {
    setStructureForm((currentForm) => ({
      ...currentForm,
      [categoryKey]:
        currentForm[categoryKey].length > 1
          ? currentForm[categoryKey].filter((_, itemIndex) => itemIndex !== index)
          : currentForm[categoryKey],
    }));
  };

  const handleStructureSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const payload = {
      class_record: structureForm.class_record,
      session: structureForm.session,
      term: structureForm.term,
      new_items: structureForm.new_items.map((item) => ({
        name: item.name,
        amount: Number(item.amount),
      })),
      returning_items: structureForm.returning_items.map((item) => ({
        name: item.name,
        amount: Number(item.amount),
      })),
    };

    try {
      if (editingStructureId) {
        const editingCategory = structureForm.editing_fee_category;
        const items =
          editingCategory === "new"
            ? payload.new_items
            : payload.returning_items;

        await API.put(`/fee-structures/${editingStructureId}`, {
          class_record: payload.class_record,
          session: payload.session,
          term: payload.term,
          fee_category: editingCategory,
          items,
        });
      } else {
        await API.put("/fee-structures/bulk", payload);
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
    const editedItems =
      feeStructure.items?.length > 0
        ? feeStructure.items.map((item) => ({
            name: item.name || "",
            amount: item.amount?.toString() || "",
          }))
        : [
            {
              name: "School Fee",
              amount: feeStructure.amount?.toString() || "",
            },
          ];

    setStructureForm({
      session: feeStructure.session || DEFAULT_SESSION,
      class_record: getRecordId(feeStructure.class_record),
      term: feeStructure.term || "",
      editing_fee_category: feeStructure.fee_category || "returning",
      new_items:
        feeStructure.fee_category === "new"
          ? editedItems
          : newStudentFeeItems,
      returning_items:
        feeStructure.fee_category === "returning"
          ? editedItems
          : returningStudentFeeItems,
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

    if (!selectedFormFeeCategory || !selectedFormStructure) {
      setStatus({
        type: "error",
        message:
          "Create a matching payment structure for this class, session, term, and student category before recording payment.",
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
      class_record: getRecordId(fee.class_record) || matchingClass?._id || "",
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
      const feeClassRecordId = getRecordId(fee.class_record);
      const matchesSession = !filters.session || fee.session === filters.session;
      const matchesTerm = !filters.term || fee.term === filters.term;
      const matchesClass =
        !selectedClass ||
        feeClassRecordId === selectedClass._id ||
        normalizeClassName(fee.class || student.class) ===
          normalizeClassName(selectedClass.name);
      const searchableText = [
        student.full_name,
        student.admission_no,
        fee.class,
        student.class,
        fee.session,
        fee.term,
        formatFeeCategory(fee.fee_category),
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

  const selectedFilterClass = classes.find(
    (classRecord) => classRecord._id === filters.class_record
  );
  const selectedFilterStructures = feeStructures.filter(
    (feeStructure) =>
      getRecordId(feeStructure.class_record) === filters.class_record &&
      feeStructure.session === filters.session &&
      feeStructure.term === filters.term
  );

  const dashboardRows = useMemo(() => {
    return feeStructures
      .filter((feeStructure) => {
        const structureClassId = getRecordId(feeStructure.class_record);

        return (
            (!filters.session || feeStructure.session === filters.session) &&
            (!filters.term || feeStructure.term === filters.term) &&
            (!filters.class_record || structureClassId === filters.class_record) &&
          feeStructure.class_record
        );
      })
      .flatMap((feeStructure) => {
        const classRecord = feeStructure.class_record;
        const classStudents = students.filter((student) => {
          const studentClassRecordId =
            student.class_record?._id || student.class_record || "";

          return (
            isActiveStudent(student) &&
            student.current_session === classRecord.session &&
            (studentClassRecordId === classRecord._id ||
              normalizeClassName(student.class) ===
                normalizeClassName(classRecord.name))
          );
        }).filter(
          (student) =>
            getStudentFeeCategory(
              student,
              feeStructure.session,
              feeStructure.term
            ) === (feeStructure.fee_category || "returning")
        );

        return classStudents.map((student) => {
          const paid = fees
            .filter((fee) => {
              const feeStudentId = fee.student?._id || fee.student;

              return (
                feeStudentId === student._id &&
                fee.session === feeStructure.session &&
                fee.term === feeStructure.term
              );
            })
            .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
          const expected = Number(feeStructure.amount || 0);

          return {
            student,
            classRecord,
            session: feeStructure.session,
            term: feeStructure.term,
            expected,
            paid,
            balance: Math.max(expected - paid, 0),
          };
        });
      });
  }, [
    feeStructures,
    fees,
    filters.class_record,
    filters.session,
    filters.term,
    students,
  ]);

  const dashboardTotalExpected = dashboardRows.reduce(
    (sum, row) => sum + Number(row.expected || 0),
    0
  );
  const dashboardTotalPaid = dashboardRows.reduce(
    (sum, row) => sum + Number(row.paid || 0),
    0
  );
  const dashboardTotalBalance = dashboardRows.reduce(
    (sum, row) => sum + Number(row.balance || 0),
    0
  );
  const fullyPaidCount = dashboardRows.filter(
    (row) => row.expected > 0 && row.paid >= row.expected
  ).length;
  const partiallyPaidCount = dashboardRows.filter(
    (row) => row.paid > 0 && row.paid < row.expected
  ).length;
  const debtorCount = dashboardRows.filter((row) => row.balance > 0).length;

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
        const feeCategory = getStudentFeeCategory(
          student,
          filters.session,
          filters.term
        );
        const expectedStructure = findFeeStructure(
          feeStructures,
          filters.class_record,
          filters.session,
          filters.term,
          feeCategory
        );
        const expected = Number(expectedStructure?.amount || 0);

        return {
          student,
          feeCategory,
          expected,
          paid,
          balance: Math.max(expected - paid, 0),
        };
      });
  }, [
    fees,
    filters.class_record,
    filters.session,
    filters.term,
    feeStructures,
    selectedFilterClass,
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

  const handlePrintQueriedClassPayments = () => {
    if (!selectedFilterClass || !filters.session || !filters.term) {
      setStatus({
        type: "error",
        message: "Select a session, term, and class before printing payment records.",
      });
      return;
    }

    if (balanceRows.length === 0) {
      setStatus({
        type: "error",
        message: "No student payment records are available for this class query.",
      });
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      setStatus({
        type: "error",
        message: "Unable to open print window. Allow popups and try again.",
      });
      return;
    }

    const balanceTableRows = balanceRows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(row.student.full_name || "")}</td>
            <td>${escapeHtml(row.student.admission_no || "")}</td>
            <td>${escapeHtml(formatFeeCategory(row.feeCategory))}</td>
            <td>${escapeHtml(formatCurrency(row.expected))}</td>
            <td>${escapeHtml(formatCurrency(row.paid))}</td>
            <td>${escapeHtml(formatCurrency(row.balance))}</td>
          </tr>
        `
      )
      .join("");

    const paymentTableRows = filteredFees
      .filter((fee) => fee.session === filters.session && fee.term === filters.term)
      .map(
        (fee, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(fee.student?.full_name || "Deleted student")}</td>
            <td>${escapeHtml(fee.student?.admission_no || "Not available")}</td>
            <td>${escapeHtml(formatFeeCategory(fee.fee_category))}</td>
            <td>${escapeHtml(formatCurrency(fee.amount))}</td>
            <td>${escapeHtml(formatDate(fee.payment_date))}</td>
            <td>${escapeHtml(fee.payment_method || "Not set")}</td>
            <td>${escapeHtml(fee.receipt_no || "Not set")}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(selectedFilterClass.name.toUpperCase())} Payment Records</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            h2 { margin: 28px 0 10px; font-size: 18px; }
            p { margin: 0 0 12px; color: #555; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
            .summary div { border: 1px solid #ddd; padding: 12px; }
            .label { color: #555; font-size: 12px; text-transform: uppercase; }
            .value { display: block; margin-top: 6px; font-weight: 700; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 9px; text-align: left; font-size: 13px; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(selectedFilterClass.name.toUpperCase())} Payment Records</h1>
          <p>Session: ${escapeHtml(filters.session)} | Term: ${escapeHtml(filters.term)}</p>
          <div class="summary">
            <div><span class="label">Expected Total</span><span class="value">${escapeHtml(formatCurrency(totalExpected))}</span></div>
            <div><span class="label">Paid Total</span><span class="value">${escapeHtml(formatCurrency(totalTrackedPaid))}</span></div>
            <div><span class="label">Balance Total</span><span class="value">${escapeHtml(formatCurrency(totalBalance))}</span></div>
          </div>

          <h2>Student Balance Summary</h2>
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Fee Category</th>
                <th>Expected</th>
                <th>Paid</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>${balanceTableRows}</tbody>
          </table>

          <h2>Payment Entries</h2>
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Fee Category</th>
                <th>Amount</th>
                <th>Date Paid</th>
                <th>Method</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              ${
                paymentTableRows ||
                '<tr><td colspan="8">No payment entry found for this query.</td></tr>'
              }
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

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
            ? `${structureDeleteTarget.class_record?.name?.toUpperCase() || "Class"} - ${structureDeleteTarget.session} - ${structureDeleteTarget.term} - ${formatFeeCategory(structureDeleteTarget.fee_category)}`
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
              {selectedStructureClass && structureForm.term && (
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <p className="text-sm font-bold uppercase text-primary/60">
                    {selectedStructureClass.name.toUpperCase()} Category Structures
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {structureCategoryStatus.map(({ feeCategory, structure }) => (
                      <div
                        key={feeCategory}
                        className="rounded-xl bg-secondary px-4 py-3"
                      >
                        <p className="text-sm font-bold text-primary">
                          {formatFeeCategory(feeCategory)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary/60">
                          {structure
                            ? formatCurrency(structure.amount)
                            : "Not created"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {[
                {
                  key: "new_items",
                  title: "Newly Admitted Student Items",
                  total: getStructureTotal(structureForm.new_items),
                  items: structureForm.new_items,
                  hidden:
                    editingStructureId &&
                    structureForm.editing_fee_category !== "new",
                },
                {
                  key: "returning_items",
                  title: "Returning/Old Student Items",
                  total: getStructureTotal(structureForm.returning_items),
                  items: structureForm.returning_items,
                  hidden:
                    editingStructureId &&
                    structureForm.editing_fee_category !== "returning",
                },
              ]
                .filter((category) => !category.hidden)
                .map((category) => (
                  <div
                    key={category.key}
                    className="rounded-2xl border border-primary/10 bg-primary/5 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold uppercase text-primary/60">
                          {category.title}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary/60">
                          Total: {formatCurrency(category.total)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddStructureItem(category.key)}
                        className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                      >
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {category.items.map((item, index) => (
                        <div
                          key={`${category.key}-${item.name}-${index}`}
                          className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_150px_auto]"
                        >
                          <input
                            className={inputClass}
                            value={item.name}
                            onChange={(event) =>
                              handleStructureItemChange(
                                category.key,
                                index,
                                "name",
                                event.target.value
                              )
                            }
                            placeholder="Fee item"
                            required
                          />
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={item.amount}
                            onChange={(event) =>
                              handleStructureItemChange(
                                category.key,
                                index,
                                "amount",
                                event.target.value
                              )
                            }
                            placeholder="Amount"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveStructureItem(category.key, index)
                            }
                            disabled={category.items.length === 1}
                            className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {editingStructureId
                  ? "Save Structure"
                  : "Create Both Structures"}
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

        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-6">
            <h3 className="text-3xl font-extrabold text-primary">
              Payment Structure Records
            </h3>
            <p className="mt-2 text-primary/70">
              Review the expected fee totals already created for each class,
              session, term, and student category.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[840px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Term</th>
                  <th className="px-5 py-4 font-bold">Fee Category</th>
                  <th className="px-5 py-4 font-bold">Expected Fee</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {feeStructures.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
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
                      <td className="px-5 py-4">
                        {formatFeeCategory(feeStructure.fee_category)}
                      </td>
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

            <select
              className={inputClass}
              name="student"
              value={feeForm.student}
              onChange={handleChange}
              disabled={!feeForm.class_record || !feeForm.term}
              required
            >
              <option value="">
                {feeForm.class_record && feeForm.term
                  ? "Select student"
                  : "Select class and term first"}
              </option>
              {formStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.full_name} - {student.admission_no}
                  {feeForm.term
                    ? ` - ${formatFeeCategory(
                        getStudentFeeCategory(
                          student,
                          feeForm.session,
                          feeForm.term
                        )
                      )}`
                    : ""}
                </option>
              ))}
            </select>

            <input
              className={inputClass}
              value={
                selectedFormFeeCategory
                  ? formatFeeCategory(selectedFormFeeCategory)
                  : ""
              }
              placeholder="Student fee category"
              disabled
              readOnly
            />

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
                ? `Class: ${selectedFormClass.name.toUpperCase()}${
                    selectedFormFeeCategory
                      ? ` | ${formatFeeCategory(selectedFormFeeCategory)}`
                      : ""
                  }`
                : "Select a class to load the expected payment."}
            </p>
            {selectedFormStudent && feeForm.term && !selectedFormEnrollment && (
              <p className="mt-2 text-sm font-semibold text-primary/60">
                No category record was found for this student in this term, so
                the system is treating the student as Returning/Old.
              </p>
            )}
            {selectedFormStructure ? (
              <>
                {selectedFormStructure.items?.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-primary/10 bg-secondary p-4">
                    <p className="text-sm font-bold uppercase text-primary/60">
                      Fee Items
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {selectedFormStructure.items.map((item) => (
                        <div
                          key={`${item.name}-${item.amount}`}
                          className="flex items-center justify-between gap-4 rounded-xl bg-primary/5 px-4 py-3"
                        >
                          <span className="font-semibold text-primary/75">
                            {item.name}
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              </>
            ) : (
              <p className="mt-3 text-sm font-semibold text-primary/60">
                No matching payment structure found for this class, session,
                term, and student category yet.
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
          <div className="mb-6">
            <h3 className="text-3xl font-extrabold text-primary">
              Fee Dashboard
            </h3>
            <p className="mt-2 text-primary/70">
              Summary for the selected payment-record filters.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Total Expected School Fees
              </p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {loading ? "..." : formatCurrency(dashboardTotalExpected)}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Total Amount Paid
              </p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {loading ? "..." : formatCurrency(dashboardTotalPaid)}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Outstanding Balance
              </p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {loading ? "..." : formatCurrency(dashboardTotalBalance)}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Fully Paid Students
              </p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {loading ? "..." : fullyPaidCount}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Partially Paid Students
              </p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {loading ? "..." : partiallyPaidCount}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Debtors
              </p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {loading ? "..." : debtorCount}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-6 grid grid-cols-1 gap-5 xl:items-end">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Payment Records
              </h3>
              <p className="mt-2 text-primary/70">
                Filter payments by session, term, class, or student details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[1fr_220px_220px_auto_auto]">
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

            <button
              type="button"
              onClick={handlePrintQueriedClassPayments}
              disabled={!selectedFilterClass || !filters.term}
              className="flex cursor-pointer items-center justify-center rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Print
            </button>
            </div>
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
            ) : selectedFilterStructures.length === 0 ? (
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
                      <th className="px-5 py-4 font-bold">Fee Category</th>
                      <th className="px-5 py-4 font-bold">Expected</th>
                      <th className="px-5 py-4 font-bold">Paid</th>
                      <th className="px-5 py-4 font-bold">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {balanceRows.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-primary/70" colSpan="7">
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
                            {formatFeeCategory(row.feeCategory)}
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
                  <th className="px-5 py-4 font-bold">Fee Category</th>
                  <th className="px-5 py-4 font-bold">Expected</th>
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
                    <td className="px-5 py-6 text-primary/70" colSpan="13">
                      Loading fee payments...
                    </td>
                  </tr>
                ) : filteredFees.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="13">
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
                        {fee.class || fee.student?.class || "Not set"}
                      </td>
                      <td className="px-5 py-4">{fee.session}</td>
                      <td className="px-5 py-4">{fee.term}</td>
                      <td className="px-5 py-4">
                        {formatFeeCategory(fee.fee_category)}
                      </td>
                      <td className="px-5 py-4">
                        {formatCurrency(fee.expected_amount_at_payment)}
                      </td>
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
