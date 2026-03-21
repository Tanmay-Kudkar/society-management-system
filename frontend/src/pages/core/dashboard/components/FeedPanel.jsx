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
    <section className={clsx(sectionShellClass, "rounded-2xl p-4 sm:p-5 xl:p-6")}>
      <div className="mb-4 space-y-3 sm:mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)] sm:h-11 sm:w-11">
            <IconComponent className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[1.05rem] font-bold leading-tight text-[var(--text-primary)] sm:text-lg">{title}</h3>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)] sm:text-sm">Latest high-signal updates only.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
          {badgeLabel && <span className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">{badgeLabel}</span>}
          {actionLabel && typeof onActionClick === "function" && (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)]"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
      {items.length === 0 ? <p className="text-sm text-[var(--text-tertiary)]">{emptyText}</p> : (
        <div className="space-y-2.5 sm:space-y-3">
          {items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={clsx(
                "rounded-2xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3.5 py-3 sm:px-4",
                typeof item.onClick === "function" && "cursor-pointer"
              )}
              onClick={typeof item.onClick === "function" ? item.onClick : undefined}
              onKeyDown={(event) => handleItemKeyDown(event, item.onClick)}
              role={typeof item.onClick === "function" ? "button" : undefined}
              tabIndex={typeof item.onClick === "function" ? 0 : undefined}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  {item.meta && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{item.meta}</p>}
                </div>
                {item.badge && <span className={clsx("inline-flex self-start rounded-full border px-2.5 py-1 text-[11px] font-semibold", badgeClasses[item.badgeTone || "neutral"])}>{item.badge}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
