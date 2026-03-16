import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { approvalApi } from '../../../../api'
import { Plus, Search, X, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, RotateCcw, ChevronUp, GitBranch } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, NumberInput, AsyncButton, InfoTooltip, NeonSweepButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDate, formatDateTime } from '../../utils/formatUtils'

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
}

const statusIcons = {
  PENDING: Clock,
  IN_REVIEW: AlertTriangle,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  CANCELLED: X,
}

const ENTITY_TYPES = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'RATE_CHANGE', label: 'Rate Change' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'VENDOR_BILL', label: 'Vendor Bill' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CUSTOM', label: 'Custom' },
]

const APPROVER_ROLES = [
  { value: 'SOCIETY_ADMIN', label: 'Society Admin' },
  { value: 'CHAIRMAN', label: 'Chairman' },
  { value: 'SECRETARY', label: 'Secretary' },
  { value: 'TREASURER', label: 'Treasurer' },
  { value: 'COMMITTEE', label: 'Committee' },
  { value: 'MANAGER', label: 'Manager' },
]

export default function Approvals() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const canManage = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'].includes(user?.role)
  const canCreate = !['VISITOR', 'VENDOR'].includes(user?.role)

  // All hooks must be called unconditionally at the top
  const [activeTab, setActiveTab] = useState('requests') // 'requests' | 'workflows'
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(null) // approval request id
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [workflowSteps, setWorkflowSteps] = useState([{ stepOrder: 1, approverRole: 'CHAIRMAN', isMandatory: true, autoApproveBelow: '' }])

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  // === DATA FETCHING ===
  const { data: requests = [], isLoading: requestsLoading, isError: requestsError } = useQuery({
    queryKey: ['approval-requests', effectiveSocietyId],
    queryFn: () => approvalApi.getRequestsBySociety(effectiveSocietyId).then(r => r.data),
    enabled: !!effectiveSocietyId && activeTab === 'requests' && canCreate,
  })

  const { data: workflows = [], isLoading: workflowsLoading, isError: workflowsError } = useQuery({
    queryKey: ['approval-workflows', effectiveSocietyId],
    queryFn: () => approvalApi.getWorkflowsBySociety(effectiveSocietyId).then(r => r.data),
    enabled: !!effectiveSocietyId && canCreate,
  })

  // === MUTATIONS ===
  const createRequestMutation = useMutation({
    mutationFn: (data) => approvalApi.createRequest(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['approval-requests']); setShowRequestModal(false) },
  })

  const createWorkflowMutation = useMutation({
    mutationFn: (data) => approvalApi.createWorkflow(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['approval-workflows']); setShowWorkflowModal(false) },
  })

  const actionMutation = useMutation({
    mutationFn: ({ requestId, data }) => approvalApi.takeAction(requestId, user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['approval-requests']); setShowActionModal(null) },
  })

  const cancelMutation = useMutation({
    mutationFn: (requestId) => approvalApi.cancelRequest(requestId, user.id),
    onSuccess: () => queryClient.invalidateQueries(['approval-requests']),
  })

  const deleteWorkflowMutation = useMutation({
    mutationFn: (id) => approvalApi.deleteWorkflow(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['approval-workflows']),
  })

  // === FILTERING ===
  const filteredRequests = useMemo(() => requests.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || r.status === filterStatus
    return matchesSearch && matchesStatus
  }), [requests, searchTerm, filterStatus])

  const filteredWorkflows = useMemo(() => workflows.filter(w => {
    return w.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           w.entityType?.toLowerCase().includes(searchTerm.toLowerCase())
  }), [workflows, searchTerm])

  // === LOADING ===
  const isLoading = activeTab === 'requests' ? requestsLoading : workflowsLoading
  const isError = activeTab === 'requests' ? requestsError : workflowsError
  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (!canCreate) {
    return <PermissionDenied message="You don't have permission to access approvals" />
  }

  // === HANDLERS ===
  const handleCreateRequest = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    createRequestMutation.mutate({
      societyId: effectiveSocietyId,
      entityType: fd.get('entityType'),
      entityId: parseInt(fd.get('entityId')) || 0,
      title: fd.get('title'),
      description: fd.get('description'),
      amount: fd.get('amount') ? parseFloat(fd.get('amount')) : null,
    })
  }

  const handleCreateWorkflow = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    createWorkflowMutation.mutate({
      societyId: effectiveSocietyId,
      name: fd.get('name'),
      entityType: fd.get('entityType'),
      description: fd.get('description'),
      minAmount: fd.get('minAmount') ? parseFloat(fd.get('minAmount')) : null,
      maxAmount: fd.get('maxAmount') ? parseFloat(fd.get('maxAmount')) : null,
      steps: workflowSteps.map(s => ({
        stepOrder: s.stepOrder,
        approverRole: s.approverRole,
        isMandatory: s.isMandatory,
        autoApproveBelow: s.autoApproveBelow ? parseFloat(s.autoApproveBelow) : null,
      })),
    })
  }

  const handleAction = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    actionMutation.mutate({
      requestId: showActionModal,
      data: { action: fd.get('action'), comments: fd.get('comments') },
    })
  }

  const addStep = () => {
    setWorkflowSteps(prev => [...prev, {
      stepOrder: prev.length + 1,
      approverRole: 'CHAIRMAN',
      isMandatory: true,
      autoApproveBelow: '',
    }])
  }

  const removeStep = (idx) => {
    setWorkflowSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 })))
  }

  const updateStep = (idx, field, value) => {
    setWorkflowSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner isError={isError} />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <FiltersSkeleton />
        <ListSkeleton count={5} />
      </div>
    )
  }

  // === STATS ===
  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    inReview: requests.filter(r => r.status === 'IN_REVIEW').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  }

  const selectedRequest = showActionModal ? requests.find(r => r.id === showActionModal) : null

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Approvals</h1>
            <InfoTooltip text="Manage approval workflows and requests" />
          </div>
        </div>
        <div className="flex gap-2">
          {canManage && activeTab === 'workflows' && (
            <NeonSweepButton
              tone="slate"
              size="md"
              onClick={() => { setWorkflowSteps([{ stepOrder: 1, approverRole: 'CHAIRMAN', isMandatory: true, autoApproveBelow: '' }]); setShowWorkflowModal(true) }}
              className="w-full sm:w-auto"
            >
              <Plus size={16} /> New Workflow
            </NeonSweepButton>
          )}
          {canCreate && activeTab === 'requests' && (
            <NeonSweepButton
              tone="violet"
              size="md"
              onClick={() => setShowRequestModal(true)}
              className="w-full sm:w-auto"
            >
              <Plus size={16} /> New Request
            </NeonSweepButton>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 flex border-b-2 border-[var(--border-light)]">
        <button
          className={clsx(
            'mb-[-2px] border-b-2 border-transparent px-5 py-2.5 text-sm font-semibold text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]',
            activeTab === 'requests' && 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
          )}
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
        {canManage && (
          <button
            className={clsx(
              'mb-[-2px] border-b-2 border-transparent px-5 py-2.5 text-sm font-semibold text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]',
              activeTab === 'workflows' && 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
            )}
            onClick={() => setActiveTab('workflows')}
          >
            Workflows
          </button>
        )}
      </div>

      {/* Summary Cards (requests tab only) */}
      {activeTab === 'requests' && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] border-l-4 border-l-amber-500 bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <Clock size={20} className="text-amber-500" />
            <div>
              <span className="block text-2xl font-bold text-[var(--text-primary)]">{stats.pending}</span>
              <span className="text-[13px] text-[var(--text-tertiary)]">Pending</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] border-l-4 border-l-blue-500 bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <AlertTriangle size={20} className="text-blue-500" />
            <div>
              <span className="block text-2xl font-bold text-[var(--text-primary)]">{stats.inReview}</span>
              <span className="text-[13px] text-[var(--text-tertiary)]">In Review</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] border-l-4 border-l-emerald-500 bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <CheckCircle size={20} className="text-emerald-500" />
            <div>
              <span className="block text-2xl font-bold text-[var(--text-primary)]">{stats.approved}</span>
              <span className="text-[13px] text-[var(--text-tertiary)]">Approved</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] border-l-4 border-l-rose-500 bg-[var(--bg-card)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <XCircle size={20} className="text-rose-500" />
            <div>
              <span className="block text-2xl font-bold text-[var(--text-primary)]">{stats.rejected}</span>
              <span className="text-[13px] text-[var(--text-tertiary)]">Rejected</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2">
          <Search size={16} className="text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-[var(--text-tertiary)]"><X size={14} /></button>}
        </div>
        {activeTab === 'requests' && (
          <select
            className="cursor-pointer rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}
      </div>

      {/* === REQUESTS LIST === */}
      {activeTab === 'requests' && (
        <div className="flex flex-col gap-4">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-tertiary)]">
              <GitBranch size={48} className="mx-auto mb-3 opacity-40" />
              <p>No approval requests found</p>
            </div>
          ) : filteredRequests.map(req => {
            const StatusIcon = statusIcons[req.status] || Clock
            return (
              <div key={req.id} className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:shadow-[0_4px_12px_rgba(15,23,42,0.1)]">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3>{req.title}</h3>
                    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', statusColors[req.status])}>
                      <StatusIcon size={12} /> {req.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.5px] text-[var(--text-secondary)]">{req.entityType}</span>
                </div>
                <div className="mb-3">
                  {req.description && <p className="mb-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">{req.description}</p>}
                  <div className="flex flex-wrap gap-4 text-[13px] text-[var(--text-tertiary)]">
                    <span>By: {req.requestedByName || 'Unknown'}</span>
                    {req.amount && <span>Amount: ₹{Number(req.amount).toLocaleString('en-IN')}</span>}
                    <span>Step: {req.currentStep}/{req.totalSteps}</span>
                    {req.workflowName && <span>Workflow: {req.workflowName}</span>}
                    <span>{formatDate(req.createdAt)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded bg-[var(--bg-tertiary)]">
                    <div className="h-full rounded bg-[var(--accent-primary)] transition-all" style={{ width: `${(req.currentStep / req.totalSteps) * 100}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 border-t border-[var(--border-light)] pt-3">
                  {canManage && ['PENDING', 'IN_REVIEW'].includes(req.status) && (
                    <AsyncButton variant="primary" size="sm" onClick={() => setShowActionModal(req.id)}>
                      Take Action
                    </AsyncButton>
                  )}
                  {req.requestedBy === user?.id && req.status === 'PENDING' && (
                    <button
                      className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--color-error)] px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                      onClick={() => cancelMutation.mutate(req.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {/* Action history */}
                {req.actions?.length > 0 && (
                  <div className="mt-4 border-t border-[var(--border-light)] pt-3">
                    <h4 className="mb-2 text-[13px] font-semibold text-[var(--text-secondary)]">History</h4>
                    {req.actions.map(action => (
                      <div key={action.id} className="flex flex-wrap items-center gap-2.5 py-1.5 text-[13px] text-[var(--text-tertiary)]">
                        <span
                          className={clsx(
                            'rounded-full px-2 py-0.5 text-[11px] font-bold uppercase',
                            action.action === 'APPROVED' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                            action.action === 'REJECTED' && 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                            action.action === 'RETURNED' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
                            action.action === 'ESCALATED' && 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                          )}
                        >
                          {action.action}
                        </span>
                        <span>Step {action.stepOrder} — {action.actedByName}</span>
                        {action.comments && <span className="italic text-[var(--text-secondary)]">{action.comments}</span>}
                        <span className="ml-auto text-xs">{formatDateTime(action.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* === WORKFLOWS LIST === */}
      {activeTab === 'workflows' && (
        <div className="flex flex-col gap-4">
          {filteredWorkflows.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-tertiary)]">
              <GitBranch size={48} className="mx-auto mb-3 opacity-40" />
              <p>No workflows configured</p>
            </div>
          ) : filteredWorkflows.map(wf => (
            <div key={wf.id} className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:shadow-[0_4px_12px_rgba(15,23,42,0.1)]">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3>{wf.name}</h3>
                  <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', wf.isActive ? statusColors.APPROVED : statusColors.CANCELLED)}>
                    {wf.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="rounded-full bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.5px] text-[var(--text-secondary)]">{wf.entityType}</span>
              </div>
              <div className="mb-3">
                {wf.description && <p className="mb-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">{wf.description}</p>}
                <div className="flex flex-wrap gap-4 text-[13px] text-[var(--text-tertiary)]">
                  {wf.minAmount != null && <span>Min: ₹{Number(wf.minAmount).toLocaleString('en-IN')}</span>}
                  {wf.maxAmount != null && <span>Max: ₹{Number(wf.maxAmount).toLocaleString('en-IN')}</span>}
                  <span>{wf.steps?.length || 0} step(s)</span>
                </div>
                {/* Steps visualization */}
                {wf.steps?.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {wf.steps.map((step, i) => (
                      <div key={step.id} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-tertiary)] px-3 py-1 text-[13px] text-[var(--text-secondary)]">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[11px] font-bold text-white">{step.stepOrder}</span>
                        <span>{step.approverRole}</span>
                        {step.isMandatory && <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">Required</span>}
                        {i < wf.steps.length - 1 && <ArrowRight size={14} className="text-[var(--text-tertiary)]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 border-t border-[var(--border-light)] pt-3">
                <NeonSweepButton
                  tone="danger"
                  size="sm"
                  onClick={() => deleteWorkflowMutation.mutate(wf.id)}
                >
                  Delete
                </NeonSweepButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === CREATE REQUEST MODAL === */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setShowRequestModal(false)}>
          <div className="w-full max-w-[40rem] rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Approval Request</h2>
              <button onClick={() => setShowRequestModal(false)} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="flex flex-col gap-4 p-5">
              <FormInput name="title" label="Title" required />
              <SmartSelect name="entityType" label="Entity Type" options={ENTITY_TYPES} required />
              <FormInput name="entityId" label="Entity ID" type="number" required />
              <NumberInput name="amount" label="Amount (₹)" />
              <FormTextarea name="description" label="Description" />
              <div className="flex gap-3 pt-2">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={createRequestMutation.isPending}>
                  {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === CREATE WORKFLOW MODAL === */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setShowWorkflowModal(false)}>
          <div className="w-full max-w-[40rem] rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Approval Workflow</h2>
              <button onClick={() => setShowWorkflowModal(false)} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateWorkflow} className="flex flex-col gap-4 p-5">
              <FormInput name="name" label="Workflow Name" required />
              <SmartSelect name="entityType" label="Entity Type" options={ENTITY_TYPES} required />
              <FormTextarea name="description" label="Description" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NumberInput name="minAmount" label="Min Amount (₹)" />
                <NumberInput name="maxAmount" label="Max Amount (₹)" />
              </div>

              <div className="my-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Approval Steps</h3>
                {workflowSteps.map((step, idx) => (
                  <div key={idx} className="mb-2.5 flex flex-wrap items-center gap-2.5">
                    <span className="min-w-[50px] text-sm font-semibold text-[var(--text-secondary)]">Step {step.stepOrder}</span>
                    <select
                      value={step.approverRole}
                      onChange={e => updateStep(idx, 'approverRole', e.target.value)}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                    >
                      {APPROVER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <label className="inline-flex cursor-pointer items-center gap-1 text-sm text-[var(--text-secondary)]">
                      <input type="checkbox" checked={step.isMandatory} onChange={e => updateStep(idx, 'isMandatory', e.target.checked)} />
                      Required
                    </label>
                    <input
                      type="number"
                      placeholder="Auto-approve below ₹"
                      value={step.autoApproveBelow}
                      onChange={e => updateStep(idx, 'autoApproveBelow', e.target.value)}
                      className="w-[140px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                    />
                    {workflowSteps.length > 1 && (
                      <AsyncButton type="button" variant="danger" size="sm" onClick={() => removeStep(idx)}>
                        <X size={14} />
                      </AsyncButton>
                    )}
                  </div>
                ))}
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="sm"
                  onClick={addStep}
                >
                  <Plus size={14} /> Add Step
                </NeonSweepButton>
              </div>

              <div className="flex gap-3 pt-2">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowWorkflowModal(false)}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={createWorkflowMutation.isPending}>
                  {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === TAKE ACTION MODAL === */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setShowActionModal(null)}>
          <div className="w-full max-w-[40rem] rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--border-light)] px-5 py-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Take Action</h2>
              <button onClick={() => setShowActionModal(null)} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-slate-400/20 hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <div className="mx-5 mt-5 mb-4 rounded-xl bg-[var(--bg-tertiary)] p-3">
              <h3 className="mb-1 text-[15px] font-semibold text-[var(--text-primary)]">{selectedRequest.title}</h3>
              <p className="text-[13px] text-[var(--text-tertiary)]">Step {selectedRequest.currentStep} of {selectedRequest.totalSteps}</p>
              {selectedRequest.amount && <p className="text-[13px] text-[var(--text-tertiary)]">Amount: ₹{Number(selectedRequest.amount).toLocaleString('en-IN')}</p>}
            </div>
            <form onSubmit={handleAction} className="flex flex-col gap-4 px-5 pb-5">
              <SmartSelect name="action" label="Action" options={[
                { value: 'APPROVED', label: '✓ Approve' },
                { value: 'REJECTED', label: '✗ Reject' },
                { value: 'RETURNED', label: '↩ Return to Previous Step' },
                { value: 'ESCALATED', label: '↑ Escalate to Next Step' },
              ]} required />
              <FormTextarea name="comments" label="Comments" />
              <div className="flex gap-3 pt-2">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowActionModal(null)}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={actionMutation.isPending}>
                  {actionMutation.isPending ? 'Submitting...' : 'Submit Action'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
