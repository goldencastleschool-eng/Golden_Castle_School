import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios.jsx";

const initialForm = {
  full_name: "", date_of_birth: "", gender: "", parent_name: "", parent_phone: "", parent_email: "", address: "", admission_category: "regular", boarding_requested: false, preferred_class: "", previous_school: "", support_notes: "", consent_given: false,
};

export default function AdmissionApplication() {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState({ active_session: "", classes: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    API.get("/admission-applications/public-options", { skipAuthRedirect: true })
      .then((response) => setOptions(response.data || { active_session: "", classes: [] }))
      .catch(() => setMessage({ type: "error", text: "Applications are unavailable right now. Please try again later." }))
      .finally(() => setLoading(false));
  }, []);

  const classes = useMemo(() => options.classes || [], [options]);
  const input = "w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-primary outline-none placeholder:text-primary/45 focus:border-button";
  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await API.post("/admission-applications/public", { ...form, applying_session: options.active_session }, { skipAuthRedirect: true });
      setMessage({ type: "success", text: `${response.data.message} Reference: ${response.data.application_reference}` });
      setForm(initialForm);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to submit the application." });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-background px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-secondary p-6 shadow-xl sm:p-10">
        <p className="font-bold uppercase tracking-[0.18em] text-button">Admissions</p>
        <h1 className="mt-3 text-4xl font-extrabold text-primary">Apply for admission</h1>
        <p className="mt-3 text-primary/70">Submit an application for review. An application does not create a student portal account or admission number.</p>
        {loading ? <p className="mt-8 text-primary/70">Loading application form…</p> : !options.active_session ? <p className="mt-8 rounded-lg bg-primary/5 p-5 font-semibold text-primary">Admissions are not open at this time. Please contact the school.</p> : <>
          <div className="mt-7 rounded-lg bg-button/15 p-4 font-bold text-primary">Applying for: {options.active_session}</div>
          {message.text && <p className={`mt-5 rounded-lg p-4 font-semibold ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message.text}</p>}
          <form onSubmit={handleSubmit} className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
            <input className={input} name="full_name" value={form.full_name} onChange={handleChange} placeholder="Child's full name" required />
            <input className={input} type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required />
            <select className={input} name="gender" value={form.gender} onChange={handleChange} required><option value="">Child's gender</option><option>Male</option><option>Female</option></select>
            <select className={input} name="preferred_class" value={form.preferred_class} onChange={handleChange}><option value="">Preferred class (optional)</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name.toUpperCase()}</option>)}</select>
            <select className={input} name="admission_category" value={form.admission_category} onChange={handleChange}><option value="regular">Regular admission</option><option value="vip">VIP admission</option><option value="scholarship">Scholarship application</option></select>
            <input className={input} name="parent_name" value={form.parent_name} onChange={handleChange} placeholder="Parent or guardian name" required />
            <input className={input} name="parent_phone" value={form.parent_phone} onChange={handleChange} placeholder="Parent or guardian phone" required />
            <input className={input} type="email" name="parent_email" value={form.parent_email} onChange={handleChange} placeholder="Parent or guardian email (optional)" />
            <input className={input} name="previous_school" value={form.previous_school} onChange={handleChange} placeholder="Previous school (optional)" />
            <textarea className={`${input} min-h-28 md:col-span-2`} name="address" value={form.address} onChange={handleChange} placeholder="Home address (optional)" />
            <textarea className={`${input} min-h-28 md:col-span-2`} name="support_notes" value={form.support_notes} onChange={handleChange} placeholder="Medical or learning support information (optional)" />
            <label className="flex gap-3 text-sm text-primary/75 md:col-span-2"><input type="checkbox" name="boarding_requested" checked={form.boarding_requested} onChange={handleChange} />Request boarding accommodation (subject to availability and approval).</label>
            <label className="flex gap-3 text-sm text-primary/75 md:col-span-2"><input type="checkbox" name="consent_given" checked={form.consent_given} onChange={handleChange} required />I confirm that the information provided is accurate and consent to the school using it to process this admission application.</label>
            <button disabled={submitting} className="rounded-lg bg-button px-6 py-4 font-bold text-secondary shadow-md disabled:opacity-60 md:col-span-2">{submitting ? "Submitting application…" : "Submit application"}</button>
          </form>
        </>}
      </div>
    </div>
  );
}
