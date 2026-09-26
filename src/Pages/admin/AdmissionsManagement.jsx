import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios.jsx";
import PaginationControls from "../../components/common/PaginationControls.jsx";

const PAGE_SIZE = 15;
const statuses = ["submitted", "under_review", "contacted", "approved", "rejected", "waitlisted", "withdrawn"];
const feeCategoryLabels = { regular: "New student", vip: "VIP", scholarship: "Scholarship" };
const statusStyles = { submitted: "bg-primary/10 text-primary", under_review: "bg-amber-100 text-amber-800", contacted: "bg-sky-100 text-sky-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", waitlisted: "bg-violet-100 text-violet-800", withdrawn: "bg-slate-200 text-slate-700", converted_to_student: "bg-emerald-100 text-emerald-800" };

export default function AdmissionsManagement() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("submitted");
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const input = "w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none focus:border-button";

  const load = async () => {
    try {
      const response = await API.get("/admission-applications");
      setApplications(response.data || []);
    } catch {
      setMessage({ type: "error", text: "Unable to load admission applications." });
    }
  };
  useEffect(() => { load(); }, []);
  const visibleApplications = useMemo(() => applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [applications, page]);
  const openReview = (application) => { setSelected(application); setStatus(application.status); setNote(application.admin_note || ""); };
  const closeReview = () => setSelected(null);
  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await API.put(`/admission-applications/${selected._id}/status`, { status, admin_note: note });
      setMessage({ type: "success", text: "Application review updated." });
      closeReview();
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to update application." });
    } finally { setSaving(false); }
  };

  return <div className="px-6 py-8 lg:px-10">
    <h2 className="text-3xl font-extrabold text-secondary">Admissions</h2>
    <p className="mt-3 text-secondary/75">Review public applications before registering approved students.</p>
    {message.text && <p className={`mt-5 rounded-lg p-4 font-semibold ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message.text}</p>}
    <section className="mt-8 overflow-hidden rounded-xl border border-primary/10 bg-secondary shadow-lg">
      <div className="flex items-center justify-between border-b border-primary/10 px-5 py-4"><div><h3 className="text-xl font-extrabold text-primary">Application queue</h3><p className="mt-1 text-sm text-primary/65">Use Review to view and act on an application.</p></div><span className="rounded-full bg-button/15 px-3 py-1 text-sm font-bold text-primary">{applications.length} total</span></div>
      <div className="overflow-x-auto"><table className="min-w-full"><thead className="bg-primary text-left text-xs font-bold uppercase tracking-wider text-secondary"><tr><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Applicant & parent</th><th className="px-5 py-4">Session</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody>{visibleApplications.map((item) => <tr key={item._id} className="border-b border-primary/10 bg-secondary text-primary"><td className="whitespace-nowrap px-5 py-4 font-bold">{item.application_reference}</td><td className="px-5 py-4 font-semibold">{item.full_name}<span className="mt-1 block text-xs font-medium text-primary/65">{item.parent_name} · {item.parent_phone}</span></td><td className="whitespace-nowrap px-5 py-4 font-medium text-primary/80">{item.applying_session}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[item.status] || "bg-primary/10 text-primary"}`}>{item.status.replaceAll("_", " ")}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => openReview(item)} className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-button hover:text-secondary">Review</button></td></tr>)}{applications.length === 0 && <tr><td className="px-5 py-10 text-center font-medium text-primary/60" colSpan="5">No applications have been submitted yet.</td></tr>}</tbody></table></div>
      <div className="px-5 pb-5"><PaginationControls currentPage={page} totalItems={applications.length} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="admission-review-title"><button type="button" aria-label="Close review" onClick={closeReview} className="absolute inset-0 cursor-default" /><section className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-secondary p-6 shadow-2xl sm:max-w-3xl sm:rounded-2xl"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-primary/10 pb-5"><div><h3 id="admission-review-title" className="text-2xl font-extrabold text-primary">{selected.full_name}</h3><p className="mt-1 font-bold text-button">{selected.application_reference}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[selected.status] || "bg-primary/10 text-primary"}`}>{selected.status.replaceAll("_", " ")}</span><button type="button" onClick={closeReview} className="rounded-lg bg-primary/10 px-3 py-2 font-bold text-primary">Close</button></div></div><div className="mt-6 grid gap-3 rounded-lg bg-primary/5 p-4 text-sm text-primary/80 md:grid-cols-2"><p><span className="font-bold text-primary">Parent:</span> {selected.parent_name}</p><p><span className="font-bold text-primary">Phone:</span> {selected.parent_phone}</p><p><span className="font-bold text-primary">Email:</span> {selected.parent_email || "Not provided"}</p><p><span className="font-bold text-primary">Category:</span> {feeCategoryLabels[selected.admission_category] || "New student"}</p><p><span className="font-bold text-primary">Accommodation:</span> {selected.boarding_requested ? "Boarding requested" : "Day student"}</p><p><span className="font-bold text-primary">Preferred class:</span> {selected.preferred_class?.name || "Not selected"}</p><p className="md:col-span-2"><span className="font-bold text-primary">Previous school:</span> {selected.previous_school || "Not provided"}</p></div>{selected.status !== "converted_to_student" && <><select className={`${input} mt-6`} value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item.replaceAll("_", " ")}</option>)}</select><textarea className={`${input} mt-3 min-h-24`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Private review note" /><button disabled={saving} onClick={saveStatus} className="mt-3 w-full rounded-lg bg-primary px-4 py-3 font-bold text-secondary disabled:opacity-60">Save review</button></>}{selected.status === "approved" && !selected.converted_student && <div className="mt-7 border-t border-primary/10 pt-6"><h4 className="font-extrabold text-primary">Ready for student registration</h4><p className="mt-2 text-sm text-primary/65">Continue in Student Management to confirm the final class, term, and portal password.</p><button onClick={() => navigate(`/admin/students?applicationId=${selected._id}`)} className="mt-4 w-full rounded-lg bg-button px-4 py-3 font-bold text-secondary">Register student in Student Management</button></div>}{selected.converted_student && <p className="mt-6 rounded-lg bg-green-100 p-4 font-bold text-green-800">Converted: {selected.converted_student.admission_no}</p>}</section></div>}
  </div>;
}
