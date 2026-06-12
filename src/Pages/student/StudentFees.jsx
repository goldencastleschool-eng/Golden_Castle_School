import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaPrint,
  FaReceipt,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import {
  formatCurrency,
  formatFeeCategory,
  formatReceiptDate,
  getFeeReceiptNumber,
  printPaymentReceipt,
} from "../../utils/paymentReceipt.js";

const getStatusClass = (status = "") => {
  if (status === "Fully Paid") {
    return "bg-green-500/10 text-green-700";
  }

  if (status === "Part Payment") {
    return "bg-yellow-500/10 text-yellow-700";
  }

  if (status === "Unpaid") {
    return "bg-red-500/10 text-red-700";
  }

  return "bg-primary/10 text-primary";
};

function StudentFees() {
  const [student, setStudent] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [selectedSummaryKey, setSelectedSummaryKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/fees/me");
        const summaryList = response.data?.summaries || [];

        setStudent(response.data?.student || null);
        setSummaries(summaryList);

        if (summaryList.length > 0) {
          setSelectedSummaryKey(
            `${summaryList[0].session}-${summaryList[0].term}-${summaryList[0].fee_category}`
          );
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load your fee records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, []);

  const allPayments = useMemo(
    () => summaries.flatMap((summary) => summary.payments || []),
    [summaries]
  );

  const selectedSummary = useMemo(() => {
    return summaries.find(
      (summary) =>
        `${summary.session}-${summary.term}-${summary.fee_category}` ===
        selectedSummaryKey
    );
  }, [selectedSummaryKey, summaries]);

  const totalExpected = summaries.reduce(
    (sum, summary) => sum + Number(summary.expected_amount || 0),
    0
  );
  const totalPaid = summaries.reduce(
    (sum, summary) => sum + Number(summary.total_paid || 0),
    0
  );
  const totalBalance = summaries.reduce(
    (sum, summary) => sum + Number(summary.balance || 0),
    0
  );

  const handlePrintReceipt = (payment) => {
    printPaymentReceipt({
      fee: payment,
      payments: allPayments,
      onError: (message) => setError(message),
    });
  };

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaReceipt />
        </div>

        <h2 className="text-4xl font-extrabold text-secondary">
          My Fees
        </h2>

        <p className="mt-3 max-w-2xl text-secondary/75">
          View your fee status, payment history, and official payment receipts.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-secondary p-6 shadow-xl">
          <p className="text-sm font-bold uppercase text-primary/60">
            Expected Total
          </p>
          <p className="mt-3 text-3xl font-extrabold text-primary">
            {loading ? "..." : formatCurrency(totalExpected)}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary p-6 shadow-xl">
          <p className="text-sm font-bold uppercase text-primary/60">
            Paid Total
          </p>
          <p className="mt-3 text-3xl font-extrabold text-primary">
            {loading ? "..." : formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary p-6 shadow-xl">
          <p className="text-sm font-bold uppercase text-primary/60">
            Balance
          </p>
          <p className="mt-3 text-3xl font-extrabold text-primary">
            {loading ? "..." : formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-[2rem] bg-secondary p-7 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Fee Records
          </h3>
          <p className="mt-3 text-primary/70">
            Select a session and term to view details.
          </p>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                Loading fee records...
              </div>
            ) : summaries.length === 0 ? (
              <div className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                No fee record is available yet.
              </div>
            ) : (
              summaries.map((summary) => {
                const summaryKey = `${summary.session}-${summary.term}-${summary.fee_category}`;
                const isSelected = selectedSummaryKey === summaryKey;

                return (
                  <button
                    key={summaryKey}
                    type="button"
                    onClick={() => setSelectedSummaryKey(summaryKey)}
                    className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-button bg-button text-secondary"
                        : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold">{summary.term}</p>
                        <p className="mt-1 text-sm opacity-80">
                          {summary.session}
                        </p>
                      </div>
                      <FaArrowRight className="mt-1" />
                    </div>
                    <p className="mt-3 text-sm font-semibold opacity-80">
                      {formatFeeCategory(summary.fee_category)}
                    </p>
                    <span
                      className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(summary.status)}`}
                    >
                      {summary.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="rounded-[2rem] bg-secondary p-7 shadow-2xl">
          {!selectedSummary ? (
            <div className="rounded-2xl bg-primary/5 p-6 text-primary/70">
              Select a fee record to view details.
            </div>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h3 className="text-3xl font-extrabold text-primary">
                    {selectedSummary.term}
                  </h3>
                  <p className="mt-2 text-primary/70">
                    {selectedSummary.session} |{" "}
                    {selectedSummary.class || student?.class || "Class not set"}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${getStatusClass(selectedSummary.status)}`}
                >
                  {selectedSummary.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-primary/5 p-5">
                  <p className="text-sm font-bold uppercase text-primary/60">
                    Expected
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-primary">
                    {formatCurrency(selectedSummary.expected_amount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-5">
                  <p className="text-sm font-bold uppercase text-primary/60">
                    Paid
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-primary">
                    {formatCurrency(selectedSummary.total_paid)}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-5">
                  <p className="text-sm font-bold uppercase text-primary/60">
                    Balance
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-primary">
                    {formatCurrency(selectedSummary.balance)}
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-primary/10 bg-primary/5 p-5">
                <p className="text-sm font-bold uppercase text-primary/60">
                  Fee Items
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(selectedSummary.expected_items || []).length === 0 ? (
                    <p className="text-primary/70">
                      Fee items are not available for this record.
                    </p>
                  ) : (
                    selectedSummary.expected_items.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-xl bg-secondary px-4 py-3"
                      >
                        <span className="font-semibold text-primary/75">
                          {item.name}
                        </span>
                        <span className="font-bold text-primary">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-7">
                <h4 className="text-2xl font-extrabold text-primary">
                  Payment History
                </h4>
                <p className="mt-2 text-primary/70">
                  Print or save a receipt for each payment made.
                </p>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-primary/10">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-primary/10 text-primary">
                      <tr>
                        <th className="px-5 py-4 font-bold">Receipt</th>
                        <th className="px-5 py-4 font-bold">Amount</th>
                        <th className="px-5 py-4 font-bold">Date Paid</th>
                        <th className="px-5 py-4 font-bold">Method</th>
                        <th className="px-5 py-4 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {(selectedSummary.payments || []).length === 0 ? (
                        <tr>
                          <td className="px-5 py-6 text-primary/70" colSpan="5">
                            No payment has been recorded for this term yet.
                          </td>
                        </tr>
                      ) : (
                        selectedSummary.payments.map((payment) => (
                          <tr key={payment._id} className="text-primary/80">
                            <td className="px-5 py-4 font-bold text-primary">
                              {getFeeReceiptNumber(payment)}
                            </td>
                            <td className="px-5 py-4">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-5 py-4">
                              {formatReceiptDate(payment.payment_date)}
                            </td>
                            <td className="px-5 py-4">
                              {payment.payment_method || "Not set"}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => handlePrintReceipt(payment)}
                                className="flex items-center gap-2 rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary"
                              >
                                <FaPrint />
                                Receipt
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default StudentFees;
