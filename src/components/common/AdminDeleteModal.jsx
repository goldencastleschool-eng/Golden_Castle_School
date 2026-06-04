import { FaTrashCan, FaTriangleExclamation, FaXmark } from "react-icons/fa6";

function AdminDeleteModal({
  open,
  title,
  message,
  details,
  confirmLabel = "Delete",
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-secondary/70 px-4 py-8 backdrop-blur-sm sm:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="w-full max-w-lg rounded-[2rem] border border-primary/15 bg-secondary p-6 text-primary shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-xl text-red-200">
              <FaTriangleExclamation />
            </div>
            <div>
              <h3 id="delete-modal-title" className="text-2xl font-extrabold">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-primary/75">
                {message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close delete confirmation"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary/10 text-primary transition duration-300 hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaXmark />
          </button>
        </div>

        {details && (
          <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/10 p-4 text-sm font-semibold leading-relaxed">
            {details}
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-2xl bg-primary/10 px-5 py-4 font-bold text-primary transition duration-300 hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-red-600 px-5 py-4 font-bold text-white shadow-xl transition duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FaTrashCan />
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default AdminDeleteModal;
