import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaChalkboardUser } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const DEFAULT_SESSION_FILTER = "2025/2026";

const initialTeacherForm = {
  full_name: "",
  username: "",
  session: DEFAULT_SESSION_FILTER,
  assigned_class_record: "",
  password: "",
};

const buildTeacherUsername = (fullName, className) => {
  const namePart = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
  const classPart = className
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/(^\.|\.$)/g, "");

  return [namePart, classPart].filter(Boolean).join(".");
};

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const [teachersResponse, classesResponse] = await Promise.all([
        API.get("/teachers"),
        API.get("/classes"),
      ]);

      setTeachers(teachersResponse.data || []);
      setClasses(classesResponse.data || []);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load teacher records.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const sessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_SESSION_FILTER,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
      ]),
    ].sort();
  }, [classes]);

  const availableClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === teacherForm.session
    );
  }, [classes, teacherForm.session]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setTeacherForm((currentForm) => ({
        ...currentForm,
        session: value,
        assigned_class_record: "",
        username: buildTeacherUsername(currentForm.full_name, ""),
      }));
      return;
    }

    if (name === "assigned_class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setTeacherForm((currentForm) => ({
        ...currentForm,
        assigned_class_record: value,
        username: buildTeacherUsername(
          currentForm.full_name,
          selectedClass?.name || ""
        ),
      }));
      return;
    }

    if (name === "full_name") {
      const selectedClass = classes.find(
        (classRecord) => classRecord._id === teacherForm.assigned_class_record
      );

      setTeacherForm((currentForm) => ({
        ...currentForm,
        full_name: value,
        username: buildTeacherUsername(value, selectedClass?.name || ""),
      }));
      return;
    }

    setTeacherForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await API.post("/teachers", teacherForm);
      setTeacherForm(initialTeacherForm);
      setStatus({
        type: "success",
        message: "Form teacher registered successfully.",
      });
      await fetchTeacherData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to register teacher.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  return (
    <div className="px-6 py-10 lg:px-12">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaChalkboardUser />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Teacher Management
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Register form teachers and assign them to class records by session.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_520px]">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Register Form Teacher
              </h3>
              <p className="mt-3 max-w-2xl text-primary/70">
                Username is generated from the teacher name and assigned class.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className={inputClass}
                name="full_name"
                value={teacherForm.full_name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />

              <select
                className={inputClass}
                name="session"
                value={teacherForm.session}
                onChange={handleChange}
                required
              >
                {sessionOptions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>

              <select
                className={inputClass}
                name="assigned_class_record"
                value={teacherForm.assigned_class_record}
                onChange={handleChange}
                required
              >
                <option value="">Assigned class</option>
                {availableClasses.map((classRecord) => (
                  <option key={classRecord._id} value={classRecord._id}>
                    {classRecord.name.toUpperCase()}
                  </option>
                ))}
              </select>

              {teacherForm.session && availableClasses.length === 0 && (
                <p className="text-sm font-semibold text-primary/60">
                  No class has been created for this session yet.
                </p>
              )}

              <input
                className={inputClass}
                name="username"
                value={teacherForm.username}
                onChange={handleChange}
                placeholder="Username"
                readOnly
                required
              />

              <input
                className={inputClass}
                name="password"
                type="password"
                value={teacherForm.password}
                onChange={handleChange}
                placeholder="Teacher password"
                required
              />

              <button
                type="submit"
                disabled={submitting || availableClasses.length === 0}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Registering teacher..." : "Register Teacher"}
                {!submitting && <FaArrowRight />}
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-6">
            <h3 className="text-3xl font-extrabold text-primary">
              Form Teacher Records
            </h3>
            <p className="mt-2 text-primary/70">
              Recent form teacher accounts and assigned class records.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">S/N</th>
                  <th className="px-5 py-4 font-bold">Teacher</th>
                  <th className="px-5 py-4 font-bold">Username</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Assigned Class</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      Loading teachers...
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No form teacher has been registered yet.
                    </td>
                  </tr>
                ) : (
                  teachers.slice(0, 15).map((teacher, index) => (
                    <tr key={teacher._id} className="text-primary/80">
                      <td className="px-5 py-4 font-bold text-primary">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary">
                        {teacher.full_name}
                      </td>
                      <td className="px-5 py-4">{teacher.username}</td>
                      <td className="px-5 py-4">{teacher.session}</td>
                      <td className="px-5 py-4">
                        {teacher.assigned_class?.toUpperCase() || "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        {teacher.createdAt
                          ? new Date(teacher.createdAt).toLocaleDateString()
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
    </div>
  );
}

export default TeacherManagement;
