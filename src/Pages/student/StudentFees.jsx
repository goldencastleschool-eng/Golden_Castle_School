import { useEffect, useMemo, useState } from "react";
import {
  FaPrint,
  FaReceipt,
} from "react-icons/fa6";

import API from "../../api/axios.jsx";
import {
  ACADEMIC_TERMS,
  getVisibleTermsForSession,
} from "../../utils/academicTerms.js";
import {
  formatCurrency,
  formatFeeCategory,
  formatReceiptDate,
  getFeeReceiptNumber,
  printPaymentReceipt,
} from "../../utils/paymentReceipt.js";

const getTermSortValue = (term = "") => {
  const termIndex = ACADEMIC_TERMS.indexOf(term);

  return termIndex === -1 ? ACADEMIC_TERMS.length : termIndex;
};

const sortFeeTerms = (terms = []) =>
  [...terms].sort(
    (firstTerm, secondTerm) =>
      getTermSortValue(firstTerm) - getTermSortValue(secondTerm) ||
      firstTerm.localeCompare(secondTerm)
  );

function StudentFees() {
  const [summaries, setSummaries] = useState([]);
  const [paymentHistoryFilter, setPaymentHistoryFilter] = useState({
    session: "",
    term: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setError("");

        const response = await API.get("/fees/me");
        const summaryList = (response.data?.summaries || []).filter((summary) =>
          getVisibleTermsForSession(summary.session).includes(summary.term)
        );

        setSummaries(summaryList);

        if (summaryList.length > 0) {
          const firstSummary = summaryList[0];

          setPaymentHistoryFilter({
            session: firstSummary.session || "",
            term: firstSummary.term || "",
          });
        } else {
          setPaymentHistoryFilter({
            session: "",
            term: "",
          });
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load your fee records."
        );
      }
    };

    fetchFees();
  }, []);

  const allPayments = useMemo(
    () => summaries.flatMap((summary) => summary.payments || []),
    [summaries]
  );

  const paymentSessionOptions = useMemo(() => {
    return [
      ...new Set(summaries.map((summary) => summary.session).filter(Boolean)),
    ].sort((firstSession, secondSession) =>
      secondSession.localeCompare(firstSession)
    );
  }, [summaries]);

  const paymentTermOptions = useMemo(() => {
    return sortFeeTerms([
      ...new Set(
        summaries
          .filter(
            (summary) =>
              !paymentHistoryFilter.session ||
              summary.session === paymentHistoryFilter.session
          )
          .map((summary) => summary.term)
          .filter(Boolean)
      ),
    ]);
  }, [paymentHistoryFilter.session, summaries]);

  const paymentHistorySummaries = useMemo(() => {
    return summaries.filter(
      (summary) =>
        (!paymentHistoryFilter.session ||
          summary.session === paymentHistoryFilter.session) &&
        (!paymentHistoryFilter.term || summary.term === paymentHistoryFilter.term)
    );
  }, [paymentHistoryFilter.session, paymentHistoryFilter.term, summaries]);

  const filteredPaymentHistory = useMemo(() => {
    return paymentHistorySummaries.flatMap((summary) =>
      (summary.payments || []).map((payment) => ({
        ...payment,
        fee_category: payment.fee_category || summary.fee_category,
      }))
    );
  }, [paymentHistorySummaries]);

  const paymentHistoryExpected = paymentHistorySummaries.reduce(
    (sum, summary) => sum + Number(summary.expected_amount || 0),
    0
  );
  const paymentHistoryPaid = paymentHistorySummaries.reduce(
    (sum, summary) => sum + Number(summary.total_paid || 0),
    0
  );
  const paymentHistoryBalance = paymentHistorySummaries.reduce(
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

  const handlePaymentHistoryFilterChange = (event) => {
    const { name, value } = event.target;

    setPaymentHistoryFilter((currentFilter) => {
      if (name === "session") {
        const termsForSession = sortFeeTerms([
          ...new Set(
            summaries
              .filter((summary) => summary.session === value)
              .map((summary) => summary.term)
              .filter(Boolean)
          ),
        ]);

        return {
          session: value,
          term: termsForSession.includes(currentFilter.term)
            ? currentFilter.term
            : termsForSession[0] || "",
        };
      }

      return {
        ...currentFilter,
        [name]: value,
      };
    });
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaReceipt />
        </div>

        <h2 className="text-3xl font-extrabold text-secondary">
          My Fees
        </h2>

        <p className="mt-3 max-w-2xl text-secondary/75">
          View your payment history and official payment receipts.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <section className="rounded-lg bg-secondary p-5 shadow-lg">
          <h4 className="text-2xl font-extrabold text-primary">
            Payment History
          </h4>
          <p className="mt-2 text-primary/70">
            Select a session and term to view payments made for that period.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/60">
                Session
              </label>
              <select
                name="session"
                value={paymentHistoryFilter.session}
                onChange={handlePaymentHistoryFilterChange}
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                {paymentSessionOptions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary/60">
                Term
              </label>
              <select
                name="term"
                value={paymentHistoryFilter.term}
                onChange={handlePaymentHistoryFilterChange}
                className="w-full rounded-lg border border-primary/10 bg-primary/5 px-5 py-4 text-primary outline-none transition-all duration-300 focus:border-button focus:ring-2 focus:ring-button/20"
              >
                {paymentTermOptions.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-primary/5 px-5 py-4 text-primary">
              <p className="text-xs font-bold uppercase text-primary/50">
                Payments
              </p>
              <p className="mt-2 text-2xl font-extrabold">
                {filteredPaymentHistory.length}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Expected
              </p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {formatCurrency(paymentHistoryExpected)}
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Paid
              </p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {formatCurrency(paymentHistoryPaid)}
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 p-5">
              <p className="text-sm font-bold uppercase text-primary/60">
                Balance
              </p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {formatCurrency(paymentHistoryBalance)}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg border border-primary/10">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-primary/10 text-primary">
                <tr>
                  <th className="px-5 py-4 font-bold">Receipt</th>
                  <th className="px-5 py-4 font-bold">Fee Category</th>
                  <th className="px-5 py-4 font-bold">Amount</th>
                  <th className="px-5 py-4 font-bold">Date Paid</th>
                  <th className="px-5 py-4 font-bold">Method</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {filteredPaymentHistory.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-primary/70" colSpan="6">
                      No payment has been recorded for this session and term yet.
                    </td>
                  </tr>
                ) : (
                  filteredPaymentHistory.map((payment) => (
                    <tr key={payment._id} className="text-primary/80">
                      <td className="px-5 py-4 font-bold text-primary">
                        {getFeeReceiptNumber(payment)}
                      </td>
                      <td className="px-5 py-4">
                        {formatFeeCategory(payment.fee_category)}
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
        </section>
      </div>
    </div>
  );
}

export default StudentFees;

