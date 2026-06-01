import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaLayerGroup } from "react-icons/fa6";

import API from "../../api/axios.jsx";

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

function ClassManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [className, setClassName] = useState("");
  const [editingClassId, setEditingClassId] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  const fetchClassData = async () => {
    try {
      setLoadingStudents(true);
      setStatus({ type: "", message: "" });
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

  const classStudents = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    return students.filter(
      (student) =>
        normalizeClassName(student.class) === normalizeClassName(selectedClass)
    );
  }, [selectedClass, students]);

  const selectedClassRecord = classes.find(
    (classRecord) => classRecord.name === selectedClass
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingClassId) {
        await API.put(`/classes/${editingClassId}`, {
          name: className,
        });
      } else {
        await API.post("/classes", {
          name: className,
        });
      }

      setClassName("");
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
  };

  const handleDeleteClass = async (classRecord) => {
    const confirmed = window.confirm(`Delete ${classRecord.name.toUpperCase()}?`);

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/classes/${classRecord._id}`);
      setStatus({
        type: "success",
        message: "Class deleted successfully.",
      });

      if (selectedClass === classRecord.name) {
        setSelectedClass("");
      }

      await fetchClassData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete class.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingClassId("");
    setClassName("");
  };

  const statusClass =
    status.type === "success"
      ? "bg-green-500/10 border-green-500/30 text-green-300"
      : "bg-red-500/10 border-red-500/30 text-red-300";

  return (
    <div className="px-6 py-10 lg:px-12">
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

      {status.message && (
        <div className={`mb-6 rounded-2xl border px-5 py-4 ${statusClass}`}>
          {status.message}
        </div>
      )}

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
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Class Records
            </h3>
            <p className="mt-2 text-primary/70">
              Select a class to view its registered students.
            </p>
          </div>

          <button
            onClick={fetchClassData}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-3 font-semibold text-secondary shadow-lg transition-all duration-300 hover:scale-105"
          >
            Refresh
            <FaArrowRight />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {classes.map((classRecord) => (
            <button
              key={classRecord._id}
              onClick={() => setSelectedClass(classRecord.name)}
              className={`rounded-2xl border p-5 text-left transition-all duration-300 ${
                selectedClass === classRecord.name
                  ? "border-button bg-button text-secondary"
                  : "border-primary/10 bg-primary/5 text-primary hover:border-button"
              }`}
            >
              <p className="text-xl font-extrabold uppercase">
                {classRecord.name}
              </p>
              <p className="mt-2 text-sm opacity-75">
                {
                  students.filter(
                    (student) =>
                      normalizeClassName(student.class) ===
                      normalizeClassName(classRecord.name)
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
                    handleDeleteClass(classRecord);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.stopPropagation();
                      handleDeleteClass(classRecord);
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
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-[1fr_260px] md:items-end">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              {selectedClass
                ? `${selectedClass.toUpperCase()} Students`
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
              Selected Class
            </label>
            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
            >
              <option value="">Choose class</option>
              {classes.map((classRecord) => (
                <option key={classRecord._id} value={classRecord.name}>
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
            {selectedClass ? classStudents.length : "0"}
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
              ) : !selectedClass ? (
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
