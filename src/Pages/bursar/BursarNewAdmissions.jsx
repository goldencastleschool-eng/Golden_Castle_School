import { useEffect, useMemo, useState } from "react";
import { FaPrint, FaUserGraduate } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PortalWelcomeBanner from "../../components/common/PortalWelcomeBanner.jsx";

const PAGE_SIZE = 25;
const terms = ["First Term", "Second Term", "Third Term"];
const escapeHtml = (value = "") => value.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function BursarNewAdmissions() {
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/classes")
      .then((response) => setSessions([...new Set((response.data || []).map((item) => item.session).filter(Boolean))].sort()))
      .catch(() => setError("Unable to load academic sessions."));
  }, []);

  useEffect(() => {
    setPage(1); setClassFilter("");
    if (!session || !term) { setStudents([]); return; }
    setLoading(true); setError("");
    API.get("/students/new-admissions", { params: { session, term } })
      .then((response) => setStudents(response.data || []))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load new admissions."))
      .finally(() => setLoading(false));
  }, [session, term]);

  const classOptions = useMemo(() => [...new Set(students.map((student) => student.class).filter(Boolean))].sort(), [students]);
  const filteredStudents = useMemo(() => students.filter((student) => !classFilter || student.class === classFilter), [classFilter, students]);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const visiblePage = Math.min(page, totalPages);
  const displayedStudents = filteredStudents.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const printRegister = () => {
    if (!session || !term) { setError("Select a session and term before printing."); return; }
    const popup = window.open("", "_blank", "width=1000,height=800");
    if (!popup) { setError("Allow popups to print the admissions register."); return; }
    const rows = filteredStudents.map((student, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(student.full_name)}</td><td>${escapeHtml(student.admission_no)}</td><td>${escapeHtml(student.class || "Not set")}</td><td>${escapeHtml(student.gender || "Not set")}</td><td>${escapeHtml(student.status || "active")}</td></tr>`).join("") || '<tr><td colspan="6">No new admissions found.</td></tr>';
    popup.document.write(`<html><head><title>New Admissions Register</title><style>body{font-family:Arial,sans-serif;color:#172554;padding:24px}h1,h2{margin:0 0 8px}p{color:#475569}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cbd5e1;padding:9px;text-align:left;font-size:13px}th{background:#e0f2fe}</style></head><body><h1>Golden Castle School</h1><h2>New Admissions Register</h2><p>Session: ${escapeHtml(session)} | Term: ${escapeHtml(term)} | Class: ${escapeHtml(classFilter || "All classes")} | Total: ${filteredStudents.length}</p><table><thead><tr><th>S/N</th><th>Student</th><th>Admission No.</th><th>Class</th><th>Gender</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    popup.document.close(); popup.focus(); popup.print();
  };
  const input = "w-full rounded-lg border border-primary/15 bg-secondary px-4 py-3 text-primary outline-none focus:border-button focus:ring-2 focus:ring-button/20";

  return <div className="space-y-6 text-primary"><PortalWelcomeBanner icon={<FaUserGraduate />} eyebrow="Admissions register" title="Newly admitted students" description="View students registered as new admissions for any academic session and term." /><section className="rounded-lg bg-secondary p-5 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><select className={input} value={session} onChange={(event) => setSession(event.target.value)}><option value="">Select session</option>{sessions.map((value) => <option key={value}>{value}</option>)}</select><select className={input} value={term} onChange={(event) => setTerm(event.target.value)}><option value="">Select term</option>{terms.map((value) => <option key={value}>{value}</option>)}</select><select className={input} disabled={!session || !term} value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setPage(1); }}><option value="">All classes</option>{classOptions.map((value) => <option key={value}>{value}</option>)}</select></div></section>{error && <p className="rounded-lg bg-red-100 p-4 font-semibold text-red-800">{error}</p>}<section className="overflow-hidden rounded-lg bg-secondary shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 p-5"><div><h2 className="text-xl font-extrabold">New admissions register</h2><p className="mt-1 text-sm text-primary/60">{session && term ? `${session} · ${term} · ${classFilter || "All classes"}` : "Choose a session and term."} · 25 records per page</p></div><div className="flex items-center gap-2"><button type="button" disabled={!session || !term} onClick={printRegister} className="inline-flex items-center gap-2 rounded-lg bg-button px-3 py-2 text-sm font-bold text-secondary disabled:opacity-40"><FaPrint /> Print {classFilter || "all classes"}</button><span className="rounded-full bg-primary/10 px-4 py-2 font-bold">{loading ? "Loading..." : `${filteredStudents.length} student(s)`}</span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-primary/5"><tr><th className="p-4">S/N</th><th className="p-4">Student</th><th className="p-4">Admission no.</th><th className="p-4">Class</th><th className="p-4">Gender</th><th className="p-4">Status</th></tr></thead><tbody>{displayedStudents.map((student, index) => <tr key={student._id} className="border-t border-primary/10"><td className="p-4 font-bold">{(visiblePage - 1) * PAGE_SIZE + index + 1}</td><td className="p-4 font-semibold">{student.full_name}</td><td className="p-4">{student.admission_no}</td><td className="p-4">{student.class || "Not set"}</td><td className="p-4">{student.gender || "Not set"}</td><td className="p-4 capitalize">{student.status || "active"}</td></tr>)}{!loading && displayedStudents.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-primary/60">Select a session and term to view new admissions.</td></tr>}</tbody></table></div>{totalPages > 1 && <div className="flex items-center justify-between border-t border-primary/10 p-4 text-sm"><button type="button" disabled={visiblePage === 1} onClick={() => setPage((current) => current - 1)} className="rounded bg-primary px-3 py-2 font-bold text-secondary disabled:opacity-40">Previous</button><span className="font-semibold">Page {visiblePage} of {totalPages}</span><button type="button" disabled={visiblePage === totalPages} onClick={() => setPage((current) => current + 1)} className="rounded bg-primary px-3 py-2 font-bold text-secondary disabled:opacity-40">Next</button></div>}</section></div>;
}

export default BursarNewAdmissions;
