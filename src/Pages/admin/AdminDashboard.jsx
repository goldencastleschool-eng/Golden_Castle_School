import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBookOpen,
  FaChartLine,
  FaGraduationCap,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const DEFAULT_COVERAGE_SESSION_FILTER = "2025/2026";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const isActiveStudent = (student) =>
  !student.status || student.status === "active";

function AdminDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classBroadsheets, setClassBroadsheets] = useState([]);
  const [classResults, setClassResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessForm, setAccessForm] = useState({
    session: "",
    term: "",
  });
  const [cumulativeAccessForm, setCumulativeAccessForm] = useState({
    cumulative_session: "",
  });
  const [coverageSessionFilter, setCoverageSessionFilter] = useState(
    DEFAULT_COVERAGE_SESSION_FILTER
  );
  const [populationSessionFilter, setPopulationSessionFilter] = useState(
    DEFAULT_COVERAGE_SESSION_FILTER
  );
  const [promotionForm, setPromotionForm] = useState({
    sourceSession: DEFAULT_COVERAGE_SESSION_FILTER,
    fromClassRecord: "",
    fromClass: "",
    fromSession: "",
    toClassRecord: "",
    toClass: "",
    toSession: "",
  });
  const [leftSchoolActionForm, setLeftSchoolActionForm] = useState({
    sourceSession: DEFAULT_COVERAGE_SESSION_FILTER,
    fromClassRecord: "",
    fromClass: "",
    fromSession: "",
    leftSession: DEFAULT_COVERAGE_SESSION_FILTER,
    leftTerm: "",
  });
  const [graduateFilter, setGraduateFilter] = useState({
    session: "",
    search: "",
  });
  const [leftSchoolFilter, setLeftSchoolFilter] = useState({
    session: DEFAULT_COVERAGE_SESSION_FILTER,
    term: "",
    search: "",
  });
  const [selectedPromotionStudentIds, setSelectedPromotionStudentIds] = useState([]);
  const [selectedLeftSchoolStudentIds, setSelectedLeftSchoolStudentIds] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [promoting, setPromoting] = useState(false);
  const [graduating, setGraduating] = useState(false);
  const [markingLeftSchool, setMarkingLeftSchool] = useState(false);
  const [restoringGraduateId, setRestoringGraduateId] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const [
        studentsResponse,
        resultsResponse,
        classesResponse,
        accessResponse,
        teachersResponse,
        broadsheetsResponse,
        classResultsResponse,
      ] = await Promise.allSettled([
        API.get("/students"),
        API.get("/results"),
        API.get("/classes"),
        API.get("/result-access"),
        API.get("/teachers"),
        API.get("/class-broadsheets"),
        API.get("/class-results"),
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
      setAccessForm({
        session:
          accessResponse.status === "fulfilled"
            ? accessResponse.value.data?.session || ""
            : "",
        term:
          accessResponse.status === "fulfilled"
            ? accessResponse.value.data?.term || ""
            : "",
      });
      setCumulativeAccessForm({
        cumulative_session:
          accessResponse.status === "fulfilled"
            ? accessResponse.value.data?.cumulative_session || ""
            : "",
      });
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

  const coverageResults = useMemo(() => {
    if (!coverageSessionFilter || !accessForm.term) {
      return [];
    }

    return results.filter(
      (result) =>
        result.session === coverageSessionFilter &&
        result.term === accessForm.term
    );
  }, [accessForm.term, coverageSessionFilter, results]);

  const coverageSessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_COVERAGE_SESSION_FILTER,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
      ]),
    ].sort();
  }, [classes]);

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

  const coverageClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === coverageSessionFilter
    );
  }, [classes, coverageSessionFilter]);

  const activeSessionStudents = useMemo(() => {
    return students.filter(
      (student) =>
        isActiveStudent(student) &&
        student.current_session === populationSessionFilter
    );
  }, [populationSessionFilter, students]);

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

  const sessionClassBroadsheets = useMemo(() => {
    return classBroadsheets.filter(
      (broadsheet) => broadsheet.session === populationSessionFilter
    );
  }, [classBroadsheets, populationSessionFilter]);

  const sessionClassResults = useMemo(() => {
    return classResults.filter(
      (classResult) => classResult.session === populationSessionFilter
    );
  }, [classResults, populationSessionFilter]);

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
          populationSessionFilter
    );
  }, [populationSessionFilter, students]);

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

  const promotionSessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_COVERAGE_SESSION_FILTER,
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

  const classCoverage = useMemo(() => {
    return coverageClasses.map((classRecord) => {
      const className = classRecord.name;
      const classStudents = students.filter(
        (student) =>
          isActiveStudent(student) &&
          normalizeClassName(student.class) === normalizeClassName(className) &&
          student.current_session === classRecord.session
      );
      const uploadedStudentIds = new Set(
        coverageResults
          .filter(
            (result) =>
              normalizeClassName(result.class) === normalizeClassName(className) &&
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
  }, [coverageClasses, coverageResults, students]);

  const stats = [
    {
      title: "Active Students",
      value: loading ? "..." : activeSessionStudents.length,
      icon: <FaUsers />,
    },
    {
      title: "Active Classes",
      value: loading ? "..." : activeSessionClasses.length,
      icon: <FaBookOpen />,
    },
    {
      title: "Active Form Teachers",
      value: loading ? "..." : activeSessionTeachers.length,
      icon: <FaUsers />,
    },
    {
      title: "Deactivated Form Teachers",
      value: loading ? "..." : inactiveSessionTeachers.length,
      icon: <FaUsers />,
    },
    {
      title: "Class Broadsheets",
      value: loading ? "..." : sessionClassBroadsheets.length,
      icon: <FaBookOpen />,
    },
    {
      title: "Class Results",
      value: loading ? "..." : sessionClassResults.length,
      icon: <FaChartLine />,
    },
    {
      title: "Graduated",
      value: loading ? "..." : graduatedSessionStudents.length,
      icon: <FaGraduationCap />,
    },
    {
      title: "Left School",
      value: loading ? "..." : leftSchoolSessionStudents.length,
      icon: <FaUsers />,
    },
    {
      title: "Male",
      value: loading ? "..." : activeGenderSummary.Male || 0,
      icon: <FaUsers />,
    },
    {
      title: "Female",
      value: loading ? "..." : activeGenderSummary.Female || 0,
      icon: <FaUsers />,
    },
  ];

  const handleAccessChange = (event) => {
    const { name, value } = event.target;
    setAccessForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleAccessSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await API.put("/result-access", accessForm);
      setAccessForm({
        session: response.data.session || "",
        term: response.data.term || "",
      });
      setStatus({
        type: "success",
        message: "Student result access updated successfully.",
      });
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to update result access.",
      });
    }
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

    return students.filter(
      (student) =>
        isActiveStudent(student) &&
        ((student.class_record?._id || student.class_record) === selectedClass._id ||
          (normalizeClassName(student.class) === normalizeClassName(selectedClass.name) &&
            student.current_session === selectedClass.session))
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

    return students.filter(
      (student) =>
        isActiveStudent(student) &&
        ((student.class_record?._id || student.class_record) === selectedClass._id ||
          (normalizeClassName(student.class) === normalizeClassName(selectedClass.name) &&
            student.current_session === selectedClass.session))
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

  const displayedGraduatedStudents = useMemo(() => {
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
      })
      .slice(0, 15);
  }, [graduateFilter.search, graduateFilter.session, graduatedStudents]);

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

  const displayedLeftSchoolStudents = useMemo(() => {
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
      })
      .slice(0, 15);
  }, [
    leftSchoolFilter.search,
    leftSchoolFilter.session,
    leftSchoolFilter.term,
    leftSchoolStudents,
  ]);

  const allPromotionCandidatesSelected =
    promotionCandidates.length > 0 &&
    selectedPromotionStudentIds.length === promotionCandidates.length;

  const allLeftSchoolCandidatesSelected =
    leftSchoolCandidates.length > 0 &&
    selectedLeftSchoolStudentIds.length === leftSchoolCandidates.length;

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
    }));
  };

  const handleCumulativeAccessChange = (event) => {
    const { name, value } = event.target;
    setCumulativeAccessForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleCumulativeAccessSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await API.put(
        "/result-access/cumulative",
        cumulativeAccessForm
      );
      setCumulativeAccessForm({
        cumulative_session: response.data.cumulative_session || "",
      });
      setStatus({
        type: "success",
        message: "Student cumulative result access updated successfully.",
      });
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to update cumulative result access.",
      });
    }
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

  const handlePromotionSubmit = async (event) => {
    event.preventDefault();
    setPromoting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.post("/students/promote", {
        ...promotionForm,
        studentIds: selectedPromotionStudentIds,
      });
      await fetchDashboardData();
      setStatus({
        type: "success",
        message:
          response.data?.message ||
          `${promotionCandidates.length} student(s) promoted successfully.`,
      });
      setPromotionForm({
        sourceSession: DEFAULT_COVERAGE_SESSION_FILTER,
        fromClassRecord: "",
        fromClass: "",
        fromSession: "",
        toClassRecord: "",
        toClass: "",
        toSession: "",
      });
      setSelectedPromotionStudentIds([]);
    } catch (requestError) {
      setStatus({
        type: "error",
        message:
          requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to promote students.",
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
      await fetchDashboardData();
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
      await fetchDashboardData();
      setStatus({
        type: "success",
        message:
          response.data?.message ||
          `${selectedLeftSchoolStudentIds.length} student(s) marked as left school.`,
      });
      setLeftSchoolActionForm({
        sourceSession: DEFAULT_COVERAGE_SESSION_FILTER,
        fromClassRecord: "",
        fromClass: "",
        fromSession: "",
        leftSession: DEFAULT_COVERAGE_SESSION_FILTER,
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
      await fetchDashboardData();
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
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px] lg:items-end">
          <div>
            <h3 className="text-3xl font-extrabold text-secondary">
              Active Population Summary
            </h3>
            <p className="mt-2 text-sm font-semibold text-secondary/75">
              Showing active population data for {populationSessionFilter}.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary/75">
              Session
            </label>
            <select
              value={populationSessionFilter}
              onChange={(event) => setPopulationSessionFilter(event.target.value)}
              className="w-full rounded-2xl border border-secondary/10 bg-secondary px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
            >
              {populationSessionOptions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="group rounded-[2rem] bg-secondary p-7 shadow-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="font-medium text-primary/70">{stat.title}</p>
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
          ))}
        </div>

        <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Student Result Access
              </h3>
              <p className="mt-3 max-w-3xl text-primary/70">
                Students only see results that match this active session and
                term. Changing it hides previous session/term results from the
                student portal.
              </p>
            </div>

            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <input
                name="session"
                value={accessForm.session}
                onChange={handleAccessChange}
                placeholder="Session e.g. 2025/2026"
                required
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
              />
              <select
                name="term"
                value={accessForm.term}
                onChange={handleAccessChange}
                required
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                <option value="">Select active term</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                Save Access
                <FaArrowRight />
              </button>
            </form>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Student Cumulative Result Access
              </h3>
              <p className="mt-3 max-w-3xl text-primary/70">
                Students only see cumulative results that match this approved
                session. Leave it unset to hide cumulative results from the
                student portal.
              </p>
            </div>

            <form onSubmit={handleCumulativeAccessSubmit} className="space-y-4">
              <input
                name="cumulative_session"
                value={cumulativeAccessForm.cumulative_session}
                onChange={handleCumulativeAccessChange}
                placeholder="Approved session e.g. 2025/2026"
                required
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
              />
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                Save Cumulative Access
                <FaArrowRight />
              </button>
            </form>
          </div>
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
                Move all students in one class session into another class and
                session. Existing result records keep their
                original class, session, and term.
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

              {promotionForm.sourceSession &&
                promotionSourceClasses.length === 0 && (
                  <p className="rounded-2xl bg-primary/5 px-5 py-4 text-sm font-semibold text-primary/60">
                    No active class has been created for{" "}
                    {promotionForm.sourceSession} yet.
                  </p>
                )}

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
                  className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
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

              {promotionForm.toSession &&
                promotionDestinationClasses.length === 0 && (
                  <p className="rounded-2xl bg-primary/5 px-5 py-4 text-sm font-semibold text-primary/60">
                    No destination class has been created for{" "}
                    {promotionForm.toSession} yet.
                  </p>
                )}

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
                  markingLeftSchool ||
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
                  markingLeftSchool ||
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
          <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_220px_320px] lg:items-end">
            <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Graduate List
            </h3>
            <p className="mt-2 text-primary/70">
              Graduated students keep their academic records but are hidden
              from active class lists.
            </p>
            </div>

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
                        {index + 1}
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

              {leftSchoolActionForm.sourceSession &&
                leftSchoolSourceClasses.length === 0 && (
                  <p className="rounded-2xl bg-primary/5 px-5 py-4 text-sm font-semibold text-primary/60">
                    No active class has been created for{" "}
                    {leftSchoolActionForm.sourceSession} yet.
                  </p>
                )}

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
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
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
          <div className="mb-6 grid grid-cols-1 gap-5 xl:items-end">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Left School Records
              </h3>
              <p className="mt-2 text-primary/70">
                Students recorded here keep their history but are hidden from
                active classes and promotion lists.
              </p>
            </div>

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
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
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
                        {index + 1}
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
        </section>

        <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px] lg:items-end">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Result Upload Coverage
              </h3>
              <p className="mt-2 text-primary/70">
                Uploaded results out of registered students for{" "}
                {coverageSessionFilter}
                {accessForm.term ? ` - ${accessForm.term}` : ""}.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/60">
                Session
              </label>
              <select
                className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                value={coverageSessionFilter}
                onChange={(event) => setCoverageSessionFilter(event.target.value)}
              >
                {coverageSessionOptions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {classCoverage.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-primary/10 bg-primary/5 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase text-primary/60">
                      {item.className}
                      <span className="block font-semibold normal-case text-primary/50">
                        {item.session}
                      </span>
                    </p>
                    <p className="mt-3 text-3xl font-extrabold text-primary">
                      {item.uploaded} / {item.total}
                    </p>
                    <p className="mt-1 text-sm text-primary/60">
                      results uploaded
                    </p>
                  </div>

                  <Link
                    to={`/admin/classes/${item.id}/coverage`}
                    className="rounded-2xl bg-button px-4 py-3 text-sm font-bold text-secondary transition duration-300 hover:scale-105"
                  >
                    Coverage Overview
                  </Link>
                </div>
              </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export default AdminDashboard;
