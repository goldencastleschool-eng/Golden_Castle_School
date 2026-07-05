import { formatFeeCategory } from "./feeCategories.js";
import {
  getPrintBrandHeader,
  getPrintBrandStyles,
} from "./printBranding.js";

export { formatFeeCategory };

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export const formatReceiptDate = (dateValue) =>
  dateValue ? new Date(dateValue).toLocaleDateString() : "Not set";

export const escapeHtml = (value = "") =>
  value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getRecordId = (record) => record?._id || record || "";

const getFeeStudentId = (fee = {}) => getRecordId(fee.student);

export const buildReceiptNumber = (feeId = "") =>
  feeId ? `GCIS-RCPT-${feeId.toString().slice(-8).toUpperCase()}` : "";

export const getFeeReceiptNumber = (fee = {}) =>
  fee.receipt_no || buildReceiptNumber(fee._id);

export const printPaymentReceipt = ({
  fee,
  payments = [],
  onError = () => {},
}) => {
  if (!fee?._id) {
    onError("Select a valid fee payment before printing receipt.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=720,height=900");

  if (!printWindow) {
    onError("Unable to open receipt window. Allow popups and try again.");
    return;
  }

  const student = fee.student || {};
  const studentId = getFeeStudentId(fee);
  const receiptNumber = getFeeReceiptNumber(fee);
  const expectedAmount = Number(fee.expected_amount_at_payment || 0);
  const discountAmount = Number(fee.discount_amount_at_payment || 0);
  const relatedPayments = studentId
    ? payments.filter(
        (payment) =>
          getFeeStudentId(payment) === studentId &&
          payment.session === fee.session &&
          payment.term === fee.term
      )
    : [fee];
  const totalPaid = relatedPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const currentBalance = Math.max(expectedAmount - totalPaid, 0);
  const feeItems = Array.isArray(fee.expected_items_at_payment)
    ? fee.expected_items_at_payment
    : [];
  const discountRow =
    discountAmount > 0
      ? `
        <tr>
          <td>${feeItems.length > 0 ? feeItems.length + 1 : 2}</td>
          <td>Student Discount</td>
          <td>-${escapeHtml(formatCurrency(discountAmount))}</td>
        </tr>
      `
      : "";
  const feeItemRows = feeItems.length
    ? feeItems
        .map(
          (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.name || "Fee Item")}</td>
              <td>${escapeHtml(formatCurrency(item.amount))}</td>
            </tr>
          `
        )
        .join("") + discountRow
    : `
      <tr>
        <td>1</td>
        <td>Expected Fee</td>
        <td>${escapeHtml(formatCurrency(expectedAmount))}</td>
      </tr>
    ${discountRow}`;
  const noteMarkup = fee.note
    ? `<div class="note"><strong>Note:</strong> ${escapeHtml(fee.note)}</div>`
    : "";

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(receiptNumber)} Payment Receipt</title>
        <style>
          @page { size: 148mm 210mm; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #fff;
            color: #111;
            font-family: Arial, sans-serif;
          }
          ${getPrintBrandStyles()}
          .receipt {
            width: 132mm;
            min-height: 194mm;
            margin: 0 auto;
            border: 1px solid #d7d7d7;
            padding: 8mm;
          }
          .receipt .school-print-brand {
            margin-bottom: 18px;
          }
          .title {
            margin: 0 0 12px;
            text-align: center;
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 14px;
            margin-bottom: 14px;
          }
          .field {
            border: 1px solid #e1e1e1;
            padding: 8px;
            min-height: 40px;
          }
          .label {
            display: block;
            color: #666;
            font-size: 10px;
            font-weight: 700;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .value {
            font-size: 12px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th,
          td {
            border: 1px solid #dcdcdc;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }
          th {
            background: #f3f3f3;
            font-size: 10px;
            text-transform: uppercase;
          }
          .totals {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 14px;
          }
          .total {
            border: 1px solid #111;
            padding: 9px;
          }
          .total strong {
            display: block;
            margin-top: 5px;
            font-size: 14px;
          }
          .highlight {
            background: #111;
            color: #fff;
          }
          .note {
            margin-top: 12px;
            border: 1px solid #e1e1e1;
            padding: 9px;
            font-size: 11px;
            color: #333;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 26px;
          }
          .signature {
            border-top: 1px solid #111;
            padding-top: 6px;
            text-align: center;
            font-size: 11px;
            color: #555;
          }
          .footer {
            margin-top: 18px;
            border-top: 1px dashed #aaa;
            padding-top: 8px;
            color: #555;
            font-size: 10px;
            text-align: center;
          }
          @media print {
            .receipt {
              width: auto;
              min-height: auto;
              border: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="receipt">
          ${getPrintBrandHeader({
            title: "Official payment receipt",
            metaHtml: `Receipt No.<strong>${escapeHtml(receiptNumber)}</strong>`,
          })}

          <div class="title">Payment Receipt</div>

          <section class="grid">
            <div class="field">
              <span class="label">Student</span>
              <span class="value">${escapeHtml(student.full_name || "Deleted student")}</span>
            </div>
            <div class="field">
              <span class="label">Admission No.</span>
              <span class="value">${escapeHtml(student.admission_no || "Not available")}</span>
            </div>
            <div class="field">
              <span class="label">Class</span>
              <span class="value">${escapeHtml(fee.class || student.class || "Not set")}</span>
            </div>
            <div class="field">
              <span class="label">Session / Term</span>
              <span class="value">${escapeHtml(fee.session)} | ${escapeHtml(fee.term)}</span>
            </div>
            <div class="field">
              <span class="label">Fee Category</span>
              <span class="value">${escapeHtml(formatFeeCategory(fee.fee_category))}</span>
            </div>
            <div class="field">
              <span class="label">Date Paid</span>
              <span class="value">${escapeHtml(formatReceiptDate(fee.payment_date))}</span>
            </div>
            <div class="field">
              <span class="label">Payment Method</span>
              <span class="value">${escapeHtml(fee.payment_method || "Not set")}</span>
            </div>
            <div class="field">
              <span class="label">Print Date</span>
              <span class="value">${escapeHtml(formatReceiptDate(new Date()))}</span>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>S/N</th>
                <th>Fee Item</th>
                <th>Expected Amount</th>
              </tr>
            </thead>
            <tbody>${feeItemRows}</tbody>
          </table>

          <section class="totals">
            <div class="total">
              <span class="label">Expected Total</span>
              <strong>${escapeHtml(formatCurrency(expectedAmount))}</strong>
            </div>
            <div class="total highlight">
              <span class="label">Amount Paid On This Receipt</span>
              <strong>${escapeHtml(formatCurrency(fee.amount))}</strong>
            </div>
            <div class="total">
              <span class="label">Total Paid For Term</span>
              <strong>${escapeHtml(formatCurrency(totalPaid))}</strong>
            </div>
            <div class="total">
              <span class="label">Current Balance</span>
              <strong>${escapeHtml(formatCurrency(currentBalance))}</strong>
            </div>
          </section>

          ${noteMarkup}

          <section class="signatures">
            <div class="signature">Received By</div>
            <div class="signature">Parent / Guardian</div>
          </section>

          <p class="footer">
            This receipt confirms the amount paid on this payment record.
            Please keep it for future reference.
          </p>
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
