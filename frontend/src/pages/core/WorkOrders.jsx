import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { workOrderApi } from '../../../../api'
import { Plus, Search, X, Wrench, ClipboardList, Clock, CheckCircle2, CircleDot, PauseCircle, XCircle, UserPlus, MapPin, IndianRupee, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusIcons = {
  OPEN: ClipboardList,
  ASSIGNED: UserPlus,
  IN_PROGRESS: CircleDot,
  ON_HOLD: PauseCircle,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
}

const categoryLabels = {
  PLUMBING: '🔧 Plumbing', ELECTRICAL: '⚡ Electrical', CARPENTRY: '🪚 Carpentry',
  PAINTING: '🎨 Painting', CLEANING: '🧹 Cleaning', PEST_CONTROL: '🐛 Pest Control',
  LANDSCAPING: '🌿 Landscaping', HVAC: '❄️ HVAC', ELEVATOR: '🛗 Elevator', OTHER: '📋 Other',
}

export default function WorkOrders() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) return <PermissionDenied message="You don't have permission to access work orders" />

  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isAdmin = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'].includes(user?.role)
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const { data: workOrders = [], isLoading, isError } = useQuery({
    queryKey: ['work-orders', effectiveSocietyId],
    queryFn: () => workOrderApi.getBySociety(effectiveSocietyId, user.id).then(r => r.data),
    enabled: !!user?.id && !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => workOrderApi.create(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['work-orders']); setShowModal(false) },
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, assignedToId }) => workOrderApi.assign(id, user.id, assignedToId),
    onSuccess: () => queryClient.invalidateQueries(['work-orders']),
  })

  const startMutation = useMutation({
    mutationFn: (id) => workOrderApi.startWork(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['work-orders']),
  })

  const holdMutation = useMutation({
    mutationFn: (id) => {
      const notes = prompt('Reason for putting on hold:')
      if (!notes) return Promise.reject('Cancelled')
      return workOrderApi.putOnHold(id, user.id, notes)
    },
    onSuccess: () => queryClient.invalidateQueries(['work-orders']),
  })

  const completeMutation = useMutation({
    mutationFn: (id) => {
      const notes = prompt('Resolution notes:')
      const cost = prompt('Actual cost (optional):')
      return workOrderApi.complete(id, user.id, notes, cost || null)
    },
    onSuccess: () => queryClient.invalidateQueries(['work-orders']),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => {
      const reason = prompt('Reason for cancellation:')
      if (!reason) return Promise.reject('Cancelled')
      return workOrderApi.cancel(id, user.id, reason)
    },
    onSuccess: () => queryClient.invalidateQueries(['work-orders']),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => workOrderApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['work-orders']),
  })

  const filtered = useMemo(() => workOrders.filter(wo => {
    const matchesSearch = wo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || wo.status === filterStatus
    const matchesCategory = !filterCategory || wo.category === filterCategory
    const matchesPriority = !filterPriority || wo.priority === filterPriority
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority
  }), [workOrders, searchTerm, filterStatus, filterCategory, filterPriority])

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    createMutation.mutate({
      title: fd.get('title'),
      description: fd.get('description'),
      category: fd.get('category'),
      priority: fd.get('priority'),
      location: fd.get('location'),
      estimatedCost: fd.get('estimatedCost') ? parseFloat(fd.get('estimatedCost')) : null,
      scheduledDate: fd.get('scheduledDate') || null,
      notes: fd.get('notes') || null,
      societyId: user.societyId,
    })
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)
  if (showSkeleton) return (<div><WakeUpBanner /><HeroSkeleton /><SummaryRowSkeleton count={4} /><FiltersSkeleton filterCount={2} /><ListSkeleton count={4} /></div>)

  const openCount = workOrders.filter(w => w.status === 'OPEN').length
  const assignedCount = workOrders.filter(w => w.status === 'ASSIGNED').length
  const inProgressCount = workOrders.filter(w => w.status === 'IN_PROGRESS').length
  const completedCount = workOrders.filter(w => w.status === 'COMPLETED').length

  return (
    <div>
      <div className="wo-header">
        <div>
          <h1 className="wo-title">Work Orders</h1>
          <p className="wo-subtitle">Track and manage maintenance work orders</p>
        </div>
        <button onClick={() => setShowModal(true)} className="wo-action-button">
          <Plus size={20} /> New Work Order
        </button>
      </div>

      <div className="wo-summary">
        <div className="wo-summary-card">
          <p className="wo-summary-label">Open</p>
          <p className="wo-summary-value wo-summary-value--open">{openCount}</p>
        </div>
        <div className="wo-summary-card">
          <p className="wo-summary-label">Assigned</p>
          <p className="wo-summary-value wo-summary-value--assigned">{assignedCount}</p>
        </div>
        <div className="wo-summary-card">
          <p className="wo-summary-label">In Progress</p>
          <p className="wo-summary-value wo-summary-value--progress">{inProgressCount}</p>
        </div>
        <div className="wo-summary-card">
          <p className="wo-summary-label">Completed</p>
          <p className="wo-summary-value wo-summary-value--completed">{completedCount}</p>
        </div>
      </div>

      <div className="wo-filters">
        <div className="wo-filters-row">
          <div className="wo-search">
            <Search className="wo-search-icon" />
            <input type="text" placeholder="Search work orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="wo-input" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="wo-select">
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="wo-select">
            <option value="">All Categories</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="CARPENTRY">Carpentry</option>
            <option value="PAINTING">Painting</option>
            <option value="CLEANING">Cleaning</option>
            <option value="PEST_CONTROL">Pest Control</option>
            <option value="LANDSCAPING">Landscaping</option>
            <option value="HVAC">HVAC</option>
            <option value="ELEVATOR">Elevator</option>
            <option value="OTHER">Other</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="wo-select">
            <option value="">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="wo-list">
        {filtered.length === 0 && (
          <div className="wo-item" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No work orders found</div>
        )}
        {filtered.map(wo => {
          const StatusIcon = statusIcons[wo.status] || Wrench
          const isActive = !['COMPLETED', 'CANCELLED'].includes(wo.status)
          return (
            <div key={wo.id} className={clsx('wo-item', wo.priority === 'URGENT' && 'wo-item--urgent')}>
              <div className="wo-item-row">
                <div className="wo-item-main">
                  <div className={clsx('wo-item-icon', `wo-item-icon--${wo.status?.toLowerCase().replace('_', '-')}`)}>
                    <StatusIcon className="wo-item-icon-symbol" />
                  </div>
                  <div>
                    <div className="wo-item-meta">
                      <span className={clsx('wo-status-badge', `wo-status--${wo.status?.toLowerCase().replace('_', '-')}`)}>{wo.status?.replace(/_/g, ' ')}</span>
                      <span className={clsx('wo-priority-badge', `wo-priority--${wo.priority?.toLowerCase()}`)}>{wo.priority}</span>
                      <span className="wo-category-badge">{categoryLabels[wo.category] || wo.category}</span>
                    </div>
                    <h3 className="wo-item-title">{wo.title}</h3>
                    {wo.description && <p className="wo-item-description">{wo.description}</p>}
                    {wo.location && <p className="wo-item-location"><MapPin size={13} /> {wo.location}</p>}
                    {wo.resolutionNotes && (
                      <div className="wo-resolution">
                        <p className="wo-resolution-text"><span className="wo-resolution-label">Resolution:</span> {wo.resolutionNotes}</p>
                      </div>
                    )}
                    <div className="wo-item-footer">
                      <span className="wo-item-footer-text">By: {wo.requestedByName}</span>
                      {wo.assignedToName && <span className="wo-item-footer-text">Assigned: {wo.assignedToName}</span>}
                      {wo.flatNumber && <span className="wo-item-footer-text">Flat: {wo.flatNumber}</span>}
                      {wo.scheduledDate && <span className="wo-item-footer-text"><Calendar size={12} /> {wo.scheduledDate}</span>}
                      {wo.estimatedCost && <span className="wo-item-footer-text"><IndianRupee size={12} /> Est: ₹{wo.estimatedCost}</span>}
                      {wo.actualCost && <span className="wo-item-footer-text"><IndianRupee size={12} /> Actual: ₹{wo.actualCost}</span>}
                      {wo.completedAt && <span className="wo-item-footer-text"><Clock size={12} /> Done: {new Date(wo.completedAt).toLocaleDateString()}</span>}
                      <span className="wo-item-footer-text">{wo.createdAt && new Date(wo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {isStaff && isActive && (
                  <div className="wo-item-actions">
                    {wo.status === 'OPEN' && (
                      <button onClick={() => {
                        const assigneeId = prompt('Enter user ID to assign:')
                        if (assigneeId) assignMutation.mutate({ id: wo.id, assignedToId: parseInt(assigneeId) })
                      }} className="wo-btn wo-btn--assign"><UserPlus size={14} /> Assign</button>
                    )}
                    {(wo.status === 'ASSIGNED' || wo.status === 'ON_HOLD') && (
                      <button onClick={() => startMutation.mutate(wo.id)} className="wo-btn wo-btn--start">Start</button>
                    )}
                    {wo.status === 'IN_PROGRESS' && (
                      <button onClick={() => holdMutation.mutate(wo.id)} className="wo-btn wo-btn--hold">Hold</button>
                    )}
                    <button onClick={() => completeMutation.mutate(wo.id)} className="wo-btn wo-btn--complete">Complete</button>
                    {isAdmin && (
                      <>
                        <button onClick={() => cancelMutation.mutate(wo.id)} className="wo-btn wo-btn--cancel">Cancel</button>
                        <button onClick={() => { if (confirm('Delete this work order?')) deleteMutation.mutate(wo.id) }} className="wo-btn wo-btn--delete">Delete</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="wo-modal">
          <div className="wo-modal-card">
            <div className="wo-modal-header">
              <h3 className="wo-modal-title">New Work Order</h3>
              <button onClick={() => setShowModal(false)} className="wo-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="wo-form">
              <FormInput label="Title" name="title" required placeholder="Brief summary of work needed" />
              <FormTextarea label="Description" name="description" rows={3} required placeholder="Detailed description" />
              <div className="wo-form-row">
                <SmartSelect label="Category" name="category" required options={[
                  { value: 'PLUMBING', label: 'Plumbing' }, { value: 'ELECTRICAL', label: 'Electrical' },
                  { value: 'CARPENTRY', label: 'Carpentry' }, { value: 'PAINTING', label: 'Painting' },
                  { value: 'CLEANING', label: 'Cleaning' }, { value: 'PEST_CONTROL', label: 'Pest Control' },
                  { value: 'LANDSCAPING', label: 'Landscaping' }, { value: 'HVAC', label: 'HVAC' },
                  { value: 'ELEVATOR', label: 'Elevator' }, { value: 'OTHER', label: 'Other' },
                ]} placeholder="Select Category" />
                <SmartSelect label="Priority" name="priority" options={[
                  { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' },
                ]} placeholder="Select Priority" />
              </div>
              <FormInput label="Location" name="location" placeholder="e.g. Block A, Ground Floor" />
              <div className="wo-form-row">
                <FormInput label="Estimated Cost (₹)" name="estimatedCost" type="number" step="0.01" />
                <FormInput label="Scheduled Date" name="scheduledDate" type="date" />
              </div>
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="wo-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="wo-btn wo-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="wo-btn wo-btn--primary" isLoading={createMutation.isPending} loadingText="Creating...">Create Work Order</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
