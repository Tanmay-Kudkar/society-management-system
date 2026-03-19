import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { visitorApi } from '../../../../api'
import { Plus, Search, X, UserX, Clock, LogIn, LogOut, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, InfoTooltip, NeonSweepButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDateTime, parseServerDateTime } from '../../utils/formatUtils'

const statusIcons = {
  EXPECTED: Clock,
  CHECKED_IN: LogIn,
  CHECKED_OUT: LogOut,
  REJECTED: UserX,
  CANCELLED: X,
}

const statusBadgeClasses = {
  EXPECTED: 'bg-blue-500/10 text-blue-600',
  CHECKED_IN: 'bg-amber-500/10 text-amber-600',
  CHECKED_OUT: 'bg-emerald-500/10 text-emerald-600',
  REJECTED: 'bg-red-500/10 text-red-600',
  CANCELLED: 'bg-slate-500/10 text-[var(--text-tertiary)]',
}

const iconWrapClasses = {
  EXPECTED: 'bg-blue-500/10',
  CHECKED_IN: 'bg-amber-500/10',
  CHECKED_OUT: 'bg-emerald-500/10',
  REJECTED: 'bg-red-500/10',
  CANCELLED: 'bg-slate-500/10',
}

const iconColorClasses = {
  EXPECTED: 'text-blue-600',
  CHECKED_IN: 'text-amber-600',
  CHECKED_OUT: 'text-emerald-600',
  REJECTED: 'text-red-600',
  CANCELLED: 'text-slate-500',
}

export default function Visitors() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [viewMode, setViewMode] = useState('all')
  const [overstayThreshold, setOverstayThreshold] = useState('4')

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) {
    return <PermissionDenied message="You don't have permission to access visitor management" />
  }

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isSecurityPersonnel = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const canCreateVisitorEntries = isSecurityPersonnel
  const canGenerateOtp = isSecurityPersonnel
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const queryFnByMode = () => {
    if (viewMode === 'today') {
      return visitorApi.getTodayArrivals(effectiveSocietyId, user.id).then(res => res.data)
    }
    if (viewMode === 'overstayed') {
      return visitorApi.getOverstayed(effectiveSocietyId, user.id, Number(overstayThreshold)).then(res => res.data)
    }
    return visitorApi.getBySociety(effectiveSocietyId, user.id).then(res => res.data)
  }

  const { data: visitors = [], isLoading, isError } = useQuery({
    queryKey: ['visitors', user?.id, effectiveSocietyId, viewMode, overstayThreshold],
    queryFn: queryFnByMode,
    enabled: !!user?.id && !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => visitorApi.create(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['visitors']); setShowModal(false) },
  })

  const checkInMutation = useMutation({
    mutationFn: (id) => visitorApi.checkIn(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const checkOutMutation = useMutation({
    mutationFn: (id) => visitorApi.checkOut(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => visitorApi.updateStatus(id, user.id, 'REJECTED'),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const generateOtpMutation = useMutation({
    mutationFn: (id) => visitorApi.generateOtp(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const verifyOtpMutation = useMutation({
    mutationFn: ({ id, otpCode }) => visitorApi.verifyOtp(id, user.id, otpCode),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const filteredVisitors = useMemo(() => visitors.filter(v => {
    const matchesSearch = v.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.visitorPhone?.includes(searchTerm) ||
                         v.approvalCode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || v.status === filterStatus
    const matchesType = !filterType || v.visitorType === filterType
    return matchesSearch && matchesStatus && matchesType
  }), [visitors, searchTerm, filterStatus, filterType])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createMutation.mutate({
      visitorName: formData.get('visitorName'),
      visitorPhone: formData.get('visitorPhone'),
      visitorType: formData.get('visitorType'),
      purpose: formData.get('purpose'),
      vehicleNumber: formData.get('vehicleNumber'),
      notes: formData.get('notes'),
      societyId: user.societyId,
      isPreApproved: formData.get('isPreApproved') === 'on',
    })
  }

  const requiresOtp = (visitorType) => ['DELIVERY', 'CAB'].includes(visitorType)

  const handleVerifyOtp = (visitor) => {
    const otpCode = prompt(`Enter OTP for ${visitor.visitorName}`)
    if (!otpCode) return
    verifyOtpMutation.mutate({ id: visitor.id, otpCode })
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <FiltersSkeleton filterCount={2} />
        <ListSkeleton count={4} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Visitor Management</h1>
            <InfoTooltip text="Track and manage visitors" />
          </div>
        </div>
        {canCreateVisitorEntries && (
          <NeonSweepButton
            tone="violet"
            size="md"
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus size={20} />
            Pre-approve Visitor
          </NeonSweepButton>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_88%,var(--bg-tertiary)_12%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <p className="text-xs text-[var(--text-tertiary)]">Expected</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{visitors.filter(v => v.status === 'EXPECTED').length}</p>
        </div>
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_88%,var(--bg-tertiary)_12%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <p className="text-xs text-[var(--text-tertiary)]">Checked In</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{visitors.filter(v => v.status === 'CHECKED_IN').length}</p>
        </div>
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_88%,var(--bg-tertiary)_12%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <p className="text-xs text-[var(--text-tertiary)]">Checked Out</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{visitors.filter(v => v.status === 'CHECKED_OUT').length}</p>
        </div>
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_88%,var(--bg-tertiary)_12%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <p className="text-xs text-[var(--text-tertiary)]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{visitors.length}</p>
        </div>
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_88%,var(--bg-tertiary)_12%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <p className="text-xs text-[var(--text-tertiary)]">Overstayed</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{visitors.filter(v => {
            const checkIn = parseServerDateTime(v.checkInTime)
            if (v.status !== 'CHECKED_IN' || !checkIn) return false
            return (Date.now() - checkIn.getTime()) >= (Number(overstayThreshold) * 60 * 60 * 1000)
          }).length}</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_88%,var(--bg-tertiary)_12%)] p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_22%,transparent)]"
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_22%,transparent)]">
            <option value="">All Status</option>
            <option value="EXPECTED">Expected</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_22%,transparent)]">
            <option value="">All Types</option>
            <option value="GUEST">Guest</option>
            <option value="DELIVERY">Delivery</option>
            <option value="CAB">Cab</option>
            <option value="SERVICE">Service</option>
            <option value="OTHER">Other</option>
          </select>

          <div className="inline-flex items-center gap-2" role="group" aria-label="Visitor quick views">
            <NeonSweepButton
              type="button"
              size="sm"
              tone={viewMode === 'all' ? 'cyan' : 'slate'}
              onClick={() => setViewMode('all')}
            >
              All
            </NeonSweepButton>
            <NeonSweepButton
              type="button"
              size="sm"
              tone={viewMode === 'today' ? 'cyan' : 'slate'}
              onClick={() => setViewMode('today')}
            >
              Today
            </NeonSweepButton>
            {isStaff && (
              <NeonSweepButton
                type="button"
                size="sm"
                tone={viewMode === 'overstayed' ? 'danger' : 'slate'}
                onClick={() => setViewMode('overstayed')}
              >
                <AlertTriangle size={14} /> Overstayed
              </NeonSweepButton>
            )}
          </div>

          {viewMode === 'overstayed' && isStaff && (
            <select
              value={overstayThreshold}
              onChange={(e) => setOverstayThreshold(e.target.value)}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent-primary)_22%,transparent)]"
            >
              <option value="2">2h threshold</option>
              <option value="4">4h threshold</option>
              <option value="6">6h threshold</option>
              <option value="8">8h threshold</option>
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filteredVisitors.length === 0 && (
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_90%,var(--bg-tertiary)_10%)] p-5 text-center text-[var(--text-tertiary)] shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            No visitors found
          </div>
        )}
        {filteredVisitors.map((visitor) => {
          const StatusIcon = statusIcons[visitor.status] || Clock
          return (
            <div key={visitor.id} className="rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--bg-tertiary)_8%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-start gap-3">
                  <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconWrapClasses[visitor.status] || iconWrapClasses.CANCELLED)}>
                    <StatusIcon className={clsx('h-5 w-5', iconColorClasses[visitor.status] || iconColorClasses.CANCELLED)} />
                  </div>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase', statusBadgeClasses[visitor.status] || statusBadgeClasses.CANCELLED)}>{visitor.status?.replace('_', ' ')}</span>
                      <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600">{visitor.visitorType}</span>
                      {visitor.isPreApproved && <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-blue-600">PRE-APPROVED</span>}
                      {visitor.otpVerifiedAt && <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-600">OTP VERIFIED</span>}
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{visitor.visitorName}</h3>
                    {visitor.purpose && <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">{visitor.purpose}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                      {visitor.visitorPhone && <span className="text-xs text-[var(--text-tertiary)]">Phone: {visitor.visitorPhone}</span>}
                      {visitor.flatNumber && <span className="text-xs text-[var(--text-tertiary)]">Flat: {visitor.flatNumber}</span>}
                      {visitor.vehicleNumber && <span className="text-xs text-[var(--text-tertiary)]">Vehicle: {visitor.vehicleNumber}</span>}
                      {visitor.expectedArrival && <span className="text-xs text-[var(--text-tertiary)]">Expected: {formatDateTime(visitor.expectedArrival)}</span>}
                      {visitor.approvalCode && <span className="text-xs text-[var(--text-tertiary)]">Code: {visitor.approvalCode}</span>}
                      {requiresOtp(visitor.visitorType) && visitor.status === 'EXPECTED' && visitor.otpCode && (
                        <span className="text-xs font-semibold text-blue-600">OTP: {visitor.otpCode} {(() => {
                          const otpExpiry = parseServerDateTime(visitor.otpExpiresAt)
                          return otpExpiry
                            ? `(valid till ${otpExpiry.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })})`
                            : ''
                        })()}</span>
                      )}
                      <span className="text-xs text-[var(--text-tertiary)]">{formatDateTime(visitor.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {visitor.status === 'EXPECTED' && requiresOtp(visitor.visitorType) && canGenerateOtp && (
                    <NeonSweepButton
                      onClick={() => generateOtpMutation.mutate(visitor.id)}
                      tone="cyan"
                      size="sm"
                    >
                      {visitor.otpCode ? 'Regenerate OTP' : 'Generate OTP'}
                    </NeonSweepButton>
                  )}

                  {isSecurityPersonnel && visitor.status === 'EXPECTED' && requiresOtp(visitor.visitorType) && !visitor.otpVerifiedAt && (
                    <NeonSweepButton onClick={() => handleVerifyOtp(visitor)} tone="violet" size="sm">
                      Verify OTP
                    </NeonSweepButton>
                  )}

                  {isSecurityPersonnel && visitor.status === 'EXPECTED' && (
                    <>
                      {(!requiresOtp(visitor.visitorType) || visitor.otpVerifiedAt) && (
                        <NeonSweepButton onClick={() => checkInMutation.mutate(visitor.id)} tone="cyan" size="sm">Check In</NeonSweepButton>
                      )}
                      <NeonSweepButton onClick={() => rejectMutation.mutate(visitor.id)} tone="danger" size="sm">Reject</NeonSweepButton>
                    </>
                  )}

                  {isSecurityPersonnel && visitor.status === 'CHECKED_IN' && (
                    <NeonSweepButton onClick={() => checkOutMutation.mutate(visitor.id)} tone="slate" size="sm">Check Out</NeonSweepButton>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,#020617_65%,transparent)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--border-default)_86%,#334155_14%)] bg-[color-mix(in_srgb,var(--bg-card)_96%,var(--bg-tertiary)_4%)] p-5 shadow-[0_24px_64px_rgba(2,6,23,0.35)] sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-[var(--border-light)] pb-3">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Pre-approve Visitor</h3>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormInput label="Visitor Name" name="visitorName" required />
              <FormInput label="Phone Number" name="visitorPhone" />
              <SmartSelect label="Visitor Type" name="visitorType" required options={[
                { value: 'GUEST', label: 'Guest' },
                { value: 'DELIVERY', label: 'Delivery' },
                { value: 'CAB', label: 'Cab' },
                { value: 'SERVICE', label: 'Service' },
                { value: 'OTHER', label: 'Other' },
              ]} placeholder="Select Type" />
              <FormInput label="Purpose" name="purpose" />
              <FormInput label="Vehicle Number" name="vehicleNumber" />
              <FormTextarea label="Notes" name="notes" rows={3} />
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <input type="checkbox" name="isPreApproved" defaultChecked className="h-4 w-4 accent-[var(--accent-primary)]" /> Pre-approve this visitor
              </label>
              <div className="mt-2 flex items-center justify-end gap-3 border-t border-[var(--border-light)] pt-4">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={() => setShowModal(false)}>
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Visitor'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
