import { memo } from "react";
import clsx from "clsx";
import { ArrowUpRight, Sparkles } from "lucide-react";

const alertToneClasses = {
  yellow: {
    accent: "bg-yellow-500",
    icon: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    count: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  },
  teal: {
    accent: "bg-teal-500",
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    count: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  red: {
    accent: "bg-rose-500",
    icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    count: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

const AlertCard = memo(function AlertCard({ title, items, icon, tone = "yellow", delay = 0, actionLabel, onActionClick }) {
  const AlertIcon = icon;
  const toneClasses = alertToneClasses[tone] || alertToneClasses.yellow;

  const handleItemKeyDown = (event, onClick) => {
    if (typeof onClick !== "function") return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <section
      className="animate-slide-up overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4 shadow-sm transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-md sm:p-5 dark:border-[#1a1a1a] dark:bg-[var(--bg-secondary)] dark:hover:border-[rgba(47,129,247,0.15)] dark:hover:shadow-[0_0_24px_rgba(47,129,247,0.1),0_2px_8px_rgba(0,0,0,0.3)]"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={title}
    >
      <div className={clsx("-mx-4 -mt-4 mb-4 h-[3px] sm:-mx-5 sm:-mt-5", toneClasses.accent)}></div>

      <div className="mb-4 space-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", toneClasses.icon)}>
            <AlertIcon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <h3 className="min-w-0 break-words text-[15px] font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {items.length > 0 && (
            <span className={clsx("inline-flex min-w-7 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold sm:ml-auto", toneClasses.count)}>
              {items.length}
            </span>
          )}
          {actionLabel && typeof onActionClick === "function" && (
            <button
              type="button"
              onClick={onActionClick}
              className="max-w-full rounded-md border border-[var(--border-default)] px-2 py-1 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] whitespace-normal break-words sm:whitespace-nowrap"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
            <Sparkles className="h-4.5 w-4.5 text-[var(--text-tertiary)]" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">All clear!</p>
          <p className="text-xs text-[var(--text-tertiary)]">No items to display</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 5).map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className={clsx(
                "flex flex-col items-start gap-1.5 rounded-lg border border-[var(--border-light,var(--border-default))] bg-[var(--bg-tertiary)] px-3 py-2.5 transition-colors hover:border-[var(--accent-primary)] sm:flex-row sm:items-center sm:justify-between sm:gap-3",
                typeof item.onClick === "function" && "cursor-pointer"
              )}
              style={{ animationDelay: `${delay + index * 100}ms` }}
              onClick={typeof item.onClick === "function" ? item.onClick : undefined}
              onKeyDown={(event) => handleItemKeyDown(event, item.onClick)}
              role={typeof item.onClick === "function" ? "button" : undefined}
              tabIndex={typeof item.onClick === "function" ? 0 : undefined}
            >
              <span className="min-w-0 break-words text-sm text-[var(--text-primary)]">{item.title}</span>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] sm:shrink-0">
                {item.subtitle}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});

export default AlertCard;
