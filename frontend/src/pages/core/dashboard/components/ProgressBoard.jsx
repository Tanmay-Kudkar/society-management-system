import clsx from "clsx";
import { clampPercent, panelClass, toneClasses } from "../utils/dashboardUtils";

export default function ProgressBoard({ title, caption, items, emptyText = "No data available yet." }) {
  return (
    <section className={panelClass}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        {caption && <p className="mt-1 text-sm text-[var(--text-secondary)]">{caption}</p>}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                  {item.helper && <p className="text-xs text-[var(--text-tertiary)]">{item.helper}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{item.value}</p>
                  {item.meta && <p className="text-xs text-[var(--text-tertiary)]">{item.meta}</p>}
                </div>
              </div>
              <div className="h-2 rounded-full bg-black/5 dark:bg-white/5">
                <div className={clsx("h-full rounded-full", toneClasses[item.tone] || toneClasses.blue)} style={{ width: `${clampPercent(item.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
