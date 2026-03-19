import { Bell } from "lucide-react";

const fallbackNotices = [
  "Welcome to the Society Management Hub!",
  "Check your pending bills and active notices.",
  "Security systems are 100% operational.",
  "Maintenance requests can be raised anytime.",
  "Community events are updated in real-time.",
];

export default function NoticeRail({ notices }) {
  const items = notices.length > 0
    ? notices.map((notice) => ({
        id: notice.id || notice.createdAt || notice.title || notice.content,
        label: notice.content || notice.title,
      }))
    : fallbackNotices.map((label) => ({ id: label, label }));

  // Duplicate for seamless infinite scroll
  const doubled = [...items, ...items];
  const tickerDurationSeconds = Math.max(48, Math.min(140, items.length * 12));

  return (
    <section
      className="relative border-t border-[var(--border-default)]/60 bg-[var(--bg-tertiary)]"
      aria-label="Recent notices"
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-20 bg-gradient-to-r from-[var(--bg-tertiary)] to-transparent" />
      {/* Right fade */}
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-20 bg-gradient-to-l from-[var(--bg-tertiary)] to-transparent" />

      <div className="flex items-center gap-0 py-2.5">
        {/* Label pill */}
        <div className="shrink-0 z-20 flex items-center gap-2 border-r border-[var(--border-default)] bg-[var(--bg-tertiary)] pl-4 pr-4 py-1">
          <Bell className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent-primary)] whitespace-nowrap">
            Latest Notices
          </span>
        </div>

        {/* Scrolling ticker */}
        <div
          className="flex-1 overflow-hidden"
          aria-live="polite"
          style={{ "--ticker-duration": `${tickerDurationSeconds}s` }}
        >
          <ul className="flex w-max animate-ticker items-center gap-0">
            {doubled.map((item, i) => (
              <li
                key={`${item.id}-${i}`}
                className="flex items-center gap-3 px-5 text-[12.5px] font-medium text-[var(--text-tertiary)] whitespace-nowrap"
              >
                <span className="h-1 w-1 rounded-full bg-[var(--accent-primary)] opacity-60 shrink-0" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
