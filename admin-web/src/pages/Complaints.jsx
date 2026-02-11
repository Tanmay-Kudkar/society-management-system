import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { complaintApi } from '../../../api'
import { Plus, Search, X, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea } from '../components/FormComponents'
import PermissionDenied from '../components/PermissionDenied'

const statusColors = {
  PENDING: 'complaints-status--pending',
  UNDER_REVIEW: 'complaints-status--review',
  RESOLVED: 'complaints-status--resolved',
  REJECTED: 'complaints-status--rejected',
}

const statusIcons = {
  PENDING: Clock,
  UNDER_REVIEW: AlertTriangle,
  RESOLVED: CheckCircle,
  REJECTED: XCircle,
}

export default function Complaints() {
  const { user, canRaiseComplaints, canManageComplaints } = useAuth()
  const queryClient = useQueryClient()
  
  // Permission check - users must be able to at least raise complaints
  if (!canRaiseComplaints()) {
    return <PermissionDenied message="You don't have permission to access complaints" />
  }
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
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
      <div className="complaints-header">
        <div>
          <h1 className="complaints-title">Complaints</h1>
          <p className="complaints-subtitle">Manage resident complaints</p>
        </div>
<<<<<<< HEAD
        {canRaiseComplaints() && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Log Complaint
          </button>
        )}
=======
        <button
          onClick={() => setShowModal(true)}
          className="complaints-action-button"
        >
          <Plus size={20} />
          Log Complaint
        </button>
>>>>>>> aab3455 (Added Flyway dependency with version 12.2.0 to backend pom.xml)
      </div>

      {/* Summary Cards */}
      <div className="complaints-summary">
        <div className="complaints-summary-card">
          <p className="complaints-summary-label">Pending</p>
          <p className="complaints-summary-value complaints-summary-value--pending">{complaints.filter(c => c.status === 'PENDING').length}</p>
        </div>
        <div className="complaints-summary-card">
          <p className="complaints-summary-label">Under Review</p>
          <p className="complaints-summary-value complaints-summary-value--review">{complaints.filter(c => c.status === 'UNDER_REVIEW').length}</p>
        </div>
        <div className="complaints-summary-card">
          <p className="complaints-summary-label">Resolved</p>
          <p className="complaints-summary-value complaints-summary-value--resolved">{complaints.filter(c => c.status === 'RESOLVED').length}</p>
        </div>
        <div className="complaints-summary-card">
          <p className="complaints-summary-label">Total</p>
          <p className="complaints-summary-value complaints-summary-value--total">{complaints.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="complaints-filters">
        <div className="complaints-filters-row">
          <div className="complaints-search">
            <Search className="complaints-search-icon" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="complaints-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="complaints-select"
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
        <div className="complaints-loading">
          <div className="complaints-spinner"></div>
        </div>
      ) : (
        <div className="complaints-list">
          {filteredComplaints.map((complaint) => {
            const StatusIcon = statusIcons[complaint.status] || Clock
            return (
              <div key={complaint.id} className="complaints-item">
                <div className="complaints-item-row">
                  <div className="complaints-item-main">
                    <div className={clsx('complaints-item-icon', 
                      complaint.status === 'PENDING' && 'complaints-item-icon--pending',
                      complaint.status === 'UNDER_REVIEW' && 'complaints-item-icon--review',
                      complaint.status === 'RESOLVED' && 'complaints-item-icon--resolved',
                      complaint.status === 'REJECTED' && 'complaints-item-icon--rejected'
                    )}>
                      <StatusIcon className={clsx('complaints-item-icon-symbol',
                        complaint.status === 'PENDING' && 'complaints-item-icon-symbol--pending',
                        complaint.status === 'UNDER_REVIEW' && 'complaints-item-icon-symbol--review',
                        complaint.status === 'RESOLVED' && 'complaints-item-icon-symbol--resolved',
                        complaint.status === 'REJECTED' && 'complaints-item-icon-symbol--rejected'
                      )} />
                    </div>
                    <div>
                      <div className="complaints-item-meta">
                        <span className="complaints-item-number">{complaint.complaintNumber}</span>
                        <span className={clsx('complaints-status-badge', statusColors[complaint.status])}>
                          {complaint.status?.replace('_', ' ')}
                        </span>
                        <span className="complaints-category-badge">{complaint.category}</span>
                      </div>
                      <h3 className="complaints-item-title">{complaint.subject}</h3>
                      <p className="complaints-item-description line-clamp-2">{complaint.description}</p>
                      
                      {complaint.resolution && (
                        <div className="complaints-resolution">
                          <p className="complaints-resolution-text"><span className="complaints-resolution-label">Resolution:</span> {complaint.resolution}</p>
                        </div>
                      )}
                      
                      <div className="complaints-item-footer">
                        {isPlatformLevel && <span className="complaints-item-footer-text">{complaint.societyName}</span>}
                        <span className="complaints-item-footer-text">By: {complaint.raisedByName || 'N/A'}</span>
                        <span className="complaints-item-footer-text">{complaint.createdAt && new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

<<<<<<< HEAD
                  <div className="flex items-center gap-2 ml-auto">
                    {canManageComplaints() && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
=======
                  <div className="complaints-item-actions">
                    {complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
>>>>>>> aab3455 (Added Flyway dependency with version 12.2.0 to backend pom.xml)
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint, e.target.value)}
                        className="complaints-status-select"
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
        <div className="complaints-modal">
          <div className="complaints-modal-card">
            <div className="complaints-modal-header">
              <h3 className="complaints-modal-title">Log Complaint</h3>
              <button onClick={() => setShowModal(false)} className="complaints-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="complaints-form">
              <FormInput
                label="Subject"
                name="subject"
                required
              />
              <SmartSelect
                label="Category"
                name="category"
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
                rows={4}
                required
              />
              <div className="complaints-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="complaints-btn complaints-btn--ghost">Cancel</button>
                <button type="submit" className="complaints-btn complaints-btn--primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
