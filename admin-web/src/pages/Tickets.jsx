import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { ticketApi, userApi, exportApi, downloadBlob } from '../api'
import { Plus, Search, X, Ticket, MessageSquare, User, Edit, AlertTriangle, Clock, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'

const statusColors = {
  OPEN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const getProgressColor = (progress) => {
  if (progress >= 100) return 'bg-green-500'
  if (progress >= 75) return 'bg-emerald-500'
  if (progress >= 50) return 'bg-blue-500'
  if (progress >= 25) return 'bg-yellow-500'
  return 'bg-gray-400'
}

export default function Tickets() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Check if current user is MASTER_ADMIN
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'

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
    return matchesSearch && matchesStatus
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
    setIsExporting(true)
    try {
      const response = await exportApi.tickets(user.societyId, filterStatus || null)
      downloadBlob(response.data, `tickets_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage support tickets and requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{tickets.filter(t => t.status === 'OPEN').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{tickets.filter(t => t.isOverdue).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{tickets.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className={clsx(
              "bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-5 hover:shadow-md transition",
              ticket.isOverdue ? "border-red-300 dark:border-red-700" : "border-gray-100 dark:border-slate-700"
            )}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">#{ticket.id}</span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[ticket.status])}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', priorityColors[ticket.priority])}>
                        {ticket.priority}
                      </span>
                      {ticket.isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <AlertTriangle size={12} />
                          Overdue
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{ticket.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{ticket.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{ticket.progressPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={clsx("h-2 rounded-full transition-all duration-300", getProgressColor(ticket.progressPercent || 0))}
                          style={{ width: `${ticket.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{ticket.type}</span>
                      {isMasterAdmin && <span>{ticket.societyName}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      {ticket.pendingDays > 0 && (
                        <span className={clsx("inline-flex items-center gap-1", ticket.isOverdue ? "text-red-500" : "")}>
                          {ticket.pendingDays} days
                        </span>
                      )}
                      {ticket.assignedToId && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} />
                          {ticket.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {ticket.status === 'OPEN' && (
                      <button
                        onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true) }}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                      >
                        Assign
                      </button>
                    )}
                    {ticket.status !== 'CLOSED' && (
                      <select
                        value={ticket.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={ticket.progressPercent || 0}
                        onChange={(e) => updateProgressMutation.mutate({ id: ticket.id, progress: parseInt(e.target.value) })}
                        className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{ticket.progressPercent || 0}%</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Ticket</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" name="title" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" rows={3} required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select name="type" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="COMPLAINT">Complaint</option>
                    <option value="REQUEST">Request</option>
                    <option value="ISSUE">Issue</option>
                    <option value="TASK">Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select name="priority" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Ticket</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-4 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ticket ID: <span className="font-medium text-gray-900 dark:text-white">#{selectedTicket.id}</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedTicket.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                <select name="employeeId" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
