function AdminStatCard({ title, value, icon, tone = "default" }) {
  const toneClasses = {
    default: "bg-button text-secondary",
    green: "bg-green-500/15 text-green-300",
    red: "bg-red-500/15 text-red-300",
    muted: "bg-primary/10 text-primary",
  };

  return (
    <div className="rounded-[2rem] bg-secondary p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-primary/60">{title}</p>
          <p className="mt-3 text-3xl font-extrabold text-primary">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
            toneClasses[tone] || toneClasses.default
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default AdminStatCard;
