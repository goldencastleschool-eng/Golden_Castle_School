import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaChalkboardUser,
  FaLayerGroup,
  FaPrint,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import PaginationControls from "../../components/common/PaginationControls.jsx";
import {
  formatClassSection,
  getClassSection,
} from "../../utils/classSections.js";
import {
  TEACHER_ASSIGNMENT_TYPES,
  isFormTeacher,
} from "../../utils/teacherAssignments.js";
import {
  getPrintBrandHeader,
  getPrintBrandStyles,
} from "../../utils/printBranding.js";

const DEFAULT_SESSION_FILTER = "2025/2026";
const PAGE_SIZE = 15;

const initialTeacherForm = {
  full_name: "",
  username: "",
  session: DEFAULT_SESSION_FILTER,
  assigned_class_record: "",
  assignment_type: TEACHER_ASSIGNMENT_TYPES.FORM,
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

const escapeHtml = (value = "") =>
  value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not available";

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
  const [teacherPage, setTeacherPage] = useState(1);

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

  const formTeachers = useMemo(
    () => teachers.filter((teacher) => isFormTeacher(teacher)),
    [teachers]
  );
  useEffect(() => {
    setTeacherPage(1);
  }, [formTeachers.length]);

  const visibleTeacherPage = Math.min(
    teacherPage,
    Math.max(1, Math.ceil(formTeachers.length / PAGE_SIZE))
  );
  const displayedFormTeachers = useMemo(
    () =>
      formTeachers.slice(
        (visibleTeacherPage - 1) * PAGE_SIZE,
        visibleTeacherPage * PAGE_SIZE
      ),
    [formTeachers, visibleTeacherPage]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "session") {
      setTeacherForm((currentForm) => ({
        ...currentForm,
        session: value,
        assigned_class_record: "",
        assignment_type: TEACHER_ASSIGNMENT_TYPES.FORM,
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
        assignment_type: TEACHER_ASSIGNMENT_TYPES.FORM,
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
      const payload = {
        ...teacherForm,
        assignment_type: TEACHER_ASSIGNMENT_TYPES.FORM,
      };

      if (!payload.password) {
        delete payload.password;
      }

      let savedTeacher = null;

      if (editingTeacherId) {
        const response = await API.put(`/teachers/${editingTeacherId}`, payload);
        savedTeacher = response.data;
      } else {
        const response = await API.post("/teachers", payload);
        savedTeacher = response.data;
      }

      setTeacherForm(initialTeacherForm);
      setEditingTeacherId("");
      setUsernameSuffix(createUsernameSuffix());
      setStatus({
        type: "success",
        message: editingTeacherId
          ? "Form teacher updated successfully."
          : "Form teacher registered successfully.",
      });
      if (savedTeacher?._id) {
        setTeachers((currentTeachers) => {
          const existingTeacher = currentTeachers.some(
            (teacher) => teacher._id === savedTeacher._id
          );

          if (existingTeacher) {
            return currentTeachers.map((teacher) =>
              teacher._id === savedTeacher._id ? savedTeacher : teacher
            );
          }

          return [savedTeacher, ...currentTeachers];
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to register form teacher.",
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
      assignment_type: TEACHER_ASSIGNMENT_TYPES.FORM,
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

  const handlePrintFormTeachers = () => {
    if (formTeachers.length === 0) {
      setStatus({
        type: "error",
        message: "No form teacher record is available to print.",
      });
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=720");

    if (!printWindow) {
      setStatus({
        type: "error",
        message: "Unable to open print window. Allow popups and try again.",
      });
      return;
    }

    const rows = formTeachers
      .map(
        (teacher, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(teacher.full_name || "")}</td>
            <td>${escapeHtml(teacher.username || "")}</td>
            <td>${escapeHtml(teacher.session || "")}</td>
            <td>${escapeHtml(
              teacher.assigned_class?.toUpperCase() || "Not set"
            )}</td>
            <td>${escapeHtml(
              teacher.status === "inactive" ? "Inactive" : "Active"
            )}</td>
            <td>${escapeHtml(formatDate(teacher.createdAt))}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Registered Form Teachers</title>
          <style>
            ${getPrintBrandStyles()}
            body {
              color: #111;
              font-family: Arial, sans-serif;
              padding: 28px;
            }

            h1 {
              font-size: 24px;
              margin: 0 0 6px;
            }

            p {
              color: #555;
              margin: 0 0 18px;
            }

            table {
              border-collapse: collapse;
              width: 100%;
            }

            th,
            td {
              border: 1px solid #ddd;
              font-size: 13px;
              padding: 10px;
              text-align: left;
            }

            th {
              background: #f1f1f1;
            }
          </style>
        </head>
        <body>
          ${getPrintBrandHeader({
            title: "Registered Form Teachers",
            subtitle: "Form Teacher Records",
          })}
          <h1>Registered Form Teachers</h1>
          <p>Total: ${formTeachers.length} | Printed: ${escapeHtml(
            new Date().toLocaleDateString()
          )}</p>
          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Teacher</th>
                <th>Username</th>
                <th>Session</th>
                <th>Assigned Class</th>
                <th>Status</th>
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

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget?._id) {
      return;
    }

    setDeactivating(true);

    try {
      const response = await API.put(`/teachers/${deactivateTarget._id}/deactivate`, {
        reason: "Form teacher no longer assigned to this class",
      });
      const deactivatedTeacher = response.data?.teacher;
      setStatus({
        type: "success",
        message:
          "Form teacher deactivated successfully. Previous records remain linked.",
      });
      setDeactivateTarget(null);
      if (deactivatedTeacher?._id) {
        setTeachers((currentTeachers) =>
          currentTeachers.map((teacher) =>
            teacher._id === deactivatedTeacher._id
              ? deactivatedTeacher
              : teacher
          )
        );
      }
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
    "w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  return (
    <div className="px-6 py-8 lg:px-10">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />
      <AdminDeleteModal
        open={Boolean(deactivateTarget)}
        title="Deactivate Form Teacher"
        message="This will remove the form teacher from the active class assignment. Previous class results and broadsheets will remain linked to this teacher."
        details={
          deactivateTarget
            ? `${deactivateTarget.full_name} - ${deactivateTarget.username}`
            : ""
        }
        confirmLabel="Deactivate Form Teacher"
        loading={deactivating}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateConfirm}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaChalkboardUser />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">
          Teacher Management
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Register form teachers and assign them to class records by session.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-8 ">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                {editingTeacherId ? "Edit Form Teacher" : "Register Form Teacher"}
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
                    {classRecord.name.toUpperCase()} -{" "}
                    {formatClassSection(getClassSection(classRecord))}
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
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? editingTeacherId
                    ? "Saving form teacher..."
                    : "Registering form teacher..."
                  : editingTeacherId
                    ? "Save Form Teacher"
                    : "Register Form Teacher"}
                {!submitting && <FaArrowRight />}
              </button>

              {editingTeacherId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full rounded-lg bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </section>

        <section className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                View Form Teachers
              </h3>
              <p className="mt-2 text-primary/70">
                View registered form teachers, edit records, deactivate
                accounts, or reset a teacher password.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrintFormTeachers}
              disabled={loading || formTeachers.length === 0}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-3 font-bold text-secondary shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              <FaPrint />
              Print Form Teachers
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-primary/10">
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
                  <TableSkeleton columns={9} />
                ) : displayedFormTeachers.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="9">
                      No form teacher has been registered yet.
                    </td>
                  </tr>
                ) : (
                  displayedFormTeachers.map((teacher, index) => (
                    <tr key={teacher._id} className="text-primary/80">
                      <td className="px-5 py-4 font-bold text-primary">
                        {(visibleTeacherPage - 1) * PAGE_SIZE + index + 1}
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
                        {formatDate(teacher.createdAt)}
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
          <PaginationControls
            currentPage={visibleTeacherPage}
            totalItems={formTeachers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setTeacherPage}
          />
        </section>
      </div>
    </div>
  );
}

export default TeacherManagement;

