import { useEffect, useMemo, useState } from "react";
import { FaLayerGroup, FaPlus, FaUpload } from "react-icons/fa6";
import API from "../../api/axios.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";
import { feeCategories } from "../../utils/feeCategories.js";
import { getVisibleTermsForSession } from "../../utils/academicTerms.js";

const sections = [
  { value: "early_years", label: "Creche / Pre-Grade (PG-1 - PG-2)" },
  { value: "nursery", label: "Nursery (Nur 1 - Nur 3)" },
  { value: "basic", label: "Basic (B1 - B5)" },
  { value: "junior_secondary", label: "Junior Secondary (JSS 1 - JSS 3)" },
  { value: "senior_secondary", label: "Senior Secondary (SS 1 - SS 3)" },
];

const blankForm = (session = "2025/2026") => ({
  session,
  section: "",
  term: "",
  fee_category: "returning",
  items: [{ name: "School Fee", amount: "" }],
});

const inputClass = "w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none transition-all duration-300 placeholder:text-primary/40 focus:border-button focus:ring-2 focus:ring-button/20";

function FeeSectionTemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(blankForm());
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState("");

  const load = async () => {
    const [templatesResponse, classesResponse] = await Promise.all([
      API.get("/fee-section-templates"),
      API.get("/classes"),
    ]);
    setTemplates(templatesResponse.data || []);
    setClasses(classesResponse.data || []);
  };

  useEffect(() => { load().catch(() => setStatus({ type: "error", message: "Unable to load section fee templates." })); }, []);

  const sessions = useMemo(() => [...new Set(classes.map((item) => item.session).filter(Boolean))], [classes]);
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setItem = (index, field, value) => setForm((current) => ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
  }));
  const amount = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setStatus({ type: "", message: "" });
    try {
      const { data } = await API.post("/fee-section-templates", form);
      setTemplates((current) => [data, ...current.filter((item) => item._id !== data._id)]);
      setStatus({ type: "success", message: "Section template saved. Publish it when you are ready to apply it to its classes." });
    } catch (requestError) { setStatus({ type: "error", message: requestError.response?.data?.message || "Unable to save the template." }); }
    finally { setSaving(false); }
  };

  const publish = async (template) => {
    setPublishingId(template._id); setStatus({ type: "", message: "" });
    try {
      const { data } = await API.post(`/fee-section-templates/${template._id}/publish`);
      await load();
      const skipped = data.skipped?.length ? ` ${data.skipped.length} class(es) with recorded payments were left unchanged.` : "";
      setStatus({ type: "success", message: `Published: ${data.created.length} created, ${data.updated.length} updated.${skipped}` });
    } catch (requestError) { setStatus({ type: "error", message: requestError.response?.data?.message || "Unable to publish the template." }); }
    finally { setPublishingId(""); }
  };

  const edit = (template) => {
    setForm({
      session: template.session,
      section: template.section,
      term: template.term,
      fee_category: template.fee_category,
      items: (template.items || []).map((item) => ({ name: item.name, amount: item.amount?.toString() || "0" })),
    });
    setStatus({ type: "success", message: "Template loaded. Save your changes, then publish to apply them to classes." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="rounded-lg bg-secondary p-6 shadow-lg">
      <AdminNotification status={status} onDismiss={() => setStatus({ type: "", message: "" })} />
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-lg bg-button p-3 text-secondary"><FaLayerGroup /></div>
        <div>
          <h3 className="text-3xl font-extrabold text-primary">Section fee templates</h3>
          <p className="mt-1 text-sm text-primary/70">Create once for a section, then publish the same school-fee structure to its classes. Bus routes and boarding houses remain managed in their own fee sections.</p>
        </div>
      </div>
      <form onSubmit={save} className="space-y-4 border-b border-primary/10 pb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className={inputClass} value={form.session} onChange={(event) => setField("session", event.target.value)} list="section-template-sessions" placeholder="Session e.g. 2025/2026" required />
          <datalist id="section-template-sessions">{sessions.map((session) => <option key={session} value={session} />)}</datalist>
          <select className={inputClass} value={form.section} onChange={(event) => setField("section", event.target.value)} required><option value="">Select school section</option>{sections.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}</select>
          <select className={inputClass} value={form.term} onChange={(event) => setField("term", event.target.value)} required><option value="">Select term</option>{getVisibleTermsForSession(form.session).map((term) => <option key={term}>{term}</option>)}</select>
          <select className={inputClass} value={form.fee_category} onChange={(event) => setField("fee_category", event.target.value)}>{feeCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select>
        </div>
        {form.items.map((item, index) => <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <input className={inputClass} value={item.name} onChange={(event) => setItem(index, "name", event.target.value)} placeholder="Fee item" required />
          <input className={inputClass} type="number" min="0" value={item.amount} onChange={(event) => setItem(index, "amount", event.target.value)} placeholder="Amount" required />
          <button type="button" className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition hover:bg-button hover:text-secondary disabled:opacity-40" disabled={form.items.length === 1} onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button>
        </div>)}
        <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/20" onClick={() => setForm((current) => ({ ...current, items: [...current.items, { name: "", amount: "" }] }))}><FaPlus /> Add item</button><span className="font-bold text-primary">Template total: ₦{amount.toLocaleString()}</span><button disabled={saving} className="rounded-lg bg-button px-5 py-3 font-bold text-secondary shadow-md transition hover:scale-[1.02] disabled:opacity-60">{saving ? "Saving..." : "Save section template"}</button></div>
      </form>
      <div className="mt-6 overflow-x-auto rounded-lg border border-primary/10"><table className="w-full text-left text-sm"><thead className="bg-primary/10 text-primary"><tr><th className="px-5 py-4">Section</th><th className="px-5 py-4">Session / Term</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-primary/10 text-primary/80">{templates.map((template) => <tr key={template._id}><td className="px-5 py-4 font-bold text-primary">{sections.find((item) => item.value === template.section)?.label || template.section}</td><td className="px-5 py-4">{template.session}<br />{template.term}</td><td className="px-5 py-4">{feeCategories.find((item) => item.value === template.fee_category)?.label || template.fee_category}</td><td className="px-5 py-4 font-bold text-primary">₦{Number(template.amount || 0).toLocaleString()}</td><td className="flex flex-wrap gap-2 px-5 py-4"><button onClick={() => edit(template)} className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/20">Edit</button><button onClick={() => publish(template)} disabled={publishingId === template._id} className="inline-flex items-center gap-2 rounded-lg bg-button px-3 py-2 text-xs font-bold text-secondary shadow-md disabled:opacity-60"><FaUpload /> {publishingId === template._id ? "Publishing..." : "Publish to classes"}</button></td></tr>)}{templates.length === 0 && <tr><td colSpan="5" className="px-5 py-6 text-center text-primary/70">No section templates have been saved.</td></tr>}</tbody></table></div>
    </section>
  );
}

export default FeeSectionTemplateManagement;
