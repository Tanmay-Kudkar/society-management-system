import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth, useToast } from '../../context'
import { visitorApi } from '../../../../api'
import { Plus, Search, X, UserX, Clock, LogIn, LogOut, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, PhoneInput, SmartSelect, FormTextarea, InfoTooltip, NeonSweepButton, EmptyStateSection } from '../../components'
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
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [viewMode, setViewMode] = useState('all')
  const [overstayThreshold, setOverstayThreshold] = useState('4')

  const [createForm, setCreateForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorType: '',
    purpose: '',
    vehicleNumber: '',
    notes: '',
    isPreApproved: true,
  })
  const [createErrors, setCreateErrors] = useState({})

  const isMember = user?.role && user.role !== 'VISITOR'

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const isResidentMember = user?.role === 'MEMBER'
  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isSecurityPersonnel = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const canCreateVisitorEntries = isSecurityPersonnel
  const canGenerateOtp = isSecurityPersonnel
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const queryFnByMode = () => {
    if (isResidentMember) {
      if (!user?.flatId) return Promise.resolve([])
      return visitorApi.getByFlat(user.flatId, user.id).then(res => {
        const list = Array.isArray(res?.data) ? res.data : []
        if (viewMode === 'today') {
          const today = new Date().toLocaleDateString('en-CA')
          return list.filter((visitor) => {
            const createdAt = parseServerDateTime(visitor.createdAt)
            if (!createdAt) return false
            return createdAt.toLocaleDateString('en-CA') === today
          })
        }
        return list
      })
    }
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
    enabled: !!user?.id && (isResidentMember ? !!user?.flatId : !!effectiveSocietyId),
  })

  const closeModal = (force = false) => {
    if (!force && createMutation.isPending) return
    setShowModal(false)
    setCreateErrors({})
    setCreateForm({
      visitorName: '',
      visitorPhone: '',
      visitorType: '',
      purpose: '',
      vehicleNumber: '',
      notes: '',
      isPreApproved: true,
    })
  }

  const createMutation = useMutation({
    mutationFn: (data) => visitorApi.create(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['visitors'])
      toast.success('Visitor added')
      closeModal(true)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to add visitor'
      toast.error(message)
    },
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

  const validateCreateForm = () => {
    const nextErrors = {}

    const resolvedSocietyId = effectiveSocietyId ? Number(effectiveSocietyId) : null
    if (!resolvedSocietyId || Number.isNaN(resolvedSocietyId)) {
      nextErrors.societyId = 'Society is required'
    }

    const visitorName = (createForm.visitorName || '').trim()
    if (!visitorName) nextErrors.visitorName = 'Visitor name is required'
    else if (visitorName.length < 2) nextErrors.visitorName = 'Enter at least 2 characters'

    if (!createForm.visitorType) nextErrors.visitorType = 'Visitor type is required'

    const phoneDigits = String(createForm.visitorPhone || '').replace(/[^0-9]/g, '')
    if (phoneDigits.length > 0) {
      if (phoneDigits.length !== 10) nextErrors.visitorPhone = 'Enter a 10-digit phone number'
      else if (!/^[6-9]/.test(phoneDigits)) nextErrors.visitorPhone = 'Phone must start with 6, 7, 8, or 9'
    }

    const vehicleNumber = (createForm.vehicleNumber || '').trim()
    if (vehicleNumber) {
      const normalizedVehicle = vehicleNumber.toUpperCase()
      if (!/^[A-Z0-9\-\s]{3,20}$/.test(normalizedVehicle)) {
        nextErrors.vehicleNumber = 'Use letters/numbers only (3–20 chars)'
      }
    }

    const purpose = (createForm.purpose || '').trim()
    if (purpose && purpose.length < 3) nextErrors.purpose = 'Enter at least 3 characters'

    const notes = (createForm.notes || '').trim()
    if (notes && notes.length > 250) nextErrors.notes = 'Keep notes within 250 characters'

    setCreateErrors(nextErrors)
    return { isValid: Object.keys(nextErrors).length === 0, resolvedSocietyId }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { isValid, resolvedSocietyId } = validateCreateForm()
    if (!isValid) {
      toast.validation('Please fix the highlighted fields')
      return
    }

    const payload = {
      visitorName: (createForm.visitorName || '').trim(),
      visitorPhone: String(createForm.visitorPhone || '').replace(/[^0-9]/g, ''),
      visitorType: createForm.visitorType,
      purpose: (createForm.purpose || '').trim() || null,
      vehicleNumber: (createForm.vehicleNumber || '').trim().toUpperCase() || null,
      notes: (createForm.notes || '').trim() || null,
      societyId: resolvedSocietyId,
      isPreApproved: !!createForm.isPreApproved,
    }

    createMutation.mutate(payload)
  }

  const requiresOtp = (visitorType) => ['DELIVERY', 'CAB'].includes(visitorType)

  const handleVerifyOtp = (visitor) => {
    const otpCode = prompt(`Enter OTP for ${visitor.visitorName}`)
    if (!otpCode) return
    verifyOtpMutation.mutate({ id: visitor.id, otpCode })
  }

  const showSkeleton = useMinLoadingTime(isLoading)

  if (!isMember) {
    return <PermissionDenied message="You don't have permission to access visitor management" />
  }

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
            onClick={() => {
              setCreateErrors({})
              setCreateForm({
                visitorName: '',
                visitorPhone: '',
                visitorType: '',
                purpose: '',
                vehicleNumber: '',
                notes: '',
                isPreApproved: true,
              })
              setShowModal(true)
            }}
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
          <EmptyStateSection
            title="No visitors found"
            description="No visitor records match your current filters."
            icon={UserX}
            className="p-5"
          />
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
              <button onClick={() => closeModal()} className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Visitor Name"
                  name="visitorName"
                  value={createForm.visitorName}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, visitorName: e.target.value }))
                    if (createErrors.visitorName) setCreateErrors(prev => ({ ...prev, visitorName: '' }))
                  }}
                  error={createErrors.visitorName}
                  required
                  placeholder="e.g. Full Name"
                  maxLength={80}
                  autoFocus
                />

                <PhoneInput
                  label="Phone Number"
                  name="visitorPhone"
                  value={createForm.visitorPhone}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, visitorPhone: e.target.value }))
                    if (createErrors.visitorPhone) setCreateErrors(prev => ({ ...prev, visitorPhone: '' }))
                  }}
                  error={createErrors.visitorPhone}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SmartSelect
                  label="Visitor Type"
                  name="visitorType"
                  required
                  value={createForm.visitorType}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, visitorType: e.target.value }))
                    if (createErrors.visitorType) setCreateErrors(prev => ({ ...prev, visitorType: '' }))
                  }}
                  error={createErrors.visitorType}
                  options={[
                { value: 'GUEST', label: 'Guest' },
                { value: 'DELIVERY', label: 'Delivery' },
                { value: 'CAB', label: 'Cab' },
                { value: 'SERVICE', label: 'Service' },
                { value: 'OTHER', label: 'Other' },
                  ]}
                  placeholder="Select type"
                />

                <FormInput
                  label="Purpose"
                  name="purpose"
                  value={createForm.purpose}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, purpose: e.target.value }))
                    if (createErrors.purpose) setCreateErrors(prev => ({ ...prev, purpose: '' }))
                  }}
                  error={createErrors.purpose}
                  placeholder="e.g. Package delivery"
                  maxLength={120}
                />
              </div>

              <FormInput
                label="Vehicle Number"
                name="vehicleNumber"
                value={createForm.vehicleNumber}
                onChange={(e) => {
                  setCreateForm(prev => ({ ...prev, vehicleNumber: e.target.value }))
                  if (createErrors.vehicleNumber) setCreateErrors(prev => ({ ...prev, vehicleNumber: '' }))
                }}
                error={createErrors.vehicleNumber}
                placeholder="Optional"
                maxLength={20}
              />

              <FormTextarea
                label="Notes"
                name="notes"
                rows={3}
                value={createForm.notes}
                onChange={(e) => {
                  setCreateForm(prev => ({ ...prev, notes: e.target.value }))
                  if (createErrors.notes) setCreateErrors(prev => ({ ...prev, notes: '' }))
                }}
                error={createErrors.notes}
                placeholder="Optional"
                maxLength={250}
              />

              {createErrors.societyId && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
                  {createErrors.societyId}
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  name="isPreApproved"
                  checked={createForm.isPreApproved}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, isPreApproved: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--accent-primary)]"
                />
                Pre-approve this visitor
              </label>
              <div className="mt-2 flex items-center justify-end gap-3 border-t border-[var(--border-light)] pt-4">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={() => closeModal()}>
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
