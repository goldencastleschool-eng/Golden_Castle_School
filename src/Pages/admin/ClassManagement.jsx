import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaLayerGroup } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const DEFAULT_SESSION_FILTER = "2025/2026";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

function ClassManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sessionFilter, setSessionFilter] = useState(DEFAULT_SESSION_FILTER);
  const [className, setClassName] = useState("");
  const [classSession, setClassSession] = useState(DEFAULT_SESSION_FILTER);
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

  const classStudents = useMemo(() => {
    const selectedClassRecord = classes.find(
      (classRecord) => classRecord._id === selectedClassId
    );

    if (!selectedClassRecord) {
      return [];
    }

    return students.filter(
      (student) =>
        student.status === "active" &&
        normalizeClassName(student.class) ===
          normalizeClassName(selectedClassRecord.name) &&
        student.current_session === selectedClassRecord.session
    );
  }, [classes, selectedClassId, students]);

  const selectedClassRecord = classes.find(
    (classRecord) => classRecord._id === selectedClassId
  );

  const handleSessionFilterChange = (event) => {
    const nextSession = event.target.value;

    setSessionFilter(nextSession);

    const selectedClassStillVisible = classes.some(
      (classRecord) =>
        classRecord._id === selectedClassId &&
        classRecord.session === nextSession
    );

    if (!selectedClassStillVisible) {
      setSelectedClassId("");
    }

    if (!editingClassId) {
      setClassSession(nextSession);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const submittedSession = classSession;

      if (editingClassId) {
        await API.put(`/classes/${editingClassId}`, {
          name: className,
          session: classSession,
        });
      } else {
        await API.post("/classes", {
          name: className,
          session: classSession,
        });
      }

      setClassName("");
      setClassSession(submittedSession);
      setSessionFilter(submittedSession);
      setEditingClassId("");
      setStatus({
        type: "success",
        message: editingClassId
          ? "Class updated successfully."
          : "Class created successfully.",
      });
      await fetchClassData();
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

      if (selectedClassId === deleteTarget._id) {
        setSelectedClassId("");
      }

      setDeleteTarget(null);
      await fetchClassData();
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
              onChange={(event) => setClassName(event.target.value)}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredClasses.map((classRecord) => (
            <button
              key={classRecord._id}
              onClick={() => setSelectedClassId(classRecord._id)}
              className={`rounded-2xl border p-5 text-left transition-all duration-300 ${
                selectedClassId === classRecord._id
                  ? "border-button bg-button text-secondary"
                  : "border-primary/10 bg-primary/5 text-primary hover:border-button"
              }`}
            >
              <p className="text-xl font-extrabold uppercase">
                {classRecord.name}
              </p>
              <p className="mt-1 text-sm font-semibold opacity-75">
                {classRecord.session}
              </p>
              <p className="mt-2 text-sm opacity-75">
                {
                  students.filter(
                    (student) =>
                      student.status === "active" &&
                      normalizeClassName(student.class) ===
                        normalizeClassName(classRecord.name) &&
                      student.current_session === classRecord.session
                  ).length
                }{" "}
                students
              </p>

              <div className="mt-4 flex gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleEditClass(classRecord);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.stopPropagation();
                      handleEditClass(classRecord);
                    }
                  }}
                  className="rounded-xl bg-primary/20 px-4 py-2 text-sm font-bold"
                >
                  Edit
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteClassRequest(classRecord);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.stopPropagation();
                      handleDeleteClassRequest(classRecord);
                    }
                  }}
                  className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-100"
                >
                  Delete
                </span>
              </div>
            </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px_260px] lg:items-end">
          <div>
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

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Session
            </label>
            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
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

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary/60">
              Selected Class
            </label>
            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
            >
              <option value="">Choose class</option>
              {filteredClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-primary/5 p-5">
          <p className="text-sm font-semibold text-primary/50">
            Students in Selected Class
          </p>
          <p className="mt-3 text-4xl font-extrabold text-primary">
            {selectedClassRecord ? classStudents.length : "0"}
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
              ) : classStudents.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="5">
                    No students registered in this class yet.
                  </td>
                </tr>
              ) : (
                classStudents.map((student) => (
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
