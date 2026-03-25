import clsx from "clsx";
import { panelClass, toneClasses } from "../utils/dashboardUtils";

export default function MetricPanel({ title, value, helper, icon: Icon, tone = "blue", onClick }) {
  const interactive = typeof onClick === "function";

  const onKeyDown = (event) => {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={clsx(
        panelClass,
        "overflow-hidden",
        interactive && "cursor-pointer transition hover:border-[var(--accent-primary)] hover:shadow-md"
      )}
      onClick={interactive ? onClick : undefined}
      onKeyDown={onKeyDown}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{title}</p>
          <p className="mt-3 break-words text-[24px] font-black leading-none tracking-tight text-[var(--text-primary)] sm:text-[28px]">{value}</p>
          {helper && <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">{helper}</p>}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-[var(--text-primary)] shadow-inner dark:bg-white/5">
            <Icon
              className={clsx(
                "h-5 w-5",
                tone === "emerald" && "text-emerald-500",
                tone === "amber" && "text-amber-500",
                tone === "rose" && "text-rose-500",
                tone === "violet" && "text-violet-500",
                tone === "blue" && "text-blue-500"
              )}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-black/5 dark:bg-white/5">
        <div className={clsx("h-full rounded-full", toneClasses[tone] || toneClasses.blue)} style={{ width: "58%" }} />
      </div>
    </article>
  );
}
