import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaChalkboardUser,
  FaCircleCheck,
  FaCircleExclamation,
  FaXmark,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";

const DEFAULT_SESSION_FILTER = "2025/2026";

const initialTeacherForm = {
  full_name: "",
  username: "",
  session: DEFAULT_SESSION_FILTER,
  assigned_class_record: "",
  password: "",
};

const buildTeacherUsername = (fullName, suffix = "") => {
  const namePart = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return `${namePart}${suffix}`;
};

const createUsernameSuffix = () => Math.floor(1000 + Math.random() * 9000).toString();

function ActionMessageModal({ status, onClose }) {
  if (!status?.message) {
    return null;
  }

  const isSuccess = status.type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-secondary p-7 text-primary shadow-2xl">
        <div
          className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-xl text-white ${
            isSuccess ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {isSuccess ? <FaCircleCheck /> : <FaCircleExclamation />}
        </div>
        <h3 className="text-2xl font-extrabold">
          {isSuccess ? "Success" : "Notice"}
        </h3>
        <p className="mt-3 text-primary/70">{status.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary transition-all duration-300 hover:scale-[1.02]"
        >
          Close
          <FaXmark />
        </button>
      </div>
    </div>
  );
}

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [editingTeacherId, setEditingTeacherId] = useState("");
  const [usernameSuffix, setUsernameSuffix] = useState(createUsernameSuffix);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [resettingTeacherId, setResettingTeacherId] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const [teachersRequest, classesRequest] = await Promise.allSettled([
        API.get("/teachers"),
        API.get("/classes"),
      ]);

      if (classesRequest.status === "rejected") {
        throw new Error(
          classesRequest.reason?.response?.data?.message ||
            classesRequest.reason?.response?.data?.error ||
            "Unable to load class records."
        );
      }

      setClasses(classesRequest.value.data || []);
      setTeachers(
        teachersRequest.status === "fulfilled"
          ? teachersRequest.value.data || []
          : []
      );
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
        username: editingTeacherId
          ? currentForm.username
          : buildTeacherUsername(currentForm.full_name, usernameSuffix),
      }));
      return;
    }

    if (name === "assigned_class_record") {
      setTeacherForm((currentForm) => ({
        ...currentForm,
        assigned_class_record: value,
        username: editingTeacherId
          ? currentForm.username
          : buildTeacherUsername(currentForm.full_name, usernameSuffix),
      }));
      return;
    }

    if (name === "full_name") {
      setTeacherForm((currentForm) => ({
        ...currentForm,
        full_name: value,
        username: editingTeacherId
          ? currentForm.username
          : buildTeacherUsername(value, usernameSuffix),
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
      const payload = { ...teacherForm };

      if (!payload.password) {
        delete payload.password;
      }

      if (editingTeacherId) {
        await API.put(`/teachers/${editingTeacherId}`, payload);
      } else {
        await API.post("/teachers", payload);
      }

      setTeacherForm(initialTeacherForm);
      setEditingTeacherId("");
      setUsernameSuffix(createUsernameSuffix());
      setStatus({
        type: "success",
        message: editingTeacherId
          ? "Teacher updated successfully."
          : "Form teacher registered successfully.",
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

  const handleEdit = (teacher) => {
    setEditingTeacherId(teacher._id);
    setTeacherForm({
      full_name: teacher.full_name || "",
      username: teacher.username || "",
      session: teacher.session || DEFAULT_SESSION_FILTER,
      assigned_class_record:
        teacher.assigned_class_record?._id ||
        teacher.assigned_class_record ||
        "",
      password: "",
    });
    setStatus({ type: "", message: "" });
  };

  const handleCancelEdit = () => {
    setEditingTeacherId("");
    setTeacherForm(initialTeacherForm);
    setUsernameSuffix(createUsernameSuffix());
  };

  const handleDeactivateRequest = (teacher) => {
    setDeactivateTarget(teacher);
  };

  const handleResetPassword = async (teacherId) => {
    setResettingTeacherId(teacherId);
    setStatus({ type: "", message: "" });

    try {
      await API.put(`/teachers/${teacherId}/reset-password`);
      setStatus({
        type: "success",
        message: "Teacher password reset to original registration password.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to reset teacher password.",
      });
    } finally {
      setResettingTeacherId("");
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget?._id) {
      return;
    }

    setDeactivating(true);

    try {
      await API.put(`/teachers/${deactivateTarget._id}/deactivate`, {
        reason: "Teacher no longer assigned to this class",
      });
      setStatus({
        type: "success",
        message:
          "Teacher deactivated successfully. Previous records remain linked.",
      });
      setDeactivateTarget(null);
      await fetchTeacherData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to deactivate teacher.",
      });
    } finally {
      setDeactivating(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  return (
    <div className="px-6 py-10 lg:px-12">
      <ActionMessageModal
        status={status}
        onClose={() => setStatus({ type: "", message: "" })}
      />
      <AdminDeleteModal
        open={Boolean(deactivateTarget)}
        title="Deactivate Form Teacher"
        message="This will remove the teacher from the active class assignment so another form teacher can be assigned. Previous class results and broadsheets will remain linked to this teacher."
        details={
          deactivateTarget
            ? `${deactivateTarget.full_name} - ${deactivateTarget.username}`
            : ""
        }
        confirmLabel="Deactivate Teacher"
        loading={deactivating}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateConfirm}
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
          <div className="grid grid-cols-1 gap-8 ">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                {editingTeacherId ? "Edit Teacher" : "Register Form Teacher"}
              </h3>
              <p className="mt-3 max-w-2xl text-primary/70">
                {editingTeacherId
                  ? "Update teacher details. Leave password empty to keep the current password."
                  : "Username is generated from the teacher full name and a unique 4 digit code."}
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
                required={!editingTeacherId}
              />

              <button
                type="submit"
                disabled={submitting || availableClasses.length === 0}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? editingTeacherId
                    ? "Saving teacher..."
                    : "Registering teacher..."
                  : editingTeacherId
                    ? "Save Teacher"
                    : "Register Teacher"}
                {!submitting && <FaArrowRight />}
              </button>

              {editingTeacherId && (
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

        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-6">
            <h3 className="text-3xl font-extrabold text-primary">
              View Form Teachers
            </h3>
            <p className="mt-2 text-primary/70">
              View registered form teachers, edit records, deactivate accounts,
              or reset a teacher password.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">S/N</th>
                  <th className="px-5 py-4 font-bold">Teacher</th>
                  <th className="px-5 py-4 font-bold">Username</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Assigned Class</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Password</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loading ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="9">
                      Loading teachers...
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="9">
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
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${
                            teacher.status === "inactive"
                              ? "bg-red-500/20 text-red-200"
                              : "bg-green-500/20 text-green-100"
                          }`}
                        >
                          {teacher.status === "inactive" ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary/70">
                          Protected
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {teacher.createdAt
                          ? new Date(teacher.createdAt).toLocaleDateString()
                          : "Not available"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(teacher)}
                            className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeactivateRequest(teacher)}
                            disabled={teacher.status === "inactive"}
                            className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(teacher._id)}
                            disabled={resettingTeacherId === teacher._id}
                            className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {resettingTeacherId === teacher._id
                              ? "Resetting..."
                              : "Reset Password"}
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

export default TeacherManagement;
