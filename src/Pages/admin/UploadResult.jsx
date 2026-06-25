import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBookOpen,
  FaClipboardCheck,
  FaFilePdf,
  FaLayerGroup,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import PaginationControls from "../../components/common/PaginationControls.jsx";
import { sortStudentsByName } from "../../utils/students.js";
import { isFormTeacher } from "../../utils/teacherAssignments.js";
import {
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";

const initialResultForm = {
  studentId: "",
  session: "",
  term: "",
  class: "",
  class_record: "",
  assigned_teacher: "",
  pdf: null,
};

const initialBroadsheetForm = {
  session: "",
  term: "",
  class: "",
  class_record: "",
  assigned_teacher: "",
  pdf: null,
};

const initialClassResultForm = {
  session: "",
  term: "",
  class: "",
  class_record: "",
  assigned_teacher: "",
  pdf: null,
};

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const getRecordId = (record) => record?._id || record || "";

const TERM_ORDER = ["First Term", "Second Term", "Third Term"];

const getTermIndex = (term = "") => {
  const termIndex = TERM_ORDER.indexOf(term);

  return termIndex === -1 ? TERM_ORDER.length : termIndex;
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

  const enrollmentClassRecordId = getRecordId(enrollment.class_record);
  const classRecordId = getRecordId(classRecord);

  return (
    enrollmentClassRecordId === classRecordId ||
    normalizeClassName(enrollment.class) === normalizeClassName(classRecord.name)
  );
};

const PAGE_SIZE = 15;

const getResponseTotalCount = (response) => {
  const headerValue =
    response.headers?.get?.("x-total-count") ||
    response.headers?.["x-total-count"] ||
    response.headers?.["X-Total-Count"];
  const totalCount = Number(headerValue);

  return Number.isFinite(totalCount) ? totalCount : null;
};

const getCountValue = (response) => {
  const totalCount = Number(response?.data?.totalCount);

  return Number.isFinite(totalCount) ? totalCount : null;
};

const fetchResultTotalCount = async ({ countResponse, listResponse }) => {
  const countValue = getCountValue(countResponse);

  if (countValue !== null) {
    return countValue;
  }

  const headerValue = getResponseTotalCount(listResponse);

  if (headerValue !== null && headerValue !== PAGE_SIZE) {
    return headerValue;
  }

  const fullResultsResponse = await API.get("/results");

  return Array.isArray(fullResultsResponse.data)
    ? fullResultsResponse.data.length
    : 0;
};

function UploadResult() {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [resultSummaryRecords, setResultSummaryRecords] = useState([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [classBroadsheets, setClassBroadsheets] = useState([]);
  const [classBroadsheetSummaryRecords, setClassBroadsheetSummaryRecords] =
    useState([]);
  const [classResults, setClassResults] = useState([]);
  const [classResultSummaryRecords, setClassResultSummaryRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [resultForm, setResultForm] = useState(initialResultForm);
  const [broadsheetForm, setBroadsheetForm] = useState(initialBroadsheetForm);
  const [classResultForm, setClassResultForm] = useState(initialClassResultForm);
  const [studentResultAccessForm, setStudentResultAccessForm] = useState({
    session: "",
    term: "",
  });
  const [broadsheetAccessForm, setBroadsheetAccessForm] = useState({
    broadsheet_session: "",
    broadsheet_term: "",
  });
  const [classResultAccessForm, setClassResultAccessForm] = useState({
    class_result_session: "",
    class_result_term: "",
  });
  const [editingResultId, setEditingResultId] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [resultPage, setResultPage] = useState(1);
  const [classResultPage, setClassResultPage] = useState(1);
  const [broadsheetPage, setBroadsheetPage] = useState(1);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadingBroadsheet, setUploadingBroadsheet] = useState(false);
  const [uploadingClassResult, setUploadingClassResult] = useState(false);
  const [savingStudentResultAccess, setSavingStudentResultAccess] =
    useState(false);
  const [savingBroadsheetAccess, setSavingBroadsheetAccess] = useState(false);
  const [savingClassResultAccess, setSavingClassResultAccess] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [summaryFilters, setSummaryFilters] = useState({
    session: "",
    term: "",
  });

  const fetchResults = async () => {
    const [resultsRequest, countRequest, summaryRequest] = await Promise.allSettled([
      API.get("/results", { params: { limit: PAGE_SIZE } }),
      API.get("/results/count"),
      API.get("/results"),
    ]);

    if (resultsRequest.status === "rejected") {
      throw resultsRequest.reason;
    }

    const response = resultsRequest.value;
    const resultRecords = response.data || [];
    const totalCount = await fetchResultTotalCount({
      countResponse:
        countRequest.status === "fulfilled" ? countRequest.value : null,
      listResponse: response,
    });

    setResults(resultRecords);
    setResultTotal(totalCount);
    if (summaryRequest.status === "fulfilled") {
      setResultSummaryRecords(summaryRequest.value.data || []);
    }
  };

  const fetchClassBroadsheets = async () => {
    const [response, summaryResponse] = await Promise.all([
      API.get("/class-broadsheets", {
        params: { limit: PAGE_SIZE },
      }),
      API.get("/class-broadsheets"),
    ]);
    setClassBroadsheets(response.data || []);
    setClassBroadsheetSummaryRecords(summaryResponse.data || []);
  };

  const fetchClassResults = async () => {
    const [response, summaryResponse] = await Promise.all([
      API.get("/class-results", {
        params: { limit: PAGE_SIZE },
      }),
      API.get("/class-results"),
    ]);
    setClassResults(response.data || []);
    setClassResultSummaryRecords(summaryResponse.data || []);
  };

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoadingStudents(true);

        const [
          studentsRequest,
          resultsRequest,
          resultCountRequest,
          classesRequest,
          broadsheetsRequest,
          classResultsRequest,
          teachersRequest,
          accessRequest,
          resultSummaryRequest,
          broadsheetSummaryRequest,
          classResultSummaryRequest,
        ] = await Promise.allSettled([
          API.get("/students"),
          API.get("/results", { params: { limit: PAGE_SIZE } }),
          API.get("/results/count"),
          API.get("/classes"),
          API.get("/class-broadsheets", { params: { limit: PAGE_SIZE } }),
          API.get("/class-results", { params: { limit: PAGE_SIZE } }),
          API.get("/teachers"),
          API.get("/result-access"),
          API.get("/results"),
          API.get("/class-broadsheets"),
          API.get("/class-results"),
        ]);

        if (studentsRequest.status === "rejected") {
          throw new Error(
            studentsRequest.reason?.response?.data?.message ||
              "Unable to load students for result upload."
          );
        }

        if (resultsRequest.status === "rejected") {
          throw new Error(
            resultsRequest.reason?.response?.data?.message ||
              "Unable to load result records."
          );
        }

        if (classesRequest.status === "rejected") {
          throw new Error(
            classesRequest.reason?.response?.data?.message ||
              "Unable to load class records."
          );
        }

        setStudents(studentsRequest.value.data || []);
        const resultRecords = resultsRequest.value.data || [];

        setResults(resultRecords);
        setResultSummaryRecords(
          resultSummaryRequest.status === "fulfilled"
            ? resultSummaryRequest.value.data || []
            : resultRecords
        );
        const totalCount = await fetchResultTotalCount({
          countResponse:
            resultCountRequest.status === "fulfilled"
              ? resultCountRequest.value
              : null,
          listResponse: resultsRequest.value,
        });

        setResultTotal(totalCount);
        setClasses(classesRequest.value.data || []);
        setClassBroadsheets(
          broadsheetsRequest.status === "fulfilled"
            ? broadsheetsRequest.value.data || []
            : []
        );
        setClassBroadsheetSummaryRecords(
          broadsheetSummaryRequest.status === "fulfilled"
            ? broadsheetSummaryRequest.value.data || []
            : broadsheetsRequest.status === "fulfilled"
              ? broadsheetsRequest.value.data || []
              : []
        );
        setClassResults(
          classResultsRequest.status === "fulfilled"
            ? classResultsRequest.value.data || []
            : []
        );
        setClassResultSummaryRecords(
          classResultSummaryRequest.status === "fulfilled"
            ? classResultSummaryRequest.value.data || []
            : classResultsRequest.status === "fulfilled"
              ? classResultsRequest.value.data || []
              : []
        );
        setTeachers(
          teachersRequest.status === "fulfilled"
            ? teachersRequest.value.data || []
            : []
        );
        if (accessRequest.status === "fulfilled") {
          setStudentResultAccessForm({
            session: accessRequest.value.data?.session || "",
            term: accessRequest.value.data?.term || "",
          });
          setBroadsheetAccessForm({
            broadsheet_session:
              accessRequest.value.data?.broadsheet_session || "",
            broadsheet_term: accessRequest.value.data?.broadsheet_term || "",
          });
          setClassResultAccessForm({
            class_result_session:
              accessRequest.value.data?.class_result_session || "",
            class_result_term:
              accessRequest.value.data?.class_result_term || "",
          });
        }
      } catch (error) {
        setStatus({
          type: "error",
          message:
            error.message ||
            error.response?.data?.message ||
            "Unable to load result upload records.",
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchPageData();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!resultForm.class_record || !resultForm.session || !resultForm.term) {
      return [];
    }

    const selectedClass = classes.find(
      (classRecord) => classRecord._id === resultForm.class_record
    );

    return sortStudentsByName(
      students.filter(
        (student) =>
          student.status === "active" &&
          studentBelongsToTermClass(
            student,
            selectedClass,
            resultForm.session,
            resultForm.term
          )
      )
    );
  }, [
    classes,
    resultForm.class_record,
    resultForm.session,
    resultForm.term,
    students,
  ]);

  const availableClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === resultForm.session
    );
  }, [classes, resultForm.session]);

  const broadsheetAvailableClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === broadsheetForm.session
    );
  }, [classes, broadsheetForm.session]);

  const broadsheetAvailableTeachers = useMemo(() => {
    if (!broadsheetForm.class_record || !broadsheetForm.session) {
      return [];
    }

    return teachers.filter((teacher) => {
      const teacherClassId =
        teacher.assigned_class_record?._id || teacher.assigned_class_record;

      return (
        teacher.status !== "inactive" &&
        isFormTeacher(teacher) &&
        teacher.session === broadsheetForm.session &&
        teacherClassId === broadsheetForm.class_record
      );
    });
  }, [broadsheetForm.class_record, broadsheetForm.session, teachers]);

  const classResultAvailableClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === classResultForm.session
    );
  }, [classes, classResultForm.session]);

  const classResultAvailableTeachers = useMemo(() => {
    if (!classResultForm.class_record || !classResultForm.session) {
      return [];
    }

    return teachers.filter((teacher) => {
      const teacherClassId =
        teacher.assigned_class_record?._id || teacher.assigned_class_record;

      return (
        teacher.status !== "inactive" &&
        isFormTeacher(teacher) &&
        teacher.session === classResultForm.session &&
        teacherClassId === classResultForm.class_record
      );
    });
  }, [classResultForm.class_record, classResultForm.session, teachers]);

  const filteredResults = useMemo(() => {
    const searchValue = resultSearch.trim().toLowerCase();
    const sourceResults =
      resultSummaryRecords.length > 0 ? resultSummaryRecords : results;

    if (!searchValue) {
      return sourceResults;
    }

    return sourceResults.filter((result) => {
      const studentName = result.student?.full_name || "";
      const admissionNo = result.student?.admission_no || "";
      const searchableText = [
        studentName,
        admissionNo,
        result.class,
        result.session,
        result.term,
        result.file_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [resultSearch, resultSummaryRecords, results]);

  useEffect(() => {
    setResultPage(1);
  }, [filteredResults.length, resultSearch]);

  const visibleResultPage = Math.min(
    resultPage,
    Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE))
  );
  const displayedResults = useMemo(
    () =>
      filteredResults.slice(
        (visibleResultPage - 1) * PAGE_SIZE,
        visibleResultPage * PAGE_SIZE
      ),
    [filteredResults, visibleResultPage]
  );

  const classResultRecordSource =
    classResultSummaryRecords.length > 0 ? classResultSummaryRecords : classResults;
  const visibleClassResultPage = Math.min(
    classResultPage,
    Math.max(1, Math.ceil(classResultRecordSource.length / PAGE_SIZE))
  );
  const displayedClassResults = useMemo(() => {
    return classResultRecordSource.slice(
      (visibleClassResultPage - 1) * PAGE_SIZE,
      visibleClassResultPage * PAGE_SIZE
    );
  }, [classResultRecordSource, visibleClassResultPage]);

  const broadsheetRecordSource =
    classBroadsheetSummaryRecords.length > 0
      ? classBroadsheetSummaryRecords
      : classBroadsheets;
  const visibleBroadsheetPage = Math.min(
    broadsheetPage,
    Math.max(1, Math.ceil(broadsheetRecordSource.length / PAGE_SIZE))
  );
  const displayedClassBroadsheets = useMemo(() => {
    return broadsheetRecordSource.slice(
      (visibleBroadsheetPage - 1) * PAGE_SIZE,
      visibleBroadsheetPage * PAGE_SIZE
    );
  }, [broadsheetRecordSource, visibleBroadsheetPage]);

  useEffect(() => {
    setClassResultPage(1);
  }, [classResultRecordSource.length]);

  useEffect(() => {
    setBroadsheetPage(1);
  }, [broadsheetRecordSource.length]);

  const resultSummarySessions = useMemo(() => {
    return [
      ...new Set(
        [
          ...resultSummaryRecords.map((result) => result.session),
          ...classBroadsheetSummaryRecords.map((result) => result.session),
          ...classResultSummaryRecords.map((result) => result.session),
        ].filter(Boolean)
      ),
    ].sort();
  }, [
    classBroadsheetSummaryRecords,
    classResultSummaryRecords,
    resultSummaryRecords,
  ]);

  const matchesSummaryFilter = (record, { includeTerm = true } = {}) => {
    const matchesSession =
      !summaryFilters.session || record.session === summaryFilters.session;
    const matchesTerm =
      !includeTerm ||
      !summaryFilters.term ||
      record.term === summaryFilters.term;

    return matchesSession && matchesTerm;
  };

  const resultSummaryItems = [
    {
      label: "Term Results",
      value: resultSummaryRecords.filter((result) => matchesSummaryFilter(result)).length,
      icon: <FaClipboardCheck />,
    },
    {
      label: "Class Broadsheets",
      value: classBroadsheetSummaryRecords.filter((result) => matchesSummaryFilter(result)).length,
      icon: <FaBookOpen />,
    },
    {
      label: "Class Results",
      value: classResultSummaryRecords.filter((result) => matchesSummaryFilter(result)).length,
      icon: <FaLayerGroup />,
    },
  ];

  const handleSummaryFilterChange = (event) => {
    const { name, value } = event.target;

    setSummaryFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
      ...(name === "session"
        ? { term: normalizeTermForSession(currentFilters.term, value) }
        : {}),
    }));
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "session") {
      setResultForm((currentForm) => ({
        ...currentForm,
        session: value,
        class: "",
        class_record: "",
        term: normalizeTermForSession(currentForm.term, value),
        studentId: editingResultId ? currentForm.studentId : "",
      }));
      return;
    }

    if (name === "class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setResultForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        class: selectedClass?.name || "",
        studentId: editingResultId ? currentForm.studentId : "",
      }));
      return;
    }

    setResultForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleBroadsheetChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "session") {
      setBroadsheetForm((currentForm) => ({
        ...currentForm,
        session: value,
        class: "",
        class_record: "",
        term: normalizeTermForSession(currentForm.term, value),
        assigned_teacher: "",
      }));
      return;
    }

    if (name === "class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setBroadsheetForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        class: selectedClass?.name || "",
        assigned_teacher: "",
      }));
      return;
    }

    setBroadsheetForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleBroadsheetAccessChange = (event) => {
    const { name, value } = event.target;

    setBroadsheetAccessForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "broadsheet_session"
        ? {
            broadsheet_term: normalizeTermForSession(
              currentForm.broadsheet_term,
              value
            ),
          }
        : {}),
    }));
  };

  const handleStudentResultAccessChange = (event) => {
    const { name, value } = event.target;

    setStudentResultAccessForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "session"
        ? { term: normalizeTermForSession(currentForm.term, value) }
        : {}),
    }));
  };

  const handleClassResultChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "session") {
      setClassResultForm((currentForm) => ({
        ...currentForm,
        session: value,
        class: "",
        class_record: "",
        term: normalizeTermForSession(currentForm.term, value),
        assigned_teacher: "",
      }));
      return;
    }

    if (name === "class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setClassResultForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        class: selectedClass?.name || "",
        assigned_teacher: "",
      }));
      return;
    }

    setClassResultForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleClassResultAccessChange = (event) => {
    const { name, value } = event.target;

    setClassResultAccessForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "class_result_session"
        ? {
            class_result_term: normalizeTermForSession(
              currentForm.class_result_term,
              value
            ),
          }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);
    setStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("studentId", resultForm.studentId);
      formData.append("session", resultForm.session);
      formData.append("term", resultForm.term);
      formData.append("class", resultForm.class);
      formData.append("class_record", resultForm.class_record);
      formData.append("pdf", resultForm.pdf);

      const endpoint = editingResultId
        ? `/results/${editingResultId}`
        : "/results/upload";
      const request = editingResultId ? API.put : API.post;

      await request(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResultForm(initialResultForm);
      setEditingResultId("");
      event.target.reset();
      await fetchResults();
      setStatus({
        type: "success",
        message: editingResultId
          ? "Result updated successfully."
          : "Result PDF uploaded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to upload result.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBroadsheetSubmit = async (event) => {
    event.preventDefault();
    setUploadingBroadsheet(true);
    setStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("session", broadsheetForm.session);
      formData.append("term", broadsheetForm.term);
      formData.append("class_record", broadsheetForm.class_record);
      formData.append("assigned_teacher", broadsheetForm.assigned_teacher);
      formData.append("pdf", broadsheetForm.pdf);

      await API.post("/class-broadsheets/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setBroadsheetForm(initialBroadsheetForm);
      event.target.reset();
      await fetchClassBroadsheets();
      setStatus({
        type: "success",
        message: "Class broadsheet uploaded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to upload class broadsheet.",
      });
    } finally {
      setUploadingBroadsheet(false);
    }
  };

  const handleStudentResultAccessSubmit = async (event) => {
    event.preventDefault();
    setSavingStudentResultAccess(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.put(
        "/result-access",
        studentResultAccessForm
      );
      setStudentResultAccessForm({
        session: response.data.session || "",
        term: response.data.term || "",
      });
      setStatus({
        type: "success",
        message: "Student result access updated successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update student result access.",
      });
    } finally {
      setSavingStudentResultAccess(false);
    }
  };

  const handleBroadsheetAccessSubmit = async (event) => {
    event.preventDefault();
    setSavingBroadsheetAccess(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.put(
        "/result-access/broadsheet",
        broadsheetAccessForm
      );
      setBroadsheetAccessForm({
        broadsheet_session: response.data.broadsheet_session || "",
        broadsheet_term: response.data.broadsheet_term || "",
      });
      setStatus({
        type: "success",
        message: "Teacher broadsheet access updated successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update teacher broadsheet access.",
      });
    } finally {
      setSavingBroadsheetAccess(false);
    }
  };

  const handleClassResultSubmit = async (event) => {
    event.preventDefault();
    setUploadingClassResult(true);
    setStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("session", classResultForm.session);
      formData.append("term", classResultForm.term);
      formData.append("class_record", classResultForm.class_record);
      formData.append("assigned_teacher", classResultForm.assigned_teacher);
      formData.append("pdf", classResultForm.pdf);

      await API.post("/class-results/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setClassResultForm(initialClassResultForm);
      event.target.reset();
      await fetchClassResults();
      setStatus({
        type: "success",
        message: "Class result uploaded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to upload class result.",
      });
    } finally {
      setUploadingClassResult(false);
    }
  };

  const handleClassResultAccessSubmit = async (event) => {
    event.preventDefault();
    setSavingClassResultAccess(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.put(
        "/result-access/class-result",
        classResultAccessForm
      );
      setClassResultAccessForm({
        class_result_session: response.data.class_result_session || "",
        class_result_term: response.data.class_result_term || "",
      });
      setStatus({
        type: "success",
        message: "Teacher class result access updated successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update teacher class result access.",
      });
    } finally {
      setSavingClassResultAccess(false);
    }
  };

  const handleEdit = (result) => {
    setEditingResultId(result._id);
    setResultForm({
      studentId: result.student?._id || result.student || "",
      session: result.session || "",
      term: result.term || "",
      class: result.class || "",
      class_record:
        classes.find(
          (classRecord) =>
            classRecord.name === result.class &&
            classRecord.session === result.session
        )?._id || "",
      pdf: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingResultId("");
    setResultForm(initialResultForm);
  };

  const handleDeleteRequest = (result, type = "termly") => {
    setDeleteTarget({
      ...result,
      deleteType: type
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    setDeleting(true);
    try {
      if (deleteTarget.deleteType === "broadsheet") {
        await API.delete(`/class-broadsheets/${deleteTarget._id}`);
      } else if (deleteTarget.deleteType === "class-result") {
        await API.delete(`/class-results/${deleteTarget._id}`);
      } else {
        await API.delete(`/results/${deleteTarget._id}`);
      }
      setStatus({
        type: "success",
        message:
          deleteTarget.deleteType === "broadsheet"
              ? "Class broadsheet deleted successfully."
            : deleteTarget.deleteType === "class-result"
              ? "Class result deleted successfully."
            : "Result deleted successfully.",
      });
      setDeleteTarget(null);
      if (deleteTarget.deleteType === "broadsheet") {
        await fetchClassBroadsheets();
      } else if (deleteTarget.deleteType === "class-result") {
        await fetchClassResults();
      } else {
        await fetchResults();
      }
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete result.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  return (
    <div className="px-6 py-8 lg:px-10">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.deleteType === "broadsheet"
              ? "Delete Class Broadsheet"
            : deleteTarget?.deleteType === "class-result"
              ? "Delete Class Result"
            : "Delete Result"
        }
        message={
          deleteTarget?.deleteType === "broadsheet"
              ? "This action will permanently remove this uploaded class broadsheet PDF record from the system."
            : deleteTarget?.deleteType === "class-result"
              ? "This action will permanently remove this uploaded class result PDF record from the system."
            : "This action will permanently remove this uploaded result PDF record from the system."
        }
        details={
          deleteTarget
            ? `${deleteTarget.student?.full_name || deleteTarget.class || "Unknown record"} - ${deleteTarget.session}${deleteTarget.term ? ` - ${deleteTarget.term}` : ""}`
            : ""
        }
        confirmLabel={
          deleteTarget?.deleteType === "broadsheet"
              ? "Delete Class Broadsheet"
            : deleteTarget?.deleteType === "class-result"
              ? "Delete Class Result"
            : "Delete Result"
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaClipboardCheck />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">
          Result Uploads
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Upload PDF result files and link them to the correct student,
          session, term, and class.
        </p>
      </div>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg lg:p-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              {editingResultId ? "Edit Result" : "Upload Result PDF"}
            </h3>
            <p className="mt-3 text-primary/70">
              The backend accepts PDF files up to 5MB and stores them securely in
              the database.
            </p>

            <form onSubmit={handleSubmit} className="mt-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <input
              className={inputClass}
              name="session"
              value={resultForm.session}
              onChange={handleChange}
              placeholder="Session e.g. 2025/2026"
              required
            />
            <select
              className={inputClass}
              name="term"
              value={resultForm.term}
              onChange={handleChange}
              required
            >
              <option value="">Select term</option>
              {getVisibleTermsForSession(resultForm.session).map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              name="class_record"
              value={resultForm.class_record}
              onChange={handleChange}
              disabled={!resultForm.session}
              required
            >
              <option value="">
                {resultForm.session ? "Select class" : "Enter session first"}
              </option>
              {availableClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>
            {resultForm.session && availableClasses.length === 0 && (
              <p className="text-sm font-semibold text-primary/60">
                No class has been created for this session yet.
              </p>
            )}

            <select
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              name="studentId"
              value={resultForm.studentId}
              onChange={handleChange}
              disabled={
                !resultForm.class_record ||
                !resultForm.term ||
                loadingStudents
              }
              required
            >
              <option value="">
                {loadingStudents
                  ? "Loading students..."
                  : resultForm.class_record && resultForm.term
                    ? "Select student"
                    : "Select class and term first"}
              </option>
              {filteredStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.full_name} - {student.admission_no}
                </option>
              ))}
            </select>

            <input
              className={inputClass}
              name="pdf"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
              required={!editingResultId}
            />
          </div>

              <button
                type="submit"
                disabled={uploading || filteredStudents.length === 0}
                className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading
                  ? editingResultId
                    ? "Saving result..."
                    : "Uploading result..."
                  : editingResultId
                    ? "Save Result"
                    : "Upload Result"}
                {!uploading && <FaArrowRight />}
              </button>
              {editingResultId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="mt-4 w-full rounded-lg bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          <form
            onSubmit={handleStudentResultAccessSubmit}
            className="rounded-lg bg-primary/5 p-6"
          >
            <h4 className="text-2xl font-extrabold text-primary">
              Student Result Access
            </h4>
            <p className="mt-2 text-primary/70">
              Control the session and term students can access in their portal.
            </p>

            <div className="mt-6 space-y-4">
              <input
                className={inputClass}
                name="session"
                value={studentResultAccessForm.session}
                onChange={handleStudentResultAccessChange}
                placeholder="Approved session e.g. 2025/2026"
                required
              />
              <select
                className={inputClass}
                name="term"
                value={studentResultAccessForm.term}
                onChange={handleStudentResultAccessChange}
                required
              >
                <option value="">Approved term</option>
                {getVisibleTermsForSession(studentResultAccessForm.session).map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={savingStudentResultAccess}
              className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingStudentResultAccess
                ? "Saving access..."
                : "Save Result Access"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg lg:p-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Upload Class Broadsheet PDF
            </h3>
            <p className="mt-3 text-primary/70">
              Upload a class broadsheet to a selected form teacher destination.
            </p>

            <form onSubmit={handleBroadsheetSubmit} className="mt-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <input
                  className={inputClass}
                  name="session"
                  value={broadsheetForm.session}
                  onChange={handleBroadsheetChange}
                  placeholder="Session e.g. 2025/2026"
                  required
                />

                <select
                  className={inputClass}
                  name="term"
                  value={broadsheetForm.term}
                  onChange={handleBroadsheetChange}
                  required
                >
                  <option value="">Select term</option>
                  {getVisibleTermsForSession(broadsheetForm.session).map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>

                <select
                  className={inputClass}
                  name="class_record"
                  value={broadsheetForm.class_record}
                  onChange={handleBroadsheetChange}
                  disabled={!broadsheetForm.session}
                  required
                >
                  <option value="">
                    {broadsheetForm.session ? "Select class" : "Enter session first"}
                  </option>
                  {broadsheetAvailableClasses.map((classRecord) => (
                    <option key={classRecord._id} value={classRecord._id}>
                      {classRecord.name.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  className={inputClass}
                  name="assigned_teacher"
                  value={broadsheetForm.assigned_teacher}
                  onChange={handleBroadsheetChange}
                  disabled={!broadsheetForm.class_record}
                  required
                >
                  <option value="">
                    {broadsheetForm.class_record
                      ? "Select form teacher destination"
                      : "Select class first"}
                  </option>
                  {broadsheetAvailableTeachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.full_name} - {teacher.username}
                    </option>
                  ))}
                </select>

                <input
                  className={inputClass}
                  name="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handleBroadsheetChange}
                  required
                />
              </div>

              {broadsheetForm.session && broadsheetAvailableClasses.length === 0 && (
                <p className="mt-4 text-sm font-semibold text-primary/60">
                  No class has been created for this session yet.
                </p>
              )}
              {broadsheetForm.class_record &&
                broadsheetAvailableTeachers.length === 0 && (
                  <p className="mt-4 text-sm font-semibold text-primary/60">
                    No form teacher is assigned to this class/session yet.
                  </p>
                )}

              <button
                type="submit"
                disabled={
                  uploadingBroadsheet ||
                  !broadsheetForm.class_record ||
                  !broadsheetForm.assigned_teacher ||
                  !broadsheetForm.pdf
                }
                className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploadingBroadsheet
                  ? "Uploading broadsheet..."
                  : "Upload Class Broadsheet"}
                {!uploadingBroadsheet && <FaArrowRight />}
              </button>
            </form>
          </div>

          <form
            onSubmit={handleBroadsheetAccessSubmit}
            className="rounded-lg bg-primary/5 p-6"
          >
            <h4 className="text-2xl font-extrabold text-primary">
              Teacher Broadsheet Access
            </h4>
            <p className="mt-2 text-primary/70">
              Control the session and term teachers can access in their portal.
            </p>

            <div className="mt-6 space-y-4">
              <input
                className={inputClass}
                name="broadsheet_session"
                value={broadsheetAccessForm.broadsheet_session}
                onChange={handleBroadsheetAccessChange}
                placeholder="Approved session e.g. 2025/2026"
                required
              />
              <select
                className={inputClass}
                name="broadsheet_term"
                value={broadsheetAccessForm.broadsheet_term}
                onChange={handleBroadsheetAccessChange}
                required
              >
                <option value="">Approved term</option>
                {getVisibleTermsForSession(broadsheetAccessForm.broadsheet_session).map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={savingBroadsheetAccess}
              className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingBroadsheetAccess ? "Saving access..." : "Save Broadsheet Access"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg lg:p-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Upload Class Result PDF
            </h3>
            <p className="mt-3 text-primary/70">
              Upload a class result to the form teacher who owns that class for
              the selected session and term.
            </p>

            <form onSubmit={handleClassResultSubmit} className="mt-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <input
                  className={inputClass}
                  name="session"
                  value={classResultForm.session}
                  onChange={handleClassResultChange}
                  placeholder="Session e.g. 2025/2026"
                  required
                />

                <select
                  className={inputClass}
                  name="term"
                  value={classResultForm.term}
                  onChange={handleClassResultChange}
                  required
                >
                  <option value="">Select term</option>
                  {getVisibleTermsForSession(classResultForm.session).map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>

                <select
                  className={inputClass}
                  name="class_record"
                  value={classResultForm.class_record}
                  onChange={handleClassResultChange}
                  disabled={!classResultForm.session}
                  required
                >
                  <option value="">
                    {classResultForm.session ? "Select class" : "Enter session first"}
                  </option>
                  {classResultAvailableClasses.map((classRecord) => (
                    <option key={classRecord._id} value={classRecord._id}>
                      {classRecord.name.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  className={inputClass}
                  name="assigned_teacher"
                  value={classResultForm.assigned_teacher}
                  onChange={handleClassResultChange}
                  disabled={!classResultForm.class_record}
                  required
                >
                  <option value="">
                    {classResultForm.class_record
                      ? "Select form teacher owner"
                      : "Select class first"}
                  </option>
                  {classResultAvailableTeachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.full_name} - {teacher.username}
                    </option>
                  ))}
                </select>

                <input
                  className={inputClass}
                  name="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handleClassResultChange}
                  required
                />
              </div>

              {classResultForm.session && classResultAvailableClasses.length === 0 && (
                <p className="mt-4 text-sm font-semibold text-primary/60">
                  No class has been created for this session yet.
                </p>
              )}
              {classResultForm.class_record &&
                classResultAvailableTeachers.length === 0 && (
                  <p className="mt-4 text-sm font-semibold text-primary/60">
                    No form teacher is assigned to this class/session yet.
                  </p>
                )}

              <button
                type="submit"
                disabled={
                  uploadingClassResult ||
                  !classResultForm.class_record ||
                  !classResultForm.assigned_teacher ||
                  !classResultForm.pdf
                }
                className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploadingClassResult
                  ? "Uploading class result..."
                  : "Upload Class Result"}
                {!uploadingClassResult && <FaArrowRight />}
              </button>
            </form>
          </div>

          <form
            onSubmit={handleClassResultAccessSubmit}
            className="rounded-lg bg-primary/5 p-6"
          >
            <h4 className="text-2xl font-extrabold text-primary">
              Teacher Class Result Access
            </h4>
            <p className="mt-2 text-primary/70">
              Control the class result session and term teachers can access.
            </p>

            <div className="mt-6 space-y-4">
              <input
                className={inputClass}
                name="class_result_session"
                value={classResultAccessForm.class_result_session}
                onChange={handleClassResultAccessChange}
                placeholder="Approved session e.g. 2025/2026"
                required
              />
              <select
                className={inputClass}
                name="class_result_term"
                value={classResultAccessForm.class_result_term}
                onChange={handleClassResultAccessChange}
                required
              >
                <option value="">Approved term</option>
                {getVisibleTermsForSession(classResultAccessForm.class_result_session).map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={savingClassResultAccess}
              className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingClassResultAccess
                ? "Saving access..."
                : "Save Class Result Access"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-5">
            <h3 className="text-3xl font-extrabold text-primary">
              Result Records
            </h3>
            <p className="mt-2 text-primary/70">
              Showing 15 uploads per page. Use search to filter these records.
            </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[360px]">
          <input
            value={resultSearch}
            onChange={(event) => setResultSearch(event.target.value)}
            placeholder="Search result records"
            className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loadingStudents ? (
                <TableSkeleton columns={6} />
              ) : displayedResults.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="6">
                    {resultSearch
                      ? "No result record matches your search."
                      : "No result records yet."}
                  </td>
                </tr>
              ) : (
                displayedResults.map((result, index) => (
                  <tr key={result._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {(visibleResultPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {result.student?.full_name || "Unknown"}
                    </td>
                    <td className="px-5 py-4">{result.class}</td>
                    <td className="px-5 py-4">{result.session}</td>
                    <td className="px-5 py-4">{result.term}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(result)}
                          className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(result)}
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
        <PaginationControls
          currentPage={visibleResultPage}
          totalItems={filteredResults.length}
          pageSize={PAGE_SIZE}
          onPageChange={setResultPage}
        />
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Recent Class Results
          </h3>
          <p className="mt-2 text-primary/70">
            Showing 15 class result uploads per page.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Form Teacher</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Uploaded</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loadingStudents ? (
                <TableSkeleton columns={7} />
              ) : displayedClassResults.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
                    No class result uploads yet.
                  </td>
                </tr>
              ) : (
                displayedClassResults.map((classResult, index) => (
                  <tr key={classResult._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {(visibleClassResultPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {classResult.class?.toUpperCase() || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      {classResult.assigned_teacher?.full_name || "Not set"}
                    </td>
                    <td className="px-5 py-4">{classResult.session}</td>
                    <td className="px-5 py-4">{classResult.term}</td>
                    <td className="px-5 py-4">
                      {classResult.createdAt
                        ? new Date(classResult.createdAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(classResult, "class-result")}
                        className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200"
                      >
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
          currentPage={visibleClassResultPage}
          totalItems={classResultRecordSource.length}
          pageSize={PAGE_SIZE}
          onPageChange={setClassResultPage}
        />
      </section>

      <section className="mt-8 rounded-lg bg-secondary p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Recent Class Broadsheets
          </h3>
          <p className="mt-2 text-primary/70">
            Showing 15 class broadsheet uploads per page.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-primary/10">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Form Teacher</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Uploaded</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {loadingStudents ? (
                <TableSkeleton columns={7} />
              ) : displayedClassBroadsheets.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
                    No class broadsheet uploads yet.
                  </td>
                </tr>
              ) : (
                displayedClassBroadsheets.map((broadsheet, index) => (
                  <tr key={broadsheet._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {(visibleBroadsheetPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {broadsheet.class?.toUpperCase() || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      {broadsheet.assigned_teacher?.full_name || "Not set"}
                    </td>
                    <td className="px-5 py-4">{broadsheet.session}</td>
                    <td className="px-5 py-4">{broadsheet.term}</td>
                    <td className="px-5 py-4">
                      {broadsheet.createdAt
                        ? new Date(broadsheet.createdAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(broadsheet, "broadsheet")}
                        className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200"
                      >
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
          currentPage={visibleBroadsheetPage}
          totalItems={broadsheetRecordSource.length}
          pageSize={PAGE_SIZE}
          onPageChange={setBroadsheetPage}
        />
      </section>
    </div>
  );
}

export default UploadResult;

