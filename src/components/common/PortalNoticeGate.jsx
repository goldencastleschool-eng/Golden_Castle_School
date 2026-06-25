import { useEffect, useState } from "react";
import { FaBullhorn, FaCircleCheck, FaRotateRight } from "react-icons/fa6";

import API from "../../api/axios.jsx";

function PortalNoticeGate({ children }) {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [error, setError] = useState("");

  const fetchPendingNotice = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/portal-notices/pending");
      setNotice(response.data?.notice || null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to load portal notice."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingNotice();
  }, []);

  const handleContinue = async () => {
    if (!notice?.id) {
      return;
    }

    try {
      setAcknowledging(true);
      setError("");

      await API.post(`/portal-notices/${notice.id}/acknowledge`);
      await fetchPendingNotice();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to acknowledge this notice."
      );
    } finally {
      setAcknowledging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
            <FaBullhorn />
          </div>
          <p className="font-bold text-secondary">Checking portal notices...</p>
        </div>
      </div>
    );
  }

  if (error && !notice) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-lg bg-secondary p-6 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-500/10 text-xl text-red-700">
            <FaBullhorn />
          </div>
          <h2 className="text-2xl font-extrabold text-primary">
            Notice Check Failed
          </h2>
          <p className="mt-3 text-primary/70">{error}</p>
          <button
            type="button"
            onClick={fetchPendingNotice}
            className="mt-6 inline-flex items-center justify-center gap-3 rounded-lg bg-button px-5 py-3 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            <FaRotateRight />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!notice) {
    return children;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-8">
      <div className="w-full max-w-2xl rounded-lg bg-secondary p-6 shadow-xl md:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-button text-xl text-secondary">
            <FaBullhorn />
          </div>
          <div>
            <p className="text-sm font-bold uppercase text-button">
              Important Notice
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-primary md:text-3xl">
              {notice.title}
            </h2>
          </div>
        </div>

        <div className="max-h-[48vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-primary/10 bg-primary/5 p-5 text-base leading-7 text-primary/80">
          {notice.message}
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={acknowledging}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-button px-5 py-4 font-bold text-secondary shadow-md transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <FaCircleCheck />
          {acknowledging ? "Saving..." : "I have read this notice, continue"}
        </button>
      </div>
    </div>
  );
}

export default PortalNoticeGate;
