import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCircleCheck,
  FaMoneyBillWave,
  FaPenToSquare,
  FaPrint,
  FaReceipt,
  FaTrashCan,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import PaginationControls from "../../components/common/PaginationControls.jsx";
import schoolLogo from "../../assets/1723987411228.jpg";
import { getFeeReceiptNumber } from "../../utils/paymentReceipt.js";
import {
  getPrintBrandHeader,
  getPrintBrandStyles,
} from "../../utils/printBranding.js";
import { sortStudentsByName } from "../../utils/students.js";
import {
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";
import {
  feeCategories,
  formatFeeCategory,
  getDefaultFeeItems,
  getFeeItemsKey,
  isFeeExemptCategory,
} from "../../utils/feeCategories.js";

const DEFAULT_SESSION = "2025/2026";
const PAGE_SIZE = 15;

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

const initialBatchForm = {
  session: DEFAULT_SESSION,
  class_record: "",
  term: "",
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: "",
  note: "",
};

const initialStructureForm = {
  session: DEFAULT_SESSION,
  class_record: "",
  term: "",
  fee_category: "returning",
  ...Object.fromEntries(
    feeCategories.map((category) => [
      getFeeItemsKey(category.value),
      getDefaultFeeItems(category.value),
    ])
  ),
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

const getFeeStudentId = (fee = {}) => getRecordId(fee.student);

const TERM_ORDER = ["First Term", "Second Term", "Third Term"];

const getTermIndex = (term = "") => {
  const termIndex = TERM_ORDER.indexOf(term);

  return termIndex === -1 ? TERM_ORDER.length : termIndex;
};

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

const getStudentEffectiveFeeEnrollment = (student, session, term = "") => {
  const enrollments = Array.isArray(student?.fee_enrollments)
    ? student.fee_enrollments
    : [];

  if (!term) {
    return getStudentFeeEnrollment(student, session);
  }

  const targetTermIndex = getTermIndex(term);

  const effectiveEnrollment = enrollments
    .filter(
      (enrollment) =>
        enrollment.session === session &&
        getTermIndex(enrollment.term) <= targetTermIndex
    )
    .sort(
      (firstEnrollment, secondEnrollment) =>
        getTermIndex(secondEnrollment.term) - getTermIndex(firstEnrollment.term)
    )[0];

  if (
    effectiveEnrollment &&
    effectiveEnrollment.term !== term &&
    effectiveEnrollment.fee_category === "new"
  ) {
    return {
      ...effectiveEnrollment,
      fee_category: "returning",
    };
  }

  return effectiveEnrollment;
};

const studentBelongsToTermClass = (student, classRecord, session, term) => {
  const enrollment = getStudentEffectiveFeeEnrollment(student, session, term);

  if (!enrollment || !classRecord) {
    return false;
  }

  const enrollmentClassRecordId = getRecordId(enrollment.class_record);
  const classRecordId = getRecordId(classRecord);

  return (
    enrollmentClassRecordId === classRecordId ||
    normalizeClassName(enrollment.class) === normalizeClassName(classRecord.name)
  );
};

const getStudentFeeCategory = (student, session, term) =>
  getStudentEffectiveFeeEnrollment(student, session, term)?.fee_category ||
  "returning";

const getStructureCategoriesForFeeCategory = (feeCategory = "returning") =>
  feeCategory === "discounted"
    ? ["returning", "discounted"]
    : [feeCategory || "returning"];

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

const findFeeStructureForStudentFee = (
  feeStructures,
  classRecordId,
  session,
  term,
  feeCategory
) => {
  const structureCategories = getStructureCategoriesForFeeCategory(feeCategory);

  return structureCategories
    .map((structureCategory) =>
      findFeeStructure(
        feeStructures,
        classRecordId,
        session,
        term,
        structureCategory
      )
    )
    .find(Boolean);
};

const getExpectedFeeSnapshot = ({ feeStructure, enrollment }) => {
  const feeCategory = enrollment?.fee_category || "returning";
  const baseAmount = Number(feeStructure?.amount || 0);
  const rawDiscountAmount = Number(enrollment?.discount_amount || 0);
  const discountAmount =
    feeCategory === "discounted" && Number.isFinite(rawDiscountAmount)
      ? Math.min(Math.max(rawDiscountAmount, 0), baseAmount)
      : 0;
  const expectedAmount = isFeeExemptCategory(feeCategory)
    ? 0
    : Math.max(baseAmount - discountAmount, 0);

  return {
    baseAmount,
    discountAmount,
    discountReason: enrollment?.discount_reason || "",
    expectedAmount,
    isExempt: isFeeExemptCategory(feeCategory),
  };
};

const getFeeStructurePaymentCount = (feeStructure, fees = []) => {
  const structureClassId = getRecordId(feeStructure.class_record);
  const structureClassName = normalizeClassName(feeStructure.class_record?.name);
  const structureFeeCategory = feeStructure.fee_category || "returning";

  return fees.filter((fee) => {
    const feeClassId = getRecordId(fee.class_record);
    const matchesClass =
      feeClassId === structureClassId ||
      (!feeClassId &&
        structureClassName &&
        normalizeClassName(fee.class || fee.student?.class) === structureClassName);

    return (
      matchesClass &&
      fee.session === feeStructure.session &&
      fee.term === feeStructure.term &&
      (fee.fee_category || "returning") === structureFeeCategory
    );
  }).length;
};

const getStudentPaidForFeeWindow = ({
  fees = [],
  studentId,
  session,
  term,
  feeCategory,
}) =>
  fees
    .filter((fee) => {
      const feeStudentId = getFeeStudentId(fee);

      return (
        feeStudentId === studentId &&
        fee.session === session &&
        fee.term === term &&
        (fee.fee_category || "returning") === feeCategory
      );
    })
    .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);

function FeeManagement() {
  const [fees, setFees] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeForm, setFeeForm] = useState(initialFeeForm);
  const [batchForm, setBatchForm] = useState(initialBatchForm);
  const [batchAmounts, setBatchAmounts] = useState({});
  const [batchSelectedStudents, setBatchSelectedStudents] = useState({});
  const [structureForm, setStructureForm] = useState(initialStructureForm);
  const [editingFeeId, setEditingFeeId] = useState("");
  const [editingStructureId, setEditingStructureId] = useState("");
  const [filters, setFilters] = useState({
    session: DEFAULT_SESSION,
    term: "",
    class_record: "",
    payment_status: "",
    search: "",
  });
  const [structureCategoryFilter, setStructureCategoryFilter] = useState("");
  const [structurePage, setStructurePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [structureDeleteTarget, setStructureDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingStructure, setDeletingStructure] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const inputClass =
    "w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

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

  const batchClasses = useMemo(
    () => classes.filter((classRecord) => classRecord.session === batchForm.session),
    [batchForm.session, classes]
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

    return sortStudentsByName(
      students.filter((student) => {
        if (!isActiveStudent(student)) {
          return false;
        }

        if (!selectedClass || !feeForm.term) {
          return false;
        }

        return studentBelongsToTermClass(
          student,
          selectedClass,
          feeForm.session,
          feeForm.term
        );
      })
    );
  }, [classes, feeForm.class_record, feeForm.session, feeForm.term, students]);

  const selectedBatchClass = useMemo(
    () =>
      classes.find((classRecord) => classRecord._id === batchForm.class_record),
    [batchForm.class_record, classes]
  );

  const batchPaymentRows = useMemo(() => {
    if (!selectedBatchClass || !batchForm.session || !batchForm.term) {
      return [];
    }

    return sortStudentsByName(
      students.filter(
        (student) =>
          isActiveStudent(student) &&
          studentBelongsToTermClass(
            student,
            selectedBatchClass,
            batchForm.session,
            batchForm.term
          )
      )
    ).map((student) => {
      const feeCategory = getStudentFeeCategory(
        student,
        batchForm.session,
        batchForm.term
      );
      const enrollment = getStudentEffectiveFeeEnrollment(
        student,
        batchForm.session,
        batchForm.term
      );
      const expectedStructure = findFeeStructureForStudentFee(
        feeStructures,
        batchForm.class_record,
        batchForm.session,
        batchForm.term,
        feeCategory
      );
      const paid = getStudentPaidForFeeWindow({
        fees,
        studentId: student._id,
        session: batchForm.session,
        term: batchForm.term,
        feeCategory,
      });
      const isFeeExempt = isFeeExemptCategory(feeCategory);
      const expectedSnapshot = getExpectedFeeSnapshot({
        feeStructure: expectedStructure,
        enrollment: {
          ...enrollment,
          fee_category: feeCategory,
        },
      });
      const expected = expectedSnapshot.expectedAmount;
      const balance = isFeeExempt ? 0 : Math.max(expected - paid, 0);

      return {
        student,
        feeCategory,
        baseExpected: expectedSnapshot.baseAmount,
        discountAmount: expectedSnapshot.discountAmount,
        discountReason: expectedSnapshot.discountReason,
        expected,
        paid,
        balance,
        isFeeExempt,
        hasStructure: isFeeExempt || Boolean(expectedStructure),
      };
    });
  }, [
    batchForm.class_record,
    batchForm.session,
    batchForm.term,
    feeStructures,
    fees,
    selectedBatchClass,
    students,
  ]);

  const selectedBatchRows = batchPaymentRows.filter(
    (row) => batchSelectedStudents[row.student._id]
  );
  const batchSelectedTotal = selectedBatchRows.reduce(
    (sum, row) => sum + Number(batchAmounts[row.student._id] || 0),
    0
  );
  const batchPayableRows = batchPaymentRows.filter(
    (row) => !row.isFeeExempt && row.hasStructure && row.balance > 0
  );
  const allPayableBatchRowsSelected =
    batchPayableRows.length > 0 &&
    batchPayableRows.every((row) => batchSelectedStudents[row.student._id]);

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
  const selectedFormEffectiveEnrollment =
    selectedFormStudent && feeForm.session && feeForm.term
      ? getStudentEffectiveFeeEnrollment(
          selectedFormStudent,
          feeForm.session,
          feeForm.term
        )
      : null;
  const selectedFormFeeCategory =
    selectedFormStudent && feeForm.session && feeForm.term
      ? selectedFormEffectiveEnrollment?.fee_category || "returning"
      : "";
  const selectedFormIsFeeExempt = isFeeExemptCategory(selectedFormFeeCategory);

  const selectedFormStructure = findFeeStructureForStudentFee(
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
          (fee.fee_category || "returning") === selectedFormFeeCategory &&
          fee._id !== editingFeeId
        );
      })
      .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  }, [
    editingFeeId,
    feeForm.session,
    feeForm.student,
    feeForm.term,
    fees,
    selectedFormFeeCategory,
  ]);

  const selectedFormExpectedAmount = selectedFormIsFeeExempt
    ? 0
    : getExpectedFeeSnapshot({
        feeStructure: selectedFormStructure,
        enrollment: {
          ...selectedFormEffectiveEnrollment,
          fee_category: selectedFormFeeCategory,
        },
      }).expectedAmount;
  const selectedFormExpectedSnapshot = getExpectedFeeSnapshot({
    feeStructure: selectedFormStructure,
    enrollment: {
      ...selectedFormEffectiveEnrollment,
      fee_category: selectedFormFeeCategory,
    },
  });
  const selectedStudentRemainingBeforePayment = selectedFormIsFeeExempt
    ? 0
    : selectedFormStructure
    ? Math.max(selectedFormExpectedAmount - selectedStudentPaidForTerm, 0)
    : 0;
  const selectedPaymentAmount = Number(feeForm.amount || 0);
  const selectedStudentProjectedPaid =
    selectedStudentPaidForTerm + selectedPaymentAmount;
  const selectedStudentOverpayment = selectedFormIsFeeExempt
    ? Math.max(selectedPaymentAmount, 0)
    : selectedFormStructure
    ? Math.max(selectedStudentProjectedPaid - selectedFormExpectedAmount, 0)
    : 0;

  const selectedStudentProjectedBalance = selectedFormIsFeeExempt
      ? 0
      : selectedFormStructure
      ? Math.max(
          selectedFormExpectedAmount - selectedStudentProjectedPaid,
          0
        )
      : 0;
  const selectedStructureClass = classes.find(
    (classRecord) => classRecord._id === structureForm.class_record
  );
  const selectedStructureCategory = editingStructureId
    ? structureForm.editing_fee_category || structureForm.fee_category || "returning"
    : structureForm.fee_category || "returning";
  const selectedStructureItemsKey = getFeeItemsKey(selectedStructureCategory);
  const selectedStructureItems = structureForm[selectedStructureItemsKey] || [];
  const selectedStructureTotal = getStructureTotal(selectedStructureItems);
  const selectedExistingStructure = findFeeStructure(
    feeStructures,
    structureForm.class_record,
    structureForm.session,
    structureForm.term,
    selectedStructureCategory
  );
  const structureCategoryStatus = feeCategories.map((category) => ({
    feeCategory: category.value,
    structure: findFeeStructure(
      feeStructures,
      structureForm.class_record,
      structureForm.session,
      structureForm.term,
      category.value
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
        term: normalizeTermForSession(currentForm.term, value),
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

    if (name === "term") {
      setFeeForm((currentForm) => ({
        ...currentForm,
        term: value,
        student: "",
      }));
      return;
    }

    setFeeForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleBatchChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setBatchForm((currentForm) => ({
        ...currentForm,
        session: value,
        class_record: "",
        term: normalizeTermForSession(currentForm.term, value),
      }));
      setBatchAmounts({});
      setBatchSelectedStudents({});
      return;
    }

    if (name === "class_record" || name === "term") {
      setBatchForm((currentForm) => ({
        ...currentForm,
        [name]: value,
      }));
      setBatchAmounts({});
      setBatchSelectedStudents({});
      return;
    }

    setBatchForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleBatchAmountChange = (studentId, value) => {
    setBatchAmounts((currentAmounts) => ({
      ...currentAmounts,
      [studentId]: value,
    }));
  };

  const handleBatchStudentToggle = (studentId, checked) => {
    setBatchSelectedStudents((currentSelected) => ({
      ...currentSelected,
      [studentId]: checked,
    }));
  };

  const handleBatchSelectAll = () => {
    const nextSelected = {};
    const nextAmounts = { ...batchAmounts };

    if (!allPayableBatchRowsSelected) {
      batchPayableRows.forEach((row) => {
        nextSelected[row.student._id] = true;
        nextAmounts[row.student._id] =
          nextAmounts[row.student._id] || row.balance.toString();
      });
    }

    setBatchSelectedStudents(nextSelected);
    setBatchAmounts(nextAmounts);
  };

  const handleBatchFillOutstanding = () => {
    setBatchAmounts((currentAmounts) => ({
      ...currentAmounts,
      ...Object.fromEntries(
        batchPayableRows.map((row) => [
          row.student._id,
          row.balance.toString(),
        ])
      ),
    }));
    setBatchSelectedStudents(
      Object.fromEntries(
        batchPayableRows.map((row) => [row.student._id, true])
      )
    );
  };

  const handleBatchClear = () => {
    setBatchAmounts({});
    setBatchSelectedStudents({});
  };

  const handleBatchSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const payments = selectedBatchRows
      .map((row) => ({
        student: row.student._id,
        amount: Number(batchAmounts[row.student._id] || 0),
      }))
      .filter((payment) => payment.amount > 0);

    if (!batchForm.class_record || !batchForm.term) {
      setStatus({
        type: "error",
        message: "Select a class and term before recording batch payments.",
      });
      return;
    }

    if (payments.length === 0) {
      setStatus({
        type: "error",
        message: "Select at least one student with an amount greater than 0.",
      });
      return;
    }

    setBatchSubmitting(true);

    try {
      const response = await API.post("/fees/batch", {
        session: batchForm.session,
        term: batchForm.term,
        payment_date: batchForm.payment_date,
        payment_method: batchForm.payment_method,
        note: batchForm.note,
        payments,
      });
      const createdFees = response.data?.created || [];
      const skippedCount = response.data?.skippedCount || 0;

      if (createdFees.length > 0) {
        setFees((currentFees) => [...createdFees, ...currentFees]);
      }

      setStatus({
        type: skippedCount > 0 ? "error" : "success",
        message:
          skippedCount > 0 && response.data?.errors?.[0]?.message
            ? `${response.data.message} First issue: ${response.data.errors[0].message}`
            : response.data?.message ||
              `${createdFees.length} payment(s) recorded.`,
      });
      setBatchAmounts({});
      setBatchSelectedStudents({});
    } catch (error) {
      const responseData = error.response?.data;
      const createdFees = responseData?.created || [];

      if (createdFees.length > 0) {
        setFees((currentFees) => [...createdFees, ...currentFees]);
      }

      setStatus({
        type: createdFees.length > 0 ? "error" : "error",
        message:
          responseData?.message ||
          responseData?.errors?.[0]?.message ||
          responseData?.error ||
          "Unable to record batch fee payments.",
      });
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleStructureChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setStructureForm((currentForm) => ({
        ...currentForm,
        session: value,
        class_record: "",
        term: normalizeTermForSession(currentForm.term, value),
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
        ...(currentForm[categoryKey] || []),
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
        (currentForm[categoryKey] || []).length > 1
          ? currentForm[categoryKey].filter((_, itemIndex) => itemIndex !== index)
          : currentForm[categoryKey],
    }));
  };

  const handleStructureSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const feeCategory = editingStructureId
      ? structureForm.editing_fee_category
      : structureForm.fee_category;
    const itemsKey = getFeeItemsKey(feeCategory);
    const items = (structureForm[itemsKey] || []).map((item) => ({
      name: item.name,
      amount: Number(item.amount),
    }));
    const payload = {
      class_record: structureForm.class_record,
      session: structureForm.session,
      term: structureForm.term,
      fee_category: feeCategory,
      items,
    };

    if (!editingStructureId && selectedExistingStructure?._id) {
      setStatus({
        type: "error",
        message:
          "A payment structure already exists for this class, session, term, and student category. Use Edit to change it.",
      });
      return;
    }

    try {
      const wasEditingStructure = Boolean(editingStructureId);
      let savedStructure = null;

      if (editingStructureId) {
        const response = await API.put(`/fee-structures/${editingStructureId}`, payload);
        savedStructure = response.data;
      } else {
        const response = await API.post("/fee-structures", payload);
        savedStructure = response.data;
      }

      setStructureForm({
        ...initialStructureForm,
        session: structureForm.session || DEFAULT_SESSION,
        fee_category: structureForm.fee_category || "returning",
      });
      setEditingStructureId("");
      setStatus({
        type: "success",
        message: editingStructureId
          ? "Payment structure updated successfully."
          : "Payment structure saved successfully.",
      });
      if (savedStructure?._id) {
        setFeeStructures((currentStructures) => {
          const existingStructure = currentStructures.some(
            (feeStructure) => feeStructure._id === savedStructure._id
          );

          if (existingStructure) {
            return currentStructures.map((feeStructure) =>
              feeStructure._id === savedStructure._id
                ? savedStructure
                : feeStructure
            );
          }

          return [savedStructure, ...currentStructures];
        });
      }

      if (wasEditingStructure) {
        const feesResponse = await API.get("/fees");
        setFees(feesResponse.data || []);
      }
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

    const editedFeeCategory = feeStructure.fee_category || "returning";

    setStructureForm({
      session: feeStructure.session || DEFAULT_SESSION,
      class_record: getRecordId(feeStructure.class_record),
      term: feeStructure.term || "",
      fee_category: editedFeeCategory,
      editing_fee_category: editedFeeCategory,
      ...Object.fromEntries(
        feeCategories.map((category) => [
          getFeeItemsKey(category.value),
          category.value === editedFeeCategory
            ? editedItems
            : getDefaultFeeItems(category.value),
        ])
      ),
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

    if (selectedFormIsFeeExempt) {
      setStatus({
        type: "error",
        message: "This student is fee-exempt and does not require payment records.",
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

    if (Number(feeForm.amount) > selectedStudentRemainingBeforePayment) {
      setStatus({
        type: "error",
        message: `Payment amount cannot be greater than the outstanding balance of ${formatCurrency(selectedStudentRemainingBeforePayment)}.`,
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
      let savedFee = null;

      if (editingFeeId) {
        const response = await API.put(`/fees/${editingFeeId}`, payload);
        savedFee = response.data;
      } else {
        const response = await API.post("/fees", payload);
        savedFee = response.data;
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
      if (savedFee?._id) {
        setFees((currentFees) => {
          const existingFee = currentFees.some((fee) => fee._id === savedFee._id);

          if (existingFee) {
            return currentFees.map((fee) =>
              fee._id === savedFee._id ? savedFee : fee
            );
          }

          return [savedFee, ...currentFees];
        });
      }
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
      receipt_no: getFeeReceiptNumber(fee) || "",
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
      ...(name === "session"
        ? { term: normalizeTermForSession(currentFilters.term, value) }
        : {}),
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
      setFees((currentFees) =>
        currentFees.filter((fee) => fee._id !== deleteTarget._id)
      );
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
      setFeeStructures((currentStructures) =>
        currentStructures.filter(
          (feeStructure) => feeStructure._id !== structureDeleteTarget._id
        )
      );
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
      const expectedAmount = Number(fee.expected_amount_at_payment || 0);
      const paidForWindow = getStudentPaidForFeeWindow({
        fees,
        studentId: getFeeStudentId(fee),
        session: fee.session,
        term: fee.term,
        feeCategory: fee.fee_category || "returning",
      });
      const matchesPaymentStatus =
        !filters.payment_status ||
        (filters.payment_status === "paid" &&
          expectedAmount > 0 &&
          paidForWindow >= expectedAmount) ||
        (filters.payment_status === "unpaid" &&
          expectedAmount > 0 &&
          paidForWindow < expectedAmount);
      const searchableText = [
        student.full_name,
        student.admission_no,
        fee.class,
        student.class,
        fee.session,
        fee.term,
        formatFeeCategory(fee.fee_category),
        getFeeReceiptNumber(fee),
        fee.payment_method,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesSession &&
        matchesTerm &&
        matchesClass &&
        matchesPaymentStatus &&
        (!searchValue || searchableText.includes(searchValue))
      );
    });
  }, [classes, fees, filters]);

  useEffect(() => {
    setStructurePage(1);
  }, [feeStructures.length, structureCategoryFilter]);

  useEffect(() => {
    setPaymentPage(1);
  }, [filteredFees.length, filters]);

  const filteredFeeStructures = feeStructures.filter(
    (feeStructure) =>
      !structureCategoryFilter ||
      (feeStructure.fee_category || "returning") === structureCategoryFilter
  );
  const visibleStructurePage = Math.min(
    structurePage,
    Math.max(1, Math.ceil(filteredFeeStructures.length / PAGE_SIZE))
  );
  const paginatedFeeStructures = filteredFeeStructures.slice(
    (visibleStructurePage - 1) * PAGE_SIZE,
    visibleStructurePage * PAGE_SIZE
  );
  const visiblePaymentPage = Math.min(
    paymentPage,
    Math.max(1, Math.ceil(filteredFees.length / PAGE_SIZE))
  );
  const paginatedFees = filteredFees.slice(
    (visiblePaymentPage - 1) * PAGE_SIZE,
    visiblePaymentPage * PAGE_SIZE
  );

  const selectedFilterClass = classes.find(
    (classRecord) => classRecord._id === filters.class_record
  );
  const selectedFilterStructures = feeStructures.filter(
    (feeStructure) =>
      getRecordId(feeStructure.class_record) === filters.class_record &&
      feeStructure.session === filters.session &&
      feeStructure.term === filters.term
  );

  const allBalanceRows = useMemo(() => {
    if (!selectedFilterClass || !filters.session || !filters.term) {
      return [];
    }

    return students
      .filter((student) => {
        return (
          isActiveStudent(student) &&
          studentBelongsToTermClass(
            student,
            selectedFilterClass,
            filters.session,
            filters.term
          )
        );
      })
      .sort((firstStudent, secondStudent) =>
        (firstStudent.full_name || "").localeCompare(secondStudent.full_name || "")
      )
      .map((student) => {
        const feeCategory = getStudentFeeCategory(
          student,
          filters.session,
          filters.term
        );
        const paid = getStudentPaidForFeeWindow({
          fees,
          studentId: student._id,
          session: filters.session,
          term: filters.term,
          feeCategory,
        });
        const enrollment = getStudentEffectiveFeeEnrollment(
          student,
          filters.session,
          filters.term
        );
        const expectedStructure = findFeeStructureForStudentFee(
          feeStructures,
          filters.class_record,
          filters.session,
          filters.term,
          feeCategory
        );
        const isFeeExempt = isFeeExemptCategory(feeCategory);
        const expectedSnapshot = getExpectedFeeSnapshot({
          feeStructure: expectedStructure,
          enrollment: {
            ...enrollment,
            fee_category: feeCategory,
          },
        });
        const expected = expectedSnapshot.expectedAmount;

        return {
          student,
          feeCategory,
          baseExpected: expectedSnapshot.baseAmount,
          discountAmount: expectedSnapshot.discountAmount,
          discountReason: expectedSnapshot.discountReason,
          expected: isFeeExempt ? 0 : expected,
          paid: isFeeExempt ? 0 : paid,
          balance: isFeeExempt ? 0 : Math.max(expected - paid, 0),
          isFeeExempt,
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
  const balanceRows = useMemo(() => {
    if (!filters.payment_status) {
      return allBalanceRows;
    }

    return allBalanceRows.filter((row) => {
      if (filters.payment_status === "paid") {
        return row.isFeeExempt || (row.expected > 0 && row.paid >= row.expected);
      }

      if (filters.payment_status === "unpaid") {
        return !row.isFeeExempt && row.expected > 0 && row.paid < row.expected;
      }

      if (filters.payment_status === "exempt") {
        return row.isFeeExempt;
      }

      return true;
    });
  }, [allBalanceRows, filters.payment_status]);
  const displayedBalanceRows =
    selectedFilterStructures.length > 0
      ? balanceRows
      : balanceRows.filter((row) => row.isFeeExempt);
  const totalExpected = displayedBalanceRows.reduce(
    (sum, row) => sum + Number(row.expected || 0),
    0
  );
  const totalTrackedPaid = displayedBalanceRows.reduce(
    (sum, row) => sum + Number(row.paid || 0),
    0
  );
  const totalBalance = displayedBalanceRows.reduce(
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

    if (displayedBalanceRows.length === 0) {
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

    const balanceTableRows = displayedBalanceRows
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
            <td>${escapeHtml(getFeeReceiptNumber(fee))}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(selectedFilterClass.name.toUpperCase())} Payment Records</title>
          <style>
            ${getPrintBrandStyles()}
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
          ${getPrintBrandHeader({
            title: "Class Payment Records",
            subtitle: `${selectedFilterClass.name.toUpperCase()} - ${filters.session} - ${filters.term}`,
          })}
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

  const handlePrintPaymentReceipt = (fee) => {
    if (!fee?._id) {
      setStatus({
        type: "error",
        message: "Select a valid fee payment before printing receipt.",
      });
      return;
    }

    const printWindow = window.open("", "_blank", "width=720,height=900");

    if (!printWindow) {
      setStatus({
        type: "error",
        message: "Unable to open receipt window. Allow popups and try again.",
      });
      return;
    }

    const student = fee.student || {};
    const studentId = getFeeStudentId(fee);
    const receiptNumber = getFeeReceiptNumber(fee);
    const expectedAmount = Number(fee.expected_amount_at_payment || 0);
    const discountAmount = Number(fee.discount_amount_at_payment || 0);
    const relatedPayments = studentId
      ? fees.filter(
          (payment) =>
            getFeeStudentId(payment) === studentId &&
            payment.session === fee.session &&
            payment.term === fee.term
        )
      : [fee];
    const totalPaid = relatedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const currentBalance = Math.max(expectedAmount - totalPaid, 0);
    const feeItems = Array.isArray(fee.expected_items_at_payment)
      ? fee.expected_items_at_payment
      : [];
    const logoUrl = new URL(schoolLogo, window.location.origin).href;
    const discountRow =
      discountAmount > 0
        ? `
          <tr>
            <td>${feeItems.length > 0 ? feeItems.length + 1 : 2}</td>
            <td>Student Discount</td>
            <td>-${escapeHtml(formatCurrency(discountAmount))}</td>
          </tr>
        `
        : "";
    const feeItemRows = feeItems.length
      ? feeItems
          .map(
            (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.name || "Fee Item")}</td>
                <td>${escapeHtml(formatCurrency(item.amount))}</td>
              </tr>
            `
          )
          .join("") + discountRow
      : `
        <tr>
          <td>1</td>
          <td>Expected Fee</td>
          <td>${escapeHtml(formatCurrency(expectedAmount))}</td>
        </tr>
      ${discountRow}`;
    const noteMarkup = fee.note
      ? `<div class="note"><strong>Note:</strong> ${escapeHtml(fee.note)}</div>`
      : "";

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(receiptNumber)} Payment Receipt</title>
          <style>
            @page { size: 148mm 210mm; margin: 8mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #fff;
              color: #111;
              font-family: Arial, sans-serif;
            }
            .receipt {
              width: 132mm;
              min-height: 194mm;
              margin: 0 auto;
              border: 1px solid #d7d7d7;
              padding: 8mm;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              border-bottom: 2px solid #111;
              padding-bottom: 12px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .brand img {
              width: 48px;
              height: 48px;
              object-fit: cover;
              border-radius: 50%;
            }
            h1 {
              margin: 0;
              font-size: 18px;
              line-height: 1.15;
            }
            .subtitle {
              margin: 4px 0 0;
              color: #555;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .receipt-no {
              text-align: right;
              font-size: 11px;
              color: #555;
            }
            .receipt-no strong {
              display: block;
              margin-top: 4px;
              color: #111;
              font-size: 13px;
            }
            .title {
              margin: 18px 0 12px;
              text-align: center;
              font-size: 16px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 14px;
              margin-bottom: 14px;
            }
            .field {
              border: 1px solid #e1e1e1;
              padding: 8px;
              min-height: 40px;
            }
            .label {
              display: block;
              color: #666;
              font-size: 10px;
              font-weight: 700;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .value {
              font-size: 12px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th,
            td {
              border: 1px solid #dcdcdc;
              padding: 8px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background: #f3f3f3;
              font-size: 10px;
              text-transform: uppercase;
            }
            .totals {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-top: 14px;
            }
            .total {
              border: 1px solid #111;
              padding: 9px;
            }
            .total strong {
              display: block;
              margin-top: 5px;
              font-size: 14px;
            }
            .highlight {
              background: #111;
              color: #fff;
            }
            .note {
              margin-top: 12px;
              border: 1px solid #e1e1e1;
              padding: 9px;
              font-size: 11px;
              color: #333;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 26px;
            }
            .signature {
              border-top: 1px solid #111;
              padding-top: 6px;
              text-align: center;
              font-size: 11px;
              color: #555;
            }
            .footer {
              margin-top: 18px;
              border-top: 1px dashed #aaa;
              padding-top: 8px;
              color: #555;
              font-size: 10px;
              text-align: center;
            }
            @media print {
              .receipt {
                width: auto;
                min-height: auto;
                border: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <main class="receipt">
            <header class="header">
              <div class="brand">
                <img src="${escapeHtml(logoUrl)}" alt="Golden Castle logo" />
                <div>
                  <h1>Golden Castle<br />International School</h1>
                  <p class="subtitle">Official payment receipt</p>
                </div>
              </div>
              <div class="receipt-no">
                Receipt No.
                <strong>${escapeHtml(receiptNumber)}</strong>
              </div>
            </header>

            <div class="title">Payment Receipt</div>

            <section class="grid">
              <div class="field">
                <span class="label">Student</span>
                <span class="value">${escapeHtml(student.full_name || "Deleted student")}</span>
              </div>
              <div class="field">
                <span class="label">Admission No.</span>
                <span class="value">${escapeHtml(student.admission_no || "Not available")}</span>
              </div>
              <div class="field">
                <span class="label">Class</span>
                <span class="value">${escapeHtml(fee.class || student.class || "Not set")}</span>
              </div>
              <div class="field">
                <span class="label">Session / Term</span>
                <span class="value">${escapeHtml(fee.session)} | ${escapeHtml(fee.term)}</span>
              </div>
              <div class="field">
                <span class="label">Fee Category</span>
                <span class="value">${escapeHtml(formatFeeCategory(fee.fee_category))}</span>
              </div>
              <div class="field">
                <span class="label">Date Paid</span>
                <span class="value">${escapeHtml(formatDate(fee.payment_date))}</span>
              </div>
              <div class="field">
                <span class="label">Payment Method</span>
                <span class="value">${escapeHtml(fee.payment_method || "Not set")}</span>
              </div>
              <div class="field">
                <span class="label">Print Date</span>
                <span class="value">${escapeHtml(formatDate(new Date()))}</span>
              </div>
            </section>

            <table>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Fee Item</th>
                  <th>Expected Amount</th>
                </tr>
              </thead>
              <tbody>${feeItemRows}</tbody>
            </table>

            <section class="totals">
              <div class="total">
                <span class="label">Expected Total</span>
                <strong>${escapeHtml(formatCurrency(expectedAmount))}</strong>
              </div>
              <div class="total highlight">
                <span class="label">Amount Paid On This Receipt</span>
                <strong>${escapeHtml(formatCurrency(fee.amount))}</strong>
              </div>
              <div class="total">
                <span class="label">Total Paid For Term</span>
                <strong>${escapeHtml(formatCurrency(totalPaid))}</strong>
              </div>
              <div class="total">
                <span class="label">Current Balance</span>
                <strong>${escapeHtml(formatCurrency(currentBalance))}</strong>
              </div>
            </section>

            ${noteMarkup}

            <section class="signatures">
              <div class="signature">Received By</div>
              <div class="signature">Parent / Guardian</div>
            </section>

            <p class="footer">
              This receipt confirms the amount paid on this payment record.
              Please keep it for future reference.
            </p>
          </main>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="px-6 py-8 lg:px-10">
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
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaReceipt />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">
          Fee Management
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Record student fee payments by session, term, and payment date.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="rounded-lg bg-secondary p-6 shadow-lg">
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
                {getVisibleTermsForSession(structureForm.session).map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                name="fee_category"
                value={structureForm.fee_category}
                onChange={handleStructureChange}
                disabled={Boolean(editingStructureId)}
                required
              >
                {feeCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {selectedStructureClass && structureForm.term && (
                <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                  <p className="text-sm font-bold uppercase text-primary/60">
                    {selectedStructureClass.name.toUpperCase()} Category Structures
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                  key: selectedStructureItemsKey,
                  title: `${formatFeeCategory(selectedStructureCategory)} Student Items`,
                  total: selectedStructureTotal,
                  items: selectedStructureItems,
                },
              ]
                .map((category) => (
                  <div
                    key={category.key}
                    className="rounded-lg border border-primary/10 bg-primary/5 p-4"
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
                disabled={!editingStructureId && Boolean(selectedExistingStructure)}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {editingStructureId
                  ? "Save Structure"
                  : selectedExistingStructure
                    ? `${formatFeeCategory(selectedStructureCategory)} Structure Exists`
                    : `Create ${formatFeeCategory(selectedStructureCategory)} Structure`}
                <FaArrowRight />
              </button>
              {editingStructureId && (
                <button
                  type="button"
                  onClick={handleCancelStructureEdit}
                  className="w-full rounded-lg bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </section>

        <section className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="mb-6">
            <h3 className="text-3xl font-extrabold text-primary">
              Payment Structure Records
            </h3>
            <p className="mt-2 text-primary/70">
              Review the expected fee totals already created for each class,
              session, term, and student category.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,360px)_auto] md:items-center">
            <select
              className={inputClass}
              value={structureCategoryFilter}
              onChange={(event) => setStructureCategoryFilter(event.target.value)}
            >
              <option value="">All student categories</option>
              {feeCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <p className="text-sm font-semibold text-primary/60">
              Showing {filteredFeeStructures.length} of {feeStructures.length} structures
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-primary/10">
            <table className="w-full min-w-[840px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Term</th>
                  <th className="px-5 py-4 font-bold">Fee Category</th>
                  <th className="px-5 py-4 font-bold">Expected Fee</th>
                  <th className="px-5 py-4 font-bold">Recorded Fees</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loading ? (
                  <TableSkeleton columns={7} />
                ) : feeStructures.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="7">
                      No payment structure has been created yet.
                    </td>
                  </tr>
                ) : filteredFeeStructures.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="7">
                      No payment structure matches this category filter.
                    </td>
                  </tr>
                ) : (
                  paginatedFeeStructures.map((feeStructure) => {
                    const recordedFeeCount = getFeeStructurePaymentCount(
                      feeStructure,
                      fees
                    );

                    return (
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
                          <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                            {recordedFeeCount}
                          </span>
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
                              disabled={recordedFeeCount > 0}
                              title={
                                recordedFeeCount > 0
                                  ? "Cannot delete a structure with recorded fee payments"
                                  : "Delete payment structure"
                              }
                              className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={visibleStructurePage}
            totalItems={filteredFeeStructures.length}
            pageSize={PAGE_SIZE}
            onPageChange={setStructurePage}
          />
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-secondary p-6 shadow-lg"
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
              {getVisibleTermsForSession(feeForm.session).map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
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
              max={
                selectedFormIsFeeExempt
                  ? 0
                  : selectedFormStructure
                  ? selectedStudentRemainingBeforePayment
                  : undefined
              }
              value={feeForm.amount}
              onChange={handleChange}
              placeholder="Amount paid"
              disabled={selectedFormIsFeeExempt}
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
              placeholder="Receipt number is generated after saving"
              readOnly
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

          <div className="mt-6 rounded-lg border border-primary/10 bg-primary/5 p-5">
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
                No category record was found for this exact term, so the system
                is using the latest earlier category for this student.
              </p>
            )}
            {selectedFormIsFeeExempt ? (
              <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-5">
                <p className="text-sm font-bold uppercase text-green-700">
                  Fee Exempt
                </p>
                <p className="mt-2 text-primary/75">
                  This student is fee-exempt and does not pay school fees.
                  No payment record or fee structure is required.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold text-primary/60">
                      Expected
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-primary">
                      {formatCurrency(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary/60">
                      Paid
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-primary">
                      {formatCurrency(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary/60">
                      Balance
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-primary">
                      {formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedFormStructure ? (
              <>
                {selectedFormStructure.items?.length > 0 && (
                  <div className="mt-4 rounded-lg border border-primary/10 bg-secondary p-4">
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

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm font-semibold text-primary/60">
                      Expected
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-primary">
                      {formatCurrency(selectedFormExpectedAmount)}
                    </p>
                    {selectedFormExpectedSnapshot.discountAmount > 0 && (
                      <p className="mt-2 text-sm font-semibold text-primary/60">
                        Base {formatCurrency(selectedFormExpectedSnapshot.baseAmount)} -
                        discount {formatCurrency(selectedFormExpectedSnapshot.discountAmount)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary/60">
                      Outstanding Before This Record
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-primary">
                      {formatCurrency(selectedStudentRemainingBeforePayment)}
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
                {selectedStudentOverpayment > 0 && (
                  <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700">
                    This amount is {formatCurrency(selectedStudentOverpayment)} above
                    the outstanding balance. Enter {formatCurrency(selectedStudentRemainingBeforePayment)} or less.
                  </p>
                )}
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
            disabled={submitting || selectedFormIsFeeExempt}
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {selectedFormIsFeeExempt
              ? "Fee Exempt - No Payment Required"
              : submitting
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
              className="mt-4 w-full rounded-lg bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              Cancel Edit
            </button>
          )}
        </form>

        <form
          onSubmit={handleBatchSubmit}
          className="rounded-lg bg-secondary p-6 shadow-lg"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Batch Fee Payment
              </h3>
              <p className="mt-3 max-w-2xl text-primary/70">
                Record payments for multiple students in the same class, session,
                and term.
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 px-5 py-4 text-primary">
              <p className="text-sm font-bold uppercase text-primary/60">
                Selected Total
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {formatCurrency(batchSelectedTotal)}
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <select
              className={inputClass}
              name="session"
              value={batchForm.session}
              onChange={handleBatchChange}
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
              value={batchForm.class_record}
              onChange={handleBatchChange}
              disabled={!batchForm.session}
              required
            >
              <option value="">
                {batchForm.session ? "Select class" : "Select session first"}
              </option>
              {batchClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              name="term"
              value={batchForm.term}
              onChange={handleBatchChange}
              required
            >
              <option value="">Select term</option>
              {getVisibleTermsForSession(batchForm.session).map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>

            <input
              className={inputClass}
              name="payment_date"
              type="date"
              value={batchForm.payment_date}
              onChange={handleBatchChange}
              required
            />

            <select
              className={inputClass}
              name="payment_method"
              value={batchForm.payment_method}
              onChange={handleBatchChange}
            >
              <option value="">Payment method</option>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="POS">POS</option>
              <option value="Bank Deposit">Bank Deposit</option>
            </select>

            <input
              className={inputClass}
              name="note"
              value={batchForm.note}
              onChange={handleBatchChange}
              placeholder="Optional note for all payments"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleBatchFillOutstanding}
              disabled={batchPayableRows.length === 0}
              className="flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-primary px-5 py-3 font-bold text-secondary transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Fill Outstanding
              <FaMoneyBillWave />
            </button>
            <button
              type="button"
              onClick={handleBatchSelectAll}
              disabled={batchPayableRows.length === 0}
              className="flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-3 font-bold text-secondary transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {allPayableBatchRowsSelected ? "Clear Selection" : "Select Payable"}
              <FaCircleCheck />
            </button>
            <button
              type="button"
              onClick={handleBatchClear}
              className="rounded-lg bg-primary/10 px-5 py-3 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              Clear Batch
            </button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-primary/10">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">Use</th>
                  <th className="px-5 py-4 font-bold">Student</th>
                  <th className="px-5 py-4 font-bold">Admission No.</th>
                  <th className="px-5 py-4 font-bold">Fee Category</th>
                  <th className="px-5 py-4 font-bold">Expected</th>
                  <th className="px-5 py-4 font-bold">Paid</th>
                  <th className="px-5 py-4 font-bold">Balance</th>
                  <th className="px-5 py-4 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {!batchForm.class_record || !batchForm.term ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="8">
                      Select a class and term to load students for batch payment.
                    </td>
                  </tr>
                ) : batchPaymentRows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="8">
                      No active student found for this class and term.
                    </td>
                  </tr>
                ) : (
                  batchPaymentRows.map((row) => {
                    const disabled =
                      row.isFeeExempt || !row.hasStructure || row.balance <= 0;
                    const studentId = row.student._id;

                    return (
                      <tr key={studentId} className="text-primary/80">
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={Boolean(batchSelectedStudents[studentId])}
                            onChange={(event) =>
                              handleBatchStudentToggle(
                                studentId,
                                event.target.checked
                              )
                            }
                            disabled={disabled}
                            className="h-5 w-5 accent-button disabled:cursor-not-allowed"
                          />
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
                        <td className="px-5 py-4">
                          {formatCurrency(row.paid)}
                        </td>
                        <td className="px-5 py-4">
                          {row.isFeeExempt
                            ? "Exempt"
                            : row.hasStructure
                              ? formatCurrency(row.balance)
                              : "No structure"}
                        </td>
                        <td className="px-5 py-4">
                          <input
                            className="w-32 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20 disabled:cursor-not-allowed disabled:opacity-60"
                            type="number"
                            min="0"
                            max={row.balance}
                            value={batchAmounts[studentId] || ""}
                            onChange={(event) =>
                              handleBatchAmountChange(
                                studentId,
                                event.target.value
                              )
                            }
                            disabled={disabled}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            disabled={batchSubmitting || selectedBatchRows.length === 0}
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {batchSubmitting ? "Recording batch..." : "Record Batch Payments"}
            {!batchSubmitting && <FaArrowRight />}
          </button>
        </form>

        <section className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="mb-6 rounded-lg bg-secondary p-6 shadow-lg">
            <div className="mb-5">
              <p className="text-sm font-bold uppercase text-button">
                Fee Filters
              </p>
              <h3 className="text-3xl font-extrabold text-primary">
                Payment Records
              </h3>
              <p className="mt-2 text-primary/70">
                Filter payments by session, term, class, or student details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                {getVisibleTermsForSession(filters.session).map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
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

              <select
                className={inputClass}
                name="payment_status"
                value={filters.payment_status}
                onChange={handleFilterChange}
              >
                <option value="">All payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="exempt">Exempt</option>
              </select>

              <button
                type="button"
                onClick={handlePrintQueriedClassPayments}
                disabled={!selectedFilterClass || !filters.term}
                className="flex min-w-0 cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-4 py-4 font-bold text-secondary shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="truncate">Print Records</span>
                <FaPrint />
              </button>
            </div>
          </div>

          <input
            className="mb-6 w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search student, admission number, receipt, or payment method"
          />

          <div className="mb-8 rounded-lg border border-primary/10 bg-primary/5 p-5">
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
            ) : selectedFilterStructures.length === 0 &&
              displayedBalanceRows.length === 0 ? (
              <p className="text-primary/70">
                No payment structure found for{" "}
                {selectedFilterClass.name.toUpperCase()},{" "}
                {filters.session}, {filters.term}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-primary/10 bg-secondary">
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
                    {displayedBalanceRows.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-primary/70" colSpan="7">
                          {filters.payment_status
                            ? "No student matches this payment status."
                            : "No active student found in this class."}
                        </td>
                      </tr>
                    ) : (
                      displayedBalanceRows.map((row, index) => (
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
                                row.isFeeExempt
                                  ? "bg-green-500/10 text-green-700"
                                  : row.balance > 0
                                  ? "bg-red-500/10 text-red-700"
                                  : "bg-green-500/10 text-green-700"
                              }`}
                            >
                              {row.isFeeExempt
                                ? "Exempt"
                                : formatCurrency(row.balance)}
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

          <div className="overflow-x-auto rounded-lg border border-primary/10">
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
                  <TableSkeleton columns={13} />
                ) : filteredFees.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="13">
                      No fee payment matches this filter.
                    </td>
                  </tr>
                ) : (
                  paginatedFees.map((fee, index) => (
                    <tr
                      key={fee._id}
                      className="text-primary/80 transition duration-300 hover:bg-primary/5"
                    >
                      <td className="px-5 py-4 font-bold text-primary">
                        {(visiblePaymentPage - 1) * PAGE_SIZE + index + 1}
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
                        {getFeeReceiptNumber(fee)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrintPaymentReceipt(fee)}
                            className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary"
                          >
                            <FaPrint />
                            Receipt
                          </button>
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
          <PaginationControls
            currentPage={visiblePaymentPage}
            totalItems={filteredFees.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPaymentPage}
          />
        </section>
      </div>
    </div>
  );
}

export default FeeManagement;

