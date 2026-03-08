import { Activity, Building2, Home, Layers, MapPin, Sun } from "lucide-react";
import ClockDisplay from "./ClockDisplay";
import NoticeRail from "./NoticeRail";
import { formatRole } from "../../../../utils/formatUtils";

export default function HeroSection({
  user,
  notices,
  isMemberOrTenant,
  isPlatformLevel,
  isPlatformOwner,
  weather,
  locationName,
  getWeatherDesc,
  getWeatherIcon,
  timeGreeting,
}) {
  return (
    <>
      <style>{`
        @keyframes border-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <section
        className="relative mb-6 rounded-2xl p-[2px] shadow-sm transition-all duration-300"
        aria-labelledby="dashboard-hero-title"
      >
        {/* Flowing Gradient Border Background */}
        <div className="absolute inset-0 rounded-2xl opacity-100 blur-[1px]"
             style={{ 
               backgroundImage: "linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff, #ff0000)",
               backgroundSize: "200% auto", 
               animation: "border-flow 5s linear infinite" 
             }} />
             
        {/* Inner Card Container */}
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-[var(--bg-secondary)]">

          <div className="relative flex flex-col gap-0 md:flex-row">
            {/* LEFT: Greeting */}
            <header className="flex-1 px-6 py-6 sm:px-8 sm:py-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* LIVE badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>

            {isMemberOrTenant ? (
              <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                {formatRole(user?.role)}
              </span>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  v1.0.0
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  <Activity className="h-2.5 w-2.5" aria-hidden="true" />
                  Real-time
                </span>
              </>
            )}
          </div>

          {/* Greeting headline */}
          <h1
            id="dashboard-hero-title"
            className="mb-2 text-[24px] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[28px]"
          >
            {timeGreeting},{" "}
            <span className="text-[var(--accent-primary)]">
              {user?.name?.split(" ")[0] || "User"}
            </span>{" "}
            <span aria-hidden="true">👋</span>
          </h1>

          <p className="max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">
            {isMemberOrTenant
              ? "Welcome back. Here's a personalized overview of everything happening in your living space."
              : "Welcome to your command center. Here's what's happening across your society today."}
          </p>

          {/* Role / Society badge row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!isMemberOrTenant && !isPlatformLevel && user?.societyId && (
              <span className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent-primary)]">
                <Building2 className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
                Society ID: <span className="text-[var(--text-primary)]">{user.societyId}</span>
              </span>
            )}
            {isPlatformLevel && (
              <span className="flex items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/8 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                {formatRole(user?.role)}
              </span>
            )}
            {isMemberOrTenant && (
              <span className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent-primary)]">
                <Home className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden="true" />
                {user?.flatNumber ? <span className="text-[var(--text-primary)]">Unit {user.flatNumber}</span> : "Resident"}
              </span>
            )}
          </div>
        </header>

        {/* RIGHT: Weather + Clock combined widget */}
        <aside
          className="flex shrink-0 flex-col xl:flex-row items-center justify-center gap-6 lg:gap-8 border-t border-[var(--border-default)]/60 p-6 lg:p-8 md:border-l md:border-t-0"
          aria-label="Weather and time"
        >
          {/* Weather block */}
          <div className="flex flex-col items-center xl:items-start gap-3 lg:gap-4">
            {locationName && (
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <MapPin className="h-4 w-4 lg:h-5 lg:w-5 shrink-0 text-[var(--accent-primary)]" aria-hidden="true" />
                <span className="truncate text-sm lg:text-base font-semibold">{locationName}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 lg:h-16 lg:w-16 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] shadow-sm shadow-amber-500/10">
                {weather?.current?.weather_code !== undefined ? (
                  <div className="[&>svg]:h-8 [&>svg]:w-8 lg:[&>svg]:h-10 lg:[&>svg]:w-10">
                    {getWeatherIcon(weather.current.weather_code)}
                  </div>
                ) : (
                  <Sun className="h-8 w-8 lg:h-10 lg:w-10 text-amber-500" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col items-start pt-1">
                <p className="text-[36px] lg:text-[46px] font-black leading-none tabular-nums tracking-tight text-amber-600 dark:text-amber-400">
                  {weather?.current?.temperature_2m != null
                    ? `${Math.round(weather.current.temperature_2m)}°C`
                    : "—"}
                </p>
                <p className="mt-1 lg:mt-1.5 text-xs lg:text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {weather?.current?.weather_code !== undefined
                    ? getWeatherDesc(weather.current.weather_code)
                    : "Fetching..."}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden xl:block h-[80px] w-px bg-[var(--border-default)]/60" />
          <div className="block xl:hidden h-px w-full bg-[var(--border-default)]/60" />

          {/* Clock block */}
          <div className="flex flex-col items-center xl:items-start">
            <ClockDisplay />
          </div>
        </aside>
      </div>

      <NoticeRail notices={notices} />
      
        </div>
      </section>
    </>
  );
}
