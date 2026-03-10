import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { complaintApi } from '../../../../api'
import { Plus, Search, X, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton, InfoTooltip } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
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
  
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const canViewAll = ['MASTER_ADMIN', 'COMMITTEE', 'EMPLOYEE'].includes(user?.role)

  // Determine which societyId to use for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const { data: complaints = [], isLoading, isError } = useQuery({
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

  const filteredComplaints = useMemo(() => complaints.filter(c => {
    const matchesSearch = c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || c.status === filterStatus
    return matchesSearch && matchesStatus
  }), [complaints, searchTerm, filterStatus])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createMutation.mutate({
      societyId: effectiveSocietyId,
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

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  // Permission check - users must be able to at least raise complaints
  if (!canRaiseComplaints()) {
    return <PermissionDenied message="You don't have permission to access complaints" />
  }

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <FiltersSkeleton filterCount={1} />
        <ListSkeleton count={4} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Complaints</h1>
            <InfoTooltip text="Manage resident complaints" />
          </div>
        </div>
        {canRaiseComplaints() && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] dark:border-slate-400/22 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus size={20} />
            Log Complaint
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-[var(--text-tertiary)]">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{complaints.filter(c => c.status === 'PENDING').length}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-[var(--text-tertiary)]">Under Review</p>
          <p className="text-2xl font-bold text-blue-600">{complaints.filter(c => c.status === 'UNDER_REVIEW').length}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-[var(--text-tertiary)]">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{complaints.filter(c => c.status === 'RESOLVED').length}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-[var(--text-tertiary)]">Total</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{complaints.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
        <div className="grid gap-4">
          {filteredComplaints.map((complaint) => {
            const StatusIcon = statusIcons[complaint.status] || Clock
            return (
              <div key={complaint.id} className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-px">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className={clsx('p-3 rounded-xl', 
                      complaint.status === 'PENDING' && 'bg-yellow-100',
                      complaint.status === 'UNDER_REVIEW' && 'bg-blue-100',
                      complaint.status === 'RESOLVED' && 'bg-green-100',
                      complaint.status === 'REJECTED' && 'bg-red-100'
                    )}>
                      <StatusIcon className={clsx('w-5 h-5',
                        complaint.status === 'PENDING' && 'text-yellow-600',
                        complaint.status === 'UNDER_REVIEW' && 'text-blue-600',
                        complaint.status === 'RESOLVED' && 'text-green-600',
                        complaint.status === 'REJECTED' && 'text-red-600'
                      )} />
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-mono text-[var(--text-tertiary)]">{complaint.complaintNumber}</span>
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', statusColors[complaint.status])}>
                          {complaint.status?.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs text-slate-700 bg-white/10">{complaint.category}</span>
                      </div>
                      <h3 className="mt-1 font-semibold text-[var(--text-primary)]">{complaint.subject}</h3>
                      <p className="mt-1 text-sm text-[var(--text-tertiary)] line-clamp-2">{complaint.description}</p>
                      
                      {complaint.resolution && (
                        <div className="mt-2 p-2 rounded-[10px] bg-green-100">
                          <p className="text-xs text-green-700"><span className="font-semibold">Resolution:</span> {complaint.resolution}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-4 mt-2 text-xs text-[var(--text-tertiary)]">
                        {isPlatformLevel && <span className="whitespace-nowrap">{complaint.societyName}</span>}
                        <span className="whitespace-nowrap">By: {complaint.raisedByName || 'N/A'}</span>
                        <span className="whitespace-nowrap">{complaint.createdAt && new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {canManageComplaints() && complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint, e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

      {/* Create Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[520px] max-h-[calc(100vh-3rem)] overflow-y-auto bg-[var(--bg-card)] rounded-xl border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Log Complaint</h3>
              <button onClick={() => setShowModal(false)} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 grid gap-4">
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
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-[10px] font-semibold border border-[var(--border-light)] bg-[var(--bg-card)] text-slate-700 hover:bg-[var(--bg-tertiary)] transition-colors">Cancel</button>
                <AsyncButton type="submit" className="flex-1 px-4 py-2 rounded-[10px] font-semibold border-none bg-blue-600 text-white hover:bg-blue-700 transition-colors" isLoading={createMutation.isPending} loadingText="Submitting...">Submit</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
