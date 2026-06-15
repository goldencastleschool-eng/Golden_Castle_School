import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaLayerGroup,
  FaSchool,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import AdminStatCard from "../../components/common/AdminStatCard.jsx";
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

const DEFAULT_SESSION_FILTER = "2025/2026";
const PAGE_SIZE = 25;

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
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
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
  const displayedClassStudents = useMemo(
    () => sortedClassStudents.slice(0, PAGE_SIZE),
    [sortedClassStudents]
  );

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

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="All Classes"
          value={classes.length}
          icon={<FaLayerGroup />}
        />
        <AdminStatCard
          title={`${sessionFilter} Classes`}
          value={filteredClasses.length}
          icon={<FaSchool />}
          tone="muted"
        />
        <AdminStatCard
          title="Active Students"
          value={activeSessionStudents.length}
          icon={<FaUsers />}
          tone="green"
        />
        <AdminStatCard
          title="Sections"
          value={groupedClassRecords.length}
          icon={<FaLayerGroup />}
        />
      </section>

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
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px_auto] lg:items-end">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Class Records
            </h3>
            <p className="mt-2 text-primary/70">
              Showing class records for the selected session.
            </p>
          </div>

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

        <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_220px_170px_auto_auto] xl:items-end">

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
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="5">
                    Loading students...
                  </td>
                </tr>
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
      </section>
    </div>
  );
}

export default ClassManagement;
