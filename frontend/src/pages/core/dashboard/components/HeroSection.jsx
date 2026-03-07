import { Activity, Building2, Home, Layers, Sun } from "lucide-react";
import ClockDisplay from "./ClockDisplay";
import NoticeRail from "./NoticeRail";

export default function HeroSection({
  user,
  notices,
  isMemberOrTenant,
  isPlatformLevel,
  isPlatformOwner,
  weather,
  getWeatherDesc,
  getWeatherIcon,
  timeGreeting,
}) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-sm dark:border-[#1a1a1a]" aria-labelledby="dashboard-hero-title">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-emerald-500/5 opacity-50 dark:from-blue-500/10 dark:via-violet-500/10 dark:to-emerald-500/10" />
      <div className="absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-blue-400/20 mix-blend-multiply blur-3xl filter dark:bg-blue-400/10" style={{ animationDuration: "8s" }} />
      <div className="absolute -bottom-20 -right-20 h-64 w-64 animate-pulse rounded-full bg-violet-400/20 mix-blend-multiply blur-3xl filter dark:bg-violet-400/10" style={{ animationDuration: "10s", animationDelay: "1s" }} />
      <div className="absolute left-0 right-0 top-0 h-[4px] bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400 opacity-90" />

      <div className="relative flex flex-col gap-0 md:flex-row">
        <header className="flex-1 px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.1)] backdrop-blur-sm dark:text-emerald-400">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              LIVE
            </span>

            {isMemberOrTenant ? (
              <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-1 text-[11px] font-bold tracking-wider text-[var(--text-secondary)] shadow-sm backdrop-blur-sm">
                {user?.role}
              </span>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-white/50 px-3 py-1 text-[11px] font-bold tracking-wider text-[var(--text-secondary)] shadow-sm backdrop-blur-sm dark:bg-black/20">
                  v2.5.0
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.1)] backdrop-blur-sm dark:text-blue-400">
                  <Activity className="h-3 w-3" aria-hidden="true" />
                  REAL-TIME
                </span>
              </>
            )}
          </div>

          <h1 id="dashboard-hero-title" className="mb-2 text-[28px] font-extrabold tracking-tight text-[var(--text-primary)] lg:text-[34px]">
            {timeGreeting},{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-400">
              {user?.name?.split(" ")[0] || "User"}
            </span>{" "}
            <span className="inline-block origin-bottom animate-bounce-custom" aria-hidden="true">👋</span>
          </h1>

          <p className="max-w-xl text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
            {isMemberOrTenant
              ? "Welcome back. Here's a personalized overview of everything happening in your living space."
              : "Welcome to your command center. Here's what's happening across your society today."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!isMemberOrTenant && !isPlatformLevel && user?.societyId && (
              <span className="group flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-white/60 px-4 py-2 text-xs font-semibold tracking-wide text-[var(--text-secondary)] shadow-sm backdrop-blur-md transition-all hover:border-[var(--accent-primary)] hover:bg-white dark:bg-black/40 dark:hover:bg-black/60">
                <Building2 className="h-4 w-4 text-[var(--accent-primary)] transition-transform group-hover:scale-110" aria-hidden="true" />
                Society ID: <span className="text-[var(--text-primary)]">{user.societyId}</span>
              </span>
            )}
            {isPlatformLevel && (
              <span className="group flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-bold tracking-wide text-violet-700 shadow-sm backdrop-blur-md transition-all hover:bg-violet-500/20 dark:text-violet-300">
                <Layers className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
                {isPlatformOwner ? "Platform Owner" : "Organisation Owner"}
              </span>
            )}
            {isMemberOrTenant && (
              <span className="group flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-white/60 px-4 py-2 text-xs font-semibold tracking-wide text-[var(--text-secondary)] shadow-sm backdrop-blur-md transition-all hover:border-[var(--accent-primary)] hover:bg-white dark:bg-black/40 dark:hover:bg-black/60">
                <Home className="h-4 w-4 text-[var(--accent-primary)] transition-transform group-hover:scale-110" aria-hidden="true" />
                {user?.flatNumber ? <span className="text-[var(--text-primary)]">Unit {user.flatNumber}</span> : "Resident"}
              </span>
            )}
          </div>
        </header>

        <aside className="relative flex shrink-0 items-center justify-center gap-0 border-t border-[var(--border-default)] bg-gradient-to-b from-white/40 to-white/10 backdrop-blur-md md:border-l md:border-t-0 dark:from-black/40 dark:to-black/10" aria-label="Weather and time">
          <div className="flex h-full w-full max-w-sm divide-x divide-[var(--border-default)] md:max-w-none">
            <div className="group flex w-1/2 flex-col items-center justify-center gap-2 p-5 transition-colors hover:bg-white/40 md:w-auto md:min-w-[140px] dark:hover:bg-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)] shadow-inner transition-transform duration-300 group-hover:scale-110">
                {weather?.current?.weather_code !== undefined ? (
                  getWeatherIcon(weather.current.weather_code)
                ) : (
                  <Sun className="h-6 w-6 animate-[spin_4s_linear_infinite] text-[var(--accent-primary)]" />
                )}
              </div>
              <div className="text-center">
                <p className="bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-[26px] font-black leading-none tabular-nums tracking-tight text-transparent">
                  {weather?.current?.temperature_2m != null
                    ? `${Math.round(weather.current.temperature_2m)}°C`
                    : "-"}
                </p>
                <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-tertiary)]">
                  {weather?.current?.weather_code !== undefined
                    ? getWeatherDesc(weather.current.weather_code)
                    : "Loading"}
                </p>
              </div>
            </div>
            <div className="flex w-1/2 items-center justify-center p-2 transition-colors hover:bg-white/40 md:w-auto md:min-w-[170px] dark:hover:bg-white/5">
              <ClockDisplay />
            </div>
          </div>
        </aside>
      </div>

      <NoticeRail notices={notices} />
    </section>
  );
}
