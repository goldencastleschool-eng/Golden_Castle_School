import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios.jsx";

const documentTypes = ["lesson_note", "assignment", "test", "examination"];

function AcademicStudio() {
  const [schemes, setSchemes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({ class_scheme: "", subject: "", template: "", document_type: "lesson_note", question_count: 10, duration_minutes: 40, difficulty: "mixed" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedScheme = schemes.find((scheme) => scheme._id === form.class_scheme);
  const templatesForType = useMemo(() => templates.filter((template) => template.document_type === form.document_type), [form.document_type, templates]);
  const load = async () => {
    const [schemesResponse, templatesResponse, documentsResponse] = await Promise.all([API.get("/class-schemes"), API.get("/academic-content/templates"), API.get("/academic-content/documents")]);
    setSchemes(schemesResponse.data || []);
    setTemplates(templatesResponse.data || []);
    setDocuments(documentsResponse.data || []);
  };
  useEffect(() => { document.body.classList.add("academic-ai-active"); return () => document.body.classList.remove("academic-ai-active"); }, []);
  useEffect(() => { const timerId = setTimeout(() => { load().catch(() => setStatus("Unable to load your approved class scheme.")); }, 0); return () => clearTimeout(timerId); }, []);
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setStatus("");
    try { await API.post("/academic-content/documents/generate", form); await load(); setStatus("Draft generated from your assigned class scheme. Submit it for review before school use."); }
    catch (error) { setStatus(error.response?.data?.message || "Unable to generate a draft."); }
    finally { setLoading(false); }
  };
  return <div className="p-5 md:p-8"><div className="max-w-6xl"><h2 className="text-3xl font-extrabold text-primary">Academic AI Studio</h2><p className="mt-2 text-primary/70">Generate classroom material from the approved scheme of work assigned to your class.</p>{status && <p className="mt-4 rounded-lg bg-primary/10 p-4 text-primary">{status}</p>}<div className="mt-6 grid gap-6"><form onSubmit={submit} className="space-y-4 rounded-lg bg-secondary p-6 shadow-lg"><h3 className="text-xl font-bold text-primary">Create Draft</h3><select required value={form.class_scheme} onChange={(event) => setForm({...form, class_scheme:event.target.value, subject:""})} className="w-full rounded-lg border p-3"><option value="">My approved class scheme</option>{schemes.map((scheme) => <option key={scheme._id} value={scheme._id}>{scheme.class.toUpperCase()} · {scheme.session}</option>)}</select><select required disabled={!selectedScheme} value={form.subject} onChange={(event) => setForm({...form, subject:event.target.value})} className="w-full rounded-lg border p-3"><option value="">{selectedScheme ? "Select subject" : "Select scheme first"}</option>{selectedScheme?.subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select><select value={form.document_type} onChange={(event) => setForm({...form, document_type:event.target.value, template:""})} className="w-full rounded-lg border p-3">{documentTypes.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select><select value={form.template} onChange={(event) => setForm({...form, template:event.target.value})} className="w-full rounded-lg border p-3"><option value="">Default school layout</option>{templatesForType.map((template) => <option key={template._id} value={template._id}>{template.name}</option>)}</select><div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-semibold text-primary/70">Number of questions<input min="1" type="number" value={form.question_count} onChange={(event) => setForm({...form, question_count:Number(event.target.value)})} className="mt-2 w-full rounded-lg border p-3"/><span className="mt-1 block text-xs font-normal text-primary/55">Use for tests, assignments, and examinations.</span></label><label className="block text-sm font-semibold text-primary/70">Assessment duration (minutes)<input min="5" type="number" value={form.duration_minutes} onChange={(event) => setForm({...form, duration_minutes:Number(event.target.value)})} className="mt-2 w-full rounded-lg border p-3"/><span className="mt-1 block text-xs font-normal text-primary/55">For example: enter 40 for a 40-minute assessment.</span></label></div><select value={form.difficulty} onChange={(event) => setForm({...form, difficulty:event.target.value})} className="w-full rounded-lg border p-3"><option value="mixed">Mixed difficulty</option><option value="foundation">Foundation</option><option value="challenging">Challenging</option></select><button disabled={loading || !form.subject} className="w-full rounded-lg bg-button p-3 font-bold text-secondary disabled:opacity-60">{loading ? "Generating..." : "Generate School Draft"}</button></form><section className="rounded-lg bg-secondary p-6 shadow-lg"><h3 className="text-xl font-bold text-primary">My Drafts</h3><div className="mt-4 space-y-3">{documents.length === 0 ? <p className="text-primary/70">No drafts yet.</p> : documents.map((document) => <article key={document._id} className="rounded-lg border border-primary/10 p-4"><div className="flex justify-between gap-3"><div><p className="font-bold text-primary">{document.title}</p><p className="text-sm text-primary/60">{document.class_scheme?.class} · {document.subject}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{document.status.replace("_", " ")}</span></div><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-primary/5 p-3 text-sm text-primary/80">{JSON.stringify(document.content, null, 2)}</pre></article>)}</div></section></div></div></div>;
}

export default AcademicStudio;
