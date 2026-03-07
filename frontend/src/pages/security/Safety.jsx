import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { safetyApi } from '../../../../api'
import { Plus, Search, X, AlertTriangle, Shield, ShieldCheck, LogIn, LogOut, Siren, Bell, ArrowUpCircle, Clock, MapPin, TrendingUp, Building2, CreditCard, Package, UserCheck, Image } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const alertIcons = {
  ACTIVE: Siren,
  ACKNOWLEDGED: Bell,
  RESOLVED: ShieldCheck,
  FALSE_ALARM: X,
}

const alertStatusBadgeClasses = {
  ACTIVE: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  ACKNOWLEDGED: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  RESOLVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  FALSE_ALARM: 'bg-slate-500/10 text-[var(--text-tertiary)]',
}

const alertIconWrapClasses = {
  ACTIVE: 'bg-rose-500/10',
  ACKNOWLEDGED: 'bg-amber-500/10',
  RESOLVED: 'bg-emerald-500/10',
  FALSE_ALARM: 'bg-slate-500/10',
}

const alertIconClasses = {
  ACTIVE: 'text-rose-600 dark:text-rose-300',
  ACKNOWLEDGED: 'text-amber-600 dark:text-amber-300',
  RESOLVED: 'text-emerald-600 dark:text-emerald-300',
  FALSE_ALARM: 'text-[var(--text-tertiary)]',
}

const gateStatusBadgeClasses = {
  IN: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  OUT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
}

const gateIconWrapClasses = {
  IN: 'bg-blue-500/10',
  OUT: 'bg-emerald-500/10',
}

const gateIconClasses = {
  IN: 'text-blue-600 dark:text-blue-300',
  OUT: 'text-emerald-600 dark:text-emerald-300',
}

const priorityBadgeClasses = {
  CRITICAL: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  HIGH: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  MEDIUM: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  LOW: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
}

export default function Safety() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('sos') // 'sos' or 'gatelog'
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [showGateLogModal, setShowGateLogModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterEntryType, setFilterEntryType] = useState('')

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) {
    return <PermissionDenied message="You don't have permission to access safety management" />
  }

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isAdmin = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'].includes(user?.role)
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  // SOS Alerts
  const { data: alerts = [], isLoading: alertsLoading, isError: alertsError } = useQuery({
    queryKey: ['sos-alerts', user?.id, effectiveSocietyId],
    queryFn: () => safetyApi.getAlertsBySociety(effectiveSocietyId, user.id).then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'sos',
  })

  // Gate Logs
  const { data: gateLogs = [], isLoading: gateLogsLoading, isError: gateLogsError } = useQuery({
    queryKey: ['gate-logs', effectiveSocietyId],
    queryFn: () => safetyApi.getGateLogsBySociety(effectiveSocietyId, user.id).then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'gatelog',
  })

  const createAlertMutation = useMutation({
    mutationFn: (data) => safetyApi.createAlert(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['sos-alerts']); setShowSOSModal(false) },
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (id) => safetyApi.acknowledgeAlert(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const resolveMutation = useMutation({
    mutationFn: (id) => {
      const notes = prompt('Enter resolution notes:')
      if (!notes) return Promise.reject('Cancelled')
      return safetyApi.resolveAlert(id, user.id, notes)
    },
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const falseAlarmMutation = useMutation({
    mutationFn: (id) => safetyApi.markFalseAlarm(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const escalateMutation = useMutation({
    mutationFn: (id) => safetyApi.escalateAlert(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['sos-alerts']),
  })

  const handleQuickSOS = (alertType) => {
    if (!confirm(`Raise ${alertType} SOS alert immediately?`)) return
    createAlertMutation.mutate({
      alertType,
      description: `Quick ${alertType} SOS alert raised`,
      priority: 'CRITICAL',
      societyId: user.societyId,
    })
  }

  const formatResponseTime = (seconds) => {
    if (!seconds && seconds !== 0) return null
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const createGateLogMutation = useMutation({
    mutationFn: (data) => safetyApi.createGateLog(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['gate-logs']); setShowGateLogModal(false) },
  })

  const markExitMutation = useMutation({
    mutationFn: (id) => safetyApi.markExit(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['gate-logs']),
  })

  const filteredAlerts = useMemo(() => alerts.filter(a => {
    const matchesSearch = a.alertType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.raisedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || a.status === filterStatus
    const matchesPriority = !filterPriority || a.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  }), [alerts, searchTerm, filterStatus, filterPriority])

  const filteredGateLogs = useMemo(() => gateLogs.filter(g => {
    const matchesSearch = g.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.personPhone?.includes(searchTerm) ||
                         g.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.itemsCarried?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || g.status === filterStatus
    const matchesEntryType = !filterEntryType || g.entryType === filterEntryType
    return matchesSearch && matchesStatus && matchesEntryType
  }), [gateLogs, searchTerm, filterStatus, filterEntryType])

  const handleSOSSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createAlertMutation.mutate({
      alertType: formData.get('alertType'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      location: formData.get('location'),
      societyId: user.societyId,
    })
  }

  const handleGateLogSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createGateLogMutation.mutate({
      entryType: formData.get('entryType'),
      personName: formData.get('personName'),
      personPhone: formData.get('personPhone'),
      vehicleNumber: formData.get('vehicleNumber'),
      entryGate: formData.get('entryGate'),
      purpose: formData.get('purpose'),
      notes: formData.get('notes'),
      imageUrl: formData.get('imageUrl') || null,
      idType: formData.get('idType') || null,
      idNumber: formData.get('idNumber') || null,
      companyName: formData.get('companyName') || null,
      itemsCarried: formData.get('itemsCarried') || null,
      societyId: user.societyId,
    })
  }

  const isLoading = activeTab === 'sos' ? alertsLoading : gateLogsLoading
  const isError = activeTab === 'sos' ? alertsError : gateLogsError
  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (<div><WakeUpBanner /><HeroSkeleton /><SummaryRowSkeleton count={4} /><FiltersSkeleton filterCount={1} /><ListSkeleton count={4} /></div>)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Safety & Security</h1>
          <p className="mt-1 text-[var(--text-tertiary)]">SOS alerts and gate entry/exit tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'sos' && (
            <>
              <button onClick={() => handleQuickSOS('FIRE')} className="inline-flex min-w-10 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-2 text-lg text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300" title="Quick Fire SOS">🔥</button>
              <button onClick={() => handleQuickSOS('MEDICAL')} className="inline-flex min-w-10 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-2 text-lg text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300" title="Quick Medical SOS">🏥</button>
              <button onClick={() => handleQuickSOS('SECURITY')} className="inline-flex min-w-10 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-2 text-lg text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300" title="Quick Security SOS">🚨</button>
              <button onClick={() => setShowSOSModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300">
                <Siren size={20} /> Raise SOS Alert
              </button>
            </>
          )}
          {activeTab === 'gatelog' && isStaff && (
            <button onClick={() => setShowGateLogModal(true)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900">
              <Plus size={20} /> Log Entry
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex w-fit gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1">
        <button
          className={clsx('rounded-md px-4 py-2 text-sm font-medium text-[var(--text-tertiary)] transition', activeTab === 'sos' && 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm')}
          onClick={() => { setActiveTab('sos'); setFilterStatus(''); setFilterPriority(''); setSearchTerm('') }}
        >
          SOS Alerts
          {alerts.filter(a => a.status === 'ACTIVE').length > 0 && <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">{alerts.filter(a => a.status === 'ACTIVE').length}</span>}
        </button>
        <button
          className={clsx('rounded-md px-4 py-2 text-sm font-medium text-[var(--text-tertiary)] transition', activeTab === 'gatelog' && 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm')}
          onClick={() => { setActiveTab('gatelog'); setFilterStatus(''); setFilterPriority(''); setFilterEntryType(''); setSearchTerm('') }}
        >
          Gate Log
          {gateLogs.filter(g => g.status === 'IN').length > 0 && <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white">{gateLogs.filter(g => g.status === 'IN').length}</span>}
        </button>
      </div>

      {/* SOS ALERTS TAB */}
      {activeTab === 'sos' && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Active</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-300">{alerts.filter(a => a.status === 'ACTIVE').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Acknowledged</p>
              <p className="mt-1 text-2xl font-bold text-amber-500 dark:text-amber-300">{alerts.filter(a => a.status === 'ACKNOWLEDGED').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Resolved</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">{alerts.filter(a => a.status === 'RESOLVED').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Critical</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-300">{alerts.filter(a => a.priority === 'CRITICAL' && a.status !== 'RESOLVED' && a.status !== 'FALSE_ALARM').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Escalated</p>
              <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-300">{alerts.filter(a => a.escalationLevel > 0).length}</p>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input type="text" placeholder="Search alerts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]">
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
                <option value="FALSE_ALARM">False Alarm</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]">
                <option value="">All Priority</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredAlerts.length === 0 && (
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 text-center text-[var(--text-tertiary)]">No SOS alerts found</div>
            )}
            {filteredAlerts.map((alert) => {
              const AlertIcon = alertIcons[alert.status] || AlertTriangle
              return (
                <div key={alert.id} className={clsx('rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 transition hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]', alert.priority === 'CRITICAL' && 'border-l-4 border-l-rose-600', alert.escalationLevel > 0 && 'border-l-4 border-l-violet-600', alert.priority === 'CRITICAL' && alert.escalationLevel > 0 && 'border-l-4 border-l-rose-600')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                      <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', alertIconWrapClasses[alert.status] || 'bg-slate-500/10', alert.priority === 'CRITICAL' && alert.status === 'ACTIVE' && 'animate-pulse')}>
                        <AlertIcon className={clsx('h-5 w-5', alertIconClasses[alert.status] || 'text-[var(--text-tertiary)]')} />
                      </div>
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase', alertStatusBadgeClasses[alert.status] || 'bg-slate-500/10 text-[var(--text-tertiary)]')}>{alert.status?.replace('_', ' ')}</span>
                          <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase', priorityBadgeClasses[alert.priority] || 'bg-slate-500/10 text-[var(--text-tertiary)]')}>{alert.priority}</span>
                          <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-300">{alert.alertType}</span>
                          {alert.escalationLevel > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-300"><TrendingUp size={12} /> L{alert.escalationLevel}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)]">{alert.alertType} Alert</h3>
                        {alert.description && <p className="mt-1 text-sm text-[var(--text-tertiary)]">{alert.description}</p>}
                        {alert.location && (
                          <p className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)]"><MapPin size={13} /> {alert.location}</p>
                        )}
                        {alert.resolutionNotes && (
                          <div className="mt-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                            <p className="text-sm text-[var(--text-secondary)]"><span className="font-semibold text-emerald-600 dark:text-emerald-300">Resolution:</span> {alert.resolutionNotes}</p>
                          </div>
                        )}
                        {/* Timeline */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] before:mr-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-500 before:content-['']">Created {alert.createdAt && new Date(alert.createdAt).toLocaleString()}</span>
                          {alert.acknowledgedAt && <span className="inline-flex items-center rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] before:mr-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-500 before:content-['']">Acknowledged {new Date(alert.acknowledgedAt).toLocaleString()}{alert.acknowledgedByName ? ` by ${alert.acknowledgedByName}` : ''}</span>}
                          {alert.resolvedAt && <span className="inline-flex items-center rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] before:mr-1.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-emerald-500 before:content-['']">{alert.status === 'FALSE_ALARM' ? 'Marked False Alarm' : 'Resolved'} {new Date(alert.resolvedAt).toLocaleString()}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4">
                          <span className="text-xs text-[var(--text-tertiary)]">By: {alert.raisedByName}</span>
                          {alert.flatNumber && <span className="text-xs text-[var(--text-tertiary)]">Flat: {alert.flatNumber}</span>}
                          {alert.resolvedByName && <span className="text-xs text-[var(--text-tertiary)]">Resolved by: {alert.resolvedByName}</span>}
                          {alert.responseTimeSeconds != null && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-300"><Clock size={12} /> Response: {formatResponseTime(alert.responseTimeSeconds)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isStaff && alert.status !== 'RESOLVED' && alert.status !== 'FALSE_ALARM' && (
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        {alert.status === 'ACTIVE' && (
                          <button onClick={() => acknowledgeMutation.mutate(alert.id)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-300">Acknowledge</button>
                        )}
                        <button onClick={() => escalateMutation.mutate(alert.id)} className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-600 transition hover:bg-violet-500/20 dark:text-violet-300"><ArrowUpCircle size={14} /> Escalate</button>
                        <button onClick={() => resolveMutation.mutate(alert.id)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-300">Resolve</button>
                        {isAdmin && <button onClick={() => falseAlarmMutation.mutate(alert.id)} className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-3 py-1.5 text-sm text-[var(--text-tertiary)] transition hover:bg-slate-500/20">False Alarm</button>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* GATE LOG TAB */}
      {activeTab === 'gatelog' && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Currently In</p>
              <p className="mt-1 text-2xl font-bold text-amber-500 dark:text-amber-300">{gateLogs.filter(g => g.status === 'IN').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Exited</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">{gateLogs.filter(g => g.status === 'OUT').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Total Today</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{gateLogs.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Vehicles</p>
              <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-300">{gateLogs.filter(g => g.vehicleNumber).length}</p>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input type="text" placeholder="Search gate logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]">
                <option value="">All Status</option>
                <option value="IN">Currently In</option>
                <option value="OUT">Exited</option>
              </select>
              <select value={filterEntryType} onChange={(e) => setFilterEntryType(e.target.value)} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]">
                <option value="">All Types</option>
                <option value="RESIDENT">Resident</option>
                <option value="VISITOR">Visitor</option>
                <option value="STAFF">Staff</option>
                <option value="DELIVERY">Delivery</option>
                <option value="CAB">Cab</option>
                <option value="VEHICLE">Vehicle</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredGateLogs.length === 0 && (
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 text-center text-[var(--text-tertiary)]">No gate log entries found</div>
            )}
            {filteredGateLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 transition hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', gateIconWrapClasses[log.status] || 'bg-slate-500/10')}>
                      {log.status === 'IN' ? <LogIn className={clsx('h-5 w-5', gateIconClasses.IN)} /> : <LogOut className={clsx('h-5 w-5', gateIconClasses.OUT)} />}
                    </div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase', gateStatusBadgeClasses[log.status] || 'bg-slate-500/10 text-[var(--text-tertiary)]')}>{log.status}</span>
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-300">{log.entryType}</span>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{log.personName}</h3>
                      {log.companyName && (
                        <p className="my-0.5 inline-flex items-center gap-1 text-sm font-medium text-[var(--text-secondary)]"><Building2 size={13} /> {log.companyName}</p>
                      )}
                      {log.purpose && <p className="mt-1 text-sm text-[var(--text-tertiary)]">{log.purpose}</p>}
                      {log.itemsCarried && (
                        <p className="my-0.5 inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]"><Package size={13} /> Items: {log.itemsCarried}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4">
                        {log.personPhone && <span className="text-xs text-[var(--text-tertiary)]">Phone: {log.personPhone}</span>}
                        {log.vehicleNumber && <span className="text-xs text-[var(--text-tertiary)]">Vehicle: {log.vehicleNumber}</span>}
                        {log.flatNumber && <span className="text-xs text-[var(--text-tertiary)]">Flat: {log.flatNumber}</span>}
                        {log.entryGate && <span className="text-xs text-[var(--text-tertiary)]">Gate: {log.entryGate}</span>}
                        {log.idType && log.idNumber && (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]"><CreditCard size={12} /> {log.idType}: {log.idNumber}</span>
                        )}
                        {log.approvedByName && (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]"><UserCheck size={12} /> Approved: {log.approvedByName}</span>
                        )}
                        <span className="text-xs text-[var(--text-tertiary)]">In: {log.entryTime && new Date(log.entryTime).toLocaleTimeString()}</span>
                        {log.exitTime && <span className="text-xs text-[var(--text-tertiary)]">Out: {new Date(log.exitTime).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  </div>
                  {isStaff && log.status === 'IN' && (
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <button onClick={() => markExitMutation.mutate(log.id)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-300">Mark Exit</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SOS Alert Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-[var(--bg-card)] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Raise SOS Alert</h3>
              <button onClick={() => setShowSOSModal(false)} className="rounded-md p-1 text-[var(--text-tertiary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSOSSubmit} className="flex flex-col gap-4">
              <SmartSelect label="Alert Type" name="alertType" required options={[
                { value: 'FIRE', label: 'Fire' }, { value: 'MEDICAL', label: 'Medical Emergency' },
                { value: 'SECURITY', label: 'Security Threat' }, { value: 'THEFT', label: 'Theft' },
                { value: 'FLOOD', label: 'Flood/Water' }, { value: 'GAS_LEAK', label: 'Gas Leak' },
                { value: 'OTHER', label: 'Other' },
              ]} placeholder="Select Alert Type" />
              <SmartSelect label="Priority" name="priority" options={[
                { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' }, { value: 'CRITICAL', label: 'Critical' },
              ]} placeholder="Select Priority" />
              <FormInput label="Location" name="location" placeholder="e.g. Block A, 3rd Floor, Near Lift" />
              <FormTextarea label="Description" name="description" rows={4} required />
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSOSModal(false)} className="rounded-lg border border-[var(--border-default)] bg-transparent px-4 py-2 text-[var(--text-secondary)]">Cancel</button>
                <AsyncButton type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white" isLoading={createAlertMutation.isPending} loadingText="Raising...">Raise Alert</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gate Log Modal */}
      {showGateLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-[var(--bg-card)] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Log Gate Entry</h3>
              <button onClick={() => setShowGateLogModal(false)} className="rounded-md p-1 text-[var(--text-tertiary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleGateLogSubmit} className="flex flex-col gap-4">
              <FormInput label="Person Name" name="personName" required />
              <FormInput label="Phone Number" name="personPhone" />
              <SmartSelect label="Entry Type" name="entryType" required options={[
                { value: 'RESIDENT', label: 'Resident' }, { value: 'VISITOR', label: 'Visitor' },
                { value: 'STAFF', label: 'Staff' }, { value: 'DELIVERY', label: 'Delivery' },
                { value: 'CAB', label: 'Cab' }, { value: 'VEHICLE', label: 'Vehicle' },
              ]} placeholder="Select Type" />
              <FormInput label="Vehicle Number" name="vehicleNumber" />
              <FormInput label="Gate" name="entryGate" />
              <FormInput label="Company Name" name="companyName" placeholder="e.g. Amazon, Swiggy" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SmartSelect label="ID Type" name="idType" options={[
                  { value: 'AADHAAR', label: 'Aadhaar' }, { value: 'PAN', label: 'PAN Card' },
                  { value: 'DRIVING_LICENSE', label: 'Driving License' }, { value: 'PASSPORT', label: 'Passport' },
                  { value: 'VOTER_ID', label: 'Voter ID' }, { value: 'EMPLOYEE_ID', label: 'Employee ID' },
                ]} placeholder="Select ID Type" />
                <FormInput label="ID Number" name="idNumber" placeholder="Enter ID Number" />
              </div>
              <FormInput label="Items Carried" name="itemsCarried" placeholder="e.g. 2 parcels, toolbox" />
              <FormInput label="Image URL" name="imageUrl" placeholder="Photo URL (optional)" />
              <FormInput label="Purpose" name="purpose" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowGateLogModal(false)} className="rounded-lg border border-[var(--border-default)] bg-transparent px-4 py-2 text-[var(--text-secondary)]">Cancel</button>
                <AsyncButton type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white" isLoading={createGateLogMutation.isPending} loadingText="Logging...">Log Entry</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
