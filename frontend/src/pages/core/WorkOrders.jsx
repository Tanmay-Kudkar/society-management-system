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

const iconBgMap = {
  open: 'bg-[rgba(245,158,11,.15)] text-[var(--color-amber)]',
  assigned: 'bg-[rgba(59,130,246,.15)] text-[var(--color-blue)]',
  'in-progress': 'bg-[rgba(139,92,246,.15)] text-[var(--color-violet)]',
  'on-hold': 'bg-[rgba(107,114,128,.15)] text-[var(--text-secondary)]',
  completed: 'bg-[rgba(34,197,94,.15)] text-[var(--color-green)]',
  cancelled: 'bg-[rgba(239,68,68,.15)] text-[var(--color-red)]',
}

const statusBadgeMap = {
  open: 'bg-[rgba(245,158,11,.15)] text-[var(--color-amber)]',
  assigned: 'bg-[rgba(59,130,246,.15)] text-[var(--color-blue)]',
  'in-progress': 'bg-[rgba(139,92,246,.15)] text-[var(--color-violet)]',
  'on-hold': 'bg-[rgba(107,114,128,.15)] text-[var(--text-secondary)]',
  completed: 'bg-[rgba(34,197,94,.15)] text-[var(--color-green)]',
  cancelled: 'bg-[rgba(239,68,68,.15)] text-[var(--color-red)]',
}

const priorityBadgeMap = {
  low: 'bg-[rgba(107,114,128,.12)] text-[var(--text-secondary)]',
  medium: 'bg-[rgba(59,130,246,.12)] text-[var(--color-blue)]',
  high: 'bg-[rgba(245,158,11,.12)] text-[var(--color-amber)]',
  urgent: 'bg-[rgba(239,68,68,.15)] text-[var(--color-red)] font-bold',
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
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Work Orders</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track and manage maintenance work orders</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 py-[10px] px-5 bg-[var(--color-blue)] text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--color-blue-hover,#2563eb)]">
          <Plus size={20} /> New Work Order
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">Open</p>
          <p className="text-[28px] font-bold text-[var(--color-amber)]">{openCount}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">Assigned</p>
          <p className="text-[28px] font-bold text-[var(--color-blue)]">{assignedCount}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">In Progress</p>
          <p className="text-[28px] font-bold text-[var(--color-violet)]">{inProgressCount}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.5px] mb-1">Completed</p>
          <p className="text-[28px] font-bold text-[var(--color-green)]">{completedCount}</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
            <input type="text" placeholder="Search work orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-[10px] pr-3 pl-9 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)]" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="py-[10px] px-3 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] min-w-[140px]">
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="py-[10px] px-3 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] min-w-[140px]">
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
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="py-[10px] px-3 border border-[var(--border-primary)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] min-w-[140px]">
            <option value="">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)] text-center text-[var(--text-tertiary)]">No work orders found</div>
        )}
        {filtered.map(wo => {
          const StatusIcon = statusIcons[wo.status] || Wrench
          const isActive = !['COMPLETED', 'CANCELLED'].includes(wo.status)
          const statusKey = wo.status?.toLowerCase().replace('_', '-')
          const priorityKey = wo.priority?.toLowerCase()
          return (
            <div key={wo.id} className={clsx('bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-primary)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,.06)]', wo.priority === 'URGENT' && 'border-l-[3px] border-l-[var(--color-red)]')}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={clsx('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0', iconBgMap[statusKey])}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={clsx('text-[11px] font-semibold py-[2px] px-2 rounded-md uppercase tracking-[0.3px]', statusBadgeMap[statusKey])}>{wo.status?.replace(/_/g, ' ')}</span>
                      <span className={clsx('text-[11px] font-semibold py-[2px] px-2 rounded-md uppercase tracking-[0.3px]', priorityBadgeMap[priorityKey])}>{wo.priority}</span>
                      <span className="text-[11px] font-semibold py-[2px] px-2 rounded-md uppercase tracking-[0.3px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{categoryLabels[wo.category] || wo.category}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-[2px]">{wo.title}</h3>
                    {wo.description && <p className="text-[13px] text-[var(--text-secondary)] mb-1">{wo.description}</p>}
                    {wo.location && <p className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] mb-1"><MapPin size={13} /> {wo.location}</p>}
                    {wo.resolutionNotes && (
                      <div className="bg-[var(--bg-tertiary)] rounded-lg py-2 px-3 my-[6px]">
                        <p className="text-[13px] text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Resolution:</span> {wo.resolutionNotes}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-[6px]">
                      <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]">By: {wo.requestedByName}</span>
                      {wo.assignedToName && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]">Assigned: {wo.assignedToName}</span>}
                      {wo.flatNumber && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]">Flat: {wo.flatNumber}</span>}
                      {wo.scheduledDate && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><Calendar size={12} /> {wo.scheduledDate}</span>}
                      {wo.estimatedCost && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><IndianRupee size={12} /> Est: ₹{wo.estimatedCost}</span>}
                      {wo.actualCost && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><IndianRupee size={12} /> Actual: ₹{wo.actualCost}</span>}
                      {wo.completedAt && <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]"><Clock size={12} /> Done: {new Date(wo.completedAt).toLocaleDateString()}</span>}
                      <span className="text-xs text-[var(--text-tertiary)] inline-flex items-center gap-[3px]">{wo.createdAt && new Date(wo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {isStaff && isActive && (
                  <div className="flex gap-[6px] flex-wrap shrink-0">
                    {wo.status === 'OPEN' && (
                      <button onClick={() => {
                        const assigneeId = prompt('Enter user ID to assign:')
                        if (assigneeId) assignMutation.mutate({ id: wo.id, assignedToId: parseInt(assigneeId) })
                      }} className="py-[6px] px-[14px] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(59,130,246,.1)] text-[var(--color-blue)] border border-[rgba(59,130,246,.3)]"><UserPlus size={14} /> Assign</button>
                    )}
                    {(wo.status === 'ASSIGNED' || wo.status === 'ON_HOLD') && (
                      <button onClick={() => startMutation.mutate(wo.id)} className="py-[6px] px-[14px] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(139,92,246,.1)] text-[var(--color-violet)] border border-[rgba(139,92,246,.3)]">Start</button>
                    )}
                    {wo.status === 'IN_PROGRESS' && (
                      <button onClick={() => holdMutation.mutate(wo.id)} className="py-[6px] px-[14px] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(107,114,128,.1)] text-[var(--text-secondary)] border border-[rgba(107,114,128,.3)]">Hold</button>
                    )}
                    <button onClick={() => completeMutation.mutate(wo.id)} className="py-[6px] px-[14px] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(34,197,94,.1)] text-[var(--color-green)] border border-[rgba(34,197,94,.3)]">Complete</button>
                    {isAdmin && (
                      <>
                        <button onClick={() => cancelMutation.mutate(wo.id)} className="py-[6px] px-[14px] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(245,158,11,.1)] text-[var(--color-amber)] border border-[rgba(245,158,11,.3)]">Cancel</button>
                        <button onClick={() => { if (confirm('Delete this work order?')) deleteMutation.mutate(wo.id) }} className="py-[6px] px-[14px] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[rgba(239,68,68,.1)] text-[var(--color-red)] border border-[rgba(239,68,68,.3)]">Delete</button>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-[4px]">
          <div className="bg-[var(--bg-primary)] rounded-2xl p-6 w-[90%] max-w-[560px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,.3)]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">New Work Order</h3>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer text-[var(--text-tertiary)] p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormInput label="Title" name="title" required placeholder="Brief summary of work needed" />
              <FormTextarea label="Description" name="description" rows={3} required placeholder="Detailed description" />
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Estimated Cost (₹)" name="estimatedCost" type="number" step="0.01" />
                <FormInput label="Scheduled Date" name="scheduledDate" type="date" />
              </div>
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="py-[6px] px-[14px] border border-[var(--border-primary)] rounded-lg text-xs font-medium cursor-pointer bg-transparent text-[var(--text-primary)] inline-flex items-center gap-1 transition-all hover:bg-[var(--bg-tertiary)]">Cancel</button>
                <AsyncButton type="submit" className="py-[6px] px-[14px] rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-1 transition-all bg-[var(--color-blue)] text-white border border-[var(--color-blue)] hover:opacity-90" isLoading={createMutation.isPending} loadingText="Creating...">Create Work Order</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
