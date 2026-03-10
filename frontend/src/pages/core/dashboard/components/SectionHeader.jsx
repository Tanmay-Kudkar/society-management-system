export default function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent-primary)]">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
            {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
