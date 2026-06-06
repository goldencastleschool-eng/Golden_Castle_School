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

function AdminDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
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
  const [promotionForm, setPromotionForm] = useState({
    fromClassRecord: "",
    fromClass: "",
    toClass: "",
    fromSession: "",
    toSession: "",
  });
  const [selectedPromotionStudentIds, setSelectedPromotionStudentIds] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [promoting, setPromoting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const [studentsResponse, resultsResponse, classesResponse, accessResponse] =
        await Promise.all([
          API.get("/students"),
          API.get("/results"),
          API.get("/classes"),
          API.get("/result-access"),
        ]);

      setStudents(studentsResponse.data || []);
      setResults(resultsResponse.data || []);
      setClasses(classesResponse.data || []);
      setAccessForm({
        session: accessResponse.data?.session || "",
        term: accessResponse.data?.term || "",
      });
      setCumulativeAccessForm({
        cumulative_session: accessResponse.data?.cumulative_session || "",
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

  const classCount = useMemo(() => {
    return classes.length;
  }, [classes]);

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

  const coverageClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === coverageSessionFilter
    );
  }, [classes, coverageSessionFilter]);

  const classCoverage = useMemo(() => {
    return coverageClasses.map((classRecord) => {
      const className = classRecord.name;
      const classStudents = students.filter(
        (student) =>
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
      title: "Total Students",
      value: loading ? "..." : students.length,
      icon: <FaUsers />,
    },
    {
      title: "Active Classes",
      value: loading ? "..." : classCount,
      icon: <FaBookOpen />,
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
        (student.class_record?._id || student.class_record) === selectedClass._id ||
        (normalizeClassName(student.class) === normalizeClassName(selectedClass.name) &&
          student.current_session === selectedClass.session)
    );
  }, [classes, promotionForm.fromClassRecord, students]);

  const classNameOptions = useMemo(() => {
    return [...new Set(classes.map((classRecord) => classRecord.name))].sort();
  }, [classes]);

  const allPromotionCandidatesSelected =
    promotionCandidates.length > 0 &&
    selectedPromotionStudentIds.length === promotionCandidates.length;

  const handlePromotionStudentToggle = (studentId) => {
    setSelectedPromotionStudentIds((currentIds) =>
      currentIds.includes(studentId)
        ? currentIds.filter((currentId) => currentId !== studentId)
        : [...currentIds, studentId]
    );
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
        fromClassRecord: "",
        fromClass: "",
        toClass: "",
        fromSession: "",
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  name="fromClassRecord"
                  value={promotionForm.fromClassRecord}
                  onChange={handlePromotionChange}
                  required
                  className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                >
                  <option value="">From class/session</option>
                  {classes.map((classRecord) => (
                    <option key={classRecord._id} value={classRecord._id}>
                      {classRecord.name.toUpperCase()} - {classRecord.session}
                    </option>
                  ))}
                </select>

                <select
                  name="toClass"
                  value={promotionForm.toClass}
                  onChange={handlePromotionChange}
                  required
                  className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                >
                  <option value="">To class</option>
                  {classNameOptions.map((className) => (
                    <option key={className} value={className}>
                      {className.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  name="fromSession"
                  value={promotionForm.fromSession}
                  onChange={handlePromotionChange}
                  placeholder="From session e.g. 2025/2026"
                  readOnly
                  required
                  className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
                />
                <input
                  name="toSession"
                  value={promotionForm.toSession}
                  onChange={handlePromotionChange}
                  placeholder="To session e.g. 2026/2027"
                  required
                  className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
                />
              </div>

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
                  promotionCandidates.length === 0 ||
                  selectedPromotionStudentIds.length === 0
                }
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {promoting ? "Moving students..." : "Move Selected Students"}
                {!promoting && <FaArrowRight />}
              </button>
            </form>
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
