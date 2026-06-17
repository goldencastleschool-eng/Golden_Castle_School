import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaGraduationCap,
  FaLayerGroup,
  FaSchool,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import PaginationControls from "../../components/common/PaginationControls.jsx";
import {
  CLASS_SECTION_OPTIONS,
  formatClassSection,
  getClassSection,
  inferClassSection,
} from "../../utils/classSections.js";
import {
  getPrintBrandHeader,
  getPrintBrandStyles,
} from "../../utils/printBranding.js";
import {
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";
import { sortStudentsByName } from "../../utils/students.js";

const DEFAULT_SESSION_FILTER = "2025/2026";
const PAGE_SIZE = 15;

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

const UNSECTIONED_CLASS_GROUP = "unsectioned";

const sortClassRecords = (classRecords = []) =>
  [...classRecords].sort((firstClass, secondClass) => {
    const sessionCompare = (secondClass.session || "").localeCompare(
      firstClass.session || ""
    );

    if (sessionCompare !== 0) {
      return sessionCompare;
    }

    return (firstClass.name || "").localeCompare(secondClass.name || "");
  });

function ClassManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessionFilter, setSessionFilter] = useState(DEFAULT_SESSION_FILTER);
  const [studentViewSessionFilter, setStudentViewSessionFilter] = useState(
    DEFAULT_SESSION_FILTER
  );
  const [studentViewClassId, setStudentViewClassId] = useState("");
  const [studentNameSort, setStudentNameSort] = useState("az");
  const [className, setClassName] = useState("");
  const [classSession, setClassSession] = useState(DEFAULT_SESSION_FILTER);
  const [classSection, setClassSection] = useState("");
  const [editingClassId, setEditingClassId] = useState("");
  const [promotionForm, setPromotionForm] = useState({
    sourceSession: DEFAULT_SESSION_FILTER,
    fromClassRecord: "",
    fromClass: "",
    fromSession: "",
    toClassRecord: "",
    toClass: "",
    toSession: "",
    targetFeeTerm: "",
  });
  const [leftSchoolActionForm, setLeftSchoolActionForm] = useState({
    sourceSession: DEFAULT_SESSION_FILTER,
    fromClassRecord: "",
    fromClass: "",
    fromSession: "",
    leftSession: DEFAULT_SESSION_FILTER,
    leftTerm: "",
  });
  const [graduateFilter, setGraduateFilter] = useState({
    session: "",
    search: "",
  });
  const [leftSchoolFilter, setLeftSchoolFilter] = useState({
    session: DEFAULT_SESSION_FILTER,
    term: "",
    search: "",
  });
  const [selectedPromotionStudentIds, setSelectedPromotionStudentIds] = useState([]);
  const [selectedLeftSchoolStudentIds, setSelectedLeftSchoolStudentIds] = useState([]);
  const [classStudentPage, setClassStudentPage] = useState(1);
  const [graduatePage, setGraduatePage] = useState(1);
  const [leftSchoolPage, setLeftSchoolPage] = useState(1);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [promoting, setPromoting] = useState(false);
  const [graduating, setGraduating] = useState(false);
  const [markingLeftSchool, setMarkingLeftSchool] = useState(false);
  const [restoringGraduateId, setRestoringGraduateId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClassData = async () => {
    try {
      setLoadingStudents(true);
      const [studentsResponse, classesResponse] = await Promise.all([
        API.get("/students"),
        API.get("/classes"),
      ]);
      setStudents(studentsResponse.data || []);
      setClasses(classesResponse.data || []);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          "Unable to load class records.",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, []);

  const sessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_SESSION_FILTER,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
      ]),
    ].sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((classRecord) => classRecord.session === sessionFilter);
  }, [classes, sessionFilter]);

  const groupedClassRecords = useMemo(() => {
    const sectionGroups = [
      ...CLASS_SECTION_OPTIONS.map((sectionOption) => ({
        ...sectionOption,
        classes: [],
      })),
      {
        value: UNSECTIONED_CLASS_GROUP,
        label: "Unsectioned",
        classes: [],
      },
    ];

    filteredClasses.forEach((classRecord) => {
      const section = getClassSection(classRecord) || UNSECTIONED_CLASS_GROUP;
      const sectionGroup =
        sectionGroups.find((group) => group.value === section) ||
        sectionGroups[sectionGroups.length - 1];

      sectionGroup.classes.push(classRecord);
    });

    return sectionGroups.filter((sectionGroup) => sectionGroup.classes.length > 0);
  }, [filteredClasses]);

  const studentViewClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === studentViewSessionFilter
    );
  }, [classes, studentViewSessionFilter]);

  const classStudents = useMemo(() => {
    const selectedClassRecord = classes.find(
      (classRecord) =>
        classRecord._id === studentViewClassId &&
        classRecord.session === studentViewSessionFilter
    );

    if (!selectedClassRecord) {
      return [];
    }

    return students.filter(
      (student) =>
        isActiveStudent(student) &&
        normalizeClassName(student.class) ===
          normalizeClassName(selectedClassRecord.name) &&
        student.current_session === selectedClassRecord.session
    );
  }, [classes, studentViewClassId, studentViewSessionFilter, students]);

  const selectedClassRecord = classes.find(
    (classRecord) =>
      classRecord._id === studentViewClassId &&
      classRecord.session === studentViewSessionFilter
  );

  const sortedClassStudents = useMemo(() => {
    return [...classStudents].sort((firstStudent, secondStudent) => {
      const firstName = (firstStudent.full_name || "").toLowerCase();
      const secondName = (secondStudent.full_name || "").toLowerCase();

      return studentNameSort === "za"
        ? secondName.localeCompare(firstName)
        : firstName.localeCompare(secondName);
    });
  }, [classStudents, studentNameSort]);
  useEffect(() => {
    setClassStudentPage(1);
  }, [studentViewClassId, studentViewSessionFilter, sortedClassStudents.length]);

  const visibleClassStudentPage = Math.min(
    classStudentPage,
    Math.max(1, Math.ceil(sortedClassStudents.length / PAGE_SIZE))
  );
  const displayedClassStudents = useMemo(
    () =>
      sortedClassStudents.slice(
        (visibleClassStudentPage - 1) * PAGE_SIZE,
        visibleClassStudentPage * PAGE_SIZE
      ),
    [sortedClassStudents, visibleClassStudentPage]
  );

  const promotionSessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_SESSION_FILTER,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
      ]),
    ].sort();
  }, [classes]);

  const promotionSourceClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === promotionForm.sourceSession
    );
  }, [classes, promotionForm.sourceSession]);

  const promotionDestinationClasses = useMemo(() => {
    if (!promotionForm.toSession) {
      return [];
    }

    return classes.filter(
      (classRecord) => classRecord.session === promotionForm.toSession
    );
  }, [classes, promotionForm.toSession]);

  const leftSchoolSourceClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === leftSchoolActionForm.sourceSession
    );
  }, [classes, leftSchoolActionForm.sourceSession]);

  const promotionCandidates = useMemo(() => {
    if (!promotionForm.fromClassRecord) {
      return [];
    }

    const selectedClass = classes.find(
      (classRecord) => classRecord._id === promotionForm.fromClassRecord
    );

    if (!selectedClass) {
      return [];
    }

    return sortStudentsByName(
      students.filter(
        (student) =>
          isActiveStudent(student) &&
          ((student.class_record?._id || student.class_record) === selectedClass._id ||
            (normalizeClassName(student.class) === normalizeClassName(selectedClass.name) &&
              student.current_session === selectedClass.session))
      )
    );
  }, [classes, promotionForm.fromClassRecord, students]);

  const leftSchoolCandidates = useMemo(() => {
    if (!leftSchoolActionForm.fromClassRecord) {
      return [];
    }

    const selectedClass = classes.find(
      (classRecord) => classRecord._id === leftSchoolActionForm.fromClassRecord
    );

    if (!selectedClass) {
      return [];
    }

    return sortStudentsByName(
      students.filter(
        (student) =>
          isActiveStudent(student) &&
          ((student.class_record?._id || student.class_record) === selectedClass._id ||
            (normalizeClassName(student.class) === normalizeClassName(selectedClass.name) &&
              student.current_session === selectedClass.session))
      )
    );
  }, [classes, leftSchoolActionForm.fromClassRecord, students]);

  const graduatedStudents = useMemo(() => {
    return students
      .filter((student) => student.status === "graduated")
      .sort((firstStudent, secondStudent) => {
        return (
          new Date(secondStudent.graduated_at || secondStudent.updatedAt || 0) -
          new Date(firstStudent.graduated_at || firstStudent.updatedAt || 0)
        );
      });
  }, [students]);

  const filteredGraduatedStudents = useMemo(() => {
    const searchValue = graduateFilter.search.trim().toLowerCase();

    return graduatedStudents
      .filter((student) => {
        const matchesSession =
          !graduateFilter.session ||
          student.graduation_session === graduateFilter.session;
        const searchableText = [
          student.full_name,
          student.admission_no,
          student.graduation_class,
          student.graduation_session,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return matchesSession && (!searchValue || searchableText.includes(searchValue));
      });
  }, [graduateFilter.search, graduateFilter.session, graduatedStudents]);

  useEffect(() => {
    setGraduatePage(1);
  }, [filteredGraduatedStudents.length, graduateFilter.search, graduateFilter.session]);

  const visibleGraduatePage = Math.min(
    graduatePage,
    Math.max(1, Math.ceil(filteredGraduatedStudents.length / PAGE_SIZE))
  );
  const displayedGraduatedStudents = useMemo(
    () =>
      filteredGraduatedStudents.slice(
        (visibleGraduatePage - 1) * PAGE_SIZE,
        visibleGraduatePage * PAGE_SIZE
      ),
    [filteredGraduatedStudents, visibleGraduatePage]
  );

  const leftSchoolStudents = useMemo(() => {
    return students
      .filter((student) => student.status === "left")
      .sort((firstStudent, secondStudent) => {
        return (
          new Date(secondStudent.left_at || secondStudent.updatedAt || 0) -
          new Date(firstStudent.left_at || firstStudent.updatedAt || 0)
        );
      });
  }, [students]);

  const filteredLeftSchoolStudents = useMemo(() => {
    const searchValue = leftSchoolFilter.search.trim().toLowerCase();

    return leftSchoolStudents
      .filter((student) => {
        const matchesSession =
          !leftSchoolFilter.session ||
          student.left_session === leftSchoolFilter.session;
        const matchesTerm =
          !leftSchoolFilter.term ||
          student.left_term === leftSchoolFilter.term;
        const searchableText = [
          student.full_name,
          student.admission_no,
          student.left_class,
          student.left_session,
          student.left_term,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          matchesSession &&
          matchesTerm &&
          (!searchValue || searchableText.includes(searchValue))
        );
      });
  }, [
    leftSchoolFilter.search,
    leftSchoolFilter.session,
    leftSchoolFilter.term,
    leftSchoolStudents,
  ]);

  useEffect(() => {
    setLeftSchoolPage(1);
  }, [
    filteredLeftSchoolStudents.length,
    leftSchoolFilter.search,
    leftSchoolFilter.session,
    leftSchoolFilter.term,
  ]);

  const visibleLeftSchoolPage = Math.min(
    leftSchoolPage,
    Math.max(1, Math.ceil(filteredLeftSchoolStudents.length / PAGE_SIZE))
  );
  const displayedLeftSchoolStudents = useMemo(
    () =>
      filteredLeftSchoolStudents.slice(
        (visibleLeftSchoolPage - 1) * PAGE_SIZE,
        visibleLeftSchoolPage * PAGE_SIZE
      ),
    [filteredLeftSchoolStudents, visibleLeftSchoolPage]
  );

  const allPromotionCandidatesSelected =
    promotionCandidates.length > 0 &&
    selectedPromotionStudentIds.length === promotionCandidates.length;

  const allLeftSchoolCandidatesSelected =
    leftSchoolCandidates.length > 0 &&
    selectedLeftSchoolStudentIds.length === leftSchoolCandidates.length;

  const handleSessionFilterChange = (event) => {
    const nextSession = event.target.value;

    setSessionFilter(nextSession);

    if (!editingClassId) {
      setClassSession(nextSession);
    }
  };

  const handleStudentViewSessionChange = (event) => {
    setStudentViewSessionFilter(event.target.value);
    setStudentViewClassId("");
  };

  const handlePromotionChange = (event) => {
    const { name, value } = event.target;

    if (name === "sourceSession") {
      setPromotionForm((currentForm) => ({
        ...currentForm,
        sourceSession: value,
        fromClassRecord: "",
        fromClass: "",
        fromSession: value,
      }));
      setSelectedPromotionStudentIds([]);
      return;
    }

    if (name === "fromClassRecord") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setPromotionForm((currentForm) => ({
        ...currentForm,
        fromClassRecord: value,
        fromClass: selectedClass?.name || "",
        fromSession: selectedClass?.session || "",
      }));
      setSelectedPromotionStudentIds([]);
      return;
    }

    if (name === "toSession") {
      setPromotionForm((currentForm) => ({
        ...currentForm,
        toSession: value,
        toClassRecord: "",
        toClass: "",
        targetFeeTerm: normalizeTermForSession(
          currentForm.targetFeeTerm,
          value
        ),
      }));
      return;
    }

    if (name === "toClassRecord") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setPromotionForm((currentForm) => ({
        ...currentForm,
        toClassRecord: value,
        toClass: selectedClass?.name || "",
        toSession: selectedClass?.session || currentForm.toSession,
      }));
      return;
    }

    setPromotionForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handlePromotionStudentToggle = (studentId) => {
    setSelectedPromotionStudentIds((currentIds) =>
      currentIds.includes(studentId)
        ? currentIds.filter((currentId) => currentId !== studentId)
        : [...currentIds, studentId]
    );
  };

  const handleLeftSchoolChange = (event) => {
    const { name, value } = event.target;

    if (name === "sourceSession") {
      setLeftSchoolActionForm((currentForm) => ({
        ...currentForm,
        sourceSession: value,
        fromClassRecord: "",
        fromClass: "",
        fromSession: value,
      }));
      setSelectedLeftSchoolStudentIds([]);
      return;
    }

    if (name === "fromClassRecord") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setLeftSchoolActionForm((currentForm) => ({
        ...currentForm,
        fromClassRecord: value,
        fromClass: selectedClass?.name || "",
        fromSession: selectedClass?.session || "",
      }));
      setSelectedLeftSchoolStudentIds([]);
      return;
    }

    setLeftSchoolActionForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "leftSession"
        ? { leftTerm: normalizeTermForSession(currentForm.leftTerm, value) }
        : {}),
    }));
  };

  const handleLeftSchoolStudentToggle = (studentId) => {
    setSelectedLeftSchoolStudentIds((currentIds) =>
      currentIds.includes(studentId)
        ? currentIds.filter((currentId) => currentId !== studentId)
        : [...currentIds, studentId]
    );
  };

  const handleGraduateFilterChange = (event) => {
    const { name, value } = event.target;
    setGraduateFilter((currentFilter) => ({
      ...currentFilter,
      [name]: value,
    }));
  };

  const handleLeftSchoolFilterChange = (event) => {
    const { name, value } = event.target;
    setLeftSchoolFilter((currentFilter) => ({
      ...currentFilter,
      [name]: value,
      ...(name === "session"
        ? { term: normalizeTermForSession(currentFilter.term, value) }
        : {}),
    }));
  };

  const handleSelectAllPromotionStudents = () => {
    setSelectedPromotionStudentIds(
      promotionCandidates.map((student) => student._id)
    );
  };

  const handleClearPromotionStudents = () => {
    setSelectedPromotionStudentIds([]);
  };

  const handleSelectAllLeftSchoolStudents = () => {
    setSelectedLeftSchoolStudentIds(
      leftSchoolCandidates.map((student) => student._id)
    );
  };

  const handleClearLeftSchoolStudents = () => {
    setSelectedLeftSchoolStudentIds([]);
  };

  const handleClassNameChange = (event) => {
    const nextClassName = event.target.value;

    setClassName(nextClassName);

    if (!classSection) {
      setClassSection(inferClassSection(nextClassName));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const submittedSession = classSession;
      const submittedSection = classSection || inferClassSection(className);
      const previousClassRecord = classes.find(
        (classRecord) => classRecord._id === editingClassId
      );
      let savedClassRecord = null;

      if (editingClassId) {
        const response = await API.put(`/classes/${editingClassId}`, {
          name: className,
          session: classSession,
          section: submittedSection,
        });
        savedClassRecord = response.data;
      } else {
        const response = await API.post("/classes", {
          name: className,
          session: classSession,
          section: submittedSection,
        });
        savedClassRecord = response.data;
      }

      setClassName("");
      setClassSession(submittedSession);
      setClassSection("");
      setSessionFilter(submittedSession);
      setEditingClassId("");
      setStatus({
        type: "success",
        message: editingClassId
          ? "Class updated successfully."
          : "Class created successfully.",
      });

      if (savedClassRecord?._id) {
        setClasses((currentClasses) => {
          const existingClassRecord = currentClasses.some(
            (classRecord) => classRecord._id === savedClassRecord._id
          );

          if (existingClassRecord) {
            return sortClassRecords(
              currentClasses.map((classRecord) =>
                classRecord._id === savedClassRecord._id
                  ? savedClassRecord
                  : classRecord
              )
            );
          }

          return sortClassRecords([savedClassRecord, ...currentClasses]);
        });

        if (previousClassRecord) {
          setStudents((currentStudents) =>
            currentStudents.map((student) => {
              const studentClassRecordId =
                student.class_record?._id || student.class_record || "";
              const matchesClassRecord =
                studentClassRecordId.toString() === savedClassRecord._id;
              const matchesLegacyClass =
                normalizeClassName(student.class) ===
                  normalizeClassName(previousClassRecord.name) &&
                student.current_session === previousClassRecord.session;

              if (!matchesClassRecord && !matchesLegacyClass) {
                return student;
              }

              return {
                ...student,
                class: savedClassRecord.name,
                current_session: savedClassRecord.session,
                class_record:
                  student.class_record && typeof student.class_record === "object"
                    ? {
                        ...student.class_record,
                        name: savedClassRecord.name,
                        session: savedClassRecord.session,
                        section: savedClassRecord.section,
                      }
                    : savedClassRecord._id,
              };
            })
          );
        }
      }
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to save class.",
      });
    }
  };

  const handleEditClass = (classRecord) => {
    setEditingClassId(classRecord._id);
    setClassName(classRecord.name);
    setClassSession(classRecord.session || "");
    setClassSection(getClassSection(classRecord));
  };

  const handleDeleteClassRequest = (classRecord) => {
    setDeleteTarget(classRecord);
  };

  const handleDeleteClassConfirm = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    setDeleting(true);
    try {
      await API.delete(`/classes/${deleteTarget._id}`);
      setStatus({
        type: "success",
        message: "Class deleted successfully.",
      });

      if (studentViewClassId === deleteTarget._id) {
        setStudentViewClassId("");
      }

      setDeleteTarget(null);
      setClasses((currentClasses) =>
        currentClasses.filter((classRecord) => classRecord._id !== deleteTarget._id)
      );
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete class.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingClassId("");
    setClassName("");
    setClassSession(sessionFilter);
    setClassSection("");
  };

  const handlePromotionSubmit = async (event) => {
    event.preventDefault();
    setPromoting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post("/students/promote", {
        ...promotionForm,
        studentIds: selectedPromotionStudentIds,
      });
      await fetchClassData();
      setStatus({
        type: "success",
        message:
          response.data?.message ||
          `${promotionCandidates.length} student(s) moved successfully.`,
      });
      setPromotionForm({
        sourceSession: DEFAULT_SESSION_FILTER,
        fromClassRecord: "",
        fromClass: "",
        fromSession: "",
        toClassRecord: "",
        toClass: "",
        toSession: "",
        targetFeeTerm: "",
      });
      setSelectedPromotionStudentIds([]);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to move students.",
      });
    } finally {
      setPromoting(false);
    }
  };

  const handleGraduateSubmit = async () => {
    if (!promotionForm.fromClassRecord || selectedPromotionStudentIds.length === 0) {
      return;
    }

    setGraduating(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post("/students/graduate", {
        fromClassRecord: promotionForm.fromClassRecord,
        graduationSession: promotionForm.fromSession,
        studentIds: selectedPromotionStudentIds,
      });
      await fetchClassData();
      setStatus({
        type: "success",
        message:
          response.data?.message ||
          `${selectedPromotionStudentIds.length} student(s) graduated successfully.`,
      });
      setSelectedPromotionStudentIds([]);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to graduate students.",
      });
    } finally {
      setGraduating(false);
    }
  };

  const handleLeftSchoolSubmit = async () => {
    if (
      !leftSchoolActionForm.fromClassRecord ||
      selectedLeftSchoolStudentIds.length === 0
    ) {
      return;
    }

    setMarkingLeftSchool(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post("/students/left-school", {
        fromClassRecord: leftSchoolActionForm.fromClassRecord,
        studentIds: selectedLeftSchoolStudentIds,
        leftSession: leftSchoolActionForm.leftSession,
        leftTerm: leftSchoolActionForm.leftTerm,
      });
      await fetchClassData();
      setStatus({
        type: "success",
        message:
          response.data?.message ||
          `${selectedLeftSchoolStudentIds.length} student(s) marked as left school.`,
      });
      setLeftSchoolActionForm({
        sourceSession: DEFAULT_SESSION_FILTER,
        fromClassRecord: "",
        fromClass: "",
        fromSession: "",
        leftSession: DEFAULT_SESSION_FILTER,
        leftTerm: "",
      });
      setSelectedLeftSchoolStudentIds([]);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to mark students as left school.",
      });
    } finally {
      setMarkingLeftSchool(false);
    }
  };

  const handleRestoreGraduate = async (studentId) => {
    setRestoringGraduateId(studentId);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post("/students/restore-graduated", {
        studentIds: [studentId],
      });
      await fetchClassData();
      setStatus({
        type: "success",
        message:
          response.data?.message ||
          "Student restored to active students successfully.",
      });
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to restore graduated student.",
      });
    } finally {
      setRestoringGraduateId("");
    }
  };

  const getClassStudentCount = (classRecord) =>
    students.filter(
      (student) =>
        isActiveStudent(student) &&
        normalizeClassName(student.class) === normalizeClassName(classRecord.name) &&
        student.current_session === classRecord.session
    ).length;
  const activeSessionStudents = students.filter(
    (student) =>
      isActiveStudent(student) && student.current_session === sessionFilter
  );

  const buildClassStudentRows = () =>
    sortedClassStudents.map((student, index) => ({
      sn: index + 1,
      name: student.full_name || "",
      admissionNo: student.admission_no || "",
      className: student.class || selectedClassRecord?.name || "",
      session: student.current_session || selectedClassRecord?.session || "",
      gender: student.gender || "Not set",
      created: student.createdAt
        ? new Date(student.createdAt).toLocaleDateString()
        : "Not available",
    }));

  const handleExportClassStudents = () => {
    if (!selectedClassRecord || sortedClassStudents.length === 0) {
      setStatus({
        type: "error",
        message: "Select a class with students before exporting.",
      });
      return;
    }

    const headers = [
      "S/N",
      "Student",
      "Admission No.",
      "Class",
      "Session",
      "Gender",
      "Created",
    ];
    const rows = buildClassStudentRows().map((student) => [
      student.sn,
      student.name,
      student.admissionNo,
      student.className,
      student.session,
      student.gender,
      student.created,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${value.toString().replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedClassRecord.name}-${selectedClassRecord.session}-students.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintClassStudents = () => {
    if (!selectedClassRecord || sortedClassStudents.length === 0) {
      setStatus({
        type: "error",
        message: "Select a class with students before printing.",
      });
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setStatus({
        type: "error",
        message: "Unable to open print window. Allow popups and try again.",
      });
      return;
    }

    const rows = buildClassStudentRows()
      .map(
        (student) => `
          <tr>
            <td>${escapeHtml(student.sn)}</td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.admissionNo)}</td>
            <td>${escapeHtml(student.className)}</td>
            <td>${escapeHtml(student.session)}</td>
            <td>${escapeHtml(student.gender)}</td>
            <td>${escapeHtml(student.created)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(selectedClassRecord.name.toUpperCase())} Class Students</title>
          <style>
            ${getPrintBrandStyles()}
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            p { margin: 0 0 18px; color: #555; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          ${getPrintBrandHeader({
            title: "Class Students",
            subtitle: `${selectedClassRecord.name.toUpperCase()} - ${selectedClassRecord.session}`,
          })}
          <h1>${escapeHtml(selectedClassRecord.name.toUpperCase())} Students</h1>
          <p>Session: ${escapeHtml(selectedClassRecord.session)} | Total: ${sortedClassStudents.length}</p>
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Class</th>
                <th>Session</th>
                <th>Gender</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
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
        title="Delete Class"
        message="This action will permanently remove this class record from the system. Students already assigned to this class will still keep their class text until updated or promoted."
        details={deleteTarget ? deleteTarget.name.toUpperCase() : ""}
        confirmLabel="Delete Class"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteClassConfirm}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaLayerGroup />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Class Management
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Create classes, manage class records, and view registered students by
          class.
        </p>
      </div>

      <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              {editingClassId ? "Edit Class" : "Create Class"}
            </h3>
            <p className="mt-3 max-w-2xl text-primary/70">
              Class names are used by student registration, result uploads, and
              class-based views.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={className}
              onChange={handleClassNameChange}
              placeholder="Class name e.g. basic-1"
              required
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
            />
            <input
              value={classSession}
              onChange={(event) => setClassSession(event.target.value)}
              placeholder="Session e.g. 2025/2026"
              required
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
            />
            <select
              value={classSection}
              onChange={(event) => setClassSection(event.target.value)}
              required
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              <option value="">Class section</option>
              {CLASS_SECTION_OPTIONS.map((sectionOption) => (
                <option key={sectionOption.value} value={sectionOption.value}>
                  {sectionOption.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {editingClassId ? "Save Class" : "Create Class"}
              <FaArrowRight />
            </button>
            {editingClassId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-5">
            <h3 className="text-3xl font-extrabold text-primary">
              Class Records
            </h3>
            <p className="mt-2 text-primary/70">
              Showing class records for the selected session.
            </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[260px_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Session
            </label>
            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-3 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              value={sessionFilter}
              onChange={handleSessionFilterChange}
            >
              {sessionOptions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchClassData}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-3 font-semibold text-secondary shadow-lg transition-all duration-300 hover:scale-105"
          >
            Refresh
            <FaArrowRight />
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 text-primary/70">
            No class has been created yet. Create a class with a session to
            start registering students.
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 text-primary/70">
            No class has been created for {sessionFilter} yet.
          </div>
        ) : (
          <div className="space-y-5">
            {groupedClassRecords.map((sectionGroup) => (
              <div
                key={sectionGroup.value}
                className="overflow-hidden rounded-2xl border border-primary/10"
              >
                <div className="flex flex-col gap-2 bg-primary/10 px-5 py-4 text-primary md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-xl font-extrabold">
                      {sectionGroup.label}
                    </h4>
                    <p className="text-sm font-semibold text-primary/60">
                      {sectionGroup.classes.length} class
                      {sectionGroup.classes.length === 1 ? "" : "es"}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-secondary px-4 py-2 text-sm font-bold text-primary">
                    {sessionFilter}
                  </span>
                </div>

                <div className="divide-y divide-primary/10">
                  {sectionGroup.classes.map((classRecord) => (
                    <div
                      key={classRecord._id}
                      className="grid grid-cols-1 gap-4 bg-primary/5 px-5 py-4 text-primary transition duration-300 hover:bg-primary/10 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
                    >
                      <div>
                        <p className="text-lg font-extrabold uppercase">
                          {classRecord.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary/55">
                          {formatClassSection(getClassSection(classRecord))}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-primary/45">
                          Session
                        </p>
                        <p className="mt-1 font-semibold">
                          {classRecord.session}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase text-primary/45">
                          Students
                        </p>
                        <p className="mt-1 font-semibold">
                          {getClassStudentCount(classRecord)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => handleEditClass(classRecord)}
                          className="rounded-xl bg-primary/20 px-4 py-2 text-sm font-bold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClassRequest(classRecord)}
                          className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">

         <div className="mb-5">
            <h3 className="text-3xl font-extrabold text-primary">
              {selectedClassRecord
                ? `${selectedClassRecord.name.toUpperCase()} Students`
                : "View Class Students"}
            </h3>
            <p className="mt-2 text-primary/70">
              {selectedClassRecord
                ? "Only students registered under this class are shown."
                : "Choose a class from the records above or the selector."}
            </p>
          </div>

        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[220px_220px_170px_auto_auto] xl:items-end">

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Session
            </label>
            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              value={studentViewSessionFilter}
              onChange={handleStudentViewSessionChange}
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
              Selected Class
            </label>
            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              value={studentViewClassId}
              onChange={(event) => setStudentViewClassId(event.target.value)}
            >
              <option value="">Choose class</option>
              {studentViewClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Sort
            </label>
            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              value={studentNameSort}
              onChange={(event) => setStudentNameSort(event.target.value)}
            >
              <option value="az">Name A-Z</option>
              <option value="za">Name Z-A</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportClassStudents}
            disabled={!selectedClassRecord || sortedClassStudents.length === 0}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export Excel
          </button>

          <button
            type="button"
            onClick={handlePrintClassStudents}
            disabled={!selectedClassRecord || sortedClassStudents.length === 0}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Print
          </button>
        </div>

        {studentViewSessionFilter && studentViewClasses.length === 0 && (
          <div className="mb-6 rounded-2xl border border-primary/10 bg-primary/5 p-6 text-primary/70">
            No class has been created for {studentViewSessionFilter} yet.
          </div>
        )}

        <div className="mb-6 rounded-2xl bg-primary/5 p-5">
          <p className="text-sm font-semibold text-primary/50">
            Students in Selected Class
          </p>
          <p className="mt-3 text-4xl font-extrabold text-primary">
            {selectedClassRecord ? sortedClassStudents.length : "0"}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Admission No.</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Gender</th>
                <th className="px-5 py-4 font-bold">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-primary/10">
              {loadingStudents ? (
                <TableSkeleton columns={5} />
              ) : !selectedClassRecord ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="5">
                    Select a class to view students.
                  </td>
                </tr>
              ) : sortedClassStudents.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="5">
                    No students registered in this class yet.
                  </td>
                </tr>
              ) : (
                displayedClassStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="text-primary/80 transition duration-300 hover:bg-primary/5"
                  >
                    <td className="px-5 py-4 font-semibold text-primary">
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
        <PaginationControls
          currentPage={visibleClassStudentPage}
          totalItems={sortedClassStudents.length}
          pageSize={PAGE_SIZE}
          onPageChange={setClassStudentPage}
        />
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_520px]">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
              <FaGraduationCap />
            </div>
            <h3 className="text-3xl font-extrabold text-primary">
              Promote or Demote Students
            </h3>
            <p className="mt-3 max-w-3xl text-primary/70">
              Move selected students from one class session into another class
              and session. Existing result records keep their original class,
              session, and term.
            </p>

            <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Students Selected
              </p>
              <p className="mt-3 text-4xl font-extrabold text-primary">
                {selectedPromotionStudentIds.length} / {promotionCandidates.length}
              </p>
            </div>
          </div>

          <form onSubmit={handlePromotionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select
                name="sourceSession"
                value={promotionForm.sourceSession}
                onChange={handlePromotionChange}
                required
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">Source session</option>
                {promotionSessionOptions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>

              <select
                name="fromClassRecord"
                value={promotionForm.fromClassRecord}
                onChange={handlePromotionChange}
                required
                disabled={!promotionForm.sourceSession}
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">
                  {promotionForm.sourceSession
                    ? "Source class"
                    : "Select source session first"}
                </option>
                {promotionSourceClasses.map((classRecord) => (
                  <option key={classRecord._id} value={classRecord._id}>
                    {classRecord.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select
                name="toSession"
                value={promotionForm.toSession}
                onChange={handlePromotionChange}
                required
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">Destination session</option>
                {promotionSessionOptions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>

              <select
                name="toClassRecord"
                value={promotionForm.toClassRecord}
                onChange={handlePromotionChange}
                required
                disabled={!promotionForm.toSession}
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">
                  {promotionForm.toSession
                    ? "Destination class"
                    : "Select destination session first"}
                </option>
                {promotionDestinationClasses.map((classRecord) => (
                  <option key={classRecord._id} value={classRecord._id}>
                    {classRecord.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <select
              name="targetFeeTerm"
              value={promotionForm.targetFeeTerm}
              onChange={handlePromotionChange}
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              <option value="">Create returning fee record for term</option>
              {getVisibleTermsForSession(promotionForm.toSession).map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold uppercase text-primary/60">
                    Batch Students
                  </p>
                  <p className="mt-1 text-sm text-primary/60">
                    Select the students to promote or demote from this class.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPromotionStudents}
                    disabled={
                      promotionCandidates.length === 0 ||
                      allPromotionCandidatesSelected
                    }
                    className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPromotionStudents}
                    disabled={selectedPromotionStudentIds.length === 0}
                    className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-2xl border border-primary/10 bg-secondary">
                {promotionCandidates.length === 0 ? (
                  <p className="px-5 py-4 text-primary/60">
                    Select a class/session to load students.
                  </p>
                ) : (
                  promotionCandidates.map((student) => (
                    <label
                      key={student._id}
                      className="flex cursor-pointer items-center gap-4 border-b border-primary/10 px-5 py-4 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPromotionStudentIds.includes(student._id)}
                        onChange={() => handlePromotionStudentToggle(student._id)}
                        className="h-5 w-5 accent-button"
                      />
                      <span className="min-w-0">
                        <span className="block font-bold text-primary">
                          {student.full_name}
                        </span>
                        <span className="block text-sm text-primary/60">
                          {student.admission_no}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                promoting ||
                graduating ||
                promotionCandidates.length === 0 ||
                selectedPromotionStudentIds.length === 0 ||
                !promotionForm.toSession ||
                !promotionForm.toClassRecord
              }
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {promoting ? "Moving students..." : "Move Selected Students"}
              {!promoting && <FaArrowRight />}
            </button>
            <button
              type="button"
              onClick={handleGraduateSubmit}
              disabled={
                promoting ||
                graduating ||
                promotionCandidates.length === 0 ||
                selectedPromotionStudentIds.length === 0
              }
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {graduating ? "Graduating students..." : "Graduate Selected Students"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_520px]">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-xl text-red-700">
              <FaUsers />
            </div>
            <h3 className="text-3xl font-extrabold text-primary">
              Student Left School
            </h3>
            <p className="mt-3 max-w-3xl text-primary/70">
              Record students that left the school by session and term. These
              students keep their academic history but are removed from active
              class, promotion, and result upload lists.
            </p>

            <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Students Selected
              </p>
              <p className="mt-3 text-4xl font-extrabold text-primary">
                {selectedLeftSchoolStudentIds.length} / {leftSchoolCandidates.length}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select
                name="sourceSession"
                value={leftSchoolActionForm.sourceSession}
                onChange={handleLeftSchoolChange}
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">Source session</option>
                {promotionSessionOptions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>

              <select
                name="fromClassRecord"
                value={leftSchoolActionForm.fromClassRecord}
                onChange={handleLeftSchoolChange}
                disabled={!leftSchoolActionForm.sourceSession}
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">
                  {leftSchoolActionForm.sourceSession
                    ? "Source class"
                    : "Select source session first"}
                </option>
                {leftSchoolSourceClasses.map((classRecord) => (
                  <option key={classRecord._id} value={classRecord._id}>
                    {classRecord.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold uppercase text-primary/60">
                    Students That Left
                  </p>
                  <p className="mt-1 text-sm text-primary/60">
                    Select only the students that should be removed from active
                    school workflows.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllLeftSchoolStudents}
                    disabled={
                      leftSchoolCandidates.length === 0 ||
                      allLeftSchoolCandidatesSelected
                    }
                    className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLeftSchoolStudents}
                    disabled={selectedLeftSchoolStudentIds.length === 0}
                    className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-2xl border border-primary/10 bg-secondary">
                {leftSchoolCandidates.length === 0 ? (
                  <p className="px-5 py-4 text-primary/60">
                    Select a class/session to load active students.
                  </p>
                ) : (
                  leftSchoolCandidates.map((student) => (
                    <label
                      key={student._id}
                      className="flex cursor-pointer items-center gap-4 border-b border-primary/10 px-5 py-4 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeftSchoolStudentIds.includes(student._id)}
                        onChange={() => handleLeftSchoolStudentToggle(student._id)}
                        className="h-5 w-5 accent-button"
                      />
                      <span className="min-w-0">
                        <span className="block font-bold text-primary">
                          {student.full_name}
                        </span>
                        <span className="block text-sm text-primary/60">
                          {student.admission_no}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                name="leftSession"
                value={leftSchoolActionForm.leftSession}
                onChange={handleLeftSchoolChange}
                placeholder="Left session e.g. 2025/2026"
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
              />
              <select
                name="leftTerm"
                value={leftSchoolActionForm.leftTerm}
                onChange={handleLeftSchoolChange}
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">Left term</option>
                {getVisibleTermsForSession(leftSchoolActionForm.leftSession).map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleLeftSchoolSubmit}
              disabled={
                markingLeftSchool ||
                leftSchoolCandidates.length === 0 ||
                selectedLeftSchoolStudentIds.length === 0 ||
                !leftSchoolActionForm.leftSession ||
                !leftSchoolActionForm.leftTerm
              }
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-red-500/10 px-5 py-4 font-bold text-red-700 transition-all duration-300 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingLeftSchool
                ? "Saving left-school records..."
                : "Mark Selected as Left School"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-5">
            <h3 className="text-3xl font-extrabold text-primary">
              Graduate List
            </h3>
            <p className="mt-2 text-primary/70">
              Graduated students keep their academic records but are hidden
              from active class lists.
            </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[220px_320px]">
          <input
            name="session"
            value={graduateFilter.session}
            onChange={handleGraduateFilterChange}
            placeholder="Filter session"
            className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
          />

          <input
            name="search"
            value={graduateFilter.search}
            onChange={handleGraduateFilterChange}
            placeholder="Search graduated students"
            className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Admission No.</th>
                <th className="px-5 py-4 font-bold">Previous Class</th>
                <th className="px-5 py-4 font-bold">Graduation Session</th>
                <th className="px-5 py-4 font-bold">Graduated</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {displayedGraduatedStudents.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
                    No graduated student matches this filter.
                  </td>
                </tr>
              ) : (
                displayedGraduatedStudents.map((student, index) => (
                  <tr key={student._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {(visibleGraduatePage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {student.full_name}
                    </td>
                    <td className="px-5 py-4">{student.admission_no}</td>
                    <td className="px-5 py-4">
                      {student.graduation_class || student.class}
                    </td>
                    <td className="px-5 py-4">
                      {student.graduation_session || student.current_session}
                    </td>
                    <td className="px-5 py-4">
                      {student.graduated_at
                        ? new Date(student.graduated_at).toLocaleDateString()
                        : "Not available"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleRestoreGraduate(student._id)}
                        disabled={restoringGraduateId === student._id}
                        className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {restoringGraduateId === student._id
                          ? "Restoring..."
                          : "De-graduate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={visibleGraduatePage}
          totalItems={filteredGraduatedStudents.length}
          pageSize={PAGE_SIZE}
          onPageChange={setGraduatePage}
        />
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-5">
            <h3 className="text-3xl font-extrabold text-primary">
              Left School Records
            </h3>
            <p className="mt-2 text-primary/70">
              Students recorded here keep their history but are hidden from
              active classes and promotion lists.
            </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[220px_220px_320px]">
          <input
            name="session"
            value={leftSchoolFilter.session}
            onChange={handleLeftSchoolFilterChange}
            placeholder="Session"
            className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
          />

          <select
            name="term"
            value={leftSchoolFilter.term}
            onChange={handleLeftSchoolFilterChange}
            className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
          >
            <option value="">All terms</option>
            {getVisibleTermsForSession(leftSchoolFilter.session).map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>

          <input
            name="search"
            value={leftSchoolFilter.search}
            onChange={handleLeftSchoolFilterChange}
            placeholder="Search left-school records"
            className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Admission No.</th>
                <th className="px-5 py-4 font-bold">Previous Class</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {displayedLeftSchoolStudents.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
                    No left-school record matches this filter.
                  </td>
                </tr>
              ) : (
                displayedLeftSchoolStudents.map((student, index) => (
                  <tr key={student._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {(visibleLeftSchoolPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {student.full_name}
                    </td>
                    <td className="px-5 py-4">{student.admission_no}</td>
                    <td className="px-5 py-4">
                      {student.left_class || student.class}
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
        <PaginationControls
          currentPage={visibleLeftSchoolPage}
          totalItems={filteredLeftSchoolStudents.length}
          pageSize={PAGE_SIZE}
          onPageChange={setLeftSchoolPage}
        />
      </section>
    </div>
  );
}

export default ClassManagement;
