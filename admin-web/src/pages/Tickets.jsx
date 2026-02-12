import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ticketApi, userApi, exportApi, downloadBlob } from '../../../api'
import { Plus, Search, X, Ticket, MessageSquare, User, Edit, AlertTriangle, Clock, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'

const statusClasses = {
  OPEN: 'tickets-badge tickets-badge--open',
  IN_PROGRESS: 'tickets-badge tickets-badge--progress',
  RESOLVED: 'tickets-badge tickets-badge--resolved',
  CLOSED: 'tickets-badge tickets-badge--closed',
}

const priorityClasses = {
  LOW: 'tickets-badge tickets-badge--priority-low',
  MEDIUM: 'tickets-badge tickets-badge--priority-medium',
  HIGH: 'tickets-badge tickets-badge--priority-high',
  URGENT: 'tickets-badge tickets-badge--priority-urgent',
}

const getProgressClass = (progress) => {
  if (progress >= 100) return 'tickets-progress-bar tickets-progress-bar--done'
  if (progress >= 75) return 'tickets-progress-bar tickets-progress-bar--strong'
  if (progress >= 50) return 'tickets-progress-bar tickets-progress-bar--good'
  if (progress >= 25) return 'tickets-progress-bar tickets-progress-bar--start'
  return 'tickets-progress-bar tickets-progress-bar--idle'
}

export default function Tickets() {
  const { user, canCreateTickets, canManageTickets } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  const { data: tickets = [], isLoading } = useQuery({
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

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || t.status === filterStatus
    const matchesOverdue = !showOverdueOnly || t.isOverdue
    return matchesSearch && matchesStatus && matchesOverdue
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createMutation.mutate({
      societyId: user.societyId,
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
    if (!user.societyId && !isPlatformLevel) {
      toast.error('Unable to export: No society assigned to your account')
      return
    }
    
    setIsExporting(true)
    try {
      // Use societyId if available, otherwise export all for master admin
      const response = await exportApi.tickets(user.societyId || null, filterStatus || null)
      downloadBlob(response.data, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Tickets exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(error.response?.data?.message || 'Failed to export tickets')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="tickets-page">
      {/* Header */}
      <div className="tickets-header">
        <div>
          <h1 className="tickets-title">Tickets</h1>
          <p className="tickets-subtitle">Manage support tickets and requests</p>
        </div>
        <div className="tickets-header-actions">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="tickets-export-button"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          {canCreateTickets() && (
            <button
              onClick={() => setShowModal(true)}
              className="tickets-create-button"
            >
              <Plus size={20} />
              Create Ticket
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="tickets-summary">
        <div className="tickets-summary-card">
          <p className="tickets-summary-label">Open</p>
          <p className="tickets-summary-value tickets-summary-value--open">{tickets.filter(t => t.status === 'OPEN').length}</p>
        </div>
        <div className="tickets-summary-card">
          <p className="tickets-summary-label">In Progress</p>
          <p className="tickets-summary-value tickets-summary-value--progress">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="tickets-summary-card">
          <p className="tickets-summary-label">Resolved</p>
          <p className="tickets-summary-value tickets-summary-value--resolved">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
        </div>
        <div className="tickets-summary-card">
          <p className="tickets-summary-label">Overdue</p>
          <p className="tickets-summary-value tickets-summary-value--overdue">{tickets.filter(t => t.isOverdue).length}</p>
        </div>
        <div className="tickets-summary-card">
          <p className="tickets-summary-label">Total</p>
          <p className="tickets-summary-value tickets-summary-value--total">{tickets.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="tickets-filters">
        <div className="tickets-filters-row">
          <div className="tickets-search">
            <Search className="tickets-search-icon" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tickets-search-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="tickets-filter-select"
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
              'tickets-overdue-toggle',
              showOverdueOnly && 'is-active'
            )}
          >
            <AlertTriangle size={18} />
            {showOverdueOnly ? 'Showing Overdue' : 'Show Overdue'}
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="tickets-loading">
          <div className="tickets-spinner" />
        </div>
      ) : (
        <div className="tickets-list">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className={clsx(
              'tickets-card',
              ticket.isOverdue && 'tickets-card--overdue'
            )}>
              <div className="tickets-card-body">
                <div className="tickets-card-left">
                  <div className="tickets-card-icon">
                    <Ticket className="tickets-card-icon-svg" />
                  </div>
                  <div className="tickets-card-content">
                    <div className="tickets-card-meta">
                      <span className="tickets-card-id">#{ticket.id}</span>
                      <span className={clsx(statusClasses[ticket.status] || statusClasses.OPEN)}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                      <span className={clsx(priorityClasses[ticket.priority] || priorityClasses.MEDIUM)}>
                        {ticket.priority}
                      </span>
                      {ticket.isOverdue && (
                        <span className={clsx(
                          'tickets-overdue-badge',
                          ticket.escalationLevel === 2 ? 'is-critical' :
                          ticket.escalationLevel === 1 ? 'is-escalated' : 'is-overdue'
                        )}>
                          <AlertTriangle size={12} />
                          {ticket.escalationLevel === 2 ? 'CRITICAL' : 
                           ticket.escalationLevel === 1 ? 'ESCALATED' : 'Overdue'}
                          {ticket.overdueDays > 0 && ` (${ticket.overdueDays}d)`}
                        </span>
                      )}
                    </div>
                    <h3 className="tickets-card-title">{ticket.title}</h3>
                    <p className="tickets-card-desc line-clamp-2">{ticket.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="tickets-progress">
                      <div className="tickets-progress-header">
                        <span>Progress</span>
                        <span className="tickets-progress-value">{ticket.progressPercent || 0}%</span>
                      </div>
                      <div className="tickets-progress-track">
                        <div 
                          className={clsx(getProgressClass(ticket.progressPercent || 0))}
                          style={{ width: `${ticket.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="tickets-meta">
                      <span className="tickets-meta-item">{ticket.type}</span>
                      {isPlatformLevel && <span className="tickets-meta-item">{ticket.societyName}</span>}
                      <span className="tickets-meta-item">
                        <Clock size={12} />
                        {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      {ticket.pendingDays > 0 && (
                        <span className={clsx("tickets-meta-item", ticket.isOverdue && "tickets-meta-item--danger")}> 
                          {ticket.pendingDays} days
                        </span>
                      )}
                      {ticket.assignedToId && (
                        <span className="tickets-meta-item">
                          <User size={12} />
                          {ticket.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tickets-actions">
                  <div className="tickets-action-row">
                    {ticket.status === 'OPEN' && (
                      <button
                        onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true) }}
                        className="tickets-assign-button"
                      >
                        Assign
                      </button>
                    )}
                    {ticket.status !== 'CLOSED' && (
                      <select
                        value={ticket.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                        className="tickets-status-select"
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
                    <div className="tickets-progress-control">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={ticket.progressPercent || 0}
                        onChange={(e) => updateProgressMutation.mutate({ id: ticket.id, progress: parseInt(e.target.value) })}
                        className="tickets-progress-range"
                      />
                      <span className="tickets-progress-value">{ticket.progressPercent || 0}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="tickets-modal">
          <div className="tickets-modal-card">
            <div className="tickets-modal-header">
              <h3 className="tickets-modal-title">Create Ticket</h3>
              <button onClick={() => setShowModal(false)} className="tickets-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="tickets-modal-body">
              <div className="tickets-field">
                <label className="tickets-label">Title</label>
                <input type="text" name="title" required className="tickets-input" />
              </div>
              <div className="tickets-field">
                <label className="tickets-label">Description</label>
                <textarea name="description" rows={3} required className="tickets-textarea" />
              </div>
              <div className="tickets-form-grid">
                <div className="tickets-field">
                  <label className="tickets-label">Type</label>
                  <select name="type" required className="tickets-input">
                    <option value="COMPLAINT">Complaint</option>
                    <option value="REQUEST">Request</option>
                    <option value="ISSUE">Issue</option>
                    <option value="TASK">Task</option>
                  </select>
                </div>
                <div className="tickets-field">
                  <label className="tickets-label">Priority</label>
                  <select name="priority" required className="tickets-input">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="tickets-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="tickets-cancel-button">Cancel</button>
                <button type="submit" className="tickets-submit-button">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTicket && (
        <div className="tickets-modal">
          <div className="tickets-modal-card">
            <div className="tickets-modal-header">
              <h3 className="tickets-modal-title">Assign Ticket</h3>
              <button onClick={() => setShowAssignModal(false)} className="tickets-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="tickets-modal-body">
              <div className="tickets-assign-summary">
                <p className="tickets-assign-text">Ticket ID: <span className="tickets-assign-strong">#{selectedTicket.id}</span></p>
                <p className="tickets-assign-text">{selectedTicket.title}</p>
              </div>
              <div className="tickets-field">
                <label className="tickets-label">Assign To</label>
                <select name="employeeId" required className="tickets-input">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
                </select>
              </div>
              <div className="tickets-form-actions">
                <button type="button" onClick={() => setShowAssignModal(false)} className="tickets-cancel-button">Cancel</button>
                <button type="submit" className="tickets-submit-button">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
