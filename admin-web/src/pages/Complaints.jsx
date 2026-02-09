import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { complaintApi } from '../api'
import { Plus, Search, X, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const statusIcons = {
  PENDING: Clock,
  UNDER_REVIEW: AlertTriangle,
  RESOLVED: CheckCircle,
  REJECTED: XCircle,
}

export default function Complaints() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER' || user?.role === 'ORGANIZATION_OWNER'
  const canViewAll = ['PLATFORM_OWNER', 'COMMITTEE', 'EMPLOYEE'].includes(user?.role)

  // Determine which societyId to use for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints', user?.id, effectiveSocietyId],
    queryFn: () =>
      complaintApi.getBySociety(effectiveSocietyId, user.id)
        .then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId,
  })



  const createMutation = useMutation({
    mutationFn: (data) => complaintApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['complaints'])
      setShowModal(false)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, resolution }) => complaintApi.updateStatus(id, status, resolution, user.id),
    onSuccess: () => queryClient.invalidateQueries(['complaints']),
  })

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createMutation.mutate({
      societyId: user.societyId,
      subject: formData.get('subject'),
      description: formData.get('description'),
      category: formData.get('category'),
    })
  }

  const handleStatusChange = (complaint, newStatus) => {
    const resolution = newStatus === 'RESOLVED' ? prompt('Enter resolution notes:') : null
    if (newStatus === 'RESOLVED' && !resolution) return
    updateStatusMutation.mutate({ id: complaint.id, status: newStatus, resolution })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Complaints</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage resident complaints</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Log Complaint
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{complaints.filter(c => c.status === 'PENDING').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Under Review</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{complaints.filter(c => c.status === 'UNDER_REVIEW').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{complaints.filter(c => c.status === 'RESOLVED').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{complaints.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
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
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => {
            const StatusIcon = statusIcons[complaint.status] || Clock
            return (
              <div key={complaint.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={clsx('p-3 rounded-lg', 
                      complaint.status === 'PENDING' && 'bg-yellow-50',
                      complaint.status === 'UNDER_REVIEW' && 'bg-blue-50',
                      complaint.status === 'RESOLVED' && 'bg-green-50',
                      complaint.status === 'REJECTED' && 'bg-red-50'
                    )}>
                      <StatusIcon className={clsx('w-5 h-5',
                        complaint.status === 'PENDING' && 'text-yellow-600',
                        complaint.status === 'UNDER_REVIEW' && 'text-blue-600',
                        complaint.status === 'RESOLVED' && 'text-green-600',
                        complaint.status === 'REJECTED' && 'text-red-600'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{complaint.complaintNumber}</span>
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[complaint.status])}>
                          {complaint.status?.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">{complaint.category}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{complaint.subject}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{complaint.description}</p>
                      
                      {complaint.resolution && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          <p className="text-xs text-green-700 dark:text-green-300"><span className="font-medium">Resolution:</span> {complaint.resolution}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {isPlatformLevel && <span>{complaint.societyName}</span>}
                        <span>By: {complaint.raisedByName || 'N/A'}</span>
                        <span>{complaint.createdAt && new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint, e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Log Complaint</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input type="text" name="subject" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select name="category" required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="NOISE">Noise</option>
                  <option value="PARKING">Parking</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="SECURITY">Security</option>
                  <option value="CLEANLINESS">Cleanliness</option>
                  <option value="NEIGHBOR">Neighbor Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" rows={4} required className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
