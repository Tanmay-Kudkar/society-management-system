import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { ticketApi, userApi, societyApi, exportApi, downloadBlob } from '../../../../api'
import { Plus, Search, X, Ticket, MessageSquare, User, Edit, AlertTriangle, Clock, FileSpreadsheet, Trash2, CheckCircle } from 'lucide-react'
import clsx from 'clsx'
import { InfoTooltip, NeonSweepButton, AnimatedModal, DEFAULT_ANIMATED_MODAL_DURATION_MS } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDate, parseServerDateTime } from '../../utils/formatUtils'
import { isActiveTicketStatus, isOpenTicketStatus, isResolvedTicketStatus } from '../../utils/ticketStatusGroups'

const statusClasses = {
  OPEN: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800',
  IN_PROGRESS: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800',
  IN_REVIEW: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800',
  RESOLVED: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800',
  CLOSED: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-[var(--text-secondary)]',
}

const priorityClasses = {
  LOW: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-[var(--text-secondary)]',
  MEDIUM: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800',
  HIGH: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700',
  URGENT: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700',
}

const getProgressClass = (progress) => {
  const base = 'h-full rounded-full transition-[width] duration-300'
  if (progress >= 100) return `${base} bg-green-600`
  if (progress >= 75) return `${base} bg-emerald-500`
  if (progress >= 50) return `${base} bg-blue-600`
  if (progress >= 25) return `${base} bg-yellow-400`
  return `${base} bg-gray-400`
}

const getTicketDisplayNumber = (ticket) => ticket?.ticketNumber || `#${ticket?.id}`
const UNDO_CLOSE_WINDOW_MS = 5 * 60 * 1000
const MODAL_ANIMATION_MS = DEFAULT_ANIMATED_MODAL_DURATION_MS

const formatTicketDateTimeWithDay = (value) => {
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

const toTitle = (value) => String(value || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (c) => c.toUpperCase())

const extractForceDeleteImpacts = (error) => {
  const data = error?.response?.data || {}

  if (Array.isArray(data?.impacts)) {
    return data.impacts
      .map((impact) => ({
        label: toTitle(impact?.label || impact?.name),
        count: Number(impact?.count),
      }))
      .filter((impact) => impact.label && Number.isFinite(impact.count) && impact.count > 0)
  }

  if (data?.linkedRecords && typeof data.linkedRecords === 'object') {
    return Object.entries(data.linkedRecords)
      .map(([key, count]) => ({ label: toTitle(key), count: Number(count) }))
      .filter((impact) => Number.isFinite(impact.count) && impact.count > 0)
  }

  const message = String(data?.message || '')
  const parenthesized = message.match(/\(([^)]+)\)/)?.[1] || ''
  if (!parenthesized) return []

  return [...parenthesized.matchAll(/(\d+)\s+([a-zA-Z][a-zA-Z\s_-]*)/g)]
    .map((match) => ({
      label: toTitle(match[2]),
      count: Number(match[1]),
    }))
    .filter((impact) => Number.isFinite(impact.count) && impact.count > 0)
}

const isTicketEditable = (ticket) => {
  const status = ticket?.status?.toUpperCase()
  return status !== 'CLOSED' && status !== 'IN_REVIEW'
}

export default function Tickets() {
  const { user, canCreateTickets, canManageTickets } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketToEdit, setTicketToEdit] = useState(null)
  const [ticketToDelete, setTicketToDelete] = useState(null)
  const [forceDeleteImpacts, setForceDeleteImpacts] = useState([])
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: 'REQUEST',
    priority: 'MEDIUM',
  })
  const [replyMessage, setReplyMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [openReplies, setOpenReplies] = useState({})
  const [repliesByTicket, setRepliesByTicket] = useState({})
  const [loadingReplies, setLoadingReplies] = useState({})
  const [nowTs, setNowTs] = useState(Date.now())
  const [searchParams] = useSearchParams()
  const [highlightedTicketId, setHighlightedTicketId] = useState(null)
  const [isDeepLinkTransitioning, setIsDeepLinkTransitioning] = useState(false)
  const [isPageGlowActive, setIsPageGlowActive] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const canDeleteTickets = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY'].includes(user?.role)
  const canAssignTickets = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'MANAGER'].includes(user?.role)
  const isCommitteeUser = user?.role === 'COMMITTEE'
  const societyIdFromUrl = searchParams.get('society')
  const selectedTicketFromUrlRaw = Number(searchParams.get('ticket'))
  const selectedTicketFromUrl = Number.isFinite(selectedTicketFromUrlRaw) && selectedTicketFromUrlRaw > 0
    ? selectedTicketFromUrlRaw
    : null
  const pageFocusMode = searchParams.get('focus') === 'page'
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? Number(societyIdFromUrl) : user?.societyId

  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.getAll().then(res => res.data),
  })



  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => userApi.getAll().then(res => res.data.filter(u => u.role === 'EMPLOYEE')),
  })

  const { data: societies = [] } = useQuery({
    queryKey: ['societies-for-tickets'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel,
  })

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setTimeout(() => setSelectedTicket(null), MODAL_ANIMATION_MS)
  }

  const closeReplyModal = () => {
    setShowReplyModal(false)
    setTimeout(() => {
      setSelectedTicket(null)
      setReplyMessage('')
    }, MODAL_ANIMATION_MS)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setTimeout(() => setTicketToEdit(null), MODAL_ANIMATION_MS)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setTimeout(() => {
      setTicketToDelete(null)
      setForceDeleteImpacts([])
    }, MODAL_ANIMATION_MS)
  }

  const closeForceDeleteModal = () => {
    setShowForceDeleteModal(false)
    setTimeout(() => {
      setTicketToDelete(null)
      setForceDeleteImpacts([])
    }, MODAL_ANIMATION_MS)
  }

  const closeAllDeleteModals = () => {
    setShowDeleteModal(false)
    setShowForceDeleteModal(false)
    setTimeout(() => {
      setTicketToDelete(null)
      setForceDeleteImpacts([])
    }, MODAL_ANIMATION_MS)
  }

  const createMutation = useMutation({
    mutationFn: (data) => ticketApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
      setShowModal(false)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => ticketApi.updateStatus(id, status, null, user.id),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries(['tickets'])
      if (variables?.finalizeClose) {
        toast.success('Ticket close finalized')
        return
      }
      const nextStatus = response?.data?.status
      if (nextStatus === 'CLOSED') {
        toast.info('Ticket closed. Undo is available for 5 minutes.')
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update ticket status')
    },
  })

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => ticketApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
      closeEditModal()
      toast.success('Ticket updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update ticket')
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, employeeId }) => ticketApi.assign(id, employeeId, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
      closeAssignModal()
    },
  })

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, progress }) => ticketApi.updateProgress(id, progress, user.id),
    onSuccess: () => queryClient.invalidateQueries(['tickets']),
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => ticketApi.reply(id, message, user.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(['tickets'])
      fetchReplies(variables.id)
      toast.success('Reply sent successfully')
    },
    onError: (error) => {
      const apiMessage = error.response?.data?.message || 'Failed to send reply'
      if (apiMessage === 'You already sent this reply recently.') {
        toast.warning(apiMessage)
        return
      }
      toast.error(apiMessage)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, force = false }) => ticketApi.delete(id, user.id, force),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(['tickets'])
      closeAllDeleteModals()
      toast.success(variables?.force ? 'Ticket force-deleted successfully' : 'Ticket deleted successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete ticket')
    },
  })

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.type?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = !filterStatus || t.status === filterStatus
        const matchesOverdue = !showOverdueOnly || t.isOverdue
        return matchesSearch && matchesStatus && matchesOverdue
      })
      .sort((a, b) => {
        const aTime = parseServerDateTime(a.createdAt)?.getTime() ?? 0
        const bTime = parseServerDateTime(b.createdAt)?.getTime() ?? 0
        if (bTime !== aTime) return bTime - aTime
        return (b.id ?? 0) - (a.id ?? 0)
      })
  }, [tickets, searchTerm, filterStatus, showOverdueOnly])

  const summary = useMemo(() => {
    return {
      active: tickets.filter((ticket) => isActiveTicketStatus(ticket.status)).length,
      open: tickets.filter((ticket) => isOpenTicketStatus(ticket.status)).length,
      resolved: tickets.filter((ticket) => isResolvedTicketStatus(ticket.status)).length,
      overdue: tickets.filter((ticket) => ticket.isOverdue).length,
      total: tickets.length,
    }
  }, [tickets])

  useEffect(() => {
    if (!pageFocusMode) return

    const startTimer = setTimeout(() => {
      window.scrollBy({ top: 220, behavior: 'smooth' })
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
    if (pageFocusMode) {
      setIsDeepLinkTransitioning(false)
      return
    }

    if (!selectedTicketFromUrl) {
      setIsDeepLinkTransitioning(false)
      return
    }

    if (!selectedTicketFromUrl || isLoading || tickets.length === 0) return

    const selectedExists = tickets.some((ticket) => ticket.id === selectedTicketFromUrl)
    if (!selectedExists) return

    setIsDeepLinkTransitioning(true)

    let glowStartTimer
    let glowEndTimer
    let revealTimer

    const timer = setTimeout(() => {
      const element = document.getElementById(`ticket-${selectedTicketFromUrl}`)
      if (!element) return
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      revealTimer = setTimeout(() => setIsDeepLinkTransitioning(false), 420)

      // Reset first so navigating to the same ticket can retrigger the glow.
      setHighlightedTicketId(null)
      glowStartTimer = setTimeout(() => setHighlightedTicketId(selectedTicketFromUrl), 540)
      glowEndTimer = setTimeout(() => setHighlightedTicketId(null), 2480)
    }, 80)

    return () => {
      clearTimeout(timer)
      clearTimeout(revealTimer)
      clearTimeout(glowStartTimer)
      clearTimeout(glowEndTimer)
    }
  }, [pageFocusMode, selectedTicketFromUrl, isLoading, tickets])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const selectedSocietyId = isPlatformLevel
      ? Number(formData.get('societyId'))
      : Number(effectiveSocietyId)

    if (!selectedSocietyId) {
      toast.error('Society is required. Select a society first.')
      return
    }

    createMutation.mutate({
      societyId: selectedSocietyId,
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      priority: formData.get('priority'),
    })
  }

  const handleAssign = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    assignMutation.mutate({
      id: selectedTicket.id,
      employeeId: parseInt(formData.get('employeeId')),
    })
  }

  const fetchReplies = async (ticketId) => {
    if (!ticketId) return
    setLoadingReplies(prev => ({ ...prev, [ticketId]: true }))
    try {
      const res = await ticketApi.getReplies(ticketId)
      setRepliesByTicket(prev => ({ ...prev, [ticketId]: res.data || [] }))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load replies')
    } finally {
      setLoadingReplies(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  const toggleReplies = async (ticketId) => {
    const nextOpen = !openReplies[ticketId]
    setOpenReplies(prev => ({ ...prev, [ticketId]: nextOpen }))
    if (nextOpen && !repliesByTicket[ticketId]) {
      await fetchReplies(ticketId)
    }
  }

  const handleReply = (ticket) => {
    setSelectedTicket(ticket)
    setReplyMessage('')
    setShowReplyModal(true)
  }

  const openEditModal = (ticket) => {
    if (!isTicketEditable(ticket)) {
      toast.warning('This ticket cannot be edited in its current status')
      return
    }

    setTicketToEdit(ticket)
    setEditForm({
      title: ticket?.title || '',
      description: ticket?.description || '',
      type: ticket?.type || 'REQUEST',
      priority: ticket?.priority || 'MEDIUM',
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!ticketToEdit?.id) return
    if (!isTicketEditable(ticketToEdit)) {
      toast.warning('This ticket cannot be edited in its current status')
      closeEditModal()
      return
    }

    const resolvedSocietyId = Number(ticketToEdit?.societyId || effectiveSocietyId)
    if (!resolvedSocietyId) {
      toast.error('Society ID is required')
      return
    }

    updateTicketMutation.mutate({
      id: ticketToEdit.id,
      data: {
        societyId: resolvedSocietyId,
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        priority: editForm.priority,
      },
    })
  }

  const getUndoCloseRemainingMs = (ticket) => {
    if (ticket?.status !== 'CLOSED') return 0
    const rawExpiry = ticket?.closeUndoExpiresAt
    if (!rawExpiry) return 0

    const utcParsed = parseServerDateTime(rawExpiry)
    const utcRemaining = utcParsed ? (utcParsed.getTime() - nowTs) : 0
    const utcIsPlausible = utcRemaining > 0 && utcRemaining <= (UNDO_CLOSE_WINDOW_MS + 5000)

    if (utcIsPlausible) {
      return utcRemaining
    }

    // Backward compatibility for older records stored without timezone semantics.
    const localParsed = new Date(String(rawExpiry))
    if (isNaN(localParsed.getTime())) {
      return 0
    }
    const localRemaining = localParsed.getTime() - nowTs
    return localRemaining > 0 && localRemaining <= (UNDO_CLOSE_WINDOW_MS + 5000)
      ? localRemaining
      : 0
  }

  const formatCountdown = (remainingMs) => {
    const totalSeconds = Math.floor(remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const openDeleteModal = (ticket) => {
    setTicketToDelete(ticket)
    setShowForceDeleteModal(false)
    setForceDeleteImpacts([])
    setShowDeleteModal(true)
  }

  const isForceDeleteEligible = (error) => {
    const serverMessage = error?.response?.data?.message || ''
    const normalized = String(serverMessage).toLowerCase()
    return error?.response?.status === 409
      && (normalized.includes('use force delete') || normalized.includes('referenced by other records'))
  }

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return

    try {
      await deleteMutation.mutateAsync({ id: ticketToDelete.id, force: false })
    } catch (error) {
      if (!isForceDeleteEligible(error)) {
        return
      }

      setForceDeleteImpacts(extractForceDeleteImpacts(error))
      setShowDeleteModal(false)
      setShowForceDeleteModal(true)
    }
  }

  const handleForceDeleteConfirm = async () => {
    if (!ticketToDelete) return
    try {
      await deleteMutation.mutateAsync({ id: ticketToDelete.id, force: true })
    } catch {
      // Error toast is already handled by mutation onError
    }
  }

  const handleReplySubmit = (e) => {
    e.preventDefault()
    const message = replyMessage.trim()
    if (!selectedTicket || !message) {
      toast.error('Reply message is required')
      return
    }
    replyMutation.mutate(
      { id: selectedTicket.id, message },
      {
        onSuccess: () => {
          closeReplyModal()
        },
      },
    )
  }

  const handleExport = async () => {
    if (!effectiveSocietyId && !isPlatformLevel) {
      toast.error('Unable to export: No society assigned to your account')
      return
    }
    
    setIsExporting(true)
    try {
      const response = isPlatformLevel && !effectiveSocietyId
        ? await exportApi.allTickets(filterStatus || null)
        : await exportApi.tickets(effectiveSocietyId, filterStatus || null)
      downloadBlob(response.data, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Tickets exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(error.response?.data?.message || 'Failed to export tickets')
    } finally {
      setIsExporting(false)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading)

  if (showSkeleton) {
    return (
      <div className="block">
        <WakeUpBanner />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <FiltersSkeleton filterCount={2} />
        <ListSkeleton count={5} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="block">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Failed to load tickets</h2>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">Something went wrong while fetching tickets.</p>
          <NeonSweepButton tone="cyan" size="md" onClick={() => queryClient.invalidateQueries(['tickets'])}>
            Try Again
          </NeonSweepButton>
        </div>
      </div>
    )
  }

  return (
    <div className="block">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tickets</h1>
            <InfoTooltip text="Manage support tickets and requests" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <NeonSweepButton
            tone="slate"
            size="md"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export XLSX'}
          </NeonSweepButton>
          {canCreateTickets() && (
            <NeonSweepButton
              tone="violet"
              size="md"
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto"
            >
              <Plus size={20} />
              Create Ticket
            </NeonSweepButton>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Active Queue</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{summary.active}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Open</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{summary.open}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{summary.resolved}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{summary.overdue}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{summary.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-[0.55rem] px-3 pl-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20 lg:w-56"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <NeonSweepButton
            onClick={() => setShowOverdueOnly(!showOverdueOnly)}
            tone={showOverdueOnly ? 'danger' : 'slate'}
            size="md"
            className="w-full sm:w-auto"
          >
            <AlertTriangle size={18} />
            {showOverdueOnly ? 'Showing Overdue' : 'Show Overdue'}
          </NeonSweepButton>
        </div>
      </div>

      {/* Tickets List */}
        <div className={clsx(
          'flex flex-col gap-4 transition-all duration-300 ease-out',
          isDeepLinkTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
        )}>
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)]">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center mb-4">
                <Ticket className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">No tickets to display</h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                {searchTerm || filterStatus || showOverdueOnly
                  ? 'No tickets match your current filters. Try adjusting your search.'
                  : 'There are no tickets yet. Create one to get started.'}
              </p>
              {canCreateTickets && !searchTerm && !filterStatus && !showOverdueOnly && (
                <NeonSweepButton tone="cyan" size="md" onClick={() => setShowModal(true)}>
                  <Plus size={18} /> Create Ticket
                </NeonSweepButton>
              )}
            </div>
          ) : filteredTickets.map((ticket) => {
            const undoRemainingMs = getUndoCloseRemainingMs(ticket)
            const showUndoBanner = ticket.status === 'CLOSED' && undoRemainingMs > 0
            const repliesOpen = Boolean(openReplies[ticket.id])

            return (
            <div id={`ticket-${ticket.id}`} key={ticket.id} className={clsx(
              'relative overflow-hidden p-5 rounded-2xl bg-[var(--bg-card)] border-2 border-blue-500/40 shadow-[0_12px_24px_rgba(15,23,42,0.06)]',
              ticket.isOverdue && 'border-red-600/55',
              (isPageGlowActive || highlightedTicketId === ticket.id) && 'ticket-focus-glow'
            )}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-[0.9rem] bg-blue-600/[.12] flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[0.8rem] font-mono text-[var(--text-tertiary)]">{getTicketDisplayNumber(ticket)}</span>
                      <span className={clsx(statusClasses[ticket.status] || statusClasses.OPEN)}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                      <span className={clsx(priorityClasses[ticket.priority] || priorityClasses.MEDIUM)}>
                        {ticket.priority}
                      </span>
                      {ticket.isOverdue && (
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold animate-pulse',
                          ticket.escalationLevel === 2 ? 'bg-red-600 text-white' :
                          ticket.escalationLevel === 1 ? 'bg-orange-500 text-white' : 'bg-red-100 text-red-700'
                        )}>
                          <AlertTriangle size={12} />
                          {ticket.escalationLevel === 2 ? 'CRITICAL' : 
                           ticket.escalationLevel === 1 ? 'ESCALATED' : 'Overdue'}
                          {ticket.overdueDays > 0 && ` (${ticket.overdueDays}d)`}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-base font-semibold text-[var(--text-primary)]">{ticket.title}</h3>
                    <p className="mt-1.5 text-[0.85rem] text-[var(--text-tertiary)] line-clamp-2">{ticket.description}</p>
                    {ticket.resolution && (
                      <p className="mt-1.5 text-[0.8rem] font-semibold text-[var(--text-secondary)]">
                        Latest reply: {ticket.resolution}
                        {ticket.lastReplyBy && ` - ${ticket.lastReplyBy}`}
                      </p>
                    )}
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[0.7rem] text-[var(--text-tertiary)] mb-1.5">
                        <span>Progress</span>
                        <span className="font-semibold">{ticket.progressPercent || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10">
                        <div 
                          className={clsx(getProgressClass(ticket.progressPercent || 0))}
                          style={{ width: `${ticket.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--text-tertiary)]">
                      <span className="inline-flex items-center gap-1.5">{ticket.type}</span>
                      {isPlatformLevel && <span className="inline-flex items-center gap-1.5">{ticket.societyName}</span>}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatTicketDateTimeWithDay(ticket.createdAt)}
                      </span>
                      {ticket.pendingDays > 0 && (
                        <span className={clsx("inline-flex items-center gap-1.5", ticket.isOverdue && "text-red-600 font-semibold")}> 
                          {ticket.pendingDays} days
                        </span>
                      )}
                      {ticket.assignedToId && (
                        <span className="inline-flex items-center gap-1.5">
                          <User size={12} />
                          {ticket.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto md:items-end">
                  <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:items-center md:justify-end">
                    {ticket.status === 'OPEN' && canAssignTickets && (
                      <NeonSweepButton
                        onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true) }}
                        tone="violet"
                        size="sm"
                        className="w-full md:w-auto justify-center"
                      >
                        Assign
                      </NeonSweepButton>
                    )}
                    {canManageTickets() && (
                      <NeonSweepButton
                        onClick={() => handleReply(ticket)}
                        tone="cyan"
                        size="sm"
                        className="w-full md:w-auto justify-center"
                      >
                        <MessageSquare size={14} />
                        Reply
                      </NeonSweepButton>
                    )}
                    {canManageTickets() && (
                      <NeonSweepButton
                        onClick={() => openEditModal(ticket)}
                        tone="slate"
                        size="sm"
                        className="w-full md:w-auto justify-center"
                        disabled={!isTicketEditable(ticket)}
                      >
                        <Edit size={14} />
                        {isTicketEditable(ticket) ? 'Edit' : 'Locked'}
                      </NeonSweepButton>
                    )}
                    <NeonSweepButton
                      onClick={() => toggleReplies(ticket.id)}
                      tone="slate"
                      size="sm"
                      className="w-full md:w-auto justify-center"
                    >
                      <MessageSquare size={14} />
                      {openReplies[ticket.id] ? 'Hide Replies' : 'View Replies'}
                    </NeonSweepButton>
                    {canDeleteTickets && (
                      <NeonSweepButton
                        onClick={() => openDeleteModal(ticket)}
                        tone="danger"
                        size="sm"
                        className="w-full md:w-auto justify-center"
                      >
                        <Trash2 size={14} />
                        Delete
                      </NeonSweepButton>
                    )}
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value, previousStatus: ticket.status })}
                      disabled={!canManageTickets()}
                      className="col-span-2 w-full md:col-span-1 md:w-auto min-w-[9rem] px-3 py-2 text-[0.85rem] rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div
                    className={clsx(
                      'overflow-hidden transition-all duration-300 ease-out',
                      showUndoBanner ? 'max-h-20 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[0.78rem] text-amber-800 dark:text-amber-300">
                      <span>Undo available for {formatCountdown(undoRemainingMs)}</span>
                      <div className="flex items-center gap-2">
                        <NeonSweepButton
                          tone="slate"
                          size="sm"
                          className="!px-3 !py-1"
                          onClick={() => {
                            const previousStatus = ticket?.closeUndoPreviousStatus || 'IN_PROGRESS'
                            updateStatusMutation.mutate({ id: ticket.id, status: previousStatus, previousStatus: 'CLOSED' })
                          }}
                        >
                          Undo Close
                        </NeonSweepButton>
                        <NeonSweepButton
                          tone="emerald"
                          size="sm"
                          className="!px-3 !py-1 border-2 border-emerald-300/55 bg-emerald-500/25 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.45),0_8px_20px_rgba(16,185,129,0.22)]"
                          onClick={() => {
                            updateStatusMutation.mutate({ id: ticket.id, status: 'CLOSED', finalizeClose: true })
                          }}
                        >
                          <CheckCircle size={14} />
                          Confirm Close
                        </NeonSweepButton>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Slider for staff */}
                  {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={ticket.progressPercent || 0}
                        onChange={(e) => updateProgressMutation.mutate({ id: ticket.id, progress: parseInt(e.target.value) })}
                        disabled={ticket.status === 'IN_REVIEW' || !canManageTickets()}
                        className="flex-1 md:flex-none md:w-24 h-[0.45rem] rounded-full accent-blue-600 cursor-pointer"
                      />
                      <span className="w-9 text-right text-xs text-[var(--text-tertiary)] font-semibold">{ticket.progressPercent || 0}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={clsx(
                  'overflow-hidden transition-all duration-300 ease-out',
                  repliesOpen ? 'max-h-[32rem] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                )}
              >
                {repliesOpen && (
                  <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)]/35 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Reply Thread</p>
                    {loadingReplies[ticket.id] ? (
                      <p className="text-sm text-[var(--text-tertiary)]">Loading replies...</p>
                    ) : (repliesByTicket[ticket.id] || []).length === 0 ? (
                      <p className="text-sm text-[var(--text-tertiary)]">No replies yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {(repliesByTicket[ticket.id] || []).map((reply) => (
                          <div key={reply.id} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2">
                            <p className="text-[0.86rem] font-semibold text-[var(--text-primary)]">{reply.message}</p>
                            <p className="mt-1 text-[0.75rem] text-[var(--text-tertiary)]">
                              {reply.repliedByName || 'Unknown user'} - {formatDate(reply.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>

      {/* Create Ticket Modal */}
      <AnimatedModal open={showModal}>
        <div className="w-full max-w-[40rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create Ticket</h3>
              <button onClick={() => setShowModal(false)} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {isPlatformLevel && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Society</label>
                  <select
                    name="societyId"
                    required
                    defaultValue={effectiveSocietyId || ''}
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                  >
                    <option value="" disabled>Select society</option>
                    {societies.map((society) => (
                      <option key={society.id} value={society.id}>{society.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Title</label>
                <input type="text" name="title" required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Description</label>
                <textarea name="description" rows={3} required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all resize-y focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Type</label>
                  <select name="type" required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20">
                    <option value="REQUEST">Request</option>
                    <option value="ISSUE">Issue</option>
                    {!isCommitteeUser && <option value="TASK">Task</option>}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Priority</label>
                  <select name="priority" required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={() => setShowModal(false)} className="flex-1">Cancel</NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</NeonSweepButton>
              </div>
            </form>
        </div>
      </AnimatedModal>

      {/* Assign Modal */}
      <AnimatedModal open={showAssignModal}>
        {selectedTicket && (
          <div className="w-full max-w-[40rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Assign Ticket</h3>
              <button onClick={closeAssignModal} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-5 flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                <p className="text-[0.85rem]">Ticket ID: <span className="font-semibold text-[var(--text-primary)]">{getTicketDisplayNumber(selectedTicket)}</span></p>
                <p className="text-[0.85rem]">{selectedTicket.title}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Assign To</label>
                <select name="employeeId" required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={closeAssignModal} className="flex-1">Cancel</NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={assignMutation.isPending}>{assignMutation.isPending ? 'Assigning...' : 'Assign'}</NeonSweepButton>
              </div>
            </form>
          </div>
        )}
      </AnimatedModal>

      {/* Reply Modal */}
      <AnimatedModal open={showReplyModal}>
        {selectedTicket && (
          <div className="w-full max-w-[40rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Reply to Ticket</h3>
              <button
                onClick={closeReplyModal}
                className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReplySubmit} className="p-5 flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                <p className="text-[0.85rem]">Ticket ID: <span className="font-semibold text-[var(--text-primary)]">{getTicketDisplayNumber(selectedTicket)}</span></p>
                <p className="text-[0.85rem]">{selectedTicket.title}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Message</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  required
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all resize-y focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                  placeholder="Write your reply..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={closeReplyModal}
                  className="flex-1"
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                >
                  {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        )}
      </AnimatedModal>

      {/* Edit Modal */}
      <AnimatedModal open={showEditModal}>
        {ticketToEdit && (
          <div className="w-full max-w-[42rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit Ticket</h3>
              <button
                onClick={closeEditModal}
                className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                <p className="text-[0.85rem]">Ticket ID: <span className="font-semibold text-[var(--text-primary)]">{getTicketDisplayNumber(ticketToEdit)}</span></p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all resize-y focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                  >
                    <option value="REQUEST">Request</option>
                    <option value="ISSUE">Issue</option>
                    <option value="TASK">Task</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  className="flex-1"
                  onClick={closeEditModal}
                  disabled={updateTicketMutation.isPending}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={updateTicketMutation.isPending || !editForm.title.trim() || !editForm.description.trim()}
                >
                  {updateTicketMutation.isPending ? 'Saving...' : 'Save Changes'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        )}
      </AnimatedModal>

      {/* Delete Modal */}
      <AnimatedModal open={showDeleteModal}>
        {ticketToDelete && (
          <div className="w-full max-w-[30rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Ticket</h3>
              <button
                onClick={closeDeleteModal}
                className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="rounded-xl border border-red-600/30 bg-red-500/10 px-3.5 py-3 text-[0.86rem] text-red-700 dark:text-red-300">
                <p className="font-semibold">Warning</p>
                <p className="mt-1">This action will permanently delete the ticket and cannot be undone.</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-tertiary)] px-3.5 py-3 text-[0.86rem] text-[var(--text-secondary)]">
                <p>Ticket ID: <span className="font-semibold text-[var(--text-primary)]">{getTicketDisplayNumber(ticketToDelete)}</span></p>
                <p className="mt-1 text-[var(--text-primary)]">{ticketToDelete.title}</p>
              </div>
              <div className="flex gap-3 pt-1">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  className="flex-1"
                  onClick={closeDeleteModal}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="button"
                  tone="danger"
                  size="md"
                  className="flex-1"
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Ticket'}
                </NeonSweepButton>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Final Warning Force Delete Modal */}
      <AnimatedModal open={showForceDeleteModal}>
        {ticketToDelete && (
          <div className="w-full max-w-[30rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Final Warning: Force Delete Ticket</h3>
              <button
                onClick={closeForceDeleteModal}
                className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="rounded-xl border border-red-600/35 bg-red-500/10 px-3.5 py-3 text-[0.86rem] text-red-700 dark:text-red-300">
                <p className="font-semibold">Critical warning</p>
                <p className="mt-1">This ticket has linked records. Force delete will auto-clean related references and cannot be undone.</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-tertiary)] px-3.5 py-3 text-[0.86rem] text-[var(--text-secondary)]">
                <p>Ticket ID: <span className="font-semibold text-[var(--text-primary)]">{getTicketDisplayNumber(ticketToDelete)}</span></p>
                <p className="mt-1 text-[var(--text-primary)]">{ticketToDelete.title}</p>
              </div>
              {forceDeleteImpacts.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3">
                  <p className="text-[0.82rem] font-semibold text-amber-800 dark:text-amber-300">Linked records that will be auto-cleaned</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[0.8rem] text-[var(--text-secondary)]">
                    {forceDeleteImpacts.map((impact) => (
                      <div key={impact.label} className="rounded-lg bg-[var(--bg-card)] px-2.5 py-1.5">
                        <span className="font-semibold text-[var(--text-primary)]">{impact.count}</span> {impact.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  className="flex-1"
                  onClick={closeForceDeleteModal}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="button"
                  tone="danger"
                  size="md"
                  className="flex-1"
                  onClick={handleForceDeleteConfirm}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Force Deleting...' : 'Force Delete'}
                </NeonSweepButton>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  )
}
