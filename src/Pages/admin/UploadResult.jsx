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
  class_record: "",
  assigned_teacher: "",
  pdf: null,
};

const initialCumulativeForm = {
  studentId: "",
  session: "",
  class: "",
  class_record: "",
  pdf: null,
};

const initialBroadsheetForm = {
  session: "",
  term: "",
  class: "",
  class_record: "",
  pdf: null,
};

const normalizeClassName = (className = "") =>
  className.toString().trim().toLowerCase().replace(/\s+/g, "");

function UploadResult() {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [cumulativeResults, setCumulativeResults] = useState([]);
  const [classBroadsheets, setClassBroadsheets] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [resultForm, setResultForm] = useState(initialResultForm);
  const [cumulativeForm, setCumulativeForm] = useState(initialCumulativeForm);
  const [broadsheetForm, setBroadsheetForm] = useState(initialBroadsheetForm);
  const [broadsheetAccessForm, setBroadsheetAccessForm] = useState({
    broadsheet_session: "",
    broadsheet_term: "",
  });
  const [editingResultId, setEditingResultId] = useState("");
  const [editingCumulativeResultId, setEditingCumulativeResultId] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadingCumulative, setUploadingCumulative] = useState(false);
  const [uploadingBroadsheet, setUploadingBroadsheet] = useState(false);
  const [savingBroadsheetAccess, setSavingBroadsheetAccess] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchResults = async () => {
    const response = await API.get("/results");
    setResults(response.data || []);
  };

  const fetchCumulativeResults = async () => {
    const response = await API.get("/cumulative-results");
    setCumulativeResults(response.data || []);
  };

  const fetchClassBroadsheets = async () => {
    const response = await API.get("/class-broadsheets");
    setClassBroadsheets(response.data || []);
  };

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoadingStudents(true);

        const [
          studentsRequest,
          resultsRequest,
          cumulativeResultsRequest,
          classesRequest,
          broadsheetsRequest,
          teachersRequest,
          accessRequest,
        ] = await Promise.allSettled([
          API.get("/students"),
          API.get("/results"),
          API.get("/cumulative-results"),
          API.get("/classes"),
          API.get("/class-broadsheets"),
          API.get("/teachers"),
          API.get("/result-access"),
        ]);

        if (studentsRequest.status === "rejected") {
          throw new Error(
            studentsRequest.reason?.response?.data?.message ||
              "Unable to load students for result upload."
          );
        }

        if (resultsRequest.status === "rejected") {
          throw new Error(
            resultsRequest.reason?.response?.data?.message ||
              "Unable to load result records."
          );
        }

        if (classesRequest.status === "rejected") {
          throw new Error(
            classesRequest.reason?.response?.data?.message ||
              "Unable to load class records."
          );
        }

        setStudents(studentsRequest.value.data || []);
        setResults(resultsRequest.value.data || []);
        setClasses(classesRequest.value.data || []);
        setCumulativeResults(
          cumulativeResultsRequest.status === "fulfilled"
            ? cumulativeResultsRequest.value.data || []
            : []
        );
        setClassBroadsheets(
          broadsheetsRequest.status === "fulfilled"
            ? broadsheetsRequest.value.data || []
            : []
        );
        setTeachers(
          teachersRequest.status === "fulfilled"
            ? teachersRequest.value.data || []
            : []
        );
        if (accessRequest.status === "fulfilled") {
          setBroadsheetAccessForm({
            broadsheet_session:
              accessRequest.value.data?.broadsheet_session || "",
            broadsheet_term: accessRequest.value.data?.broadsheet_term || "",
          });
        }
      } catch (error) {
        setStatus({
          type: "error",
          message:
            error.message ||
            error.response?.data?.message ||
            "Unable to load result upload records.",
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchPageData();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!resultForm.class || !resultForm.session) {
      return [];
    }

    return students.filter(
      (student) =>
        student.status === "active" &&
        normalizeClassName(student.class) ===
          normalizeClassName(resultForm.class) &&
        student.current_session === resultForm.session
    );
  }, [resultForm.class, resultForm.session, students]);

  const availableClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === resultForm.session
    );
  }, [classes, resultForm.session]);

  const cumulativeAvailableClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === cumulativeForm.session
    );
  }, [classes, cumulativeForm.session]);

  const broadsheetAvailableClasses = useMemo(() => {
    return classes.filter(
      (classRecord) => classRecord.session === broadsheetForm.session
    );
  }, [classes, broadsheetForm.session]);

  const broadsheetAvailableTeachers = useMemo(() => {
    if (!broadsheetForm.class_record || !broadsheetForm.session) {
      return [];
    }

    return teachers.filter((teacher) => {
      const teacherClassId =
        teacher.assigned_class_record?._id || teacher.assigned_class_record;

      return (
        teacher.session === broadsheetForm.session &&
        teacherClassId === broadsheetForm.class_record
      );
    });
  }, [broadsheetForm.class_record, broadsheetForm.session, teachers]);

  const cumulativeFilteredStudents = useMemo(() => {
    if (!cumulativeForm.class || !cumulativeForm.session) {
      return [];
    }

    return students.filter(
      (student) =>
        student.status === "active" &&
        normalizeClassName(student.class) ===
          normalizeClassName(cumulativeForm.class) &&
        student.current_session === cumulativeForm.session
    );
  }, [cumulativeForm.class, cumulativeForm.session, students]);

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

  const displayedCumulativeResults = useMemo(() => {
    return cumulativeResults.slice(0, 15);
  }, [cumulativeResults]);

  const displayedClassBroadsheets = useMemo(() => {
    return classBroadsheets.slice(0, 15);
  }, [classBroadsheets]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "session") {
      setResultForm((currentForm) => ({
        ...currentForm,
        session: value,
        class: "",
        class_record: "",
        studentId: editingResultId ? currentForm.studentId : "",
      }));
      return;
    }

    if (name === "class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setResultForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        class: selectedClass?.name || "",
        studentId: editingResultId ? currentForm.studentId : "",
      }));
      return;
    }

    setResultForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleCumulativeChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "session") {
      setCumulativeForm((currentForm) => ({
        ...currentForm,
        session: value,
        class: "",
        class_record: "",
        studentId: editingCumulativeResultId ? currentForm.studentId : "",
      }));
      return;
    }

    if (name === "class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setCumulativeForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        class: selectedClass?.name || "",
        studentId: editingCumulativeResultId ? currentForm.studentId : "",
      }));
      return;
    }

    setCumulativeForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleBroadsheetChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "session") {
      setBroadsheetForm((currentForm) => ({
        ...currentForm,
        session: value,
        class: "",
        class_record: "",
        assigned_teacher: "",
      }));
      return;
    }

    if (name === "class_record") {
      const selectedClass = classes.find((classRecord) => classRecord._id === value);

      setBroadsheetForm((currentForm) => ({
        ...currentForm,
        class_record: value,
        class: selectedClass?.name || "",
        assigned_teacher: "",
      }));
      return;
    }

    setBroadsheetForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleBroadsheetAccessChange = (event) => {
    const { name, value } = event.target;

    setBroadsheetAccessForm((currentForm) => ({
      ...currentForm,
      [name]: value,
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

  const handleCumulativeSubmit = async (event) => {
    event.preventDefault();
    setUploadingCumulative(true);
    setStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("studentId", cumulativeForm.studentId);
      formData.append("session", cumulativeForm.session);
      formData.append("class", cumulativeForm.class);
      formData.append("pdf", cumulativeForm.pdf);

      const endpoint = editingCumulativeResultId
        ? `/cumulative-results/${editingCumulativeResultId}`
        : "/cumulative-results/upload";
      const request = editingCumulativeResultId ? API.put : API.post;

      await request(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setCumulativeForm(initialCumulativeForm);
      setEditingCumulativeResultId("");
      event.target.reset();
      await fetchCumulativeResults();
      setStatus({
        type: "success",
        message: editingCumulativeResultId
          ? "Cumulative result updated successfully."
          : "Cumulative result PDF uploaded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to upload cumulative result.",
      });
    } finally {
      setUploadingCumulative(false);
    }
  };

  const handleBroadsheetSubmit = async (event) => {
    event.preventDefault();
    setUploadingBroadsheet(true);
    setStatus({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("session", broadsheetForm.session);
      formData.append("term", broadsheetForm.term);
      formData.append("class_record", broadsheetForm.class_record);
      formData.append("assigned_teacher", broadsheetForm.assigned_teacher);
      formData.append("pdf", broadsheetForm.pdf);

      await API.post("/class-broadsheets/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setBroadsheetForm(initialBroadsheetForm);
      event.target.reset();
      await fetchClassBroadsheets();
      setStatus({
        type: "success",
        message: "Class broadsheet uploaded successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to upload class broadsheet.",
      });
    } finally {
      setUploadingBroadsheet(false);
    }
  };

  const handleBroadsheetAccessSubmit = async (event) => {
    event.preventDefault();
    setSavingBroadsheetAccess(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await API.put(
        "/result-access/broadsheet",
        broadsheetAccessForm
      );
      setBroadsheetAccessForm({
        broadsheet_session: response.data.broadsheet_session || "",
        broadsheet_term: response.data.broadsheet_term || "",
      });
      setStatus({
        type: "success",
        message: "Teacher broadsheet access updated successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to update teacher broadsheet access.",
      });
    } finally {
      setSavingBroadsheetAccess(false);
    }
  };

  const handleEdit = (result) => {
    setEditingResultId(result._id);
    setResultForm({
      studentId: result.student?._id || result.student || "",
      session: result.session || "",
      term: result.term || "",
      class: result.class || "",
      class_record:
        classes.find(
          (classRecord) =>
            classRecord.name === result.class &&
            classRecord.session === result.session
        )?._id || "",
      pdf: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingResultId("");
    setResultForm(initialResultForm);
  };

  const handleEditCumulative = (result) => {
    setEditingCumulativeResultId(result._id);
    setCumulativeForm({
      studentId: result.student?._id || result.student || "",
      session: result.session || "",
      class: result.class || "",
      class_record:
        classes.find(
          (classRecord) =>
            classRecord.name === result.class &&
            classRecord.session === result.session
        )?._id || "",
      pdf: null,
    });
  };

  const handleCancelCumulativeEdit = () => {
    setEditingCumulativeResultId("");
    setCumulativeForm(initialCumulativeForm);
  };

  const handleDeleteRequest = (result, type = "termly") => {
    setDeleteTarget({
      ...result,
      deleteType: type
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?._id) {
      return;
    }

    setDeleting(true);
    try {
      if (deleteTarget.deleteType === "cumulative") {
        await API.delete(`/cumulative-results/${deleteTarget._id}`);
      } else if (deleteTarget.deleteType === "broadsheet") {
        await API.delete(`/class-broadsheets/${deleteTarget._id}`);
      } else {
        await API.delete(`/results/${deleteTarget._id}`);
      }
      setStatus({
        type: "success",
        message:
          deleteTarget.deleteType === "cumulative"
            ? "Cumulative result deleted successfully."
            : deleteTarget.deleteType === "broadsheet"
              ? "Class broadsheet deleted successfully."
            : "Result deleted successfully.",
      });
      setDeleteTarget(null);
      if (deleteTarget.deleteType === "cumulative") {
        await fetchCumulativeResults();
      } else if (deleteTarget.deleteType === "broadsheet") {
        await fetchClassBroadsheets();
      } else {
        await fetchResults();
      }
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
        title={
          deleteTarget?.deleteType === "cumulative"
            ? "Delete Cumulative Result"
            : deleteTarget?.deleteType === "broadsheet"
              ? "Delete Class Broadsheet"
            : "Delete Result"
        }
        message={
          deleteTarget?.deleteType === "cumulative"
            ? "This action will permanently remove this uploaded cumulative result PDF record from the system."
            : deleteTarget?.deleteType === "broadsheet"
              ? "This action will permanently remove this uploaded class broadsheet PDF record from the system."
            : "This action will permanently remove this uploaded result PDF record from the system."
        }
        details={
          deleteTarget
            ? `${deleteTarget.student?.full_name || deleteTarget.class || "Unknown record"} - ${deleteTarget.session}${deleteTarget.term ? ` - ${deleteTarget.term}` : ""}`
            : ""
        }
        confirmLabel={
          deleteTarget?.deleteType === "cumulative"
            ? "Delete Cumulative Result"
            : deleteTarget?.deleteType === "broadsheet"
              ? "Delete Class Broadsheet"
            : "Delete Result"
        }
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
              name="class_record"
              value={resultForm.class_record}
              onChange={handleChange}
              disabled={!resultForm.session}
              required
            >
              <option value="">
                {resultForm.session ? "Select class" : "Enter session first"}
              </option>
              {availableClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>
            {resultForm.session && availableClasses.length === 0 && (
              <p className="text-sm font-semibold text-primary/60">
                No class has been created for this session yet.
              </p>
            )}

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

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl lg:p-10">
        <h3 className="text-3xl font-extrabold text-primary">
          {editingCumulativeResultId
            ? "Edit Cumulative Result"
            : "Upload Cumulative Result PDF"}
        </h3>
        <p className="mt-3 text-primary/70">
          Upload one cumulative PDF result for a student and academic session.
        </p>

        <form onSubmit={handleCumulativeSubmit}>
          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
            <input
              className={inputClass}
              name="session"
              value={cumulativeForm.session}
              onChange={handleCumulativeChange}
              placeholder="Session e.g. 2025/2026"
              required
            />

            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              name="class_record"
              value={cumulativeForm.class_record}
              onChange={handleCumulativeChange}
              disabled={!cumulativeForm.session}
              required
            >
              <option value="">
                {cumulativeForm.session ? "Select class" : "Enter session first"}
              </option>
              {cumulativeAvailableClasses.map((classRecord) => (
                <option key={classRecord._id} value={classRecord._id}>
                  {classRecord.name.toUpperCase()}
                </option>
              ))}
            </select>
            {cumulativeForm.session && cumulativeAvailableClasses.length === 0 && (
              <p className="text-sm font-semibold text-primary/60">
                No class has been created for this session yet.
              </p>
            )}

            <select
              className="w-full rounded-2xl border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              name="studentId"
              value={cumulativeForm.studentId}
              onChange={handleCumulativeChange}
              disabled={!cumulativeForm.class || loadingStudents}
              required
            >
              <option value="">
                {loadingStudents
                  ? "Loading students..."
                  : cumulativeForm.class
                    ? "Select student"
                    : "Select class first"}
              </option>
              {cumulativeFilteredStudents.map((student) => (
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
              onChange={handleCumulativeChange}
              required={!editingCumulativeResultId}
            />
          </div>

          <button
            type="submit"
            disabled={uploadingCumulative || cumulativeFilteredStudents.length === 0}
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploadingCumulative
              ? editingCumulativeResultId
                ? "Saving cumulative result..."
                : "Uploading cumulative result..."
              : editingCumulativeResultId
                ? "Save Cumulative Result"
                : "Upload Cumulative Result"}
            {!uploadingCumulative && <FaArrowRight />}
          </button>
          {editingCumulativeResultId && (
            <button
              type="button"
              onClick={handleCancelCumulativeEdit}
              className="mt-4 w-full rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-secondary"
            >
              Cancel Cumulative Edit
            </button>
          )}
        </form>
      </section>

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl lg:p-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
          <div>
            <h3 className="text-3xl font-extrabold text-primary">
              Upload Class Broadsheet PDF
            </h3>
            <p className="mt-3 text-primary/70">
              Upload a class broadsheet to a selected form teacher destination.
            </p>

            <form onSubmit={handleBroadsheetSubmit} className="mt-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <input
                  className={inputClass}
                  name="session"
                  value={broadsheetForm.session}
                  onChange={handleBroadsheetChange}
                  placeholder="Session e.g. 2025/2026"
                  required
                />

                <select
                  className={inputClass}
                  name="term"
                  value={broadsheetForm.term}
                  onChange={handleBroadsheetChange}
                  required
                >
                  <option value="">Select term</option>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>

                <select
                  className={inputClass}
                  name="class_record"
                  value={broadsheetForm.class_record}
                  onChange={handleBroadsheetChange}
                  disabled={!broadsheetForm.session}
                  required
                >
                  <option value="">
                    {broadsheetForm.session ? "Select class" : "Enter session first"}
                  </option>
                  {broadsheetAvailableClasses.map((classRecord) => (
                    <option key={classRecord._id} value={classRecord._id}>
                      {classRecord.name.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  className={inputClass}
                  name="assigned_teacher"
                  value={broadsheetForm.assigned_teacher}
                  onChange={handleBroadsheetChange}
                  disabled={!broadsheetForm.class_record}
                  required
                >
                  <option value="">
                    {broadsheetForm.class_record
                      ? "Select form teacher destination"
                      : "Select class first"}
                  </option>
                  {broadsheetAvailableTeachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.full_name} - {teacher.username}
                    </option>
                  ))}
                </select>

                <input
                  className={inputClass}
                  name="pdf"
                  type="file"
                  accept="application/pdf"
                  onChange={handleBroadsheetChange}
                  required
                />
              </div>

              {broadsheetForm.session && broadsheetAvailableClasses.length === 0 && (
                <p className="mt-4 text-sm font-semibold text-primary/60">
                  No class has been created for this session yet.
                </p>
              )}
              {broadsheetForm.class_record &&
                broadsheetAvailableTeachers.length === 0 && (
                  <p className="mt-4 text-sm font-semibold text-primary/60">
                    No form teacher is assigned to this class/session yet.
                  </p>
                )}

              <button
                type="submit"
                disabled={
                  uploadingBroadsheet ||
                  !broadsheetForm.class_record ||
                  !broadsheetForm.assigned_teacher ||
                  !broadsheetForm.pdf
                }
                className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploadingBroadsheet
                  ? "Uploading broadsheet..."
                  : "Upload Class Broadsheet"}
                {!uploadingBroadsheet && <FaArrowRight />}
              </button>
            </form>
          </div>

          <form
            onSubmit={handleBroadsheetAccessSubmit}
            className="rounded-2xl bg-primary/5 p-6"
          >
            <h4 className="text-2xl font-extrabold text-primary">
              Teacher Broadsheet Access
            </h4>
            <p className="mt-2 text-primary/70">
              Control the session and term teachers can access in their portal.
            </p>

            <div className="mt-6 space-y-4">
              <input
                className={inputClass}
                name="broadsheet_session"
                value={broadsheetAccessForm.broadsheet_session}
                onChange={handleBroadsheetAccessChange}
                placeholder="Approved session e.g. 2025/2026"
                required
              />
              <select
                className={inputClass}
                name="broadsheet_term"
                value={broadsheetAccessForm.broadsheet_term}
                onChange={handleBroadsheetAccessChange}
                required
              >
                <option value="">Approved term</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingBroadsheetAccess}
              className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-button px-5 py-4 font-bold text-secondary shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingBroadsheetAccess ? "Saving access..." : "Save Broadsheet Access"}
            </button>
          </form>
        </div>
      </section>

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
                <th className="px-5 py-4 font-bold">Form Teacher</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {displayedResults.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
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

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Recent Cumulative Uploads
          </h3>
          <p className="mt-2 text-primary/70">
            Showing the 15 most recent cumulative result uploads.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Student</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Uploaded</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {displayedCumulativeResults.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="6">
                    No cumulative result uploads yet.
                  </td>
                </tr>
              ) : (
                displayedCumulativeResults.map((result, index) => (
                  <tr key={result._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {result.student?.full_name || "Unknown"}
                    </td>
                    <td className="px-5 py-4">{result.class}</td>
                    <td className="px-5 py-4">{result.session}</td>
                    <td className="px-5 py-4">
                      {result.createdAt
                        ? new Date(result.createdAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCumulative(result)}
                          className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(result, "cumulative")}
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

      <section className="mt-8 rounded-[2rem] bg-secondary p-8 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-primary">
            Recent Class Broadsheets
          </h3>
          <p className="mt-2 text-primary/70">
            Showing the 15 most recent class broadsheet uploads.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-primary/10">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-primary/10 text-primary">
              <tr>
                <th className="px-5 py-4 font-bold">S/N</th>
                <th className="px-5 py-4 font-bold">Class</th>
                <th className="px-5 py-4 font-bold">Form Teacher</th>
                <th className="px-5 py-4 font-bold">Session</th>
                <th className="px-5 py-4 font-bold">Term</th>
                <th className="px-5 py-4 font-bold">Uploaded</th>
                <th className="px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {displayedClassBroadsheets.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-primary/70" colSpan="7">
                    No class broadsheet uploads yet.
                  </td>
                </tr>
              ) : (
                displayedClassBroadsheets.map((broadsheet, index) => (
                  <tr key={broadsheet._id} className="text-primary/80">
                    <td className="px-5 py-4 font-bold text-primary">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary">
                      {broadsheet.class?.toUpperCase() || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      {broadsheet.assigned_teacher?.full_name || "Not set"}
                    </td>
                    <td className="px-5 py-4">{broadsheet.session}</td>
                    <td className="px-5 py-4">{broadsheet.term}</td>
                    <td className="px-5 py-4">
                      {broadsheet.createdAt
                        ? new Date(broadsheet.createdAt).toLocaleDateString()
                        : "Not available"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(broadsheet, "broadsheet")}
                        className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200"
                      >
                        Delete
                      </button>
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
