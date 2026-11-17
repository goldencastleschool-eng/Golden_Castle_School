import { useEffect, useMemo, useState } from "react";
import { FaBed, FaBus, FaMoneyBillWave, FaPenToSquare, FaReceipt, FaUsers } from "react-icons/fa6";
import API from "../../api/axios.jsx";
import PortalWelcomeBanner from "../../components/common/PortalWelcomeBanner.jsx";
import AdminNotification from "../../components/common/AdminNotification.jsx";

const TODAY = new Date().toISOString().slice(0, 10);
const PAGE_SIZE = 25;
const terms = ["First Term", "Second Term", "Third Term"];
const idOf = (value) => value?._id || value || "";
const money = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0));
const initialForm = () => ({ student: "", class_record: "", session: "", term: "", enrollment: "", amount: "", payment_date: TODAY, payment_method: "", note: "" });
const termIndex = (term) => terms.indexOf(term);
const escapeHtml = (value = "") => value.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const effectiveFeeEnrollment = (student, session, term) => {
  const enrollment = (student?.fee_enrollments || []).filter((item) => item.session === session && termIndex(item.term) <= termIndex(term)).sort((first, second) => termIndex(second.term) - termIndex(first.term))[0];
  return enrollment?.term !== term && enrollment?.fee_category === "new" ? { ...enrollment, fee_category: "returning" } : enrollment;
};
const feeTemplateSectionForClass = (classRecord = {}) => {
  const name = (classRecord?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/(creche|pg1|pg2|pregrade|playgroup|preprimary|prekg)/.test(name)) return "early_years";
  if (/(nursery|nur1|nur2|nur3|kg1|kg2|kg3)/.test(name)) return "nursery";
  if (/(jss|juniorsecondary|js1|js2|js3)/.test(name)) return "junior_secondary";
  if (/(sss|ss1|ss2|ss3|seniorsecondary)/.test(name)) return "senior_secondary";
  if (/(basic|primary|pry|grade|b1|b2|b3|b4|b5)/.test(name)) return "basic";
  return "";
};

function BursarFinancePortal() {
  const [type, setType] = useState("school");
  const [schoolMode, setSchoolMode] = useState("individual");
  const [data, setData] = useState({ students: [], classes: [], fees: [], schoolStructures: [], schoolTemplates: [], busEnrollments: [], busPayments: [], busStructures: [], boardingEnrollments: [], boardingPayments: [], boardingStructures: [] });
  const [form, setForm] = useState(initialForm);
  const [batchAmounts, setBatchAmounts] = useState({});
  const [batchSelected, setBatchSelected] = useState({});
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [classView, setClassView] = useState({ session: "", class_record: "", term: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [students, classes, fees, schoolStructures, schoolTemplates, busEnrollments, busPayments, busStructures, boardingEnrollments, boardingPayments, boardingStructures] = await Promise.all([
        API.get("/students"), API.get("/classes"), API.get("/fees"), API.get("/fee-structures"),
        API.get("/fee-section-templates"),
        API.get("/bus-management/enrollments"), API.get("/bus-management/payments"), API.get("/bus-management/fee-structures"),
        API.get("/boarding-management/enrollments"), API.get("/boarding-management/payments"), API.get("/boarding-management/fee-structures"),
      ]);
      setData({ students: students.data || [], classes: classes.data || [], fees: fees.data || [], schoolStructures: schoolStructures.data || [], schoolTemplates: schoolTemplates.data || [], busEnrollments: busEnrollments.data || [], busPayments: busPayments.data || [], busStructures: busStructures.data || [], boardingEnrollments: boardingEnrollments.data || [], boardingPayments: boardingPayments.data || [], boardingStructures: boardingStructures.data || [] });
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Unable to load bursar records." });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setEditing(null); setForm(initialForm()); setBatchAmounts({}); setBatchSelected({}); setPaymentPage(1); setStatus({ type: "", message: "" }); }, [type]);
  const payments = type === "school" ? data.fees : type === "bus" ? data.busPayments : data.boardingPayments;
  const sessionOptions = useMemo(() => [...new Set(data.classes.map((item) => item.session).filter(Boolean))].sort(), [data.classes]);
  const eligibleClasses = useMemo(() => data.classes.filter((item) => !form.session || item.session === form.session), [data.classes, form.session]);
  const selectedClass = data.classes.find((item) => idOf(item) === form.class_record);
  const classStudents = useMemo(() => data.students.filter((student) => (!student.status || student.status === "active") && form.session && form.term && form.class_record && (idOf(effectiveFeeEnrollment(student, form.session, form.term)?.class_record) || idOf(student.class_record)) === form.class_record).sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")), [data.students, form.class_record, form.session, form.term]);
  const activeEnrollments = useMemo(() => (type === "bus" ? data.busEnrollments : data.boardingEnrollments).filter((item) => item.status === "active"), [data, type]);
  const selectedStudent = data.students.find((item) => idOf(item) === form.student);
  const selectedEnrollment = activeEnrollments.find((item) => idOf(item) === form.enrollment);
  const schoolCategory = effectiveFeeEnrollment(selectedStudent, form.session, form.term)?.fee_category || "returning";

  const schoolStructureFor = (student, session = form.session, term = form.term, classRecord = selectedClass) => {
    const category = effectiveFeeEnrollment(student, session, term)?.fee_category || "returning";
    const categories = category === "discounted" ? ["discounted", "returning"] : [category];
    const classId = idOf(effectiveFeeEnrollment(student, session, term)?.class_record) || idOf(classRecord);
    const classStructure = data.schoolStructures.find((item) => idOf(item.class_record) === classId && item.session === session && item.term === term && categories.includes(item.fee_category || "returning"));
    if (classStructure) return classStructure;
    const selectedTemplateClass = classRecord || data.classes.find((item) => idOf(item) === classId);
    const section = feeTemplateSectionForClass(selectedTemplateClass);
    return data.schoolTemplates.find((item) => item.section === section && item.session === session && item.term === term && categories.includes(item.fee_category || "returning"));
  };
  const structure = useMemo(() => {
    if (type === "school") return selectedStudent ? schoolStructureFor(selectedStudent) : null;
    if (type === "bus" && selectedEnrollment) return data.busStructures.find((item) => idOf(item.route) === idOf(selectedEnrollment.route) && item.session === selectedEnrollment.session && item.term === selectedEnrollment.term && (!item.payment_category || item.payment_category === "both" || item.payment_category === selectedEnrollment.payment_category));
    if (type === "boarding" && selectedEnrollment) return data.boardingStructures.find((item) => idOf(item.house) === idOf(selectedEnrollment.house) && item.session === selectedEnrollment.session && item.term === selectedEnrollment.term);
    return null;
  }, [data, form.class_record, form.session, form.term, selectedEnrollment, selectedStudent, schoolCategory, type]);
  const expected = Number(structure?.amount || 0);
  const paid = payments.filter((item) => type === "school" ? idOf(item.student) === form.student && item.session === form.session && item.term === form.term : idOf(item.enrollment) === form.enrollment).filter((item) => !editing || item._id !== editing._id).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const balance = Math.max(expected - paid, 0);
  const schoolBalanceFor = (student) => {
    const expectedAmount = Number(schoolStructureFor(student)?.amount || 0);
    const paidAmount = data.fees.filter((fee) => idOf(fee.student) === idOf(student) && fee.session === form.session && fee.term === form.term).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    return Math.max(expectedAmount - paidAmount, 0);
  };
  const getSchoolPaymentStatus = (payment) => {
    const paidAmount = data.fees
      .filter((item) =>
        idOf(item.student) === idOf(payment.student) &&
        item.session === payment.session &&
        item.term === payment.term &&
        (item.fee_category || "returning") === (payment.fee_category || "returning")
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expectedAmount = Number(payment.expected_amount_at_payment || 0);
    return expectedAmount > 0 && paidAmount >= expectedAmount ? "paid" : "unpaid";
  };
  const viewEligibleClasses = useMemo(() => data.classes.filter((item) => !classView.session || item.session === classView.session), [classView.session, data.classes]);
  const classViewStudents = useMemo(() => data.students.filter((student) => (!student.status || student.status === "active") && classView.session && classView.term && classView.class_record && (idOf(effectiveFeeEnrollment(student, classView.session, classView.term)?.class_record) || idOf(student.class_record)) === classView.class_record).sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")), [classView.class_record, classView.session, classView.term, data.students]);
  const classPaymentRows = useMemo(() => classViewStudents.map((student) => {
    const enrollment = effectiveFeeEnrollment(student, classView.session, classView.term);
    const category = enrollment?.fee_category || "returning";
    const categories = category === "discounted" ? ["discounted", "returning"] : [category];
    const feeStructure = schoolStructureFor(student, classView.session, classView.term, data.classes.find((item) => idOf(item) === classView.class_record));
    const exempt = ["vip", "scholarship"].includes(category);
    const expectedAmount = exempt ? 0 : Math.max(Number(feeStructure?.amount || 0) - (category === "discounted" ? Number(enrollment?.discount_amount || 0) : 0), 0);
    const paidAmount = data.fees.filter((fee) => idOf(fee.student) === idOf(student) && fee.session === classView.session && fee.term === classView.term && (fee.fee_category || "returning") === category).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    const status = exempt || (expectedAmount > 0 && paidAmount >= expectedAmount) ? "paid" : "unpaid";
    return { student, expectedAmount, paidAmount, balanceAmount: Math.max(expectedAmount - paidAmount, 0), status };
  }), [classView.class_record, classView.session, classView.term, classViewStudents, data.classes, data.fees, data.schoolStructures, data.schoolTemplates]);
  const filteredClassPaymentRows = classPaymentRows.filter((row) => !paymentStatusFilter || row.status === paymentStatusFilter);
  const classPaymentTotals = classPaymentRows.reduce((totals, row) => ({ expected: totals.expected + row.expectedAmount, paid: totals.paid + row.paidAmount, balance: totals.balance + row.balanceAmount, paidCount: totals.paidCount + (row.status === "paid" ? 1 : 0), unpaidCount: totals.unpaidCount + (row.status === "unpaid" ? 1 : 0) }), { expected: 0, paid: 0, balance: 0, paidCount: 0, unpaidCount: 0 });
  const printSchoolFeeReport = () => {
    if (!form.session || !form.term) {
      setStatus({ type: "error", message: "Select a session and term before printing the fee report." });
      return;
    }
    const rows = data.students.map((student) => {
      const enrollment = effectiveFeeEnrollment(student, form.session, form.term);
      if (!enrollment) return null;
      const category = enrollment.fee_category || "returning";
      const categories = category === "discounted" ? ["discounted", "returning"] : [category];
      const feeStructure = schoolStructureFor(student, form.session, form.term, data.classes.find((item) => idOf(item) === idOf(enrollment.class_record || student.class_record)));
      const exempt = ["vip", "scholarship"].includes(category);
      const expectedAmount = exempt ? 0 : Math.max(Number(feeStructure?.amount || 0) - (category === "discounted" ? Number(enrollment.discount_amount || 0) : 0), 0);
      const paidAmount = data.fees.filter((fee) => idOf(fee.student) === idOf(student) && fee.session === form.session && fee.term === form.term && (fee.fee_category || "returning") === category).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
      const balanceAmount = Math.max(expectedAmount - paidAmount, 0);
      return { student, enrollment, expectedAmount, paidAmount, balanceAmount, status: exempt ? "Exempt" : expectedAmount <= 0 ? "No Structure" : balanceAmount <= 0 ? "Paid" : paidAmount > 0 ? "Part Payment" : "Unpaid" };
    }).filter(Boolean).sort((first, second) => (first.student.full_name || "").localeCompare(second.student.full_name || ""));
    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) { setStatus({ type: "error", message: "Allow popups to print the fee report." }); return; }
    const bodyRows = rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.student.full_name)}</td><td>${escapeHtml(row.student.admission_no)}</td><td>${escapeHtml(row.enrollment.class || row.student.class)}</td><td>${escapeHtml(row.status)}</td><td>${escapeHtml(money(row.expectedAmount))}</td><td>${escapeHtml(money(row.paidAmount))}</td><td>${escapeHtml(money(row.balanceAmount))}</td></tr>`).join("") || '<tr><td colspan="8">No fee enrolments found for this session and term.</td></tr>';
    const totalExpected = rows.reduce((sum, row) => sum + row.expectedAmount, 0);
    const totalPaid = rows.reduce((sum, row) => sum + row.paidAmount, 0);
    const totalBalance = rows.reduce((sum, row) => sum + row.balanceAmount, 0);
    reportWindow.document.write(`<html><head><title>School Fee Report</title><style>body{font-family:Arial,sans-serif;color:#172554;padding:24px}h1{margin:0}p{color:#475569}.summary{display:flex;gap:16px;margin:20px 0}.summary div{border:1px solid #cbd5e1;padding:12px;min-width:160px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}th{background:#e0f2fe}</style></head><body><h1>Golden Castle School</h1><h2>School Fee Paid and Unpaid Report</h2><p>Session: ${escapeHtml(form.session)} &nbsp;|&nbsp; Term: ${escapeHtml(form.term)}</p><div class="summary"><div>Expected<br><strong>${escapeHtml(money(totalExpected))}</strong></div><div>Paid<br><strong>${escapeHtml(money(totalPaid))}</strong></div><div>Outstanding<br><strong>${escapeHtml(money(totalBalance))}</strong></div></div><table><thead><tr><th>S/N</th><th>Student</th><th>Admission No.</th><th>Class</th><th>Status</th><th>Expected</th><th>Paid</th><th>Balance</th></tr></thead><tbody>${bodyRows}</tbody></table></body></html>`);
    reportWindow.document.close(); reportWindow.focus(); reportWindow.print();
  };
  const printClassPaymentReport = () => {
    if (!classView.session || !classView.term || !classView.class_record) {
      setStatus({ type: "error", message: "Select a session, class, and term before printing the class report." });
      return;
    }
    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) { setStatus({ type: "error", message: "Allow popups to print the class report." }); return; }
    const className = data.classes.find((item) => idOf(item) === classView.class_record)?.name || "Selected class";
    const bodyRows = classPaymentRows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.student.full_name)}</td><td>${escapeHtml(row.student.admission_no)}</td><td>${escapeHtml(money(row.expectedAmount))}</td><td>${escapeHtml(money(row.paidAmount))}</td><td>${escapeHtml(money(row.balanceAmount))}</td><td>${row.status === "paid" ? "Paid" : "Unpaid / Part"}</td></tr>`).join("") || '<tr><td colspan="7">No students found for this class payment view.</td></tr>';
    reportWindow.document.write(`<html><head><title>Class Payment Report</title><style>body{font-family:Arial,sans-serif;color:#172554;padding:24px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}th{background:#e0f2fe}</style></head><body><h1>Golden Castle School</h1><h2>Class Payment Report</h2><p>Class: ${escapeHtml(className)} | Session: ${escapeHtml(classView.session)} | Term: ${escapeHtml(classView.term)}</p><p>Paid: ${classPaymentTotals.paidCount} | Unpaid / Part: ${classPaymentTotals.unpaidCount} | Total Paid: ${escapeHtml(money(classPaymentTotals.paid))} | Outstanding: ${escapeHtml(money(classPaymentTotals.balance))}</p><table><thead><tr><th>S/N</th><th>Student</th><th>Admission No.</th><th>Expected</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>${bodyRows}</tbody></table></body></html>`);
    reportWindow.document.close(); reportWindow.focus(); reportWindow.print();
  };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setStatus({ type: "", message: "" });
    const payload = type === "school" ? { student: form.student, session: form.session, term: form.term, amount: Number(form.amount), payment_date: form.payment_date, payment_method: form.payment_method, note: form.note } : { enrollment: form.enrollment, amount: Number(form.amount), payment_date: form.payment_date, payment_method: form.payment_method, note: form.note };
    const base = type === "school" ? "/fees" : type === "bus" ? "/bus-management/payments" : "/boarding-management/payments";
    try { await (editing ? API.put(`${base}/${editing._id}`, payload) : API.post(base, payload)); setStatus({ type: "success", message: editing ? "Payment record updated." : "Payment recorded successfully." }); setEditing(null); setForm(initialForm()); await load(); }
    catch (error) { setStatus({ type: "error", message: error.response?.data?.message || error.response?.data?.error || "Unable to save payment." }); }
    finally { setSaving(false); }
  };
  const submitBatch = async (event) => {
    event.preventDefault();
    const selectedPayments = classStudents.filter((student) => batchSelected[student._id] && Number(batchAmounts[student._id]) > 0).map((student) => ({ student: student._id, amount: Number(batchAmounts[student._id]) }));
    if (!selectedPayments.length) { setStatus({ type: "error", message: "Select at least one student and enter a payment amount." }); return; }
    setBatchSaving(true); setStatus({ type: "", message: "" });
    try { const response = await API.post("/fees/batch", { session: form.session, term: form.term, payment_date: form.payment_date, payment_method: form.payment_method, note: form.note, payments: selectedPayments }); setStatus({ type: "success", message: response.data?.message || "Class payments recorded." }); setBatchSelected({}); setBatchAmounts({}); await load(); }
    catch (error) { setStatus({ type: "error", message: error.response?.data?.message || "Unable to record class payments." }); }
    finally { setBatchSaving(false); }
  };
  const edit = (payment) => { setEditing(payment); setSchoolMode("individual"); setForm({ student: idOf(payment.student), class_record: idOf(payment.class_record), session: payment.session || "", term: payment.term || "", enrollment: idOf(payment.enrollment), amount: payment.amount || "", payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().slice(0, 10) : TODAY, payment_method: payment.payment_method || "", note: payment.note || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const filteredPayments = useMemo(() => type !== "school" ? payments : payments.filter((payment) => (!form.session || payment.session === form.session) && (!form.term || payment.term === form.term) && (!form.class_record || idOf(payment.class_record) === form.class_record) && (!paymentStatusFilter || getSchoolPaymentStatus(payment) === paymentStatusFilter)), [data.fees, form.class_record, form.session, form.term, paymentStatusFilter, payments, type]);
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const visiblePage = Math.min(paymentPage, totalPages);
  const displayedPayments = type === "school" ? filteredPayments.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE) : filteredPayments;
  const label = type === "school" ? "School Fee" : type === "bus" ? "Bus Fee" : "Boarding Fee";
  const input = "w-full rounded-lg border border-primary/15 bg-secondary px-3 py-2.5 text-primary outline-none focus:border-button focus:ring-2 focus:ring-button/20";
  const changeSchoolContext = (key, value) => { setForm((current) => ({ ...current, [key]: value, ...(key === "session" ? { class_record: "", student: "" } : key === "class_record" || key === "term" ? { student: "" } : {}) })); setPaymentPage(1); };

  return <div className="space-y-6 text-primary">
    <AdminNotification status={status} onDismiss={() => setStatus({ type: "", message: "" })} />
    <PortalWelcomeBanner icon={<FaMoneyBillWave />} eyebrow="Finance operations" title="Welcome," name="Bursar" description="Record and correct payments against administrator-approved fee structures. Payment records cannot be deleted from this portal." />
    <div className="flex flex-wrap gap-3">{[["school", <FaReceipt />, "School fees"], ["bus", <FaBus />, "Bus fees"], ["boarding", <FaBed />, "Boarding fees"]].map(([value, icon, text]) => <button key={value} type="button" onClick={() => setType(value)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-bold ${type === value ? "bg-button text-secondary" : "bg-secondary text-primary shadow-sm"}`}>{icon}{text}</button>)}</div>
    <section className="rounded-lg bg-secondary p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-primary">{editing ? `Edit ${label} payment` : `Record ${label} payment`}</h2><p className="mt-1 text-sm text-primary/60">Select the class first for school fees; fee structures remain administrator-controlled.</p></div>{editing && <button type="button" className="text-sm font-bold text-button" onClick={() => { setEditing(null); setForm(initialForm()); }}>Cancel edit</button>}</div>
      {type === "school" && <div className="mb-5 flex flex-wrap gap-2"><button type="button" onClick={() => setSchoolMode("individual")} className={`rounded-lg px-4 py-2 font-bold ${schoolMode === "individual" ? "bg-button text-secondary" : "bg-primary/10 text-primary"}`}>Individual payment</button><button type="button" onClick={() => { setSchoolMode("batch"); setEditing(null); }} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-bold ${schoolMode === "batch" ? "bg-button text-secondary" : "bg-primary/10 text-primary"}`}><FaUsers /> Class batch register</button></div>}
      <div className="grid gap-3 md:grid-cols-3">{type === "school" ? <><select required className={input} value={form.session} onChange={(event) => changeSchoolContext("session", event.target.value)}><option value="">Select session</option>{sessionOptions.map((value) => <option key={value}>{value}</option>)}</select><select required className={input} value={form.class_record} onChange={(event) => changeSchoolContext("class_record", event.target.value)}><option value="">Select class</option>{eligibleClasses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><select required className={input} value={form.term} onChange={(event) => changeSchoolContext("term", event.target.value)}><option value="">Select term</option>{terms.map((item) => <option key={item}>{item}</option>)}</select></> : <select required className={`${input} md:col-span-3`} value={form.enrollment} onChange={(event) => setForm({ ...form, enrollment: event.target.value })}><option value="">Select active {type} enrolment</option>{activeEnrollments.map((item) => <option key={item._id} value={item._id}>{item.student?.full_name} — {item.student?.admission_no} ({item.session}, {item.term})</option>)}</select>}</div>
      {type === "school" && selectedClass && <p className="mt-3 rounded-lg bg-primary/5 px-4 py-3 text-sm font-semibold text-primary/70">Class context: {selectedClass.name} · {form.session} · {form.term || "select a term"} · {classStudents.length} active student(s)</p>}
      {type === "school" && schoolMode === "batch" ? <form onSubmit={submitBatch} className="mt-5"><div className="grid gap-3 sm:grid-cols-2"><input required type="date" className={input} value={form.payment_date} onChange={(event) => setForm({ ...form, payment_date: event.target.value })}/><input className={input} placeholder="Payment method" value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })}/></div><textarea className={`${input} mt-3 min-h-20`} placeholder="Batch note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })}/><div className="mt-4 overflow-auto rounded-lg border border-primary/10"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-primary/5"><tr><th className="p-3">Record</th><th className="p-3">Student</th><th className="p-3">Structure</th><th className="p-3">Outstanding</th><th className="p-3">Amount received</th></tr></thead><tbody>{classStudents.map((student) => { const studentStructure = schoolStructureFor(student); const outstanding = schoolBalanceFor(student); return <tr key={student._id} className="border-t border-primary/10"><td className="p-3"><input type="checkbox" disabled={!studentStructure || outstanding <= 0} checked={Boolean(batchSelected[student._id])} onChange={(event) => setBatchSelected({ ...batchSelected, [student._id]: event.target.checked })}/></td><td className="p-3 font-semibold">{student.full_name}<span className="block text-xs font-normal text-primary/60">{student.admission_no}</span></td><td className="p-3">{studentStructure ? money(studentStructure.amount) : "Not configured"}</td><td className="p-3">{money(outstanding)}</td><td className="p-3"><input type="number" min="0" max={outstanding} step="0.01" disabled={!batchSelected[student._id] || outstanding <= 0} value={batchAmounts[student._id] || ""} onChange={(event) => setBatchAmounts({ ...batchAmounts, [student._id]: event.target.value })} className="w-36 rounded border border-primary/15 px-2 py-1.5 disabled:bg-primary/5" /></td></tr>; })}{classStudents.length === 0 && <tr><td colSpan="5" className="p-5 text-center text-primary/60">Choose a session, class, and term to prepare the batch register.</td></tr>}</tbody></table></div><button disabled={batchSaving || classStudents.length === 0} className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-bold text-secondary disabled:opacity-50">{batchSaving ? "Recording class payments..." : "Record selected class payments"}</button></form> : <form onSubmit={submit} className="mt-5"><div className="space-y-4">{type === "school" && <select required disabled={!form.class_record || !form.term} className={input} value={form.student} onChange={(event) => setForm({ ...form, student: event.target.value })}><option value="">Select student in this class</option>{classStudents.map((item) => <option key={item._id} value={item._id}>{item.full_name} — {item.admission_no}</option>)}</select>}<div className="rounded-lg bg-primary/5 p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-primary/70">Structure total</span><b>{structure ? money(expected) : "Select a valid record"}</b></div><div className="mt-2 flex justify-between gap-4"><span className="text-primary/70">Outstanding balance</span><b className="text-button">{structure ? money(balance) : "—"}</b></div></div><div className="grid gap-3 sm:grid-cols-2"><input required min="0" max={balance} step="0.01" type="number" className={input} placeholder="Amount paid" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })}/><input required type="date" className={input} value={form.payment_date} onChange={(event) => setForm({ ...form, payment_date: event.target.value })}/></div><input className={input} placeholder="Payment method (cash, transfer...)" value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })}/><textarea className={`${input} min-h-20`} placeholder="Note / correction reason" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })}/><button disabled={saving || !structure} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-secondary disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Record payment"}</button></div></form>}
    </section>
    {type === "school" && <section className="overflow-hidden rounded-lg bg-secondary shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/10 p-5"><div><h2 className="text-xl font-extrabold text-primary">View class payment</h2><p className="mt-1 text-sm text-primary/60">One row per student for the selected session, class, and term.</p></div><div className="flex flex-wrap items-center gap-2"><select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)} className="rounded-lg border border-primary/15 bg-secondary px-3 py-2 text-sm font-bold text-primary"><option value="">All students</option><option value="paid">Class paid</option><option value="unpaid">Class unpaid / part paid</option></select><button type="button" onClick={printClassPaymentReport} disabled={!classView.session || !classView.class_record || !classView.term} className="rounded-lg bg-button px-3 py-2 text-sm font-bold text-secondary disabled:opacity-40">Print class report</button></div></div>
      <div className="grid gap-3 border-b border-primary/10 p-5 md:grid-cols-3"><select className={input} value={classView.session} onChange={(event) => setClassView({ session: event.target.value, class_record: "", term: "" })}><option value="">View session</option>{sessionOptions.map((value) => <option key={value}>{value}</option>)}</select><select className={input} disabled={!classView.session} value={classView.class_record} onChange={(event) => setClassView((current) => ({ ...current, class_record: event.target.value }))}><option value="">View class</option>{viewEligibleClasses.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><select className={input} disabled={!classView.session} value={classView.term} onChange={(event) => setClassView((current) => ({ ...current, term: event.target.value }))}><option value="">View term</option>{terms.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-lg bg-primary/5 p-3"><p className="text-xs font-bold uppercase text-primary/60">Students</p><p className="mt-1 text-xl font-extrabold">{classPaymentRows.length}</p></div><div className="rounded-lg bg-green-50 p-3"><p className="text-xs font-bold uppercase text-green-700">Paid</p><p className="mt-1 text-xl font-extrabold text-green-800">{classPaymentTotals.paidCount}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs font-bold uppercase text-amber-700">Unpaid / part</p><p className="mt-1 text-xl font-extrabold text-amber-800">{classPaymentTotals.unpaidCount}</p></div><div className="rounded-lg bg-primary/5 p-3"><p className="text-xs font-bold uppercase text-primary/60">Total paid</p><p className="mt-1 text-xl font-extrabold">{money(classPaymentTotals.paid)}</p></div><div className="rounded-lg bg-primary/5 p-3"><p className="text-xs font-bold uppercase text-primary/60">Outstanding</p><p className="mt-1 text-xl font-extrabold">{money(classPaymentTotals.balance)}</p></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-primary/5"><tr><th className="p-3">Student</th><th className="p-3">Admission no.</th><th className="p-3">Expected</th><th className="p-3">Paid</th><th className="p-3">Balance</th><th className="p-3">Class status</th></tr></thead><tbody>{filteredClassPaymentRows.map((row) => <tr key={row.student._id} className="border-t border-primary/10"><td className="p-3 font-semibold">{row.student.full_name}</td><td className="p-3">{row.student.admission_no}</td><td className="p-3">{money(row.expectedAmount)}</td><td className="p-3">{money(row.paidAmount)}</td><td className="p-3">{money(row.balanceAmount)}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${row.status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{row.status === "paid" ? "Paid" : "Unpaid / part"}</span></td></tr>)}{!classView.class_record && <tr><td colSpan="6" className="p-5 text-center text-primary/60">Select a session, class, and term in this section to view class payments.</td></tr>}{classView.class_record && filteredClassPaymentRows.length === 0 && <tr><td colSpan="6" className="p-5 text-center text-primary/60">No students match this payment-status filter.</td></tr>}</tbody></table></div>
    </section>}
    <section className="overflow-hidden rounded-lg bg-secondary shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/10 p-5"><div><h2 className="text-xl font-extrabold text-primary">Payment receipt register</h2><p className="mt-1 text-sm text-primary/60">Individual transactions for the selected payment context.</p></div><p className="rounded bg-primary/10 px-3 py-2 text-sm font-bold text-primary">{filteredPayments.length} record(s)</p></div>{loading ? <p className="p-5 text-primary/60">Loading payment records...</p> : <><div className="max-h-[680px] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 bg-primary/5 text-primary"><tr><th className="p-3">Student</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Receipt</th><th className="p-3">Action</th></tr></thead><tbody>{displayedPayments.map((payment) => <tr key={payment._id} className="border-t border-primary/10"><td className="p-3 font-semibold text-primary">{payment.student?.full_name || "Student"}<span className="block text-xs font-normal text-primary/60">{payment.session} · {payment.term}</span></td><td className="p-3">{money(payment.amount)}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${getSchoolPaymentStatus(payment) === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{getSchoolPaymentStatus(payment) === "paid" ? "Paid" : "Unpaid / part"}</span></td><td className="p-3">{new Date(payment.payment_date).toLocaleDateString()}</td><td className="p-3 text-xs">{payment.receipt_no || "Pending"}</td><td className="p-3"><button type="button" onClick={() => edit(payment)} className="inline-flex items-center gap-1 rounded bg-primary/10 px-3 py-2 font-bold text-primary hover:bg-button hover:text-secondary"><FaPenToSquare /> Edit</button></td></tr>)}{displayedPayments.length === 0 && <tr><td colSpan="6" className="p-5 text-center text-primary/60">No {label.toLowerCase()} payments found.</td></tr>}</tbody></table></div>{totalPages > 1 && <div className="flex items-center justify-between gap-4 border-t border-primary/10 p-4 text-sm"><button type="button" disabled={visiblePage === 1} onClick={() => setPaymentPage((page) => page - 1)} className="rounded bg-primary px-3 py-2 font-bold text-secondary disabled:opacity-40">Previous</button><span className="font-semibold text-primary">Page {visiblePage} of {totalPages}</span><button type="button" disabled={visiblePage === totalPages} onClick={() => setPaymentPage((page) => page + 1)} className="rounded bg-primary px-3 py-2 font-bold text-secondary disabled:opacity-40">Next</button></div>}</>}</section>
  </div>;
}

export default BursarFinancePortal;
