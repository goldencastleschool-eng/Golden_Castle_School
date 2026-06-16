function PageLoader({ message = "Loading application..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-secondary">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary shadow-2xl">
          <div className="absolute inset-0 rounded-2xl border-4 border-button/20"></div>
          <div className="absolute inset-0 rounded-2xl border-4 border-transparent border-t-button animate-spin"></div>
          <span className="text-2xl font-extrabold text-primary">GC</span>
        </div>

        <h1 className="mt-6 text-2xl font-extrabold">
          Golden Castle School
        </h1>
        <p className="mt-2 text-sm font-semibold text-secondary/70">
          {message}
        </p>
      </div>
    </div>
  );
}

function TableSkeleton({ columns = 5, rows = 6 }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={`skeleton-row-${rowIndex}`} className="animate-pulse">
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td key={`skeleton-cell-${columnIndex}`} className="px-5 py-4">
          <div
            className={`h-4 rounded-full bg-primary/10 ${
              columnIndex === 0
                ? "w-10"
                : columnIndex === columns - 1
                  ? "w-24"
                  : "w-full max-w-[180px]"
            }`}
          ></div>
        </td>
      ))}
    </tr>
  ));
}

function CardSkeleton({ count = 4 }) {
  return Array.from({ length: count }, (_, index) => (
    <div
      key={`card-skeleton-${index}`}
      className="animate-pulse rounded-[2rem] bg-secondary p-7 shadow-xl"
    >
      <div className="h-4 w-32 rounded-full bg-primary/15"></div>
      <div className="mt-5 h-10 w-24 rounded-full bg-primary/15"></div>
      <div className="mt-7 h-1 w-14 rounded-full bg-button/50"></div>
    </div>
  ));
}

export { CardSkeleton, PageLoader, TableSkeleton };
