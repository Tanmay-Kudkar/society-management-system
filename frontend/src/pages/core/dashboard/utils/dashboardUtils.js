export const sectionShellClass = "rounded-[28px] border border-[color-mix(in_srgb,var(--border-default)_88%,white_12%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-secondary)_96%,white_4%),color-mix(in_srgb,var(--bg-secondary)_100%,black_0%))] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)]";

export const panelClass = "rounded-[24px] border border-[color-mix(in_srgb,var(--border-default)_90%,white_10%)] bg-[color-mix(in_srgb,var(--bg-tertiary)_88%,white_12%)] p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]";

export const toneClasses = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
  cyan: "bg-cyan-500",
};

export const badgeClasses = {
  info: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  neutral: "border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const clampPercent = (value) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};
