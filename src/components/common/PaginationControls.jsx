function PaginationControls({
  currentPage,
  totalItems,
  pageSize = 15,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const visiblePage = Math.min(currentPage, totalPages);
  const startItem = (visiblePage - 1) * pageSize + 1;
  const endItem = Math.min(visiblePage * pageSize, totalItems);
  const buttonClass =
    "rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-primary/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-primary/60">
        Showing {startItem}-{endItem} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(visiblePage - 1)}
          disabled={visiblePage === 1}
          className={`${buttonClass} bg-primary/10 text-primary`}
        >
          Previous
        </button>
        <span className="rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary">
          Page {visiblePage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(visiblePage + 1)}
          disabled={visiblePage === totalPages}
          className={`${buttonClass} bg-primary/10 text-primary`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
