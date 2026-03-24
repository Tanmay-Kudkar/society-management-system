import clsx from 'clsx'
import useBackendStatus from '../hooks/useBackendStatus'

/**
 * SkeletonLoaders.jsx
 * Reusable skeleton/shimmer loading components (YouTube / social-media style)
 * Works across light & dark themes via CSS custom properties.
 *
 * Usage:
 *   import { CardGridSkeleton } from '../components/SkeletonLoaders'
 *   if (isLoading) return <CardGridSkeleton count={6} />
 */

const boneVariantClasses = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
  pill: 'rounded-full',
  search: 'h-10 w-[260px] rounded-lg max-md:w-full',
  btn: 'h-10 w-[110px] rounded-lg',
  tab: 'h-9 w-[100px] rounded-md',
}

const boneBaseClass = 'animate-pulse bg-slate-300/60 dark:bg-slate-700/60'
const containerClass = 'animate-pulse/50 hidden sm:block'
const cardClass = 'flex flex-col gap-3.5 overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5'
const statClass = 'flex min-h-[100px] flex-col gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5'

/* ─── Bone: the single shimmer primitive ─── */
export const Bone = ({ width, height, style, className = '', variant = '' }) => (
  <div
    className={clsx(boneBaseClass, variant && boneVariantClasses[variant], className)}
    style={{ width, height, ...style }}
  />
)

/* ─── Wake-up Banner (shown only when backend is cold-starting) ─── */
export const WakeUpBanner = ({ show }) => {
  const { isWakingUp, statusText } = useBackendStatus()
  const shouldShow = typeof show === 'boolean' ? show : isWakingUp
  if (!shouldShow) return null

  const isReconnecting = statusText?.toLowerCase().startsWith('reconnecting')

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-center gap-4 bg-[color-mix(in_srgb,var(--bg-primary)_95%,transparent)] px-6 text-center sm:hidden"
        style={{ top: 'var(--mobile-navbar-height, 56px)' }}
      >
        <span className="loader-6 loader-6--mobile" aria-hidden="true" />
        <div className="max-w-[300px]">
          <div className="mb-1 text-base font-semibold text-[var(--text-primary)]">
            Waking up the server
            <span className="loader-status-dots" aria-hidden="true">
              <span className="loader-status-dot" />
              <span className="loader-status-dot" />
              <span className="loader-status-dot" />
            </span>
          </div>
          <div className="text-sm text-[var(--text-tertiary)]">This can take around 2 minutes.</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {isReconnecting ? (
              <>
                Reconnecting to server
                <span className="loader-status-dots" aria-hidden="true">
                  <span className="loader-status-dot" />
                  <span className="loader-status-dot" />
                  <span className="loader-status-dot" />
                </span>
              </>
            ) : (
              statusText
            )}
          </div>
        </div>
      </div>

      <div className="mb-5 hidden items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-info)_25%,var(--border-light))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-info)_14%,var(--bg-card)),color-mix(in_srgb,var(--accent-primary)_10%,var(--bg-card)))] px-5 py-3 sm:flex">
        <span className="loader-6" aria-hidden="true" />
        <div className="flex-1">
          <div className="mb-0.5 text-sm font-semibold text-[var(--text-primary)]">
            Waking up the server
            <span className="loader-status-dots" aria-hidden="true">
              <span className="loader-status-dot" />
              <span className="loader-status-dot" />
              <span className="loader-status-dot" />
            </span>
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            Servers sleep after inactivity. This can take around 2 minutes.
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
            {isReconnecting ? (
              <>
                Reconnecting to server
                <span className="loader-status-dots" aria-hidden="true">
                  <span className="loader-status-dot" />
                  <span className="loader-status-dot" />
                  <span className="loader-status-dot" />
                </span>
              </>
            ) : (
              statusText
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Stat Card Skeleton (dashboard KPI cards) ─── */
export const StatCardSkeleton = ({ count = 4 }) => (
  <div className={`${containerClass} grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] max-md:grid-cols-2 max-sm:grid-cols-1`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={statClass}>
        <Bone width={40} height={40} variant="rounded" />
        <Bone width="55%" height={26} />
        <Bone width="75%" height={13} />
      </div>
    ))}
  </div>
)

/* ─── Card Grid Skeleton (societies, vendors, wings, etc.) ─── */
export const CardGridSkeleton = ({ count = 6, showAvatar = true, showBadge = true }) => (
  <div className={`${containerClass} grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] max-md:grid-cols-1`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${cardClass} min-h-[200px]`}>
        <div className="flex items-center gap-3">
          {showAvatar && <Bone width={48} height={48} variant="circle" />}
          <div className="flex flex-1 flex-col gap-2">
            <Bone height={17} style={{ width: '65%' }} />
            <Bone height={12} style={{ width: '45%' }} />
          </div>
          {showBadge && <Bone width={64} height={22} variant="pill" />}
        </div>
        <Bone height={12} style={{ width: '90%' }} />
        <Bone height={12} style={{ width: '70%' }} />
        <div className="mt-1.5 flex items-center gap-3">
          <Bone width={80} height={12} />
          <Bone width={80} height={12} />
        </div>
      </div>
    ))}
  </div>
)

/* ─── Table Skeleton ─── */
const TABLE_HEADER_WIDTHS = ['75%', '65%', '80%', '60%', '70%', '85%', '68%', '72%']
const TABLE_CELL_WIDTHS = ['60%', '80%', '55%', '75%', '65%', '70%', '85%', '58%', '72%', '68%']

export const TableSkeleton = ({ rows = 8, cols = 5 }) => (
  <div className={`${containerClass} flex flex-col overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)]`}>
    <div className="grid gap-4 border-b border-[var(--border-light)] bg-[var(--bg-elevated)] px-5 py-3.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Bone key={i} height={14} style={{ width: TABLE_HEADER_WIDTHS[i % TABLE_HEADER_WIDTHS.length] }} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="grid items-center gap-4 border-b border-[var(--border-light)] px-5 py-3.5 last:border-b-0" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, c) => (
          <Bone key={c} height={14} style={{ width: TABLE_CELL_WIDTHS[(r * cols + c) % TABLE_CELL_WIDTHS.length] }} />
        ))}
      </div>
    ))}
  </div>
)

/* ─── Chart Skeleton ─── */
const CHART_BAR_HEIGHTS = ['45%', '72%', '58%', '85%', '38%', '65%', '78%', '52%', '90%', '42%']

export const ChartSkeleton = ({ bars = 8 }) => (
  <div className={`${containerClass} flex min-h-[260px] flex-col gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5`}>
    <div className="flex items-center gap-3">
      <Bone width="30%" height={18} />
      <div style={{ flex: 1 }} />
      <Bone width={80} height={28} variant="rounded" />
    </div>
    <div className="flex flex-1 items-end gap-2 pt-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`${boneBaseClass} min-w-4 flex-1 rounded-t-sm`}
          style={{ height: CHART_BAR_HEIGHTS[i % CHART_BAR_HEIGHTS.length] }}
        />
      ))}
    </div>
  </div>
)

/* ─── Hero / Page Header Skeleton ─── */
export const HeroSkeleton = ({ statCount = 3 }) => (
  <div className={`${containerClass} mb-6 flex flex-col gap-4 rounded-xl border border-[var(--border-light)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_15%,var(--bg-card)),color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-card)))] px-6 py-7`}>
    <div className="flex items-center gap-3">
      <Bone width={44} height={44} variant="rounded" />
      <div className="flex flex-1 flex-col gap-2">
        <Bone height={26} style={{ width: '35%' }} />
        <Bone height={14} style={{ width: '55%' }} />
      </div>
    </div>
    {statCount > 0 && (
      <div className="mt-2 flex flex-wrap gap-4">
        {Array.from({ length: statCount }).map((_, i) => (
          <Bone key={i} className="h-14 w-20 rounded-lg" />
        ))}
      </div>
    )}
  </div>
)

/* ─── Filter Bar Skeleton ─── */
export const FiltersSkeleton = ({ filterCount = 2, showSearch = true }) => (
  <div className={`${containerClass} mb-5 flex flex-wrap items-center gap-3`}>
    {showSearch && <Bone variant="search" />}
    {Array.from({ length: filterCount }).map((_, i) => (
      <Bone key={i} variant="btn" />
    ))}
    <div style={{ flex: 1 }} />
    <Bone width={130} height={40} variant="rounded" />
  </div>
)

/* ─── Tab Bar Skeleton ─── */
export const TabsSkeleton = ({ tabCount = 3 }) => (
  <div className={`${containerClass} mb-5 flex w-fit gap-1 rounded-lg bg-[var(--bg-elevated)] p-1`}>
    {Array.from({ length: tabCount }).map((_, i) => (
      <Bone key={i} variant="tab" />
    ))}
  </div>
)

/* ─── Summary Cards Row (like Payments, Complaints top cards) ─── */
export const SummaryRowSkeleton = ({ count = 4 }) => (
  <div className={`${containerClass} mb-5 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] max-md:grid-cols-2 max-sm:grid-cols-1`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={statClass}>
        <Bone width={36} height={36} variant="circle" />
        <Bone width="50%" height={24} />
        <Bone width="70%" height={12} />
      </div>
    ))}
  </div>
)

/* ─── List Skeleton (vertical card list like Tickets, Complaints) ─── */
export const ListSkeleton = ({ count = 5, showAvatar = true }) => (
  <div className={`${containerClass} flex flex-col gap-3`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${cardClass} min-h-20 flex-row items-center px-5 py-4`}>
        {showAvatar && <Bone width={42} height={42} variant="circle" style={{ flexShrink: 0 }} />}
        <div className="flex flex-1 flex-col gap-2" style={{ flex: 1 }}>
          <Bone height={16} style={{ width: '55%' }} />
          <Bone height={12} style={{ width: '80%' }} />
        </div>
        <Bone width={70} height={24} variant="pill" style={{ flexShrink: 0 }} />
      </div>
    ))}
  </div>
)

/* ─── Detail Page Skeleton (SocietyDetail) ─── */
export const DetailPageSkeleton = ({ infoCards = 3, listItems = 4 }) => (
  <div className={containerClass}>
    <HeroSkeleton statCount={3} />
    <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] max-md:grid-cols-1">
      {Array.from({ length: infoCards }).map((_, i) => (
        <div key={i} className={cardClass}>
          <Bone width={36} height={36} variant="circle" />
          <Bone height={16} style={{ width: '60%' }} />
          <Bone height={12} style={{ width: '80%' }} />
          <Bone height={12} style={{ width: '50%' }} />
        </div>
      ))}
    </div>
    <ListSkeleton count={listItems} />
  </div>
)

/* ─── Dashboard Skeleton (full dashboard layout) ─── */
export const DashboardSkeleton = () => (
  <div className={containerClass}>
    <HeroSkeleton statCount={0} />
    <StatCardSkeleton count={6} />
    <div style={{ height: 24 }} />
    <div className="grid gap-4 md:grid-cols-2">
      <ChartSkeleton bars={7} />
      <ChartSkeleton bars={6} />
    </div>
    <div style={{ height: 24 }} />
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] max-md:grid-cols-1">
      <ChartSkeleton bars={5} />
      <ChartSkeleton bars={8} />
      <ChartSkeleton bars={6} />
    </div>
  </div>
)

/* ─── Settings Skeleton ─── */
export const SettingsSkeleton = () => (
  <div className={containerClass}>
    <TabsSkeleton tabCount={5} />
    <div className={cardClass} style={{ maxWidth: 700 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="mb-2 flex flex-col" style={{ gap: 6 }}>
          <Bone height={13} style={{ width: '25%' }} />
          <Bone height={40} style={{ width: '100%', borderRadius: 'var(--radius-lg)' }} />
        </div>
      ))}
      <Bone width={140} height={40} variant="rounded" style={{ marginTop: 12 }} />
    </div>
  </div>
)

/* ─── Grouped Contacts Skeleton (EmergencyContacts) ─── */
export const GroupedListSkeleton = ({ groups = 3, itemsPerGroup = 3 }) => (
  <div className={containerClass}>
    {Array.from({ length: groups }).map((_, g) => (
      <div key={g} style={{ marginBottom: 24 }}>
        <Bone height={20} style={{ width: 120, marginBottom: 12 }} />
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {Array.from({ length: itemsPerGroup }).map((_, i) => (
            <div key={i} className={`${cardClass} min-h-[70px] flex-row items-center`}>
              <Bone width={40} height={40} variant="circle" style={{ flexShrink: 0 }} />
              <div className="flex flex-1 flex-col gap-2" style={{ flex: 1 }}>
                <Bone height={15} style={{ width: '60%' }} />
                <Bone height={12} style={{ width: '40%' }} />
              </div>
              <Bone width={36} height={36} variant="circle" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

/* ─── Documents Skeleton ─── */
export const DocumentsSkeleton = () => (
  <div className={containerClass}>
    <SummaryRowSkeleton count={4} />
    <FiltersSkeleton filterCount={1} />
    <CardGridSkeleton count={6} showAvatar={false} showBadge={false} />
  </div>
)

/* ─── Finance page skeleton (summary cards + table) ─── */
export const FinancePageSkeleton = ({ summaryCount = 4, rows = 8, cols = 5 }) => (
  <div className={containerClass}>
    {summaryCount > 0 && <SummaryRowSkeleton count={summaryCount} />}
    <FiltersSkeleton filterCount={2} />
    <TableSkeleton rows={rows} cols={cols} />
  </div>
)

/* ─── Reports Skeleton ─── */
export const ReportsSkeleton = () => (
  <div className={containerClass}>
    <FiltersSkeleton filterCount={3} />
    <StatCardSkeleton count={4} />
    <div style={{ height: 24 }} />
    <div className="grid gap-4 md:grid-cols-2">
      <ChartSkeleton bars={6} />
      <ChartSkeleton bars={8} />
    </div>
  </div>
)
