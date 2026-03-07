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

const AlertCard = memo(function AlertCard({ title, items, icon, tone = "yellow", delay = 0 }) {
  const AlertIcon = icon;
  const toneClasses = alertToneClasses[tone] || alertToneClasses.yellow;

  return (
    <section
      className="animate-slide-up overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-md dark:border-[#1a1a1a] dark:bg-[var(--bg-secondary)] dark:hover:border-[rgba(47,129,247,0.15)] dark:hover:shadow-[0_0_24px_rgba(47,129,247,0.1),0_2px_8px_rgba(0,0,0,0.3)]"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={title}
    >
      <div className={clsx("-mx-5 -mt-5 mb-4 h-[3px]", toneClasses.accent)}></div>

      <div className="mb-4 flex items-center gap-3">
        <div className={clsx("flex h-9 w-9 items-center justify-center rounded-[10px]", toneClasses.icon)}>
          <AlertIcon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {items.length > 0 && (
          <span className={clsx("ml-auto inline-flex min-w-7 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold", toneClasses.count)}>
            {items.length}
          </span>
        )}
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
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-light,var(--border-default))] bg-[var(--bg-tertiary)] px-3 py-2.5 transition-colors hover:border-[var(--accent-primary)]"
              style={{ animationDelay: `${delay + index * 100}ms` }}
            >
              <span className="text-sm text-[var(--text-primary)]">{item.title}</span>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
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
