import clsx from "clsx";
import { badgeClasses, sectionShellClass } from "../utils/dashboardUtils";

export default function FeedPanel({ title, icon, items, emptyText, badgeLabel, actionLabel, onActionClick }) {
  const IconComponent = icon;

  const handleItemKeyDown = (event, onClick) => {
    if (typeof onClick !== "function") return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <section className={sectionShellClass}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]">
            <IconComponent className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">Latest high-signal updates only.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badgeLabel && <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">{badgeLabel}</span>}
          {actionLabel && typeof onActionClick === "function" && (
            <button
              type="button"
              onClick={onActionClick}
              className="rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      {items.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">{emptyText}</p> : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={clsx(
                "rounded-2xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-3",
                typeof item.onClick === "function" && "cursor-pointer transition-colors hover:border-[var(--accent-primary)]"
              )}
              onClick={typeof item.onClick === "function" ? item.onClick : undefined}
              onKeyDown={(event) => handleItemKeyDown(event, item.onClick)}
              role={typeof item.onClick === "function" ? "button" : undefined}
              tabIndex={typeof item.onClick === "function" ? 0 : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  {item.meta && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{item.meta}</p>}
                </div>
                {item.badge && <span className={clsx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", badgeClasses[item.badgeTone || "neutral"])}>{item.badge}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
