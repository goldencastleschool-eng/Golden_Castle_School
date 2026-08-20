import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios.jsx";

const documentTypes = ["lesson_note", "assignment", "test", "examination"];

function AcademicContentManagement() {
  const [classes, setClasses] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ session: "", class_record: "", subjects: "", pdf: null });
  const [templateForm, setTemplateForm] = useState({ name: "", document_type: "lesson_note", header_text: "Golden Castle School", instructions: "", sections: "" });
  const sessions = useMemo(() => [...new Set(classes.map((classRecord) => classRecord.session).filter(Boolean))].sort((firstSession, secondSession) => Number(secondSession.slice(0, 4)) - Number(firstSession.slice(0, 4)) || secondSession.localeCompare(firstSession)), [classes]);
  const selectedSession = form.session || sessions[0] || "";
  const availableClasses = useMemo(() => classes.filter((classRecord) => classRecord.session === selectedSession), [classes, selectedSession]);
  const load = async () => {
    const [classesResponse, schemesResponse, documentsResponse, templatesResponse] = await Promise.all([API.get("/classes"), API.get("/class-schemes"), API.get("/academic-content/documents"), API.get("/academic-content/templates")]);
    setClasses(classesResponse.data || []); setSchemes(schemesResponse.data || []); setDocuments(documentsResponse.data || []); setTemplates(templatesResponse.data || []);
  };
  useEffect(() => { document.body.classList.add("academic-ai-active"); return () => document.body.classList.remove("academic-ai-active"); }, []);
  useEffect(() => { const timerId = setTimeout(() => { load().catch(() => setStatus("Unable to load academic content.")); }, 0); return () => clearTimeout(timerId); }, []);
  const saveScheme = async (event) => {
    event.preventDefault();
    if (!form.pdf) return setStatus("Select the approved scheme-of-work PDF.");
    setUploading(true);
    try {
      const payload = new FormData(); payload.append("session", selectedSession); payload.append("class_record", form.class_record); payload.append("subjects", form.subjects); payload.append("pdf", form.pdf);
      await API.post("/class-schemes", payload); setStatus("Approved class scheme uploaded."); setForm({ session: "", class_record: "", subjects: "", pdf: null }); event.target.reset(); await load();
    } catch (error) { setStatus(error.response?.data?.message || "Unable to upload scheme."); }
    finally { setUploading(false); }
  };
  const saveTemplate = async (event) => {
    event.preventDefault();
    try { await API.post("/academic-content/templates", {...templateForm, sections: templateForm.sections.split("\n").filter(Boolean)}); setStatus("School template saved."); setTemplateForm({ name: "", document_type: "lesson_note", header_text: "Golden Castle School", instructions: "", sections: "" }); await load(); }
    catch (error) { setStatus(error.response?.data?.message || "Unable to save template."); }
  };
  const review = async (id, reviewStatus) => { await API.put(`/academic-content/documents/${id}/review`, { status: reviewStatus }); await load(); };
  return <div className="p-5 md:p-8"><h2 className="text-3xl font-extrabold text-primary">Academic Content Control</h2><p className="mt-2 text-primary/70">Upload one approved scheme-of-work PDF per class and session, then review teacher AI drafts.</p>{status && <p className="mt-4 rounded bg-primary/10 p-3 text-primary">{status}</p>}<div className="mt-6 grid gap-6 xl:grid-cols-2"><form onSubmit={saveScheme} className="space-y-3 rounded-lg bg-secondary p-6 shadow-lg"><h3 className="text-xl font-bold text-primary">Upload Approved Scheme of Work</h3><select required value={selectedSession} onChange={(event) => setForm({...form, session:event.target.value, class_record:""})} className="w-full rounded-lg border p-3"><option value="">Select existing session</option>{sessions.map((session) => <option key={session} value={session}>{session}</option>)}</select><select required disabled={!selectedSession} value={form.class_record} onChange={(event) => setForm({...form, class_record:event.target.value})} className="w-full rounded-lg border p-3"><option value="">{selectedSession ? "Select existing class" : "Select session first"}</option>{availableClasses.map((classRecord) => <option key={classRecord._id} value={classRecord._id}>{classRecord.name.toUpperCase()}</option>)}</select><textarea required placeholder="Subjects in this PDF (one per line or comma-separated)" value={form.subjects} onChange={(event) => setForm({...form, subjects:event.target.value})} className="min-h-28 w-full rounded-lg border p-3"/><input required accept="application/pdf,.pdf" type="file" onChange={(event) => setForm({...form, pdf:event.target.files?.[0] || null})} className="w-full rounded-lg border p-3"/><p className="text-sm text-primary/60">Upload one approved PDF containing all subjects for the selected class and session.</p><button disabled={uploading} className="w-full rounded-lg bg-button p-3 font-bold text-secondary disabled:opacity-60">{uploading ? "Uploading..." : "Upload Approved PDF"}</button></form><section className="rounded-lg bg-secondary p-6 shadow-lg"><h3 className="text-xl font-bold text-primary">Approved Class Schemes ({schemes.length})</h3><div className="mt-3 max-h-[420px] space-y-2 overflow-auto">{schemes.map((scheme) => <div key={scheme._id} className="rounded border p-3 text-primary"><b>{scheme.class.toUpperCase()} · {scheme.session}</b><p className="mt-1 text-sm">{scheme.subjects.join(", ")}</p><p className="mt-1 text-xs text-primary/60">{scheme.file_name || "Approved scheme PDF"}</p></div>)}</div></section></div><div className="mt-6 grid gap-6 xl:grid-cols-2"><form onSubmit={saveTemplate} className="space-y-3 rounded-lg bg-secondary p-6 shadow-lg"><h3 className="text-xl font-bold text-primary">School Document Template</h3><input required placeholder="Template name" value={templateForm.name} onChange={(event) => setTemplateForm({...templateForm,name:event.target.value})} className="w-full rounded-lg border p-3"/><select value={templateForm.document_type} onChange={(event) => setTemplateForm({...templateForm,document_type:event.target.value})} className="w-full rounded-lg border p-3">{documentTypes.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select><input required placeholder="Examination or lesson-note header" value={templateForm.header_text} onChange={(event) => setTemplateForm({...templateForm,header_text:event.target.value})} className="w-full rounded-lg border p-3"/><textarea placeholder="Standard instructions" value={templateForm.instructions} onChange={(event) => setTemplateForm({...templateForm,instructions:event.target.value})} className="w-full rounded-lg border p-3"/><textarea placeholder="Required sections (one per line)" value={templateForm.sections} onChange={(event) => setTemplateForm({...templateForm,sections:event.target.value})} className="w-full rounded-lg border p-3"/><button className="w-full rounded-lg bg-button p-3 font-bold text-secondary">Save Template</button></form><section className="rounded-lg bg-secondary p-6 shadow-lg"><h3 className="text-xl font-bold text-primary">Active Templates ({templates.length})</h3>{templates.map((template) => <div key={template._id} className="mt-3 rounded border p-3 text-primary"><b>{template.name}</b><p className="text-sm">{template.document_type.replace("_", " ")} · {template.header_text}</p></div>)}</section></div><section className="mt-6 rounded-lg bg-secondary p-6 shadow-lg"><h3 className="text-xl font-bold text-primary">Teacher Draft Review</h3><div className="mt-4 space-y-3">{documents.map((document) => <article key={document._id} className="rounded border p-4 text-primary"><b>{document.title}</b><p className="text-sm">{document.teacher?.full_name || "Teacher"} · {document.class_scheme?.class} · {document.subject} · {document.status}</p><div className="mt-3 flex gap-2"><button onClick={() => review(document._id, "in_review")} className="rounded bg-primary/10 px-3 py-2">Mark review</button><button onClick={() => review(document._id, "approved")} className="rounded bg-button px-3 py-2 font-bold text-secondary">Approve</button></div></article>)}</div></section></div>;
}

export default AcademicContentManagement;
