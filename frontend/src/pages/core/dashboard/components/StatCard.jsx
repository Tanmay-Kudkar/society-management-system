import { memo } from "react";
import clsx from "clsx";
import { Activity } from "lucide-react";

const statIconToneClasses = {
  purple: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  red: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  neutral: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
};

const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  variant = "neutral",
  subtext,
  delay = 0,
}) {
  const CardIcon = icon;
  const iconToneClass = statIconToneClasses[variant] || statIconToneClasses.neutral;

  return (
    <article
      className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-md dark:border-[#1a1a1a] dark:bg-[var(--bg-secondary)] dark:hover:border-[rgba(47,129,247,0.2)] dark:hover:shadow-[0_0_24px_rgba(47,129,247,0.1),0_2px_8px_rgba(0,0,0,0.3)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">{title}</p>
          <p className="mt-1.5 text-[30px] font-bold leading-none text-[var(--text-primary)]">{value}</p>
          {subtext && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <Activity className="h-3.5 w-3.5" />
              {subtext}
            </p>
          )}
        </div>
        <div className={clsx("flex h-11 w-11 items-center justify-center rounded-[10px]", iconToneClass)}>
          <CardIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
});

export default StatCard;
