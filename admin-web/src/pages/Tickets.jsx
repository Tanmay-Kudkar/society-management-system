import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { ticketApi, societyApi, userApi } from '../api'
import { Plus, Search, X, Ticket, MessageSquare, User, Edit } from 'lucide-react'
import clsx from 'clsx'

const statusColors = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export default function Tickets() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.getAll().then(res => res.data),
  })

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
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
      societyId: parseInt(formData.get('societyId')),
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">Manage support tickets and requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Create Ticket
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-yellow-600">{tickets.filter(t => t.status === 'OPEN').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Ticket className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono text-gray-500">#{ticket.id}</span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[ticket.status])}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', priorityColors[ticket.priority])}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-1">{ticket.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{ticket.type}</span>
                      <span>{ticket.societyName}</span>
                      <span>{ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.assignedToId && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} />
                          {ticket.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {ticket.status === 'OPEN' && (
                    <button
                      onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true) }}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      Assign
                    </button>
                  )}
                  {ticket.status !== 'CLOSED' && (
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: ticket.id, status: e.target.value })}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Create Ticket</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Society</label>
                <select name="societyId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select Society</option>
                  {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" name="title" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="COMPLAINT">Complaint</option>
                    <option value="REQUEST">Request</option>
                    <option value="ISSUE">Issue</option>
                    <option value="TASK">Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select name="priority" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Assign Ticket</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Ticket ID: <span className="font-medium">#{selectedTicket.id}</span></p>
                <p className="text-sm text-gray-600 mt-1">{selectedTicket.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select name="employeeId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
