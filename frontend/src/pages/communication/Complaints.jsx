import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { complaintApi, userApi } from '../../../../api'
import { Plus, Search, X, AlertTriangle, Clock, CheckCircle, XCircle, Edit, Trash2, Upload, Loader2, Download } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, InfoTooltip, NeonSweepButton, AnimatedModal } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { useToast } from '../../context'
import { parseServerDateTime } from '../../utils/formatUtils'

const UNDO_WINDOW_MS = 5 * 60 * 1000
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024

const statusColors = {
  PENDING: 'bg-amber-200 dark:bg-amber-100 text-amber-900',
  UNDER_REVIEW: 'bg-blue-200 dark:bg-blue-100 text-blue-900',
  RESOLVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  DELETED: 'bg-rose-200 dark:bg-rose-100 text-rose-900',
}

const statusIcons = {
  PENDING: Clock,
  UNDER_REVIEW: AlertTriangle,
  RESOLVED: CheckCircle,
  REJECTED: XCircle,
  DELETED: Trash2,
}

const categoryClasses = {
  PARKING: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-400/25',
  MAINTENANCE: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-900 dark:text-cyan-300 border-cyan-300 dark:border-cyan-400/25',
  SECURITY: 'bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-400/25',
  CLEANLINESS: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-400/25',
  NOISE: 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-400/25',
  NEIGHBOR: 'bg-violet-50 dark:bg-violet-500/15 text-violet-900 dark:text-violet-300 border-violet-300 dark:border-violet-400/25',
  NEIGHBOR_ISSUE: 'bg-violet-50 dark:bg-violet-500/15 text-violet-900 dark:text-violet-300 border-violet-300 dark:border-violet-400/25',
  OTHER: 'bg-slate-50 dark:bg-slate-500/15 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-400/25',
}

const priorityClasses = {
  LOW: 'bg-slate-500/15 text-slate-900 dark:text-slate-200 border-slate-400/25',
  MEDIUM: 'bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-400/25',
  HIGH: 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-400/25',
  URGENT: 'bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-400/25',
}

const normalizeCsvUrls = (raw) => {
  if (!raw) return []
  return String(raw)
    .split(/\r?\n|,/) 
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 10)
}

const stringifyUrls = (urls) => Array.isArray(urls) ? urls.join(', ') : ''

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

const formatDurationMinutes = (minutes) => {
  if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) {
    return '-'
  }

  const totalMinutes = Math.max(0, Math.floor(Number(minutes)))
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const remainingMinutes = totalMinutes % 60

  if (days > 0) {
    return remainingMinutes > 0 ? `${days}d ${hours}h ${remainingMinutes}m` : `${days}d ${hours}h`
  }

  if (hours > 0) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return `${remainingMinutes}m`
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
  const [filterPriority, setFilterPriority] = useState('')
  const [nowTs, setNowTs] = useState(Date.now())
  const [highlightedComplaintId, setHighlightedComplaintId] = useState(null)
  const [isPageGlowActive, setIsPageGlowActive] = useState(false)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [complaintToResolve, setComplaintToResolve] = useState(null)
  const [resolutionDraft, setResolutionDraft] = useState('')
  const [attachmentUrlsInput, setAttachmentUrlsInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [downloadingAttachmentUrl, setDownloadingAttachmentUrl] = useState('')
  const [uploadValidationError, setUploadValidationError] = useState('')

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const selectedComplaintFromUrlRaw = Number(searchParams.get('complaint'))
  const selectedComplaintFromUrl = Number.isFinite(selectedComplaintFromUrlRaw) && selectedComplaintFromUrlRaw > 0
    ? selectedComplaintFromUrlRaw
    : null
  const pageFocusMode = searchParams.get('focus') === 'page'

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const canUseAdvancedComplaintFields = user?.role === 'MASTER_ADMIN' || user?.role === 'SOCIETY_ADMIN'

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

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['complaint-assignable-users', effectiveSocietyId],
    queryFn: () => userApi.getBySociety(effectiveSocietyId).then((res) => res.data || []),
    enabled: !!effectiveSocietyId && canUseAdvancedComplaintFields,
    staleTime: 60 * 1000,
  })

  const { data: slaSummary } = useQuery({
    queryKey: ['complaints-sla-summary', effectiveSocietyId, user?.id],
    queryFn: () => complaintApi.getSlaSummary(effectiveSocietyId, user.id).then((res) => res.data),
    enabled: !!effectiveSocietyId && !!user?.id && canManageComplaints(),
    staleTime: 30 * 1000,
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
        priority: newComplaint.priority || 'MEDIUM',
        wing: null,
        floor: null,
        flatNumber: null,
        locationDetails: newComplaint.locationDetails || null,
        attachmentUrls: newComplaint.attachmentUrls || [],
        assignedToUserId: newComplaint.assignedToUserId || null,
        raisedForUserId: newComplaint.raisedForUserId || null,
        raisedForName: assignableUsers.find((entry) => Number(entry?.id) === Number(newComplaint.raisedForUserId))?.name || null,
        raisedForReason: newComplaint.raisedForReason || null,
        adminRemarks: newComplaint.adminRemarks || null,
        status: 'PENDING',
        resolution: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
                priority: data.priority,
                locationDetails: data.locationDetails,
                attachmentUrls: data.attachmentUrls,
                assignedToUserId: data.assignedToUserId,
                raisedForUserId: data.raisedForUserId,
                raisedForName: assignableUsers.find((entry) => Number(entry?.id) === Number(data.raisedForUserId))?.name || item.raisedForName || null,
                raisedForReason: data.raisedForReason,
                adminRemarks: data.adminRemarks,
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

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ file, onUploadProgress }) => complaintApi.uploadAttachment(file, effectiveSocietyId, user.id, onUploadProgress),
    onError: (error) => {
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error
      const fallback = error?.response?.status === 413
        ? 'File too large. Maximum allowed size is 25MB.'
        : 'Failed to upload attachment'
      toast.error(backendMessage || fallback)
      setUploadProgress(0)
    },
  })

  const activeComplaints = useMemo(() => complaints.filter(c => !c.deleted), [complaints])

  const filteredComplaints = useMemo(() => complaints
    .filter(c => {
      const matchesSearch = c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || c.status === filterStatus
      const matchesPriority = !filterPriority || String(c.priority || 'MEDIUM').toUpperCase() === filterPriority
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      const aTime = parseServerDateTime(a.createdAt)?.getTime() ?? 0
      const bTime = parseServerDateTime(b.createdAt)?.getTime() ?? 0
      if (bTime !== aTime) return bTime - aTime
      return (b.id || 0) - (a.id || 0)
    }), [complaints, searchTerm, filterStatus, filterPriority])

  const closeModal = (force = false) => {
    if (!force && (createMutation.isPending || updateMutation.isPending)) return
    setShowModal(false)
    setEditingComplaint(null)
    setAttachmentUrlsInput('')
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadValidationError('')
  }

  useEffect(() => {
    if (!showModal) return
    setAttachmentUrlsInput(stringifyUrls(editingComplaint?.attachmentUrls))
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadValidationError('')
  }, [showModal, editingComplaint])

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
      priority: formData.get('priority') || 'MEDIUM',
      locationDetails: formData.get('locationDetails') || null,
      attachmentUrls: normalizeCsvUrls(attachmentUrlsInput),
      ...(canUseAdvancedComplaintFields ? {
        assignedToUserId: formData.get('assignedToUserId') ? Number(formData.get('assignedToUserId')) : null,
        raisedForUserId: formData.get('raisedForUserId') ? Number(formData.get('raisedForUserId')) : null,
        raisedForReason: formData.get('raisedForReason') || null,
        adminRemarks: formData.get('adminRemarks') || null,
      } : {}),
    }

    if (editingComplaint?.id) {
      updateMutation.mutate({ id: editingComplaint.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  const handleSelectAttachmentFiles = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const firstFile = files[0]
    if (firstFile.size > MAX_ATTACHMENT_SIZE_BYTES) {
      const reason = 'File rejected: Maximum upload size is 25MB.'
      setSelectedFile(null)
      setUploadProgress(0)
      setUploadValidationError(reason)
      toast.error(reason)
      event.target.value = ''
      return
    }

    setSelectedFile(firstFile)
    setUploadProgress(0)
    setUploadValidationError('')
    if (files.length > 1) {
      toast.error('Only one file can be uploaded at a time')
    }
  }

  const handleUploadAttachments = async () => {
    if (!selectedFile || !effectiveSocietyId) return

    if (selectedFile.size > MAX_ATTACHMENT_SIZE_BYTES) {
      const reason = 'File rejected: Maximum upload size is 25MB.'
      setUploadValidationError(reason)
      toast.error(reason)
      return
    }

    try {
      setUploadProgress(0)
      const response = await uploadAttachmentMutation.mutateAsync({
        file: selectedFile,
        onUploadProgress: (event) => {
          if (!event?.total) return
          const percent = Math.min(100, Math.round((event.loaded * 100) / event.total))
          setUploadProgress(percent)
        },
      })

      if (response?.data?.url) {
        setAttachmentUrlsInput((prev) => {
          const current = normalizeCsvUrls(prev)
          return [...new Set([...current, response.data.url])].join(', ')
        })
        setSelectedFile(null)
        setUploadProgress(100)
        toast.success('1 attachment uploaded')
        setTimeout(() => setUploadProgress(0), 600)
      }
    } catch {
      // Error toast is handled in mutation onError.
    }
  }

  const handleDownloadAttachment = async (attachmentUrl, fallbackName) => {
    if (!attachmentUrl) return
    try {
      setDownloadingAttachmentUrl(attachmentUrl)
      const response = await complaintApi.downloadAttachment(attachmentUrl)

      const disposition = response?.headers?.['content-disposition'] || ''
      const nameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i)
      const filename = nameMatch?.[1] || fallbackName || 'complaint-attachment'

      const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/octet-stream' })
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to download attachment')
    } finally {
      setDownloadingAttachmentUrl('')
    }
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
    <div className="complaints-page">
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
      <div className={clsx('mb-6 grid grid-cols-2 gap-4', canManageComplaints() ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-4')}>
        <div className="complaint-summary-card complaint-summary-card--pending rounded-2xl border border-amber-500/25 bg-[linear-gradient(145deg,rgba(245,158,11,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{activeComplaints.filter(c => c.status === 'PENDING').length}</p>
        </div>
        <div className="complaint-summary-card complaint-summary-card--review rounded-2xl border border-blue-300 dark:border-blue-500/25 bg-[linear-gradient(145deg,rgba(59,130,246,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Under Review</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{activeComplaints.filter(c => c.status === 'UNDER_REVIEW').length}</p>
        </div>
        <div className="complaint-summary-card complaint-summary-card--resolved rounded-2xl border border-emerald-300 dark:border-emerald-500/25 bg-[linear-gradient(145deg,rgba(16,185,129,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{activeComplaints.filter(c => c.status === 'RESOLVED').length}</p>
        </div>
        <div className="complaint-summary-card complaint-summary-card--total rounded-2xl border border-[var(--border-light)] bg-[linear-gradient(145deg,rgba(148,163,184,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
          <p className="text-sm text-[var(--text-tertiary)]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{activeComplaints.length}</p>
        </div>
        {canManageComplaints() && (
          <>
            <div className="complaint-summary-card complaint-summary-card--breached rounded-2xl border border-rose-500/25 bg-[linear-gradient(145deg,rgba(244,63,94,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
              <p className="text-sm text-[var(--text-tertiary)]">SLA Breached</p>
              <p className="mt-1 text-2xl font-bold text-rose-900 dark:text-rose-300">{slaSummary?.breached ?? activeComplaints.filter((c) => c.slaBreached).length}</p>
            </div>
            <div className="complaint-summary-card complaint-summary-card--due rounded-2xl border border-orange-500/25 bg-[linear-gradient(145deg,rgba(249,115,22,0.14),transparent_65%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.12)]">
              <p className="text-sm text-[var(--text-tertiary)]">Due Soon</p>
              <p className="mt-1 text-2xl font-bold text-orange-300">{slaSummary?.dueSoon ?? 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)]/95 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
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
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 lg:w-56"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 lg:w-56"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
        <div className="grid gap-4">
          {filteredComplaints.map((complaint) => {
            const effectiveStatus = complaint.deleted ? 'DELETED' : complaint.status
            const StatusIcon = statusIcons[effectiveStatus] || Clock
            const normalizedCategory = String(complaint.category || 'OTHER').toUpperCase()
            const normalizedPriority = String(complaint.priority || 'MEDIUM').toUpperCase()
            const deleteUndoRemainingMs = getUndoRemainingMs(complaint.deleteUndoExpiresAt)
            const statusUndoRemainingMs = getUndoRemainingMs(complaint.statusUndoExpiresAt)
            const canUndoDelete = Boolean(complaint.deleted) && deleteUndoRemainingMs > 0
            const canUndoStatus = !complaint.deleted
              && ['RESOLVED', 'REJECTED'].includes(String(complaint.status || '').toUpperCase())
              && Boolean(complaint.statusUndoPreviousStatus)
              && statusUndoRemainingMs > 0
            const activeUndoRemainingMs = canUndoDelete ? deleteUndoRemainingMs : (canUndoStatus ? statusUndoRemainingMs : 0)
            const undoContextLabel = canUndoDelete ? 'Deleted' : complaint.status?.replace('_', ' ')
            const canManage = canManageComplaints()
            const showUndoPanel = (canUndoDelete || canUndoStatus) && canManage
            const canChangeStatus = canManage && !complaint.deleted && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED'
            const showCurrentStatus = !canChangeStatus

            return (
              <div
                id={`complaint-${complaint.id}`}
                key={complaint.id}
                className={clsx(
                  'complaint-record-card relative overflow-hidden xl:overflow-visible rounded-2xl border-2 border-cyan-500/40 bg-[var(--bg-card)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.10)]',
                  complaint.deleted && 'border-rose-500/55 bg-[color-mix(in_srgb,var(--bg-card)_90%,rgba(244,63,94,0.10)_10%)]',
                  (isPageGlowActive || highlightedComplaintId === complaint.id) && 'ticket-focus-glow'
                )}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                        effectiveStatus === 'PENDING' && 'border-amber-300 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300',
                        effectiveStatus === 'UNDER_REVIEW' && 'border-blue-300 dark:border-blue-400/25 bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-blue-300',
                        effectiveStatus === 'RESOLVED' && 'border-emerald-300 dark:border-emerald-400/25 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300',
                        effectiveStatus === 'REJECTED' && 'border-rose-300 dark:border-rose-400/25 bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300',
                        effectiveStatus === 'DELETED' && 'border-rose-400 dark:border-rose-400/35 bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300'
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
                          <span className={clsx(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em]',
                            priorityClasses[normalizedPriority] || priorityClasses.MEDIUM
                          )}>
                            {normalizedPriority}
                          </span>
                        </div>

                        <h3 className="mt-1.5 break-words text-[1.04rem] font-bold leading-tight text-[var(--text-primary)] sm:text-[1.16rem]">{complaint.subject}</h3>
                        <p className="mt-2 max-w-3xl text-[0.92rem] leading-relaxed text-[var(--text-secondary)] line-clamp-3">{complaint.description}</p>

                        {complaint.resolution && (
                          <div className="mt-3 max-w-3xl rounded-xl border border-emerald-300 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2.5">
                            <p className="text-xs text-emerald-900 dark:text-emerald-300"><span className="font-semibold">Resolution:</span> {complaint.resolution}</p>
                          </div>
                        )}

                        {complaint.adminRemarks && (
                          <div className="mt-2 max-w-3xl rounded-xl border border-blue-300 dark:border-blue-500/25 bg-blue-50 dark:bg-blue-500/10 px-3.5 py-2.5">
                            <p className="text-xs text-blue-900 dark:text-blue-300"><span className="font-semibold">Admin Remarks:</span> {complaint.adminRemarks}</p>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs text-[var(--text-tertiary)] sm:gap-x-4 sm:gap-y-1.5">
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
                          {complaint.flatNumber && (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                              {`${complaint.wing ? `${complaint.wing}-` : ''}${complaint.flatNumber}${complaint.floor ? ` (F${complaint.floor})` : ''}`}
                            </span>
                          )}
                          {complaint.assignedToName && (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              Assigned: {complaint.assignedToName}
                            </span>
                          )}
                          {complaint.raisedForName && (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                              Raised For: {complaint.raisedForName}
                            </span>
                          )}
                          {complaint.raisedForReason && (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                              Reason: {complaint.raisedForReason}
                            </span>
                          )}
                          {Array.isArray(complaint.attachmentUrls) && complaint.attachmentUrls.length > 0 && (
                            <div className="flex w-full flex-col items-start gap-1.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                Attachments: {complaint.attachmentUrls.length}
                              </span>
                              {complaint.attachmentUrls.map((attachmentUrl, index) => (
                                <button
                                  key={`${complaint.id}-attachment-${index}`}
                                  type="button"
                                  onClick={() => handleDownloadAttachment(attachmentUrl, `${complaint.complaintNumber || 'complaint'}-attachment-${index + 1}`)}
                                  disabled={downloadingAttachmentUrl === attachmentUrl}
                                  className="inline-flex items-center gap-1 rounded-full border border-sky-400/70 bg-sky-100 px-2.5 py-1 text-[10px] font-semibold text-sky-950 shadow-sm shadow-sky-200/60 transition-colors hover:border-sky-500 hover:bg-sky-200 hover:text-sky-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-400/35 dark:bg-cyan-500/12 dark:text-cyan-100 dark:hover:bg-cyan-500/20 sm:px-2 sm:py-0.5 sm:text-[11px]"
                                >
                                  {downloadingAttachmentUrl === attachmentUrl ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                                  <span>Download</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {!['RESOLVED', 'REJECTED'].includes(String(complaint.status || '').toUpperCase()) && (
                            <span className={clsx(
                              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold',
                              complaint.escalationLevel === 'BREACHED' && 'bg-rose-50 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300',
                              complaint.escalationLevel === 'AT_RISK' && 'bg-amber-500/20 text-amber-900 dark:text-amber-300',
                              (!complaint.escalationLevel || complaint.escalationLevel === 'ON_TRACK') && 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300'
                            )}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              SLA {complaint.escalationLevel === 'BREACHED'
                                ? `Breached by ${formatDurationMinutes(complaint.breachDurationMinutes)}`
                                : complaint.escalationLevel === 'AT_RISK'
                                  ? `Due in ${formatDurationMinutes(complaint.slaRemainingMinutes)}`
                                  : `On track (${formatDurationMinutes(complaint.slaRemainingMinutes)} left)`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="complaint-status-panel w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-3.5 shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-all duration-700 xl:sticky xl:top-4 xl:ml-5 xl:w-[16.8rem] xl:shrink-0 xl:self-start">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Update Status</p>

                    <div className={clsx(
                      'overflow-hidden transition-all duration-700 ease-out',
                      showUndoPanel ? 'mb-2.5 max-h-56 opacity-100' : 'max-h-0 opacity-0'
                    )}>
                      <div className="rounded-xl border border-blue-400/40 bg-blue-500/12 p-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-900 dark:text-blue-300">
                          {undoContextLabel} • Undo available
                        </p>
                        <p className="mt-1 text-xs font-semibold text-blue-100/95">{formatCountdown(activeUndoRemainingMs)} remaining</p>
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
                    </div>

                    <div className={clsx(
                      'overflow-hidden transition-all duration-700 ease-out',
                      canChangeStatus ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                    )}>
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint, e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[0_4px_10px_rgba(15,23,42,0.18)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    <div className={clsx(
                      'overflow-hidden transition-all duration-700 ease-out',
                      showCurrentStatus ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                    )}>
                      <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        Current: {complaint.deleted ? 'Deleted' : complaint.status?.replace('_', ' ')}
                      </div>
                    </div>

                    {canManage && !complaint.deleted && (
                      <div className={clsx('grid gap-2.5 transition-all duration-700', String(complaint.status || '').toUpperCase() === 'RESOLVED' ? 'grid-cols-1' : 'grid-cols-2', showCurrentStatus ? 'mt-2.5' : 'mt-1.5')}>
                        {String(complaint.status || '').toUpperCase() !== 'RESOLVED' && (
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
                        )}
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
        <div className="mx-2 w-[calc(100vw-1rem)] max-w-[980px] max-h-[calc(100vh-1.2rem)] overflow-y-auto rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:mx-0 sm:w-full sm:max-h-[calc(100vh-2.5rem)]">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] p-3 sm:p-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingComplaint ? 'Edit Complaint' : 'Log Complaint'}</h3>
              <button onClick={closeModal} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-3 sm:p-4 md:grid-cols-2">
              <FormInput
                label="Subject"
                name="subject"
                defaultValue={editingComplaint?.subject || ''}
                required
                className="md:col-span-2"
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
                  { value: 'NEIGHBOR_ISSUE', label: 'Neighbor Issue' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                placeholder="Select Category"
              />
              <SmartSelect
                label="Priority"
                name="priority"
                defaultValue={editingComplaint?.priority || 'MEDIUM'}
                required
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
                placeholder="Select Priority"
              />
              <FormInput
                label="Location Details"
                name="locationDetails"
                defaultValue={editingComplaint?.locationDetails || ''}
                placeholder="e.g., Near B-wing lift lobby"
                className="md:col-span-2"
              />
              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)]/35 p-3 md:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-[13px] font-semibold text-[var(--text-secondary)]">Upload Attachment</label>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-cyan-200">1 file only</span>
                </div>
                <input
                  type="file"
                  onChange={handleSelectAttachmentFiles}
                  className="block w-full rounded-lg border border-dashed border-[var(--border-light)] bg-[var(--bg-card)]/50 p-2 text-xs text-[var(--text-secondary)] file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-100 hover:file:bg-blue-500/30"
                />
                {selectedFile && (
                  <div className="mt-2 flex flex-col items-start justify-between gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]/40 px-2.5 py-1.5 sm:flex-row sm:items-center">
                    <p className="truncate text-xs text-[var(--text-tertiary)]">Selected: {selectedFile.name}</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-rose-900 hover:text-rose-950 dark:text-rose-300 dark:hover:text-rose-200"
                      onClick={() => {
                        setSelectedFile(null)
                        setUploadProgress(0)
                        setUploadValidationError('')
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {uploadValidationError && (
                  <p className="mt-2 text-xs font-semibold text-rose-900 dark:text-rose-300">{uploadValidationError}</p>
                )}
                {!uploadValidationError && (
                  <p className="mt-2 text-xs text-[var(--text-tertiary)]">Allowed: 1 file, up to 25MB</p>
                )}
                {(uploadAttachmentMutation.isPending || uploadProgress > 0) && (
                  <div className="mt-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/50">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">Uploading: {uploadProgress}%</p>
                  </div>
                )}
                {normalizeCsvUrls(attachmentUrlsInput).length > 0 && (
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">Uploaded URLs attached: {normalizeCsvUrls(attachmentUrlsInput).length}</p>
                )}
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="sm"
                  className="mt-3"
                  onClick={handleUploadAttachments}
                  disabled={!selectedFile || uploadAttachmentMutation.isPending}
                >
                  {uploadAttachmentMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadAttachmentMutation.isPending ? 'Uploading...' : 'Upload File'}
                </NeonSweepButton>
              </div>
              {canUseAdvancedComplaintFields && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:col-span-2">
                  <SmartSelect
                    label="Assign To"
                    name="assignedToUserId"
                    defaultValue={editingComplaint?.assignedToUserId ?? ''}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...assignableUsers
                        .filter((entry) => entry?.id)
                        .map((entry) => ({
                          value: String(entry.id),
                          label: `${entry.name || 'Unnamed'} (${entry.role || 'USER'})`,
                        })),
                    ]}
                    placeholder="Select assignee"
                  />
                  <SmartSelect
                    label="Raised For User"
                    name="raisedForUserId"
                    defaultValue={editingComplaint?.raisedForUserId ?? ''}
                    options={[
                      { value: '', label: 'Self / Not specified' },
                      ...assignableUsers
                        .filter((entry) => entry?.id)
                        .map((entry) => ({
                          value: String(entry.id),
                          label: `${entry.name || 'Unnamed'} (${entry.role || 'USER'})`,
                        })),
                    ]}
                    placeholder="Select user"
                  />
                  <FormInput
                    label="Raised For Reason"
                    name="raisedForReason"
                    defaultValue={editingComplaint?.raisedForReason || ''}
                    className="sm:col-span-2"
                    placeholder="Why this complaint was raised for someone"
                  />
                  <FormInput
                    label="Admin Remarks"
                    name="adminRemarks"
                    defaultValue={editingComplaint?.adminRemarks || ''}
                    className="sm:col-span-2"
                  />
                </div>
              )}
              <FormTextarea
                label="Description"
                name="description"
                defaultValue={editingComplaint?.description || ''}
                rows={4}
                required
                className="md:col-span-2"
              />
              <div className="flex gap-3 pt-4 md:col-span-2">
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
