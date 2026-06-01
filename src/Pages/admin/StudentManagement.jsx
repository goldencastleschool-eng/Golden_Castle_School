import { useEffect, useState } from "react";
import { FaArrowRight, FaUserGraduate } from "react-icons/fa6";

import API from "../../api/axios.jsx";

const initialStudentForm = {
  full_name: "",
  admission_no: "",
  class: "",
  gender: "",
  password: "",
};

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [editingStudentId, setEditingStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await API.get("/students");
      setStudents(response.data || []);
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
    setEditingStudentId(student._id);
    setStudentForm({
      full_name: student.full_name || "",
      admission_no: student.admission_no || "",
      class: student.class || "",
      gender: student.gender || "",
      password: "",
    });
    setStatus({ type: "", message: "" });
  };

  const handleCancelEdit = () => {
    setEditingStudentId("");
    setStudentForm(initialStudentForm);
  };

  const handleDelete = async (studentId) => {
    const confirmed = window.confirm(
      "Delete this student and their result records?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/students/${studentId}`);
      setStatus({
        type: "success",
        message: "Student deleted successfully.",
      });
      await fetchStudents();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete student.",
      });
    }
  };

  const statusClass =
    status.type === "success"
      ? "bg-green-500/10 border-green-500/30 text-green-300"
      : "bg-red-500/10 border-red-500/30 text-red-300";

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
        student.gender,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  })();

  return (
    <div className="px-6 py-10 lg:px-12">
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

          {status.message && (
            <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${statusClass}`}>
              {status.message}
            </div>
          )}

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
              name="class"
              value={studentForm.class}
              onChange={handleChange}
              placeholder="Class"
              required
            />
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
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">S/N</th>
                  <th className="px-5 py-4 font-bold">Student</th>
                  <th className="px-5 py-4 font-bold">Admission No.</th>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Gender</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-primary/10">
                {loadingStudents ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="7">
                      Loading students...
                    </td>
                  </tr>
                ) : displayedStudents.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="7">
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
                      <td className="px-5 py-4">{student.gender || "Not set"}</td>
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
                            onClick={() => handleDelete(student._id)}
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
