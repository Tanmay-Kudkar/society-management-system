import { Bell } from "lucide-react";

const fallbackNotices = [
  "Welcome to the Society Management Hub!",
  "Check your pending bills and active notices.",
  "Security systems are 100% operational.",
];

export default function NoticeRail({ notices }) {
  const items = notices.length > 0
    ? notices.map((notice) => ({
        id: notice.id || notice.createdAt || notice.title || notice.content,
        label: notice.content || notice.title,
      }))
    : fallbackNotices.map((label) => ({ id: label, label }));

  return (
    <section className="relative border-t border-[var(--border-default)] bg-gradient-to-r from-[var(--bg-tertiary)] via-white/50 to-[var(--bg-tertiary)] py-2 dark:from-[#1a1a1a] dark:via-[#222] dark:to-[#1a1a1a]" aria-label="Recent notices">
      <div className="flex flex-col gap-3 px-4 py-1 sm:flex-row sm:items-center sm:px-5">
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-extrabold tracking-widest text-[var(--accent-primary)]">
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          <span>LATEST NOTICES</span>
        </div>
        <div className="flex-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max items-center gap-2.5">
            {items.map((item) => (
              <li
                key={item.id}
                className="shrink-0 rounded-full border border-[var(--border-default)] bg-white/65 px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-sm dark:bg-black/30"
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
