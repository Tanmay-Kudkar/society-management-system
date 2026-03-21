import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { authApi, societyApi } from '../../../../api'
import { InfoTooltip, NeonSweepButton, EmptyStateSection } from '../../components'
import { HeroSkeleton, FiltersSkeleton, TableSkeleton, SummaryRowSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import useBackendStatus from '../../hooks/useBackendStatus'
import { formatDateTime } from '../../utils/formatUtils'
import { Search, LogIn, LogOut, MapPin, MapPinOff, Shield, Globe, RefreshCw, Trash2 } from 'lucide-react'
import clsx from 'clsx'

// ── UA parsing helpers (adapted from deviceDetect.js for arbitrary strings) ──

function parseOS(ua) {
  if (!ua) return { name: 'Unknown', icon: 'unknown' }
  if (/Windows NT/.test(ua)) return { name: 'Windows', icon: 'windows' }
  if (/Mac OS X/.test(ua)) return { name: 'macOS', icon: 'macos' }
  if (/Android/.test(ua)) return { name: 'Android', icon: 'android' }
  if (/iPhone|iPad|iPod/.test(ua)) return { name: 'iOS', icon: 'macos' }
  if (/CrOS/.test(ua)) return { name: 'ChromeOS', icon: 'chromeos' }
  if (/Linux/.test(ua)) return { name: 'Linux', icon: 'linux' }
  return { name: 'Unknown', icon: 'unknown' }
}

function parseBrowser(ua) {
  if (!ua) return { name: 'Unknown', icon: 'unknown' }
  if (/Edg\//.test(ua)) return { name: 'Edge', icon: 'edge' }
  if (/OPR\/|Opera/.test(ua)) return { name: 'Opera', icon: 'opera' }
  if (/Brave/.test(ua)) return { name: 'Brave', icon: 'brave' }
  if (/Vivaldi/.test(ua)) return { name: 'Vivaldi', icon: 'vivaldi' }
  if (/Firefox\//.test(ua)) return { name: 'Firefox', icon: 'firefox' }
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return { name: 'Chrome', icon: 'chrome' }
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return { name: 'Safari', icon: 'safari' }
  return { name: 'Unknown', icon: 'unknown' }
}

const osIcons = import.meta.glob('../../assets/icons/os/*.svg', { eager: true, query: '?url', import: 'default' })
const browserIcons = import.meta.glob('../../assets/icons/browsers/*.svg', { eager: true, query: '?url', import: 'default' })

function getIconUrl(iconMap, folder, iconName) {
  const key = `../../assets/icons/${folder}/${iconName}.svg`
  return iconMap[key] || null
}

function getAuditReason(audit) {
  const apiReason =
    audit?.proximityReason ||
    audit?.locationReason ||
    audit?.nearbyReason ||
    audit?.reason ||
    null

  if (apiReason) return apiReason
  if (audit?.latitude == null || audit?.longitude == null) return 'Location not shared'
  if (audit?.distanceMeters == null) return 'Distance unavailable'
  if (audit?.proximityThresholdMeters == null) return 'Proximity threshold missing'
  return 'Proximity could not be determined'
}

const actionPill = {
  LOGIN: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800',
  LOGOUT: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800',
}

const proximityPill = {
  nearby: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700',
  notNearby: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700',
  unknown: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-[var(--text-secondary)]',
}

const summaryCardClass = 'p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]'

export default function LoginAudit() {
  const { user } = useAuth()
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'
  const [selectedSociety, setSelectedSociety] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterProximity, setFilterProximity] = useState('')
  const isWakingUp = useBackendStatus()
  const queryClient = useQueryClient()

  const { data: societies = [], isLoading: societiesLoading, isError: societiesError, isFetching: societiesFetching, refetch: refetchSocieties } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isMasterAdmin,
  })

  const { data: audits = [], isLoading: auditsLoading, isError: auditsError, isFetching: auditsFetching, refetch: refetchAudits } = useQuery({
    queryKey: ['login-audit', selectedSociety],
    queryFn: () => authApi.getLoginAuditBySociety(selectedSociety).then(res => res.data),
    enabled: isMasterAdmin && !!selectedSociety,
  })

  const [pendingDelete, setPendingDelete] = useState(null) // { audit, deletePair }

  const deleteMutation = useMutation({
    mutationFn: ({ id, deletePair }) => authApi.deleteLoginAudit(id, deletePair),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-audit', selectedSociety] })
      setPendingDelete(null)
    },
  })

  const filtered = useMemo(() => {
    return audits.filter(a => {
      const name = a.userName || ''
      const email = a.userEmail || ''
      const matchesSearch = !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAction = !filterAction || a.action === filterAction
      const matchesProximity = !filterProximity ||
        (filterProximity === 'NEARBY' && a.isNearby === true) ||
        (filterProximity === 'NOT_NEARBY' && a.isNearby === false)
      return matchesSearch && matchesAction && matchesProximity
    })
  }, [audits, searchTerm, filterAction, filterProximity])

  const stats = useMemo(() => ({
    total: audits.length,
    logins: audits.filter(a => a.action === 'LOGIN').length,
    logouts: audits.filter(a => a.action === 'LOGOUT').length,
    proximityChecked: audits.filter(a => a.distanceMeters != null).length,
  }), [audits])

  const showSkeleton = useMinLoadingTime(isMasterAdmin && societiesLoading)

  if (!isMasterAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[var(--text-tertiary)]">Access denied. Master Admin only.</p>
      </div>
    )
  }

  if (showSkeleton) {
    return (
      <div className="block">
        <WakeUpBanner show={isWakingUp} />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <FiltersSkeleton filterCount={3} />
        <TableSkeleton rows={8} cols={6} />
      </div>
    )
  }

  if (societiesError) {
    return (
      <div className="block">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] py-16 text-center">
          <Shield className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-[var(--text-secondary)] font-medium">Failed to load societies</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1 mb-4">The server may be starting up. Please try again.</p>
          <NeonSweepButton tone="cyan" size="md" onClick={() => refetchSocieties()} disabled={societiesFetching}>
            <RefreshCw size={16} className={societiesFetching ? 'animate-spin' : ''} />
            {societiesFetching ? 'Retrying...' : 'Retry'}
          </NeonSweepButton>
        </div>
      </div>
    )
  }

  return (
    <div className="block">
      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                <Trash2 size={16} className="text-red-500" />
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Delete Audit Record</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              You are deleting a <strong>{pendingDelete.action}</strong> record for{' '}
              <strong>{pendingDelete.userName || pendingDelete.userEmail}</strong>.
            </p>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Would you like to also delete its paired{' '}
              <strong>{pendingDelete.action === 'LOGIN' ? 'LOGOUT' : 'LOGIN'}</strong> record?
            </p>
            <div className="flex flex-col gap-2">
              <NeonSweepButton
                tone="slate"
                size="md"
                onClick={() => deleteMutation.mutate({ id: pendingDelete.id, deletePair: false })}
                disabled={deleteMutation.isPending}
                className="w-full justify-center"
              >
                Delete only this {pendingDelete.action} record
              </NeonSweepButton>
              <NeonSweepButton
                tone="danger"
                size="md"
                onClick={() => deleteMutation.mutate({ id: pendingDelete.id, deletePair: true })}
                disabled={deleteMutation.isPending}
                className="w-full justify-center"
              >
                {deleteMutation.isPending
                  ? 'Deleting…'
                  : `Delete this ${pendingDelete.action} + paired ${pendingDelete.action === 'LOGIN' ? 'LOGOUT' : 'LOGIN'}`}
              </NeonSweepButton>
              <NeonSweepButton
                tone="cyan"
                size="md"
                onClick={() => setPendingDelete(null)}
                disabled={deleteMutation.isPending}
                className="w-full justify-center"
              >
                Cancel
              </NeonSweepButton>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Login Audit</h1>
            <InfoTooltip text="Track login & logout sessions of Society Admins with proximity monitoring" />
          </div>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Monitor Society Admin login activity and location proximity
          </p>
        </div>
      </div>

      {/* Society Selector */}
      <div className="mb-6">
        <select
          value={selectedSociety}
          onChange={(e) => setSelectedSociety(e.target.value)}
          className="w-full max-w-md py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
        >
          <option value="">Select a Society</option>
          {societies.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {!selectedSociety ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] py-16 text-center">
          <Shield className="w-12 h-12 text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-secondary)] font-medium">Select a society to view login audit records</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Login and logout sessions of Society Admins will appear here</p>
        </div>
      ) : auditsLoading ? (
        <div>
          <SummaryRowSkeleton count={4} />
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : auditsError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] py-16 text-center">
          <Shield className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-[var(--text-secondary)] font-medium">Failed to load audit records</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1 mb-4">Please try again.</p>
          <NeonSweepButton tone="cyan" size="md" onClick={() => refetchAudits()} disabled={auditsFetching}>
            <RefreshCw size={16} className={auditsFetching ? 'animate-spin' : ''} />
            {auditsFetching ? 'Retrying...' : 'Retry'}
          </NeonSweepButton>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
            <div className={summaryCardClass}>
              <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Sessions</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
            </div>
            <div className={summaryCardClass}>
              <p className="text-[0.85rem] text-[var(--text-tertiary)]">Logins</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{stats.logins}</p>
            </div>
            <div className={summaryCardClass}>
              <p className="text-[0.85rem] text-[var(--text-tertiary)]">Logouts</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">{stats.logouts}</p>
            </div>
            <div className={summaryCardClass}>
              <p className="text-[0.85rem] text-[var(--text-tertiary)]">Proximity Checked</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{stats.proximityChecked}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search by admin name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-[0.55rem] px-3 pl-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                />
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
              <select
                value={filterProximity}
                onChange={(e) => setFilterProximity(e.target.value)}
                className="py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
              >
                <option value="">All Proximity</option>
                <option value="NEARBY">Nearby</option>
                <option value="NOT_NEARBY">Not Nearby</option>
              </select>
            </div>
          </div>

          {/* Audit Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] py-16 text-center">
              <EmptyStateSection
                title={audits.length === 0 ? 'No audit records found' : 'No records match your filters'}
                description={audits.length === 0 ? 'Audit activity will appear here after logins begin.' : 'Try clearing one or more filters to see matching records.'}
                icon={Shield}
                className="w-full max-w-xl border-0"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[1080px] table-auto">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] bg-[var(--bg-elevated)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Admin</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Proximity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((audit) => {
                      const os = parseOS(audit.userAgent)
                      const browser = parseBrowser(audit.userAgent)
                      const auditReason = getAuditReason(audit)
                      const osIconUrl = getIconUrl(osIcons, 'os', os.icon)
                      const browserIconUrl = getIconUrl(browserIcons, 'browsers', browser.icon)

                      return (
                        <tr key={audit.id} className="border-b border-[var(--border-light)] last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-sm text-[var(--text-primary)]">{audit.userName || '-'}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">{audit.userEmail || '-'}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={clsx(actionPill[audit.action] || actionPill.LOGIN)}>
                              {audit.action === 'LOGIN' ? <LogIn size={12} /> : <LogOut size={12} />}
                              {audit.action}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                            {formatDateTime(audit.timestamp)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                              <Globe size={13} className="text-[var(--text-tertiary)]" />
                              {audit.ipAddress || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="inline-flex items-center gap-1.5 shrink-0">
                                {osIconUrl && <img src={osIconUrl} alt={os.name} className="w-4 h-4 object-contain" />}
                                {browserIconUrl && <img src={browserIconUrl} alt={browser.name} className="w-4 h-4 object-contain" />}
                              </div>
                              <span className="text-sm leading-5 text-[var(--text-secondary)] min-w-0 whitespace-normal break-words">
                                {os.name} / {browser.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {audit.latitude != null && audit.longitude != null ? (
                              <a
                                href={`https://www.google.com/maps?q=${audit.latitude},${audit.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline whitespace-nowrap"
                                title={`${audit.latitude.toFixed(5)}, ${audit.longitude.toFixed(5)}`}
                              >
                                <MapPin size={12} />
                                {audit.latitude.toFixed(4)}, {audit.longitude.toFixed(4)}
                              </a>
                            ) : (
                              <span className="text-xs text-[var(--text-tertiary)]">{auditReason}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1.5">
                              {audit.isNearby === true && (
                                <span className={clsx(proximityPill.nearby, 'whitespace-nowrap')}>
                                  <MapPin size={12} />
                                  Nearby
                                  {audit.distanceMeters != null && (
                                    <span className="text-[0.65rem] font-normal ml-0.5">({Math.round(audit.distanceMeters)}m)</span>
                                  )}
                                </span>
                              )}
                              {audit.isNearby === false && (
                                <span className={clsx(proximityPill.notNearby, 'whitespace-nowrap')}>
                                  <MapPinOff size={12} />
                                  Not Nearby
                                  {audit.distanceMeters != null && (
                                    <span className="text-[0.65rem] font-normal ml-0.5">({Math.round(audit.distanceMeters)}m)</span>
                                  )}
                                </span>
                              )}
                              {audit.isNearby == null && (
                                <span className={proximityPill.unknown}>{auditReason}</span>
                              )}
                              {audit.proximityReason && audit.isNearby != null && (
                                <span
                                  className={clsx(
                                    'text-xs',
                                    audit.usedFallbackLocation
                                      ? 'inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                                      : 'text-[var(--text-tertiary)]',
                                  )}
                                >
                                  {auditReason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-right w-14">
                            <button
                              onClick={() => setPendingDelete(audit)}
                              disabled={deleteMutation.isPending && deleteMutation.variables?.id === audit.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title="Delete record"
                            >
                              <Trash2 size={17} className={deleteMutation.isPending && deleteMutation.variables?.id === audit.id ? 'animate-spin' : ''} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col md:hidden">
                {filtered.map((audit) => {
                  const os = parseOS(audit.userAgent)
                  const browser = parseBrowser(audit.userAgent)
                  const auditReason = getAuditReason(audit)
                  const osIconUrl = getIconUrl(osIcons, 'os', os.icon)
                  const browserIconUrl = getIconUrl(browserIcons, 'browsers', browser.icon)

                  return (
                    <div key={audit.id} className="border-b border-[var(--border-light)] last:border-b-0 p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-[var(--text-primary)]">{audit.userName || '-'}</div>
                          <div className="text-xs text-[var(--text-tertiary)]">{audit.userEmail || '-'}</div>
                        </div>
                        <span className={clsx(actionPill[audit.action] || actionPill.LOGIN)}>
                          {audit.action === 'LOGIN' ? <LogIn size={12} /> : <LogOut size={12} />}
                          {audit.action}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-tertiary)]">
                        <span>{formatDateTime(audit.timestamp)}</span>
                        {audit.ipAddress && (
                          <span className="inline-flex items-center gap-1">
                            <Globe size={11} />
                            {audit.ipAddress}
                          </span>
                        )}
                        {audit.latitude != null && audit.longitude != null && (
                          <a
                            href={`https://www.google.com/maps?q=${audit.latitude},${audit.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                          >
                            <MapPin size={11} />
                            {audit.latitude.toFixed(4)}, {audit.longitude.toFixed(4)}
                          </a>
                        )}
                        {audit.latitude == null || audit.longitude == null ? (
                          <span>{auditReason}</span>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="inline-flex items-center gap-1.5 shrink-0">
                            {osIconUrl && <img src={osIconUrl} alt={os.name} className="w-3.5 h-3.5 object-contain" />}
                            {browserIconUrl && <img src={browserIconUrl} alt={browser.name} className="w-3.5 h-3.5 object-contain" />}
                          </div>
                          <span className="text-xs leading-5 text-[var(--text-tertiary)] break-words">{os.name} / {browser.name}</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {audit.isNearby === true && (
                              <span className={clsx(proximityPill.nearby, 'whitespace-normal break-words')}>
                                <MapPin size={11} />
                                Nearby
                                {audit.distanceMeters != null && ` (${Math.round(audit.distanceMeters)}m)`}
                              </span>
                            )}
                            {audit.isNearby === false && (
                              <span className={clsx(proximityPill.notNearby, 'whitespace-normal break-words')}>
                                <MapPinOff size={11} />
                                Not Nearby
                                {audit.distanceMeters != null && ` (${Math.round(audit.distanceMeters)}m)`}
                              </span>
                            )}
                            {audit.isNearby == null && (
                              <span className={clsx(proximityPill.unknown, 'whitespace-normal break-words')}>{auditReason}</span>
                            )}
                            {audit.proximityReason && audit.isNearby != null && (
                              <div
                                className={clsx(
                                  'mt-1 text-xs break-words',
                                  audit.usedFallbackLocation
                                    ? 'inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                                    : 'text-[var(--text-tertiary)]',
                                )}
                              >
                                {auditReason}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setPendingDelete(audit)}
                            disabled={deleteMutation.isPending && deleteMutation.variables?.id === audit.id}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete record"
                          >
                            <Trash2 size={15} className={deleteMutation.isPending && deleteMutation.variables?.id === audit.id ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Record count */}
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Showing {filtered.length} of {audits.length} records
          </p>
        </>
      )}
    </div>
  )
}
