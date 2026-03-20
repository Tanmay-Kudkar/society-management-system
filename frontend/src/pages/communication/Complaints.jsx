import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { complaintApi } from '../../../../api'
import { Plus, Search, X, AlertTriangle, Clock, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, InfoTooltip, NeonSweepButton, AnimatedModal } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { useToast } from '../../context'
import { parseServerDateTime } from '../../utils/formatUtils'

const UNDO_WINDOW_MS = 5 * 60 * 1000

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  DELETED: 'bg-rose-100 text-rose-700',
}

const statusIcons = {
  PENDING: Clock,
  UNDER_REVIEW: AlertTriangle,
  RESOLVED: CheckCircle,
  REJECTED: XCircle,
  DELETED: Trash2,
}

const categoryClasses = {
  PARKING: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/25',
  MAINTENANCE: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/25',
  SECURITY: 'bg-rose-500/15 text-rose-300 border-rose-400/25',
  CLEANLINESS: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  NOISE: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  NEIGHBOR: 'bg-violet-500/15 text-violet-300 border-violet-400/25',
  OTHER: 'bg-slate-500/15 text-slate-200 border-slate-400/25',
}

const formatComplaintDateTimeWithDay = (value) => {
  const date = parseServerDateTime(value)
  if (!date) return '-'
  return date.toLocaleString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

export default function Complaints() {
  const { user, canRaiseComplaints, canManageComplaints } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const confirmDialog = useConfirmDialog()
  
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [editingComplaint, setEditingComplaint] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [nowTs, setNowTs] = useState(Date.now())
  const [highlightedComplaintId, setHighlightedComplaintId] = useState(null)
  const [isPageGlowActive, setIsPageGlowActive] = useState(false)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [complaintToResolve, setComplaintToResolve] = useState(null)
  const [resolutionDraft, setResolutionDraft] = useState('')

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const selectedComplaintFromUrlRaw = Number(searchParams.get('complaint'))
  const selectedComplaintFromUrl = Number.isFinite(selectedComplaintFromUrlRaw) && selectedComplaintFromUrlRaw > 0
    ? selectedComplaintFromUrlRaw
    : null
  const pageFocusMode = searchParams.get('focus') === 'page'

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

  // Determine which societyId to use for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId
  const complaintQueryKey = ['complaints', user?.id, effectiveSocietyId]

  const { data: complaints = [], isLoading, isError } = useQuery({
    queryKey: complaintQueryKey,
    queryFn: () =>
      complaintApi.getBySociety(effectiveSocietyId, user.id)
        .then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId,
  })

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])



  const createMutation = useMutation({
    mutationFn: (data) => complaintApi.create(data, user.id),
    onMutate: async (newComplaint) => {
      await queryClient.cancelQueries({ queryKey: complaintQueryKey })
      const previousComplaints = queryClient.getQueryData(complaintQueryKey)

      const optimisticComplaint = {
        id: `tmp-${Date.now()}`,
        complaintNumber: `CMP-TEMP-${Date.now()}`,
        userId: user?.id,
        raisedByName: user?.name || 'You',
        societyId: Number(effectiveSocietyId),
        societyName: user?.societyName || '',
        subject: newComplaint.subject,
        description: newComplaint.description,
        category: newComplaint.category,
        status: 'PENDING',
        resolution: null,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData(complaintQueryKey, (old = []) => [optimisticComplaint, ...old])
      return { previousComplaints }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintQueryKey })
      closeModal(true)
    },
    onError: (error, _variables, context) => {
      if (context?.previousComplaints) {
        queryClient.setQueryData(complaintQueryKey, context.previousComplaints)
      }
      toast.error(error?.response?.data?.message || 'Failed to create complaint')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => complaintApi.update(id, data, user.id),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: complaintQueryKey })
      const previousComplaints = queryClient.getQueryData(complaintQueryKey)

      queryClient.setQueryData(complaintQueryKey, (old = []) =>
        old.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                subject: data.subject,
                description: data.description,
                category: data.category,
              }
            : item
        )
      )

      return { previousComplaints }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintQueryKey })
      closeModal(true)
      toast.success('Complaint updated successfully')
    },
    onError: (error, _variables, context) => {
      if (context?.previousComplaints) {
        queryClient.setQueryData(complaintQueryKey, context.previousComplaints)
      }
      toast.error(error?.response?.data?.message || 'Failed to update complaint')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, resolution }) => complaintApi.updateStatus(id, status, resolution, user.id),
    onMutate: async ({ id, status, resolution }) => {
      await queryClient.cancelQueries({ queryKey: complaintQueryKey })
      const previousComplaints = queryClient.getQueryData(complaintQueryKey)

      queryClient.setQueryData(complaintQueryKey, (old = []) =>
        old.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                status,
                resolution: resolution ?? item.resolution,
              }
            : item
        )
      )

      return { previousComplaints }
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: complaintQueryKey })
      if (variables?.finalizeStatusUndo) {
        toast.success('Resolution confirmed')
      } else if (variables?.status === 'RESOLVED' || variables?.status === 'REJECTED') {
        toast.success('Status updated. You can undo this action for 5 minutes.')
      }
    },
    onError: (error, _variables, context) => {
      if (context?.previousComplaints) {
        queryClient.setQueryData(complaintQueryKey, context.previousComplaints)
      }
      toast.error(error?.response?.data?.message || 'Failed to update complaint status')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, force = false }) => complaintApi.delete(id, user.id, force),
    onMutate: async ({ id, force = false }) => {
      await queryClient.cancelQueries({ queryKey: complaintQueryKey })
      const previousComplaints = queryClient.getQueryData(complaintQueryKey)

      queryClient.setQueryData(complaintQueryKey, (old = []) => {
        if (force) {
          return old.filter((item) => String(item.id) !== String(id))
        }

        const expiresAt = new Date(Date.now() + UNDO_WINDOW_MS).toISOString()
        return old.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                deleted: true,
                deleteUndoPreviousStatus: item.status,
                deleteUndoPreviousResolution: item.resolution,
                deleteUndoExpiresAt: expiresAt,
              }
            : item
        )
      })

      return { previousComplaints }
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: complaintQueryKey })
      if (variables?.force) {
        toast.success('Complaint permanently deleted')
      } else {
        toast.success('Complaint deleted. You can undo this action for 5 minutes.')
      }
    },
    onError: (error, _variables, context) => {
      if (context?.previousComplaints) {
        queryClient.setQueryData(complaintQueryKey, context.previousComplaints)
      }
      toast.error(error?.response?.data?.message || 'Failed to delete complaint')
    },
  })

  const undoMutation = useMutation({
    mutationFn: (id) => complaintApi.undo(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintQueryKey })
      toast.success('Undo completed successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Undo window expired or action not available')
      queryClient.invalidateQueries({ queryKey: complaintQueryKey })
    },
  })

  const activeComplaints = useMemo(() => complaints.filter(c => !c.deleted), [complaints])

  const filteredComplaints = useMemo(() => complaints
    .filter(c => {
      const matchesSearch = c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || c.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aTime = parseServerDateTime(a.createdAt)?.getTime() ?? 0
      const bTime = parseServerDateTime(b.createdAt)?.getTime() ?? 0
      if (bTime !== aTime) return bTime - aTime
      return (b.id || 0) - (a.id || 0)
    }), [complaints, searchTerm, filterStatus])

  const closeModal = (force = false) => {
    if (!force && (createMutation.isPending || updateMutation.isPending)) return
    setShowModal(false)
    setEditingComplaint(null)
  }

  useEffect(() => {
    if (!pageFocusMode) return

    const startTimer = setTimeout(() => {
      window.scrollBy({ top: 200, behavior: 'smooth' })
      setIsPageGlowActive(true)
    }, 80)

    const endTimer = setTimeout(() => setIsPageGlowActive(false), 2100)

    const clearFocusParamTimer = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('focus')
      const nextSearch = nextParams.toString()
      navigate({ search: nextSearch ? `?${nextSearch}` : '' }, { replace: true })
    }, 2300)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(endTimer)
      clearTimeout(clearFocusParamTimer)
    }
  }, [pageFocusMode, navigate, searchParams])

  useEffect(() => {
    if (pageFocusMode) return

    if (!selectedComplaintFromUrl) return

    if (!selectedComplaintFromUrl || isLoading || complaints.length === 0) return

    const selectedExists = complaints.some((complaint) => complaint.id === selectedComplaintFromUrl)
    if (!selectedExists) return

    let glowStartTimer
    let glowEndTimer

    const timer = setTimeout(() => {
      const element = document.getElementById(`complaint-${selectedComplaintFromUrl}`)
      if (!element) return
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      setHighlightedComplaintId(null)
      glowStartTimer = setTimeout(() => setHighlightedComplaintId(selectedComplaintFromUrl), 540)
      glowEndTimer = setTimeout(() => setHighlightedComplaintId(null), 2480)
    }, 80)

    return () => {
      clearTimeout(timer)
      clearTimeout(glowStartTimer)
      clearTimeout(glowEndTimer)
    }
  }, [pageFocusMode, selectedComplaintFromUrl, isLoading, complaints])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    if (!effectiveSocietyId) {
      toast.error('Society is required. Select a society first.')
      return
    }

    const payload = {
      societyId: Number(effectiveSocietyId),
      subject: formData.get('subject'),
      description: formData.get('description'),
      category: formData.get('category'),
    }

    if (editingComplaint?.id) {
      updateMutation.mutate({ id: editingComplaint.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  const confirmAndDeleteComplaint = async (complaint) => {
    const confirmed = await confirmDialog({
      title: 'Delete Complaint',
      message: 'Are you sure you want to delete this complaint? You can undo this action within 5 minutes.',
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Complaint', value: complaint.subject || '-' },
        { label: 'Status', value: String(complaint.status || '-').replace(/_/g, ' ') },
      ],
      caution: 'The complaint will stay recoverable for 5 minutes, then it becomes permanent.',
    })
    if (confirmed) {
      deleteMutation.mutate({ id: complaint.id, force: false })
    }
  }

  const confirmAndFinalDeleteComplaint = async (complaint) => {
    const confirmed = await confirmDialog({
      title: 'Final Delete Complaint',
      message: 'Permanently delete this complaint now? This cannot be undone.',
      confirmText: 'Final Delete',
      tone: 'danger',
      details: [
        { label: 'Complaint', value: complaint.subject || '-' },
        { label: 'Status', value: 'Deleted' },
      ],
      caution: 'This bypasses the remaining undo window and removes the record permanently.',
    })
    if (confirmed) {
      deleteMutation.mutate({ id: complaint.id, force: true })
    }
  }

  const getUndoRemainingMs = (undoExpiresAt) => {
    const parsed = parseServerDateTime(undoExpiresAt)
    if (!parsed) return 0
    const remaining = parsed.getTime() - nowTs
    return remaining > 0 && remaining <= (UNDO_WINDOW_MS + 5000) ? remaining : 0
  }

  const formatCountdown = (remainingMs) => {
    const totalSeconds = Math.floor(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handleStatusChange = (complaint, newStatus) => {
    if (newStatus === 'RESOLVED') {
      setComplaintToResolve(complaint)
      setResolutionDraft('')
      setShowResolutionModal(true)
      return
    }
    updateStatusMutation.mutate({ id: complaint.id, status: newStatus, resolution: null })
  }

  const handleConfirmResolution = (complaint) => {
    if (!complaint?.id || updateStatusMutation.isPending) return
    updateStatusMutation.mutate({
      id: complaint.id,
      status: 'RESOLVED',
      resolution: complaint.resolution ?? null,
      finalizeStatusUndo: true,
    })
  }

  const closeResolutionModal = () => {
    if (updateStatusMutation.isPending) return
    setShowResolutionModal(false)
    setComplaintToResolve(null)
    setResolutionDraft('')
  }

  const submitResolution = () => {
    const resolution = resolutionDraft.trim()
    if (!complaintToResolve?.id) return
    if (!resolution) {
      toast.error('Resolution notes are required')
      return
    }

    updateStatusMutation.mutate(
      { id: complaintToResolve.id, status: 'RESOLVED', resolution },
      {
        onSuccess: () => {
          closeResolutionModal()
        },
      }
    )
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  // Permission check - users must be able to at least raise complaints
  if (!canRaiseComplaints()) {
    return <PermissionDenied message="You don't have permission to access complaints" />
  }

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <FiltersSkeleton filterCount={1} />
        <ListSkeleton count={4} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Complaints</h1>
            <InfoTooltip text="Manage resident complaints" />
          </div>
        </div>
        {canRaiseComplaints() && (
          <NeonSweepButton
            tone="violet"
            size="md"
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus size={20} />
            Log Complaint
          </NeonSweepButton>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-amber-500/25 bg-[linear-gradient(145deg,rgba(245,158,11,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{activeComplaints.filter(c => c.status === 'PENDING').length}</p>
        </div>
        <div className="rounded-2xl border border-blue-500/25 bg-[linear-gradient(145deg,rgba(59,130,246,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Under Review</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{activeComplaints.filter(c => c.status === 'UNDER_REVIEW').length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/25 bg-[linear-gradient(145deg,rgba(16,185,129,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{activeComplaints.filter(c => c.status === 'RESOLVED').length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[linear-gradient(145deg,rgba(148,163,184,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{activeComplaints.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/95 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
        <div className="grid gap-4">
          {filteredComplaints.map((complaint) => {
            const effectiveStatus = complaint.deleted ? 'DELETED' : complaint.status
            const StatusIcon = statusIcons[effectiveStatus] || Clock
            const normalizedCategory = String(complaint.category || 'OTHER').toUpperCase()
            const deleteUndoRemainingMs = getUndoRemainingMs(complaint.deleteUndoExpiresAt)
            const statusUndoRemainingMs = getUndoRemainingMs(complaint.statusUndoExpiresAt)
            const canUndoDelete = Boolean(complaint.deleted) && deleteUndoRemainingMs > 0
            const canUndoStatus = !complaint.deleted
              && ['RESOLVED', 'REJECTED'].includes(String(complaint.status || '').toUpperCase())
              && Boolean(complaint.statusUndoPreviousStatus)
              && statusUndoRemainingMs > 0
            const activeUndoRemainingMs = canUndoDelete ? deleteUndoRemainingMs : (canUndoStatus ? statusUndoRemainingMs : 0)
            const undoContextLabel = canUndoDelete ? 'Deleted' : complaint.status?.replace('_', ' ')

            return (
              <div
                id={`complaint-${complaint.id}`}
                key={complaint.id}
                className={clsx(
                  'group relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.10)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-blue-500/45 hover:shadow-[0_20px_38px_rgba(30,64,175,0.18)]',
                  complaint.deleted && 'border-rose-500/40 bg-[color-mix(in_srgb,var(--bg-card)_90%,rgba(244,63,94,0.10)_10%)]',
                  (isPageGlowActive || highlightedComplaintId === complaint.id) && 'ticket-focus-glow'
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500/85 via-blue-500/75 to-indigo-500/75" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                        effectiveStatus === 'PENDING' && 'border-amber-400/25 bg-amber-500/15 text-amber-300',
                        effectiveStatus === 'UNDER_REVIEW' && 'border-blue-400/25 bg-blue-500/15 text-blue-300',
                        effectiveStatus === 'RESOLVED' && 'border-emerald-400/25 bg-emerald-500/15 text-emerald-300',
                        effectiveStatus === 'REJECTED' && 'border-rose-400/25 bg-rose-500/15 text-rose-300',
                        effectiveStatus === 'DELETED' && 'border-rose-400/35 bg-rose-500/15 text-rose-300'
                      )}>
                        <StatusIcon className="h-[1.08rem] w-[1.08rem]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.79rem] font-mono tracking-[0.02em] text-[var(--text-tertiary)]">{complaint.complaintNumber}</span>
                          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', statusColors[effectiveStatus])}>
                            {String(effectiveStatus).replace('_', ' ')}
                          </span>
                          <span className={clsx(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]',
                            categoryClasses[normalizedCategory] || categoryClasses.OTHER
                          )}>
                            {normalizedCategory}
                          </span>
                        </div>

                        <h3 className="mt-1.5 text-[1.16rem] font-bold leading-tight text-[var(--text-primary)]">{complaint.subject}</h3>
                        <p className="mt-2 max-w-3xl text-[0.92rem] leading-relaxed text-[var(--text-secondary)] line-clamp-3">{complaint.description}</p>

                        {complaint.resolution && (
                          <div className="mt-3 max-w-3xl rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5">
                            <p className="text-xs text-emerald-200"><span className="font-semibold">Resolution:</span> {complaint.resolution}</p>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-tertiary)]">
                          {isPlatformLevel && (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                              {complaint.societyName}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                            {complaint.raisedByName || 'N/A'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {formatComplaintDateTimeWithDay(complaint.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)]/45 p-3 2xl:ml-5 2xl:w-[15.2rem]">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--text-tertiary)]">Update Status</p>

                    {(canUndoDelete || canUndoStatus) && canManageComplaints() && (
                      <div className="mb-2.5 rounded-xl border border-blue-500/35 bg-blue-500/10 p-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-200">
                          {undoContextLabel} • Undo available
                        </p>
                        <p className="mt-1 text-xs text-blue-100/90">{formatCountdown(activeUndoRemainingMs)} remaining</p>
                        <NeonSweepButton
                          type="button"
                          tone="cyan"
                          size="sm"
                          className="mt-2 w-full justify-center"
                          onClick={() => undoMutation.mutate(complaint.id)}
                          disabled={undoMutation.isPending || deleteMutation.isPending || updateStatusMutation.isPending}
                        >
                          {undoMutation.isPending ? 'Undoing...' : 'Undo'}
                        </NeonSweepButton>
                        {canUndoStatus && String(complaint.status || '').toUpperCase() === 'RESOLVED' && (
                          <NeonSweepButton
                            type="button"
                            tone="emerald"
                            size="sm"
                            className="mt-2 w-full justify-center border-2 border-emerald-300/55 bg-emerald-500/25 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.45),0_8px_20px_rgba(16,185,129,0.22)]"
                            onClick={() => handleConfirmResolution(complaint)}
                            disabled={updateStatusMutation.isPending || undoMutation.isPending || deleteMutation.isPending}
                          >
                            <CheckCircle size={14} />
                            {updateStatusMutation.isPending ? 'Confirming...' : 'Confirm Resolution'}
                          </NeonSweepButton>
                        )}
                        {canUndoDelete && (
                          <NeonSweepButton
                            type="button"
                            tone="danger"
                            size="sm"
                            className="mt-2 w-full justify-center"
                            onClick={() => confirmAndFinalDeleteComplaint(complaint)}
                            disabled={deleteMutation.isPending || undoMutation.isPending}
                          >
                            <Trash2 size={14} />
                            {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                          </NeonSweepButton>
                        )}
                      </div>
                    )}

                    {canManageComplaints() && !complaint.deleted && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint, e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-[0_2px_8px_rgba(15,23,42,0.08)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    )}

                    {(!canManageComplaints() || complaint.deleted || complaint.status === 'RESOLVED' || complaint.status === 'REJECTED') && (
                      <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]">
                        Current: {complaint.deleted ? 'Deleted' : complaint.status?.replace('_', ' ')}
                      </div>
                    )}

                    {canManageComplaints() && !complaint.deleted && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <NeonSweepButton
                          type="button"
                          tone="slate"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => {
                            setEditingComplaint(complaint)
                            setShowModal(true)
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </NeonSweepButton>
                        <NeonSweepButton
                          type="button"
                          tone="danger"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => confirmAndDeleteComplaint(complaint)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} />
                          Delete
                        </NeonSweepButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      {/* Create Complaint Modal */}
      <AnimatedModal open={showModal} onRequestClose={closeModal} closeOnBackdrop>
        <div className="w-full max-w-[520px] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--bg-card)] rounded-xl border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingComplaint ? 'Edit Complaint' : 'Log Complaint'}</h3>
              <button onClick={closeModal} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 grid gap-4">
              <FormInput
                label="Subject"
                name="subject"
                defaultValue={editingComplaint?.subject || ''}
                required
              />
              <SmartSelect
                label="Category"
                name="category"
                defaultValue={editingComplaint?.category || 'NOISE'}
                required
                options={[
                  { value: 'NOISE', label: 'Noise' },
                  { value: 'PARKING', label: 'Parking' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                  { value: 'SECURITY', label: 'Security' },
                  { value: 'CLEANLINESS', label: 'Cleanliness' },
                  { value: 'NEIGHBOR', label: 'Neighbor Issue' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                placeholder="Select Category"
              />
              <FormTextarea
                label="Description"
                name="description"
                defaultValue={editingComplaint?.description || ''}
                rows={4}
                required
              />
              <div className="flex gap-3 pt-4">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={closeModal} className="flex-1">Cancel</NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? (editingComplaint ? 'Saving...' : 'Submitting...')
                    : (editingComplaint ? 'Save Changes' : 'Submit')}
                </NeonSweepButton>
              </div>
            </form>
        </div>
      </AnimatedModal>

      {/* Resolve Complaint Modal */}
      <AnimatedModal open={showResolutionModal} onRequestClose={closeResolutionModal} closeOnBackdrop>
        <div className="w-full max-w-[36rem] rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_24px_48px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Resolve Complaint</h3>
            <button
              type="button"
              onClick={closeResolutionModal}
              disabled={updateStatusMutation.isPending}
              className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="mb-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)]/45 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">Complaint</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{complaintToResolve?.subject || '-'}</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{complaintToResolve?.complaintNumber || ''}</p>
            </div>

            <label className="mb-1.5 block text-[0.86rem] font-semibold text-[var(--text-secondary)]">
              Resolution Notes
            </label>
            <textarea
              value={resolutionDraft}
              onChange={(e) => setResolutionDraft(e.target.value)}
              rows={4}
              placeholder="Describe how this complaint was resolved..."
              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="mt-4 flex gap-3">
              <NeonSweepButton
                type="button"
                tone="slate"
                size="md"
                className="flex-1"
                onClick={closeResolutionModal}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </NeonSweepButton>
              <NeonSweepButton
                type="button"
                tone="cyan"
                size="md"
                className="flex-1"
                onClick={submitResolution}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Saving...' : 'Mark as Resolved'}
              </NeonSweepButton>
            </div>
          </div>
        </div>
      </AnimatedModal>
    </div>
  )
}
