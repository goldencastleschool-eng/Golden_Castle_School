import { useState } from "react";
import API from "../../api/axios.jsx";

export default function ApplicationStatus() {
  const [form, setForm] = useState({ application_reference: "", parent_phone: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const input = "w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none placeholder:text-primary/45 focus:border-button";
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); setResult(null); try { const response = await API.post("/admission-applications/track", form, { skipAuthRedirect: true }); setResult(response.data); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to check application status."); } finally { setLoading(false); } };
  return <div className="bg-background px-5 py-12 sm:px-8 lg:px-10"><div className="mx-auto max-w-xl rounded-2xl bg-secondary p-6 shadow-xl sm:p-10"><p className="font-bold uppercase tracking-[0.18em] text-button">Admissions</p><h1 className="mt-3 text-4xl font-extrabold text-primary">Check application status</h1><p className="mt-3 text-primary/70">Enter the application reference and the parent phone number used when applying.</p><form onSubmit={submit} className="mt-7 space-y-4"><input className={input} value={form.application_reference} onChange={(e) => setForm({ ...form, application_reference: e.target.value })} placeholder="Application reference e.g. GCIS/APP/27/0001" required /><input className={input} value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} placeholder="Parent phone number" required /><button disabled={loading} className="w-full rounded-lg bg-button px-5 py-4 font-bold text-secondary disabled:opacity-60">{loading ? "Checking…" : "Check status"}</button></form>{error && <p className="mt-5 rounded-lg bg-red-100 p-4 font-semibold text-red-800">{error}</p>}{result && <div className="mt-5 rounded-lg bg-green-100 p-5 text-green-900"><p className="font-bold">{result.application_reference}</p><p className="mt-2">Session: {result.applying_session}</p><p className="mt-1">Status: {result.status.replaceAll("_", " ")}</p>{result.admission_no && <p className="mt-1">Admission number: {result.admission_no}</p>}</div>}</div></div>;
}
