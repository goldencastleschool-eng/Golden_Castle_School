function PortalWelcomeBanner({
  icon,
  eyebrow,
  title,
  name,
  description,
  metaItems = [],
}) {
  const visibleMetaItems = metaItems.filter(
    (item) => item?.label && item?.value
  );

  return (
    <section className="rounded-lg border border-secondary/10 bg-secondary p-5 shadow-lg sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-4 inline-flex max-w-full items-center gap-3 rounded-lg border border-primary/10 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            {icon && <span className="shrink-0 text-button">{icon}</span>}
            <span className="truncate">{eyebrow}</span>
          </div>

          <h2 className="text-2xl font-extrabold leading-tight text-primary sm:text-3xl md:text-4xl">
            {title}{" "}
            {name && (
              <span className="break-words text-button">{name}</span>
            )}
          </h2>

          {description && (
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-primary/70 sm:text-base">
              {description}
            </p>
          )}
        </div>

        {visibleMetaItems.length > 0 && (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:min-w-[360px]">
            {visibleMetaItems.map((item) => (
              <div key={item.label} className="rounded-lg bg-primary/10 p-4">
                <p className="text-xs font-bold uppercase text-primary/60">
                  {item.label}
                </p>
                <p className="mt-2 break-words text-lg font-extrabold text-primary">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PortalWelcomeBanner;
