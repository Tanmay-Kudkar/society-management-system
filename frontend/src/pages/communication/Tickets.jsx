import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { ticketApi, userApi, societyApi, exportApi, downloadBlob } from '../../../../api'
import { Plus, Search, X, Ticket, MessageSquare, User, Edit, AlertTriangle, Clock, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'
import { InfoTooltip, NeonSweepButton } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDate } from '../../utils/formatUtils'

const statusClasses = {
  OPEN: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800',
  IN_PROGRESS: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800',
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

export default function Tickets() {
  const { user, canCreateTickets, canManageTickets } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [openReplies, setOpenReplies] = useState({})
  const [repliesByTicket, setRepliesByTicket] = useState({})
  const [loadingReplies, setLoadingReplies] = useState({})
  const [searchParams] = useSearchParams()

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const societyIdFromUrl = searchParams.get('society')
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

  const createMutation = useMutation({
    mutationFn: (data) => ticketApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
      setShowModal(false)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => ticketApi.updateStatus(id, status, null, user.id),
    onSuccess: () => queryClient.invalidateQueries(['tickets']),
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, employeeId }) => ticketApi.assign(id, employeeId, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
      setShowAssignModal(false)
      setSelectedTicket(null)
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

  const filteredTickets = useMemo(() => tickets.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || t.status === filterStatus
    const matchesOverdue = !showOverdueOnly || t.isOverdue
    return matchesSearch && matchesStatus && matchesOverdue
  }), [tickets, searchTerm, filterStatus, showOverdueOnly])

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
          setShowReplyModal(false)
          setReplyMessage('')
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
            tone="cyan"
            size="md"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export'}
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
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Open</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'OPEN').length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{tickets.filter(t => t.isOverdue).length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{tickets.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
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
            className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
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
        <div className="flex flex-col gap-4">
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
          ) : filteredTickets.map((ticket) => (
            <div key={ticket.id} className={clsx(
              'p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_16px_28px_rgba(15,23,42,0.12)]',
              ticket.isOverdue && 'border-red-600/45'
            )}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4 flex-1">
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
                        {formatDate(ticket.createdAt)}
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

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {ticket.status === 'OPEN' && (
                      <button
                        onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true) }}
                        className="px-3 py-1.5 text-[0.85rem] rounded-[0.65rem] bg-blue-100 text-blue-700 font-semibold transition-colors duration-200 hover:bg-blue-200"
                      >
                        Assign
                      </button>
                    )}
                    {canManageTickets() && (
                      <button
                        onClick={() => handleReply(ticket)}
                        className="inline-flex items-center gap-1.5 rounded-[0.65rem] bg-emerald-100 px-3 py-1.5 text-[0.85rem] font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-200"
                      >
                        <MessageSquare size={14} />
                        Reply
                      </button>
                    )}
                    <button
                      onClick={() => toggleReplies(ticket.id)}
                      className="inline-flex items-center gap-1.5 rounded-[0.65rem] bg-[var(--bg-tertiary)] px-3 py-1.5 text-[0.85rem] font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))]"
                    >
                      <MessageSquare size={14} />
                      {openReplies[ticket.id] ? 'Hide Replies' : 'View Replies'}
                    </button>
                    {ticket.status !== 'CLOSED' && (
                      <select
                        value={ticket.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                        className="px-3 py-1.5 text-[0.85rem] rounded-[0.65rem] border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/20"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    )}
                  </div>
                  
                  {/* Progress Slider for staff */}
                  {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={ticket.progressPercent || 0}
                        onChange={(e) => updateProgressMutation.mutate({ id: ticket.id, progress: parseInt(e.target.value) })}
                        className="w-24 h-[0.45rem] rounded-full accent-blue-600 cursor-pointer"
                      />
                      <span className="w-9 text-right text-xs text-[var(--text-tertiary)] font-semibold">{ticket.progressPercent || 0}%</span>
                    </div>
                  )}
                </div>
              </div>

              {openReplies[ticket.id] && (
                <div className="mt-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)]/35 p-3">
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
          ))}
        </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
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
                    <option value="TASK">Task</option>
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
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-[40rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Assign Ticket</h3>
              <button onClick={() => setShowAssignModal(false)} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]">
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
                <NeonSweepButton type="button" tone="slate" size="md" onClick={() => setShowAssignModal(false)} className="flex-1">Cancel</NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={assignMutation.isPending}>{assignMutation.isPending ? 'Assigning...' : 'Assign'}</NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-[40rem] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Reply to Ticket</h3>
              <button
                onClick={() => {
                  setShowReplyModal(false)
                  setReplyMessage('')
                }}
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
                  onClick={() => {
                    setShowReplyModal(false)
                    setReplyMessage('')
                  }}
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
        </div>
      )}
    </div>
  )
}
