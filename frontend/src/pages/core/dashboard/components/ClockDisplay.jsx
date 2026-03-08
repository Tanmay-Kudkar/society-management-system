import { memo, useEffect, useState } from "react";

const ClockDisplay = memo(function ClockDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const [timePart, period] = timeStr.split(" ");
  const s = now.getSeconds().toString().padStart(2, "0");
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-col items-center xl:items-start gap-1.5 lg:gap-2" aria-live="polite">
      {/* Date & Day */}
      <div className="flex items-center gap-1.5 md:gap-2 text-[10px] sm:text-xs lg:text-sm font-bold tracking-widest text-[var(--text-muted)] uppercase">
        <span>{dayName}</span>
        <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-[var(--accent-primary)]/50"></span>
        <span>{dateStr}</span>
      </div>

      {/* Main Time Widget */}
      <div className="group relative flex items-center gap-2 lg:gap-3 rounded-2xl md:rounded-3xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] px-5 py-3 md:px-6 md:py-4 shadow-sm transition-all duration-300 hover:border-[var(--accent-primary)]/50 hover:shadow-md">
        
        <span className="text-[42px] sm:text-[56px] lg:text-[64px] leading-none font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
          {timePart}
        </span>
        
        <div className="flex w-[24px] sm:w-[32px] lg:w-[40px] flex-col items-start justify-center gap-0.5 md:gap-1">
          <span className="text-[14px] sm:text-[18px] lg:text-[20px] tabular-nums leading-none font-black text-[var(--accent-primary)]">
            {s}
          </span>
          <span className="text-[10px] sm:text-[12px] lg:text-[14px] leading-none font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            {period}
          </span>
        </div>
      </div>
    </div>
  );
});

export default ClockDisplay;
