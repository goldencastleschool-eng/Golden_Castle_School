import { useEffect, useState } from "react";
import { FaArrowRight, FaUserGraduate } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const initialStudentForm = {
  full_name: "",
  admission_no: "",
  class: "",
  class_record: "",
  current_session: "",
  gender: "",
  password: "",
};

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [editingStudentId, setEditingStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const [studentsResponse, classesResponse] = await Promise.all([
        API.get("/students"),
        API.get("/classes"),
      ]);
      setStudents(studentsResponse.data || []);
      setClasses(classesResponse.data || []);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to load students.",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "current_session") {
      setStudentForm((currentForm) => ({
        ...currentForm,
        current_session: value,
        class: "",
        class_record: "",
      }));
      return;
    }

    if (name === "class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setStudentForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        class: selectedClass?.name || "",
        current_session: selectedClass?.session || currentForm.current_session,
      }));
      return;
    }

    setStudentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      if (editingStudentId) {
        const payload = { ...studentForm };

        if (!payload.password) {
          delete payload.password;
        }

        await API.put(`/students/${editingStudentId}`, payload);
      } else {
        await API.post("/students", studentForm);
      }

      setStudentForm(initialStudentForm);
      setEditingStudentId("");
      setStatus({
        type: "success",
        message: editingStudentId
          ? "Student updated successfully."
          : "Student account created successfully.",
      });
      await fetchStudents();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to create student.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    const matchingClassRecord = classes.find(
      (classRecord) =>
        classRecord.name === student.class &&
        classRecord.session === student.current_session
    );

    setEditingStudentId(student._id);
    setStudentForm({
      full_name: student.full_name || "",
      admission_no: student.admission_no || "",
      class: student.class || "",
      class_record:
        student.class_record?._id ||
        student.class_record ||
        matchingClassRecord?._id ||
        "",
      current_session: student.current_session || "",
      gender: student.gender || "",
      password: "",
    });
    setStatus({ type: "", message: "" });
  };

  const handleCancelEdit = () => {
    setEditingStudentId("");
    setStudentForm(initialStudentForm);
  };

  const handleDeleteRequest = (student) => {
    setDeleteTarget(student);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    setDeleting(true);
    try {
      await API.delete(`/students/${deleteTarget._id}`);
      setStatus({
        type: "success",
        message: "Student deleted successfully.",
      });
      setDeleteTarget(null);
      await fetchStudents();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete student.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  const displayedStudents = (() => {
    const searchValue = studentSearch.trim().toLowerCase();

    if (!searchValue) {
      return students.slice(0, 15);
    }

    return students.filter((student) => {
      const searchableText = [
        student.full_name,
        student.admission_no,
        student.class,
        student.current_session,
        student.gender,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  })();

  const availableClasses = classes.filter(
    (classRecord) => classRecord.session === studentForm.current_session
  );

  return (
    <div className="px-6 py-10 lg:px-12">
      <AdminNotification
        status={status}
        onDismiss={() => setStatus({ type: "", message: "" })}
      />
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete Student"
        message="This action will permanently remove this student account and all result records linked to the student."
        details={
          deleteTarget
            ? `${deleteTarget.full_name} - ${deleteTarget.admission_no}`
            : ""
        }
        confirmLabel="Delete Student"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaUserGraduate />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Student Management
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Create student portal accounts and keep admission records easy to
          scan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 ">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-secondary p-8 shadow-2xl"
        >
          <h3 className="text-3xl font-extrabold text-primary">
            {editingStudentId ? "Edit Student" : "Register Student"}
          </h3>
          <p className="mt-3 text-primary/70">
            The password is stored securely by the backend.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-5">
            <input
              className={inputClass}
              name="full_name"
              value={studentForm.full_name}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
            <input
              className={inputClass}
              name="admission_no"
              value={studentForm.admission_no}
              onChange={handleChange}
              placeholder="Admission number"
              required
            />
            <input
              className={inputClass}
              name="current_session"
              value={studentForm.current_session}
              onChange={handleChange}
              placeholder="Current session e.g. 2025/2026"
              required
            />
            <select
              className={inputClass}
              name="class_record"
              value={studentForm.class_record}
              onChange={handleChange}
              disabled={!studentForm.current_session}
              required
            >
              <option value="">
                {studentForm.current_session
                  ? "Select class"
                  : "Enter session first"}
              </option>
              {availableClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>
            {studentForm.current_session && availableClasses.length === 0 && (
              <p className="text-sm font-semibold text-primary/60">
                No class has been created for this session yet.
              </p>
            )}
            <select
              className={inputClass}
              name="gender"
              value={studentForm.gender}
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input
              className={inputClass}
              name="password"
              type="password"
              value={studentForm.password}
              onChange={handleChange}
              placeholder="Student password"
              required={!editingStudentId}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting
              ? editingStudentId
                ? "Saving student..."
                : "Creating student..."
              : editingStudentId
                ? "Save Changes"
                : "Create Student"}
            {!submitting && <FaArrowRight />}
          </button>

          {editingStudentId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="mt-4 w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              Cancel Edit
            </button>
          )}
        </form>

        <section className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px_auto] lg:items-end">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Student Records
              </h3>
              <p className="mt-2 text-primary/70">
                Showing the 15 most recent registrations by default. Use search
                to find any student.
              </p>
            </div>

            <input
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search students"
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-3 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
            />

            <button
              onClick={fetchStudents}
              className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-3 font-semibold text-secondary shadow-lg transition-all duration-300 hover:scale-105"
            >
              Refresh
              <FaArrowRight />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-primary/10">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">S/N</th>
                  <th className="px-5 py-4 font-bold">Student</th>
                  <th className="px-5 py-4 font-bold">Admission No.</th>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Gender</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-primary/10">
                {loadingStudents ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="9">
                      Loading students...
                    </td>
                  </tr>
                ) : displayedStudents.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="9">
                      {studentSearch
                        ? "No student matches your search."
                        : "No students registered yet."}
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, index) => (
                    <tr
                      key={student._id}
                      className="text-primary/80 transition duration-300 hover:bg-primary/5"
                    >
                      <td className="px-5 py-4 font-bold text-primary">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary">
                        {student.full_name}
                      </td>
                      <td className="px-5 py-4">{student.admission_no}</td>
                      <td className="px-5 py-4">{student.class}</td>
                      <td className="px-5 py-4">
                        {student.current_session || "Not set"}
                      </td>
                      <td className="px-5 py-4">{student.gender || "Not set"}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${
                            student.status === "graduated"
                              ? "bg-green-500/10 text-green-700"
                              : student.status === "left"
                                ? "bg-red-500/10 text-red-700"
                              : "bg-button/10 text-primary"
                          }`}
                        >
                          {student.status === "graduated"
                            ? "Graduated"
                            : student.status === "left"
                              ? "Left School"
                              : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString()
                          : "Not available"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(student)}
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
        </section>
      </div>
    </div>
  );
}

export default StudentManagement;
