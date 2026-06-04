import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaClipboardCheck } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import AdminDeleteModal from "../../components/common/AdminDeleteModal.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const initialResultForm = {
  studentId: "",
  session: "",
  term: "",
  class: "",
  pdf: null,
};

const classGroups = [
  "pg-1",
  "pg-2",
  "nur-1",
  "nur-2",
  "nur-3",
  "basic-1",
  "basic-2",
  "basic-3",
  "basic-4",
  "basic-5",
  "jss-1a",
  "jss1b",
  "jss2a",
  "jss3",
  "ss1",
  "ss2art",
  "ss2scienc",
];

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

function UploadResult() {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [resultForm, setResultForm] = useState(initialResultForm);
  const [editingResultId, setEditingResultId] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResults = async () => {
    const response = await API.get("/results");
    setResults(response.data || []);
  };

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoadingStudents(true);
        const [studentsResponse, resultsResponse] = await Promise.all([
          API.get("/students"),
          API.get("/results"),
        ]);
        setStudents(studentsResponse.data || []);
        setResults(resultsResponse.data || []);
      } catch (error) {
        setStatus({
          type: "error",
          message:
            error.response?.data?.message ||
            "Unable to load students for result upload.",
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchPageData();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!resultForm.class) {
      return [];
    }

    return students.filter(
      (student) =>
        normalizeClassName(student.class) === normalizeClassName(resultForm.class)
    );
  }, [resultForm.class, students]);

  const displayedResults = useMemo(() => {
    const searchValue = resultSearch.trim().toLowerCase();

    if (!searchValue) {
      return results.slice(0, 15);
    }

    return results.filter((result) => {
      const studentName = result.student?.full_name || "";
      const admissionNo = result.student?.admission_no || "";
      const searchableText = [
        studentName,
        admissionNo,
        result.class,
        result.session,
        result.term,
        result.file_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [resultSearch, results]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "class") {
      setResultForm((currentForm) => ({
        ...currentForm,
        class: value,
        studentId: editingResultId ? currentForm.studentId : "",
      }));
      return;
    }

    setResultForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setUploading(true);
    setStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("studentId", resultForm.studentId);
      formData.append("session", resultForm.session);
      formData.append("term", resultForm.term);
      formData.append("class", resultForm.class);
      formData.append("pdf", resultForm.pdf);

      const endpoint = editingResultId
        ? `/results/${editingResultId}`
        : "/results/upload";
      const request = editingResultId ? API.put : API.post;

      await request(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResultForm(initialResultForm);
      setEditingResultId("");
      event.target.reset();
      await fetchResults();
      setStatus({
        type: "success",
        message: editingResultId
          ? "Result updated successfully."
          : "Result PDF uploaded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to upload result.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (result) => {
    setEditingResultId(result._id);
    setResultForm({
      studentId: result.student?._id || result.student || "",
      session: result.session || "",
      term: result.term || "",
      class: result.class || "",
      pdf: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingResultId("");
    setResultForm(initialResultForm);
  };

  const handleDeleteRequest = (result) => {
    setDeleteTarget(result);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    setDeleting(true);
    try {
      await API.delete(`/results/${deleteTarget._id}`);
      setStatus({
        type: "success",
        message: "Result deleted successfully.",
      });
      setDeleteTarget(null);
      await fetchResults();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to delete result.",
      });
    } finally {
      setDeleting(false);
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
      <AdminDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete Result"
        message="This action will permanently remove this uploaded result PDF record from the system."
        details={
          deleteTarget
            ? `${deleteTarget.student?.full_name || "Unknown student"} - ${deleteTarget.class} - ${deleteTarget.session} - ${deleteTarget.term}`
            : ""
        }
        confirmLabel="Delete Result"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaClipboardCheck />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Result Uploads
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Upload PDF result files and link them to the correct student,
          session, term, and class.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-secondary p-8 shadow-2xl lg:p-10"
        >
          <h3 className="text-3xl font-extrabold text-primary">
            {editingResultId ? "Edit Result" : "Upload Result PDF"}
          </h3>
          <p className="mt-3 text-primary/70">
            The backend accepts PDF files up to 5MB and stores them securely in
            the database.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
            <input
              className={inputClass}
              name="session"
              value={resultForm.session}
              onChange={handleChange}
              placeholder="Session e.g. 2025/2026"
              required
            />
            <select
              className={inputClass}
              name="term"
              value={resultForm.term}
              onChange={handleChange}
              required
            >
              <option value="">Select term</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>

            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              name="class"
              value={resultForm.class}
              onChange={handleChange}
              required
            >
              <option value="">Select class</option>
              {classGroups.map((className) => (
                <option key={className} value={className}>
                  {className.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              name="studentId"
              value={resultForm.studentId}
              onChange={handleChange}
              disabled={!resultForm.class || loadingStudents}
              required
            >
              <option value="">
                {loadingStudents
                  ? "Loading students..."
                  : resultForm.class
                    ? "Select student"
                    : "Select class first"}
              </option>
              {filteredStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.full_name} - {student.admission_no}
                </option>
              ))}
            </select>

            <input
              className={inputClass}
              name="pdf"
              type="file"
              accept="application/pdf"
              onChange={handleChange}
              required={!editingResultId}
            />
          </div>

          <button
            type="submit"
            disabled={uploading || filteredStudents.length === 0}
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploading
              ? editingResultId
                ? "Saving result..."
                : "Uploading result..."
              : editingResultId
                ? "Save Result"
                : "Upload Result"}
            {!uploading && <FaArrowRight />}
          </button>
          {editingResultId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="mt-4 w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Result Records
            </h3>
            <p className="mt-2 text-primary/70">
              Showing the 15 most recent uploads by default. Use search to find
              any result record.
            </p>
          </div>

          <input
            value={resultSearch}
            onChange={(event) => setResultSearch(event.target.value)}
            placeholder="Search result records"
            className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20"
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {displayedResults.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="6">
                    {resultSearch
                      ? "No result record matches your search."
                      : "No result records yet."}
                  </td>
                </tr>
              ) : (
                displayedResults.map((result, index) => (
                  <tr key={result._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {result.student?.full_name || "Unknown"}
                    </td>
                    <td className="px-5 py-4">{result.class}</td>
                    <td className="px-5 py-4">{result.session}</td>
                    <td className="px-5 py-4">{result.term}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(result)}
                          className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(result)}
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
  );
}

export default UploadResult;
