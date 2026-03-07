import { memo, useEffect, useState } from "react";
import { Clock } from "lucide-react";

const ClockDisplay = memo(function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-w-[152px] flex-col justify-center px-5 py-4" aria-live="polite">
      <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
          {currentTime.toLocaleDateString("en-US", { weekday: "long" })}
        </span>
      </div>
      <p className="mt-0.5 text-[23px] font-bold leading-none tabular-nums text-[var(--text-primary)]">
        {currentTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        {currentTime.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
});

export default ClockDisplay;
