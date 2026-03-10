import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { ticketApi, userApi, exportApi, downloadBlob } from '../../../../api'
import { Plus, Search, X, Ticket, MessageSquare, User, Edit, AlertTriangle, Clock, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'
import { AsyncButton, InfoTooltip } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

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

export default function Tickets() {
  const { user, canCreateTickets, canManageTickets } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.getAll().then(res => res.data),
  })



  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => userApi.getAll().then(res => res.data.filter(u => u.role === 'EMPLOYEE')),
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
    createMutation.mutate({
      societyId: effectiveSocietyId,
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

  const handleExport = async () => {
    if (!effectiveSocietyId && !isPlatformLevel) {
      toast.error('Unable to export: No society assigned to your account')
      return
    }
    
    setIsExporting(true)
    try {
      // Use societyId if available, otherwise export all for master admin
      const response = await exportApi.tickets(effectiveSocietyId || null, filterStatus || null)
      downloadBlob(response.data, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Tickets exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(error.response?.data?.message || 'Failed to export tickets')
    } finally {
      setIsExporting(false)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

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
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-[0.55rem] rounded-xl font-semibold text-white bg-green-600 transition-transform hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(22,163,74,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          {canCreateTickets() && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-[0.55rem] rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-transform hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
            >
              <Plus size={20} />
              Create Ticket
            </button>
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
          <button
            onClick={() => setShowOverdueOnly(!showOverdueOnly)}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-[0.55rem] rounded-xl font-semibold transition-all hover:-translate-y-px',
              showOverdueOnly ? 'bg-red-600 text-white shadow-[0_10px_18px_rgba(220,38,38,0.25)]' : 'bg-white/10 text-[var(--text-secondary)]'
            )}
          >
            <AlertTriangle size={18} />
            {showOverdueOnly ? 'Showing Overdue' : 'Show Overdue'}
          </button>
        </div>
      </div>

      {/* Tickets List */}
        <div className="flex flex-col gap-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className={clsx(
              'p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(15,23,42,0.12)]',
              ticket.isOverdue && 'border-red-600/45'
            )}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-11 h-11 rounded-[0.9rem] bg-blue-600/[.12] flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[0.8rem] font-mono text-[var(--text-tertiary)]">#{ticket.id}</span>
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
                        {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}
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
                        className="px-3 py-1.5 text-[0.85rem] rounded-[0.65rem] bg-blue-100 text-blue-700 font-semibold transition-all hover:-translate-y-px hover:bg-blue-200"
                      >
                        Assign
                      </button>
                    )}
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
                    <option value="COMPLAINT">Complaint</option>
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
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[#cbd5f5] text-slate-700 bg-[var(--bg-tertiary)] transition-transform hover:-translate-y-px">Cancel</button>
                <AsyncButton type="submit" className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white" isLoading={createMutation.isPending} loadingText="Creating...">Create</AsyncButton>
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
                <p className="text-[0.85rem]">Ticket ID: <span className="font-semibold text-[var(--text-primary)]">#{selectedTicket.id}</span></p>
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
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[#cbd5f5] text-slate-700 bg-[var(--bg-tertiary)] transition-transform hover:-translate-y-px">Cancel</button>
                <AsyncButton type="submit" className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white" isLoading={assignMutation.isPending} loadingText="Assigning...">Assign</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
