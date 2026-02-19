import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { approvalApi } from '../../../../api'
import { Plus, Search, X, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, RotateCcw, ChevronUp, GitBranch } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, NumberInput, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusColors = {
  PENDING: 'approvals-status--pending',
  IN_REVIEW: 'approvals-status--review',
  APPROVED: 'approvals-status--approved',
  REJECTED: 'approvals-status--rejected',
  CANCELLED: 'approvals-status--cancelled',
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

  if (!canCreate) {
    return <PermissionDenied message="You don't have permission to access approvals" />
  }

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
    enabled: !!effectiveSocietyId && activeTab === 'requests',
  })

  const { data: workflows = [], isLoading: workflowsLoading, isError: workflowsError } = useQuery({
    queryKey: ['approval-workflows', effectiveSocietyId],
    queryFn: () => approvalApi.getWorkflowsBySociety(effectiveSocietyId).then(r => r.data),
    enabled: !!effectiveSocietyId,
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

  // === LOADING ===
  const isLoading = activeTab === 'requests' ? requestsLoading : workflowsLoading
  const isError = activeTab === 'requests' ? requestsError : workflowsError
  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (
      <div className="approvals-page">
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
    <div className="approvals-page">
      {/* Header */}
      <div className="approvals-header">
        <div>
          <h1 className="approvals-title">Approvals</h1>
          <p className="approvals-subtitle">Manage approval workflows and requests</p>
        </div>
        <div className="approvals-header-actions">
          {canManage && activeTab === 'workflows' && (
            <button className="btn btn-secondary" onClick={() => { setWorkflowSteps([{ stepOrder: 1, approverRole: 'CHAIRMAN', isMandatory: true, autoApproveBelow: '' }]); setShowWorkflowModal(true) }}>
              <Plus size={16} /> New Workflow
            </button>
          )}
          {canCreate && activeTab === 'requests' && (
            <button className="btn btn-primary" onClick={() => setShowRequestModal(true)}>
              <Plus size={16} /> New Request
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="approvals-tabs">
        <button className={clsx('approvals-tab', activeTab === 'requests' && 'active')} onClick={() => setActiveTab('requests')}>
          Requests
        </button>
        {canManage && (
          <button className={clsx('approvals-tab', activeTab === 'workflows' && 'active')} onClick={() => setActiveTab('workflows')}>
            Workflows
          </button>
        )}
      </div>

      {/* Summary Cards (requests tab only) */}
      {activeTab === 'requests' && (
        <div className="approvals-summary">
          <div className="summary-card summary-card--pending">
            <Clock size={20} />
            <div>
              <span className="summary-count">{stats.pending}</span>
              <span className="summary-label">Pending</span>
            </div>
          </div>
          <div className="summary-card summary-card--review">
            <AlertTriangle size={20} />
            <div>
              <span className="summary-count">{stats.inReview}</span>
              <span className="summary-label">In Review</span>
            </div>
          </div>
          <div className="summary-card summary-card--approved">
            <CheckCircle size={20} />
            <div>
              <span className="summary-count">{stats.approved}</span>
              <span className="summary-label">Approved</span>
            </div>
          </div>
          <div className="summary-card summary-card--rejected">
            <XCircle size={20} />
            <div>
              <span className="summary-count">{stats.rejected}</span>
              <span className="summary-label">Rejected</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="approvals-filters">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm('')}><X size={14} /></button>}
        </div>
        {activeTab === 'requests' && (
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
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
        <div className="approvals-list">
          {filteredRequests.length === 0 ? (
            <div className="approvals-empty">
              <GitBranch size={48} />
              <p>No approval requests found</p>
            </div>
          ) : filteredRequests.map(req => {
            const StatusIcon = statusIcons[req.status] || Clock
            return (
              <div key={req.id} className="approval-card">
                <div className="approval-card-header">
                  <div className="approval-card-title">
                    <h3>{req.title}</h3>
                    <span className={clsx('approval-status-badge', statusColors[req.status])}>
                      <StatusIcon size={12} /> {req.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="approval-card-type">{req.entityType}</span>
                </div>
                <div className="approval-card-body">
                  {req.description && <p className="approval-card-desc">{req.description}</p>}
                  <div className="approval-card-meta">
                    <span>By: {req.requestedByName || 'Unknown'}</span>
                    {req.amount && <span>Amount: ₹{Number(req.amount).toLocaleString('en-IN')}</span>}
                    <span>Step: {req.currentStep}/{req.totalSteps}</span>
                    {req.workflowName && <span>Workflow: {req.workflowName}</span>}
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="approval-progress">
                    <div className="approval-progress-bar" style={{ width: `${(req.currentStep / req.totalSteps) * 100}%` }} />
                  </div>
                </div>
                <div className="approval-card-actions">
                  {canManage && ['PENDING', 'IN_REVIEW'].includes(req.status) && (
                    <button className="btn btn-sm btn-primary" onClick={() => setShowActionModal(req.id)}>
                      Take Action
                    </button>
                  )}
                  {req.requestedBy === user?.id && req.status === 'PENDING' && (
                    <button className="btn btn-sm btn-danger" onClick={() => cancelMutation.mutate(req.id)}>
                      Cancel
                    </button>
                  )}
                </div>
                {/* Action history */}
                {req.actions?.length > 0 && (
                  <div className="approval-actions-history">
                    <h4>History</h4>
                    {req.actions.map(action => (
                      <div key={action.id} className="action-item">
                        <span className={clsx('action-badge', `action-badge--${action.action?.toLowerCase()}`)}>
                          {action.action}
                        </span>
                        <span>Step {action.stepOrder} — {action.actedByName}</span>
                        {action.comments && <span className="action-comment">{action.comments}</span>}
                        <span className="action-time">{new Date(action.createdAt).toLocaleString()}</span>
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
        <div className="approvals-list">
          {filteredWorkflows.length === 0 ? (
            <div className="approvals-empty">
              <GitBranch size={48} />
              <p>No workflows configured</p>
            </div>
          ) : filteredWorkflows.map(wf => (
            <div key={wf.id} className="approval-card workflow-card">
              <div className="approval-card-header">
                <div className="approval-card-title">
                  <h3>{wf.name}</h3>
                  <span className={clsx('approval-status-badge', wf.isActive ? 'approvals-status--approved' : 'approvals-status--cancelled')}>
                    {wf.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="approval-card-type">{wf.entityType}</span>
              </div>
              <div className="approval-card-body">
                {wf.description && <p className="approval-card-desc">{wf.description}</p>}
                <div className="approval-card-meta">
                  {wf.minAmount != null && <span>Min: ₹{Number(wf.minAmount).toLocaleString('en-IN')}</span>}
                  {wf.maxAmount != null && <span>Max: ₹{Number(wf.maxAmount).toLocaleString('en-IN')}</span>}
                  <span>{wf.steps?.length || 0} step(s)</span>
                </div>
                {/* Steps visualization */}
                {wf.steps?.length > 0 && (
                  <div className="workflow-steps-viz">
                    {wf.steps.map((step, i) => (
                      <div key={step.id} className="workflow-step-chip">
                        <span className="step-num">{step.stepOrder}</span>
                        <span>{step.approverRole}</span>
                        {step.isMandatory && <span className="step-mandatory">Required</span>}
                        {i < wf.steps.length - 1 && <ArrowRight size={14} className="step-arrow" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="approval-card-actions">
                <button className="btn btn-sm btn-danger" onClick={() => deleteWorkflowMutation.mutate(wf.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === CREATE REQUEST MODAL === */}
      {showRequestModal && (
        <div className="modal-backdrop" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Approval Request</h2>
              <button onClick={() => setShowRequestModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <FormInput name="title" label="Title" required />
              <SmartSelect name="entityType" label="Entity Type" options={ENTITY_TYPES} required />
              <FormInput name="entityId" label="Entity ID" type="number" required />
              <NumberInput name="amount" label="Amount (₹)" />
              <FormTextarea name="description" label="Description" />
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <AsyncButton type="submit" className="btn btn-primary" loading={createRequestMutation.isPending}>
                  Submit Request
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === CREATE WORKFLOW MODAL === */}
      {showWorkflowModal && (
        <div className="modal-backdrop" onClick={() => setShowWorkflowModal(false)}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Approval Workflow</h2>
              <button onClick={() => setShowWorkflowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateWorkflow}>
              <FormInput name="name" label="Workflow Name" required />
              <SmartSelect name="entityType" label="Entity Type" options={ENTITY_TYPES} required />
              <FormTextarea name="description" label="Description" />
              <div className="form-row">
                <NumberInput name="minAmount" label="Min Amount (₹)" />
                <NumberInput name="maxAmount" label="Max Amount (₹)" />
              </div>

              <div className="workflow-steps-editor">
                <h3>Approval Steps</h3>
                {workflowSteps.map((step, idx) => (
                  <div key={idx} className="workflow-step-row">
                    <span className="step-order">Step {step.stepOrder}</span>
                    <select value={step.approverRole} onChange={e => updateStep(idx, 'approverRole', e.target.value)}>
                      {APPROVER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <label className="step-mandatory-toggle">
                      <input type="checkbox" checked={step.isMandatory} onChange={e => updateStep(idx, 'isMandatory', e.target.checked)} />
                      Required
                    </label>
                    <input type="number" placeholder="Auto-approve below ₹" value={step.autoApproveBelow}
                           onChange={e => updateStep(idx, 'autoApproveBelow', e.target.value)} className="step-auto-input" />
                    {workflowSteps.length > 1 && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => removeStep(idx)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-secondary" onClick={addStep}>
                  <Plus size={14} /> Add Step
                </button>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowWorkflowModal(false)}>Cancel</button>
                <AsyncButton type="submit" className="btn btn-primary" loading={createWorkflowMutation.isPending}>
                  Create Workflow
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === TAKE ACTION MODAL === */}
      {showActionModal && selectedRequest && (
        <div className="modal-backdrop" onClick={() => setShowActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Take Action</h2>
              <button onClick={() => setShowActionModal(null)}><X size={20} /></button>
            </div>
            <div className="action-request-info">
              <h3>{selectedRequest.title}</h3>
              <p>Step {selectedRequest.currentStep} of {selectedRequest.totalSteps}</p>
              {selectedRequest.amount && <p>Amount: ₹{Number(selectedRequest.amount).toLocaleString('en-IN')}</p>}
            </div>
            <form onSubmit={handleAction}>
              <SmartSelect name="action" label="Action" options={[
                { value: 'APPROVED', label: '✓ Approve' },
                { value: 'REJECTED', label: '✗ Reject' },
                { value: 'RETURNED', label: '↩ Return to Previous Step' },
                { value: 'ESCALATED', label: '↑ Escalate to Next Step' },
              ]} required />
              <FormTextarea name="comments" label="Comments" />
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowActionModal(null)}>Cancel</button>
                <AsyncButton type="submit" className="btn btn-primary" loading={actionMutation.isPending}>
                  Submit Action
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
