import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaLayerGroup,
  FaUserCheck,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { TableSkeleton } from "../../components/common/Loading.jsx";
import PaginationControls from "../../components/common/PaginationControls.jsx";
import {
  getVisibleTermsForSession,
  normalizeTermForSession,
} from "../../utils/academicTerms.js";
import { feeCategories, formatFeeCategory } from "../../utils/feeCategories.js";

const initialStudentForm = {
  full_name: "",
  admission_no: "",
  class: "",
  class_record: "",
  current_session: "",
  admission_term: "",
  fee_category: "",
  gender: "",
  password: "",
};

const DEFAULT_SESSION_FILTER = "2025/2026";
const PAGE_SIZE = 15;

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

const isActiveStudent = (student) =>
  !student.status || student.status === "active";

const getStudentFeeEnrollment = (student, session, term = "") => {
  const enrollments = Array.isArray(student.fee_enrollments)
    ? student.fee_enrollments
    : [];

  return enrollments.find(
    (enrollment) =>
      enrollment.session === session &&
      (!term || enrollment.term === term)
  );
};

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [editingStudentId, setEditingStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [studentViewSessionFilter, setStudentViewSessionFilter] = useState(
    DEFAULT_SESSION_FILTER
  );
  const [studentViewTermFilter, setStudentViewTermFilter] = useState("");
  const [studentViewClassId, setStudentViewClassId] = useState("");
  const [studentNameSort, setStudentNameSort] = useState("az");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [passwordResetTargetId, setPasswordResetTargetId] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

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
        admission_term: normalizeTermForSession(
          currentForm.admission_term,
          value
        ),
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
      let savedStudent = null;

      if (editingStudentId) {
        const payload = { ...studentForm };

        if (!payload.password) {
          delete payload.password;
        }

        const response = await API.put(`/students/${editingStudentId}`, payload);
        savedStudent = response.data;
      } else {
        const response = await API.post("/students", studentForm);
        savedStudent = response.data;
      }

      setStudentForm(initialStudentForm);
      setEditingStudentId("");
      setStatus({
        type: "success",
        message: editingStudentId
          ? "Student updated successfully."
          : "Student account created successfully.",
      });
      if (savedStudent?._id) {
        setStudents((currentStudents) => {
          const existingStudent = currentStudents.some(
            (student) => student._id === savedStudent._id
          );

          if (existingStudent) {
            return currentStudents.map((student) =>
              student._id === savedStudent._id ? savedStudent : student
            );
          }

          return [savedStudent, ...currentStudents];
        });
      }
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
    const currentEnrollment =
      getStudentFeeEnrollment(student, student.current_session) || {};

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
      admission_term: currentEnrollment.term || "",
      fee_category: currentEnrollment.fee_category || "",
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
      setStudents((currentStudents) =>
        currentStudents.filter((student) => student._id !== deleteTarget._id)
      );
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

  const handlePasswordReset = async (studentId) => {
    setPasswordResetTargetId(studentId);
    setResettingPassword(true);
    setStatus({ type: "", message: "" });

    try {
      await API.put(`/students/${studentId}/reset-password`);
      setStatus({
        type: "success",
        message: "Student password reset to original registration password.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to reset student password.",
      });
    } finally {
      setResettingPassword(false);
      setPasswordResetTargetId("");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, students.length]);

  const filteredStudentRecords = (() => {
    const searchValue = studentSearch.trim().toLowerCase();

    if (!searchValue) {
      return students;
    }

    return students.filter((student) => {
      const searchableText = [
        student.full_name,
        student.admission_no,
        student.class,
        student.current_session,
        getStudentFeeEnrollment(student, student.current_session)?.term,
        getStudentFeeEnrollment(student, student.current_session)?.fee_category,
        student.gender,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  })();

  const visibleStudentPage = Math.min(
    studentPage,
    Math.max(1, Math.ceil(filteredStudentRecords.length / PAGE_SIZE))
  );
  const displayedStudents = filteredStudentRecords.slice(
    (visibleStudentPage - 1) * PAGE_SIZE,
    visibleStudentPage * PAGE_SIZE
  );

  const sessionOptions = useMemo(() => {
    return [
      ...new Set([
        DEFAULT_SESSION_FILTER,
        ...classes.map((classRecord) => classRecord.session).filter(Boolean),
        ...students.map((student) => student.current_session).filter(Boolean),
      ]),
    ].sort();
  }, [classes, students]);

  const studentViewClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === studentViewSessionFilter
    );
  }, [classes, studentViewSessionFilter]);

  const selectedViewClass = useMemo(() => {
    return classes.find(
      (classRecord) =>
        classRecord._id === studentViewClassId &&
        classRecord.session === studentViewSessionFilter
    );
  }, [classes, studentViewClassId, studentViewSessionFilter]);

  const viewedClassStudents = useMemo(() => {
    if (!selectedViewClass) {
      return [];
    }

    return students.filter(
      (student) =>
        isActiveStudent(student) &&
        normalizeClassName(student.class) ===
          normalizeClassName(selectedViewClass.name) &&
        student.current_session === selectedViewClass.session
    );
  }, [selectedViewClass, students]);

  const sortedViewedClassStudents = useMemo(() => {
    return [...viewedClassStudents].sort((firstStudent, secondStudent) => {
      const firstName = (firstStudent.full_name || "").toLowerCase();
      const secondName = (secondStudent.full_name || "").toLowerCase();

      return studentNameSort === "za"
        ? secondName.localeCompare(firstName)
        : firstName.localeCompare(secondName);
    });
  }, [studentNameSort, viewedClassStudents]);

  const handleStudentViewSessionChange = (event) => {
    const nextSession = event.target.value;
    setStudentViewSessionFilter(nextSession);
    setStudentViewTermFilter((currentTerm) =>
      normalizeTermForSession(currentTerm, nextSession)
    );
    setStudentViewClassId("");
  };

  const availableClasses = classes.filter(
    (classRecord) => classRecord.session === studentForm.current_session
  );
  return (
    <div className="px-6 py-8 lg:px-10">
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
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaUserGraduate />
        </div>
        <h2 className="text-3xl font-extrabold text-secondary">
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
          className="rounded-lg bg-secondary p-6 shadow-lg"
        >
          <h3 className="text-3xl font-extrabold text-primary">
            {editingStudentId ? "Edit Student" : "Register Student"}
          </h3>
          <p className="mt-3 text-primary/70">
            The password is stored securely by the backend.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
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
              <p className="text-sm font-semibold text-primary/60 md:col-span-2">
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
            <select
              className={inputClass}
              name="admission_term"
              value={studentForm.admission_term}
              onChange={handleChange}
              required
            >
              <option value="">Select admission term</option>
              {getVisibleTermsForSession(studentForm.current_session).map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              name="fee_category"
              value={studentForm.fee_category}
              onChange={handleChange}
              required
            >
              <option value="">Select student fee category</option>
              {feeCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
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
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
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
              className="mt-4 w-full rounded-lg bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              Cancel Edit
            </button>
          )}
        </form>

        <section className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="mb-6 flex flex-col gap-4 rounded-lg bg-secondary p-6 shadow-lg">
            <div>
              <p className="text-sm font-bold uppercase text-button">
                Student Filters
              </p>
              <h3 className="text-3xl font-extrabold text-primary">
                View Students
              </h3>
              <p className="mt-2 text-primary/70">
                Select a session and class to view active students in that
                class.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                value={studentViewSessionFilter}
                onChange={handleStudentViewSessionChange}
              >
                {sessionOptions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                value={studentViewTermFilter}
              onChange={(event) => setStudentViewTermFilter(event.target.value)}
            >
              <option value="">All terms</option>
              {getVisibleTermsForSession(studentViewSessionFilter).map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
              </select>

              <select
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
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

              <select
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
                value={studentNameSort}
                onChange={(event) => setStudentNameSort(event.target.value)}
              >
                <option value="az">Name A-Z</option>
                <option value="za">Name Z-A</option>
              </select>
            </div>
          </div>

          {studentViewSessionFilter && studentViewClasses.length === 0 && (
            <div className="mb-6 rounded-lg border border-primary/10 bg-primary/5 p-6 text-primary/70">
              No class has been created for {studentViewSessionFilter} yet.
            </div>
          )}

          <div className="mb-6 rounded-lg bg-primary/5 p-5">
            <p className="text-sm font-semibold text-primary/50">
              Active Students in Selected Class
            </p>
            <p className="mt-3 text-3xl font-extrabold text-primary">
              {selectedViewClass ? sortedViewedClassStudents.length : "0"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-primary/10">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">S/N</th>
                  <th className="px-5 py-4 font-bold">Student</th>
                  <th className="px-5 py-4 font-bold">Admission No.</th>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Fee Category</th>
                  <th className="px-5 py-4 font-bold">Gender</th>
                  <th className="px-5 py-4 font-bold">Password</th>
                  <th className="px-5 py-4 font-bold">Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {loadingStudents ? (
                  <TableSkeleton columns={9} />
                ) : !selectedViewClass ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="9">
                      Select a session and class to view students.
                    </td>
                  </tr>
                ) : sortedViewedClassStudents.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="9">
                      No active student found in this class.
                    </td>
                  </tr>
                ) : (
                  sortedViewedClassStudents.map((student, index) => (
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
                      <td className="px-5 py-4">
                        {(() => {
                          const enrollment = getStudentFeeEnrollment(
                            student,
                            student.current_session
                          );

                          return enrollment
                            ? `${formatFeeCategory(enrollment.fee_category)} - ${enrollment.term}`
                            : "Not set";
                        })()}
                      </td>
                      <td className="px-5 py-4">{student.gender || "Not set"}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary/70">
                          Protected
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handlePasswordReset(student._id)}
                          disabled={
                            resettingPassword &&
                            passwordResetTargetId === student._id
                          }
                          className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {resettingPassword && passwordResetTargetId === student._id
                            ? "Resetting..."
                            : "Reset to Original"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-secondary p-6 shadow-lg">
          <div className="mb-5">
              <h3 className="text-3xl font-extrabold text-primary">
                Student Records
              </h3>
              <p className="mt-2 text-primary/70">
                Showing 15 records per page. Use search
                to find any student.
              </p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-[320px_auto] lg:items-end">
            <input
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search students"
              className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-3 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
            />

            <button
              onClick={fetchStudents}
              className="flex cursor-pointer items-center justify-center gap-3 rounded-lg bg-button px-5 py-3 font-semibold text-secondary shadow-lg transition-all duration-300 hover:scale-105"
            >
              Refresh
              <FaArrowRight />
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-primary/10">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">S/N</th>
                  <th className="px-5 py-4 font-bold">Student</th>
                  <th className="px-5 py-4 font-bold">Admission No.</th>
                  <th className="px-5 py-4 font-bold">Class</th>
                  <th className="px-5 py-4 font-bold">Session</th>
                  <th className="px-5 py-4 font-bold">Fee Category</th>
                  <th className="px-5 py-4 font-bold">Gender</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Created</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-primary/10">
                {loadingStudents ? (
                  <TableSkeleton columns={10} />
                ) : displayedStudents.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="10">
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
                        {(visibleStudentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-primary">
                        {student.full_name}
                      </td>
                      <td className="px-5 py-4">{student.admission_no}</td>
                      <td className="px-5 py-4">{student.class}</td>
                      <td className="px-5 py-4">
                        {student.current_session || "Not set"}
                      </td>
                      <td className="px-5 py-4">
                        {(() => {
                          const enrollment = getStudentFeeEnrollment(
                            student,
                            student.current_session
                          );

                          return enrollment
                            ? `${formatFeeCategory(enrollment.fee_category)} - ${enrollment.term}`
                            : "Not set";
                        })()}
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
          <PaginationControls
            currentPage={visibleStudentPage}
            totalItems={filteredStudentRecords.length}
            pageSize={PAGE_SIZE}
            onPageChange={setStudentPage}
          />
        </section>
      </div>
    </div>
  );
}

export default StudentManagement;

