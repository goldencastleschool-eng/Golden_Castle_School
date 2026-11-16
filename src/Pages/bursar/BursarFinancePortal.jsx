import { useEffect, useMemo, useState } from "react";
import { FaBed, FaBus, FaMoneyBillWave, FaPenToSquare, FaReceipt } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PortalWelcomeBanner from "../../components/common/PortalWelcomeBanner.jsx";

const TODAY = new Date().toISOString().slice(0, 10);
const terms = ["First Term", "Second Term", "Third Term"];
const money = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0));
const idOf = (value) => value?._id || value || "";
const dateForInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : TODAY;

function BursarFinancePortal() {
  const [type, setType] = useState("school");
  const [data, setData] = useState({ students: [], classes: [], fees: [], schoolStructures: [], busEnrollments: [], busPayments: [], busStructures: [], boardingEnrollments: [], boardingPayments: [], boardingStructures: [] });
  const [form, setForm] = useState({ student: "", session: "", term: "", enrollment: "", amount: "", payment_date: TODAY, payment_method: "", note: "" });
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [students, classes, fees, schoolStructures, busEnrollments, busPayments, busStructures, boardingEnrollments, boardingPayments, boardingStructures] = await Promise.all([
        API.get("/students"), API.get("/classes"), API.get("/fees"), API.get("/fee-structures"),
        API.get("/bus-management/enrollments"), API.get("/bus-management/payments"), API.get("/bus-management/fee-structures"),
        API.get("/boarding-management/enrollments"), API.get("/boarding-management/payments"), API.get("/boarding-management/fee-structures"),
      ]);
      setData({ students: students.data || [], classes: classes.data || [], fees: fees.data || [], schoolStructures: schoolStructures.data || [], busEnrollments: busEnrollments.data || [], busPayments: busPayments.data || [], busStructures: busStructures.data || [], boardingEnrollments: boardingEnrollments.data || [], boardingPayments: boardingPayments.data || [], boardingStructures: boardingStructures.data || [] });
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Unable to load bursar records." });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setEditing(null); setForm({ student: "", session: "", term: "", enrollment: "", amount: "", payment_date: TODAY, payment_method: "", note: "" }); setStatus({ type: "", message: "" }); }, [type]);

  const activeEnrollments = useMemo(() => (type === "bus" ? data.busEnrollments : data.boardingEnrollments).filter((item) => item.status === "active"), [data, type]);
  const payments = type === "school" ? data.fees : type === "bus" ? data.busPayments : data.boardingPayments;
  const selectedEnrollment = activeEnrollments.find((item) => idOf(item) === form.enrollment);
  const selectedStudent = data.students.find((item) => idOf(item) === form.student);
  const structure = useMemo(() => {
    if (type === "school" && selectedStudent && form.session && form.term) {
      const studentClass = idOf(selectedStudent.class_record);
      return data.schoolStructures.find((item) => idOf(item.class_record) === studentClass && item.session === form.session && item.term === form.term);
    }
    if (type === "bus" && selectedEnrollment) return data.busStructures.find((item) => idOf(item.route) === idOf(selectedEnrollment.route) && item.session === selectedEnrollment.session && item.term === selectedEnrollment.term && (!item.payment_category || item.payment_category === selectedEnrollment.payment_category || item.payment_category === "both"));
    if (type === "boarding" && selectedEnrollment) return data.boardingStructures.find((item) => idOf(item.house) === idOf(selectedEnrollment.house) && item.session === selectedEnrollment.session && item.term === selectedEnrollment.term);
    return null;
  }, [data, form, selectedEnrollment, selectedStudent, type]);
  const expected = Number(structure?.amount || 0);
  const paid = payments.filter((item) => type === "school" ? idOf(item.student) === form.student && item.session === form.session && item.term === form.term : idOf(item.enrollment) === form.enrollment).filter((item) => !editing || item._id !== editing._id).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const balance = Math.max(expected - paid, 0);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setStatus({ type: "", message: "" });
    const payload = type === "school" ? { student: form.student, session: form.session, term: form.term, amount: Number(form.amount), payment_date: form.payment_date, payment_method: form.payment_method, note: form.note } : { enrollment: form.enrollment, amount: Number(form.amount), payment_date: form.payment_date, payment_method: form.payment_method, note: form.note };
    const base = type === "school" ? "/fees" : type === "bus" ? "/bus-management/payments" : "/boarding-management/payments";
    try {
      await (editing ? API.put(`${base}/${editing._id}`, payload) : API.post(base, payload));
      setStatus({ type: "success", message: editing ? "Payment record updated." : "Payment recorded successfully." });
      setEditing(null); setForm({ student: "", session: "", term: "", enrollment: "", amount: "", payment_date: TODAY, payment_method: "", note: "" });
      await load();
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || error.response?.data?.error || "Unable to save payment." });
    } finally { setSaving(false); }
  };

  const edit = (payment) => {
    setEditing(payment);
    setForm({ student: idOf(payment.student), session: payment.session || "", term: payment.term || "", enrollment: idOf(payment.enrollment), amount: payment.amount || "", payment_date: dateForInput(payment.payment_date), payment_method: payment.payment_method || "", note: payment.note || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const label = type === "school" ? "School Fee" : type === "bus" ? "Bus Fee" : "Boarding Fee";
  const input = "w-full rounded-lg border border-primary/15 bg-secondary px-3 py-2.5 text-primary outline-none focus:border-button focus:ring-2 focus:ring-button/20";

  return <div className="space-y-6">
    <PortalWelcomeBanner icon={<FaMoneyBillWave />} eyebrow="Finance operations" title="Welcome," name="Bursar" description="Record and correct payments against administrator-approved fee structures. Payment records cannot be deleted from this portal." />
    <div className="flex flex-wrap gap-3">
      {[ ["school", <FaReceipt />, "School fees"], ["bus", <FaBus />, "Bus fees"], ["boarding", <FaBed />, "Boarding fees"] ].map(([value, icon, text]) => <button key={value} type="button" onClick={() => setType(value)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-bold ${type === value ? "bg-button text-secondary" : "bg-secondary text-primary shadow-sm"}`}>{icon}{text}</button>)}
    </div>
    {status.message && <div className={`rounded-lg px-4 py-3 font-semibold ${status.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{status.message}</div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form onSubmit={submit} className="rounded-lg bg-secondary p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-primary">{editing ? `Edit ${label} payment` : `Record ${label} payment`}</h2><p className="mt-1 text-sm text-primary/60">Structure amounts are controlled by the administrator.</p></div>{editing && <button type="button" className="text-sm font-bold text-button" onClick={() => { setEditing(null); setForm({ student: "", session: "", term: "", enrollment: "", amount: "", payment_date: TODAY, payment_method: "", note: "" }); }}>Cancel</button>}</div>
        <div className="space-y-4">
          {type === "school" ? <><select required className={input} value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}><option value="">Select student</option>{data.students.filter((item) => !item.status || item.status === "active").map((item) => <option key={item._id} value={item._id}>{item.full_name} — {item.admission_no}</option>)}</select><div className="grid gap-3 sm:grid-cols-2"><select required className={input} value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}><option value="">Session</option>{[...new Set(data.classes.map((item) => item.session).filter(Boolean))].sort().map((value) => <option key={value}>{value}</option>)}</select><select required className={input} value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}><option value="">Term</option>{terms.map((item) => <option key={item}>{item}</option>)}</select></div></> : <select required className={input} value={form.enrollment} onChange={(e) => setForm({ ...form, enrollment: e.target.value })}><option value="">Select active {type} enrolment</option>{activeEnrollments.map((item) => <option key={item._id} value={item._id}>{item.student?.full_name} — {item.student?.admission_no} ({item.session}, {item.term})</option>)}</select>}
          <div className="rounded-lg bg-primary/5 p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-primary/70">Structure total</span><b>{structure ? money(expected) : "Select a valid record"}</b></div><div className="mt-2 flex justify-between gap-4"><span className="text-primary/70">Outstanding balance</span><b className="text-button">{structure ? money(balance) : "—"}</b></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><input required min="0" max={balance} step="0.01" type="number" className={input} placeholder="Amount paid" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}/><input required type="date" className={input} value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })}/></div>
          <input className={input} placeholder="Payment method (cash, transfer...)" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}/><textarea className={`${input} min-h-20`} placeholder="Note / correction reason" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}/>
          <button disabled={saving || !structure} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-secondary disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Record payment"}</button>
        </div>
      </form>
      <section className="overflow-hidden rounded-lg bg-secondary shadow-sm"><div className="border-b border-primary/10 p-5"><h2 className="text-xl font-extrabold text-primary">Recent {label} payments</h2><p className="mt-1 text-sm text-primary/60">Edit is available; deletion is intentionally unavailable.</p></div>{loading ? <p className="p-5 text-primary/60">Loading payment records...</p> : <div className="max-h-[680px] overflow-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="sticky top-0 bg-primary/5 text-primary"><tr><th className="p-3">Student</th><th className="p-3">Amount</th><th className="p-3">Date</th><th className="p-3">Receipt</th><th className="p-3">Action</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id} className="border-t border-primary/10"><td className="p-3 font-semibold text-primary">{payment.student?.full_name || "Student"}<span className="block text-xs font-normal text-primary/60">{payment.session} · {payment.term}</span></td><td className="p-3">{money(payment.amount)}</td><td className="p-3">{new Date(payment.payment_date).toLocaleDateString()}</td><td className="p-3 text-xs">{payment.receipt_no || "Pending"}</td><td className="p-3"><button type="button" onClick={() => edit(payment)} className="inline-flex items-center gap-1 rounded bg-primary/10 px-3 py-2 font-bold text-primary hover:bg-button hover:text-secondary"><FaPenToSquare /> Edit</button></td></tr>)}{payments.length === 0 && <tr><td colSpan="5" className="p-5 text-center text-primary/60">No {label.toLowerCase()} payments recorded yet.</td></tr>}</tbody></table></div>}</section>
    </div>
  </div>;
}

export default BursarFinancePortal;
