/**
 * SkeletonLoaders.jsx
 * Reusable skeleton/shimmer loading components (YouTube / social-media style)
 * Works across light & dark themes via CSS custom properties.
 *
 * Usage:
 *   import { CardGridSkeleton } from '../components/SkeletonLoaders'
 *   if (isLoading) return <CardGridSkeleton count={6} />
 */

/* ─── Bone: the single shimmer primitive ─── */
export const Bone = ({ width, height, style, className = '', variant = '' }) => (
  <div
    className={`skeleton-bone ${variant ? `skeleton-bone--${variant}` : ''} ${className}`}
    style={{ width, height, ...style }}
  />
)

/* ─── Wake-up Banner (shown when backend is cold-starting) ─── */
export const WakeUpBanner = ({ show = true }) => {
  if (!show) return null
  return (
    <div className="skeleton-wakeup-banner">
      <span className="skeleton-wakeup-banner__icon">☕</span>
      <div className="skeleton-wakeup-banner__text">
        <div className="skeleton-wakeup-banner__title">Waking up the server…</div>
        <div className="skeleton-wakeup-banner__subtitle">
          servers sleep after inactivity. This takes 30–50 seconds.
        </div>
      </div>
      <div className="skeleton-wakeup-banner__dots">
        <div className="skeleton-wakeup-banner__dot" />
        <div className="skeleton-wakeup-banner__dot" />
        <div className="skeleton-wakeup-banner__dot" />
      </div>
    </div>
  )
}

/* ─── Stat Card Skeleton (dashboard KPI cards) ─── */
export const StatCardSkeleton = ({ count = 4 }) => (
  <div className="skeleton-container skeleton-grid skeleton-grid--4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-stat">
        <Bone width={40} height={40} variant="rounded" />
        <Bone width="55%" height={26} />
        <Bone width="75%" height={13} />
      </div>
    ))}
  </div>
)

/* ─── Card Grid Skeleton (societies, vendors, wings, etc.) ─── */
export const CardGridSkeleton = ({ count = 6, showAvatar = true, showBadge = true }) => (
  <div className="skeleton-container skeleton-card-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-row">
          {showAvatar && <Bone width={48} height={48} variant="circle" />}
          <div className="skeleton-col">
            <Bone height={17} style={{ width: '65%' }} />
            <Bone height={12} style={{ width: '45%' }} />
          </div>
          {showBadge && <Bone width={64} height={22} variant="pill" />}
        </div>
        <Bone height={12} style={{ width: '90%' }} />
        <Bone height={12} style={{ width: '70%' }} />
        <div className="skeleton-row" style={{ marginTop: 6 }}>
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
  <div className="skeleton-container skeleton-table">
    <div className="skeleton-table__header" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Bone key={i} height={14} style={{ width: TABLE_HEADER_WIDTHS[i % TABLE_HEADER_WIDTHS.length] }} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="skeleton-table__row" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
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
  <div className="skeleton-container skeleton-chart">
    <div className="skeleton-row">
      <Bone width="30%" height={18} />
      <div style={{ flex: 1 }} />
      <Bone width={80} height={28} variant="rounded" />
    </div>
    <div className="skeleton-chart__bars">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="skeleton-bone skeleton-chart__bar"
          style={{ height: CHART_BAR_HEIGHTS[i % CHART_BAR_HEIGHTS.length] }}
        />
      ))}
    </div>
  </div>
)

/* ─── Hero / Page Header Skeleton ─── */
export const HeroSkeleton = ({ statCount = 3 }) => (
  <div className="skeleton-container skeleton-hero">
    <div className="skeleton-row">
      <Bone width={44} height={44} variant="rounded" />
      <div className="skeleton-col">
        <Bone height={26} style={{ width: '35%' }} />
        <Bone height={14} style={{ width: '55%' }} />
      </div>
    </div>
    {statCount > 0 && (
      <div className="skeleton-hero__stats">
        {Array.from({ length: statCount }).map((_, i) => (
          <Bone key={i} className="skeleton-hero__stat-box" />
        ))}
      </div>
    )}
  </div>
)

/* ─── Filter Bar Skeleton ─── */
export const FiltersSkeleton = ({ filterCount = 2, showSearch = true }) => (
  <div className="skeleton-container skeleton-filters">
    {showSearch && <Bone className="skeleton-bone--search" />}
    {Array.from({ length: filterCount }).map((_, i) => (
      <Bone key={i} className="skeleton-bone--btn" />
    ))}
    <div style={{ flex: 1 }} />
    <Bone width={130} height={40} variant="rounded" />
  </div>
)

/* ─── Tab Bar Skeleton ─── */
export const TabsSkeleton = ({ tabCount = 3 }) => (
  <div className="skeleton-container skeleton-tabs">
    {Array.from({ length: tabCount }).map((_, i) => (
      <Bone key={i} className="skeleton-bone--tab" />
    ))}
  </div>
)

/* ─── Summary Cards Row (like Payments, Complaints top cards) ─── */
export const SummaryRowSkeleton = ({ count = 4 }) => (
  <div className="skeleton-container skeleton-summary-row">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-stat">
        <Bone width={36} height={36} variant="circle" />
        <Bone width="50%" height={24} />
        <Bone width="70%" height={12} />
      </div>
    ))}
  </div>
)

/* ─── List Skeleton (vertical card list like Tickets, Complaints) ─── */
export const ListSkeleton = ({ count = 5, showAvatar = true }) => (
  <div className="skeleton-container skeleton-list">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showAvatar && <Bone width={42} height={42} variant="circle" style={{ flexShrink: 0 }} />}
        <div className="skeleton-col" style={{ flex: 1 }}>
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
  <div className="skeleton-container">
    <HeroSkeleton statCount={3} />
    <div className="skeleton-grid skeleton-grid--3" style={{ marginBottom: 24 }}>
      {Array.from({ length: infoCards }).map((_, i) => (
        <div key={i} className="skeleton-card">
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
  <div className="skeleton-container">
    <HeroSkeleton statCount={0} />
    <StatCardSkeleton count={6} />
    <div style={{ height: 24 }} />
    <div className="skeleton-grid skeleton-grid--2">
      <ChartSkeleton bars={7} />
      <ChartSkeleton bars={6} />
    </div>
    <div style={{ height: 24 }} />
    <div className="skeleton-grid skeleton-grid--3">
      <ChartSkeleton bars={5} />
      <ChartSkeleton bars={8} />
      <ChartSkeleton bars={6} />
    </div>
  </div>
)

/* ─── Settings Skeleton ─── */
export const SettingsSkeleton = () => (
  <div className="skeleton-container">
    <TabsSkeleton tabCount={5} />
    <div className="skeleton-card" style={{ maxWidth: 700 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-col" style={{ gap: 6, marginBottom: 8 }}>
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
  <div className="skeleton-container">
    {Array.from({ length: groups }).map((_, g) => (
      <div key={g} style={{ marginBottom: 24 }}>
        <Bone height={20} style={{ width: 120, marginBottom: 12 }} />
        <div className="skeleton-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {Array.from({ length: itemsPerGroup }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ flexDirection: 'row', alignItems: 'center', minHeight: 70 }}>
              <Bone width={40} height={40} variant="circle" style={{ flexShrink: 0 }} />
              <div className="skeleton-col" style={{ flex: 1 }}>
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
  <div className="skeleton-container">
    <SummaryRowSkeleton count={4} />
    <FiltersSkeleton filterCount={1} />
    <CardGridSkeleton count={6} showAvatar={false} showBadge={false} />
  </div>
)

/* ─── Finance page skeleton (summary cards + table) ─── */
export const FinancePageSkeleton = ({ summaryCount = 4, rows = 8, cols = 5 }) => (
  <div className="skeleton-container">
    {summaryCount > 0 && <SummaryRowSkeleton count={summaryCount} />}
    <FiltersSkeleton filterCount={2} />
    <TableSkeleton rows={rows} cols={cols} />
  </div>
)

/* ─── Reports Skeleton ─── */
export const ReportsSkeleton = () => (
  <div className="skeleton-container">
    <FiltersSkeleton filterCount={3} />
    <StatCardSkeleton count={4} />
    <div style={{ height: 24 }} />
    <div className="skeleton-grid skeleton-grid--2">
      <ChartSkeleton bars={6} />
      <ChartSkeleton bars={8} />
    </div>
  </div>
)
