import { useEffect } from "react";
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaXmark,
} from "react-icons/fa6";

function AdminNotification({ status, onDismiss }) {
  const hasMessage = Boolean(status?.message);
  const isSuccess = status?.type === "success";

  useEffect(() => {
    if (!hasMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onDismiss?.();
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, [hasMessage, onDismiss, status?.message, status?.type]);

  if (!hasMessage) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 px-2">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex items-start gap-4 rounded-2xl border px-5 py-4 text-secondary shadow-2xl backdrop-blur-md ${
          isSuccess
            ? "border-green-500/30 bg-green-100/95"
            : "border-red-500/30 bg-red-100/95"
        }`}
      >
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
            isSuccess
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {isSuccess ? <FaCircleCheck /> : <FaCircleExclamation />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide">
            {isSuccess ? "Success" : "Notice"}
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed">
            {status.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-secondary/10 text-secondary transition duration-300 hover:bg-secondary hover:text-primary"
        >
          <FaXmark />
        </button>
      </div>
    </div>
  );
}

export default AdminNotification;
