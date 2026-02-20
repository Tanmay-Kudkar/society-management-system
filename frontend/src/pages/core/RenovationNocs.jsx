import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { renovationNocApi } from '../../../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageShell from '../../components/PageShell'
import { HardHat, Plus, Search, X } from 'lucide-react'

const renovationTypeOptions = [
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'EXTERIOR', label: 'Exterior' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'FLOORING', label: 'Flooring' },
  { value: 'PAINTING', label: 'Painting' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'BATHROOM', label: 'Bathroom' },
  { value: 'OTHER', label: 'Other' },
]

const statusEmoji = { PENDING: '⏳', APPROVED: '✅', IN_PROGRESS: '🔨', COMPLETED: '✔️', REJECTED: '❌' }
const statusLabel = { PENDING: 'Pending', APPROVED: 'Approved', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', REJECTED: 'Rejected' }

const emptyForm = {
  flatNumber: '', wing: '', renovationType: 'INTERIOR', description: '',
  contractorName: '', contractorPhone: '', estimatedStartDate: '', estimatedEndDate: '',
  estimatedCost: '', depositAmount: '', depositStatus: 'UNPAID', termsAccepted: false, adminNotes: '',
}

export default function RenovationNocs() {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const societyId = user?.societyId
  const userId = user?.id
  const canLoadSocietyData = Boolean(societyId && userId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: nocs = [], isLoading } = useQuery({
    queryKey: ['renovation-nocs', societyId],
    queryFn: () => renovationNocApi.getBySociety(societyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['renovation-nocs-counts', societyId],
    queryFn: () => renovationNocApi.getCounts(societyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['renovation-nocs'] }); qc.invalidateQueries({ queryKey: ['renovation-nocs-counts'] }) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId
      ? renovationNocApi.update(editingId, userId, data)
      : renovationNocApi.create(userId, data),
    onSuccess: () => { toast.success(editingId ? 'NOC updated' : 'NOC submitted'); invalidate(); closeModal() },
    onError: () => toast.error('Failed to save NOC'),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => renovationNocApi.approve(id, userId),
    onSuccess: () => { toast.success('NOC approved'); invalidate() },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => renovationNocApi.reject(id, userId),
    onSuccess: () => { toast.success('NOC rejected'); invalidate() },
  })

  const inProgressMutation = useMutation({
    mutationFn: (id) => renovationNocApi.markInProgress(id, userId),
    onSuccess: () => { toast.success('Marked in progress'); invalidate() },
  })

  const completedMutation = useMutation({
    mutationFn: (id) => renovationNocApi.markCompleted(id, userId),
    onSuccess: () => { toast.success('Marked completed'); invalidate() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => renovationNocApi.delete(id, userId),
    onSuccess: () => { toast.success('NOC deleted'); invalidate() },
  })

  const filtered = useMemo(() => {
    let list = nocs
    if (statusFilter) list = list.filter(n => n.status === statusFilter)
    if (typeFilter) list = list.filter(n => n.renovationType === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(n =>
        n.requestedByName?.toLowerCase().includes(q) ||
        n.flatNumber?.toLowerCase().includes(q) ||
        n.contractorName?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [nocs, statusFilter, typeFilter, search])

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (n) => {
    setEditingId(n.id)
    setForm({
      flatNumber: n.flatNumber || '', wing: n.wing || '', renovationType: n.renovationType || 'INTERIOR',
      description: n.description || '', contractorName: n.contractorName || '', contractorPhone: n.contractorPhone || '',
      estimatedStartDate: n.estimatedStartDate || '', estimatedEndDate: n.estimatedEndDate || '',
      estimatedCost: n.estimatedCost || '', depositAmount: n.depositAmount || '', depositStatus: n.depositStatus || 'UNPAID',
      termsAccepted: n.termsAccepted || false, adminNotes: n.adminNotes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      ...form, societyId, requestedById: userId,
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
      depositAmount: form.depositAmount ? Number(form.depositAmount) : 0,
    })
  }

  const summaryCards = [
    { label: 'Pending', value: counts.pending ?? 0, cls: 'rn-card--pending' },
    { label: 'Approved', value: counts.approved ?? 0, cls: 'rn-card--approved' },
    { label: 'In Progress', value: counts.inProgress ?? 0, cls: 'rn-card--progress' },
    { label: 'Completed', value: counts.completed ?? 0, cls: 'rn-card--completed' },
    { label: 'Rejected', value: counts.rejected ?? 0, cls: 'rn-card--rejected' },
  ]

  return (
    <PageShell title="Renovation NOC" icon={HardHat} loading={canLoadSocietyData && isLoading}>
      {/* Summary */}
      <div className="rn-summary">
        {summaryCards.map(c => (
          <div key={c.label} className={`rn-summary-card ${c.cls}`}>
            <span className="rn-summary-value">{c.value}</span>
            <span className="rn-summary-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rn-toolbar">
        <div className="rn-search-wrap">
          <Search size={16} />
          <input placeholder="Search NOCs..." value={search} onChange={e => setSearch(e.target.value)} className="rn-search" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rn-filter">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rn-filter">
          <option value="">All Types</option>
          {renovationTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="rn-btn rn-btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Apply NOC
        </button>
      </div>

      {/* List */}
      <div className="rn-list">
        {filtered.length === 0 && <div className="rn-empty">No renovation NOCs found.</div>}
        {filtered.map(n => (
          <div key={n.id} className={`rn-item rn-item--${n.status?.toLowerCase().replace('_', '-')}`}>
            <div className="rn-item-header">
              <div className="rn-item-title">
                <span className="rn-item-emoji">{statusEmoji[n.status]}</span>
                <strong>{n.flatNumber ? `${n.wing ? n.wing + '-' : ''}${n.flatNumber}` : 'Unit N/A'}</strong>
                <span className="rn-item-type">{renovationTypeOptions.find(o => o.value === n.renovationType)?.label || n.renovationType}</span>
              </div>
              <span className={`rn-badge rn-badge--${n.status?.toLowerCase().replace('_', '-')}`}>{statusLabel[n.status]}</span>
            </div>
            <div className="rn-item-meta">
              <span>👤 {n.requestedByName}</span>
              {n.contractorName && <span>🔧 {n.contractorName}</span>}
              {n.estimatedStartDate && <span>📅 {n.estimatedStartDate} → {n.estimatedEndDate || '?'}</span>}
              {n.estimatedCost > 0 && <span>💰 ₹{Number(n.estimatedCost).toLocaleString()}</span>}
              {n.depositAmount > 0 && <span>🏦 Deposit: ₹{Number(n.depositAmount).toLocaleString()} ({n.depositStatus})</span>}
            </div>
            {n.description && <div className="rn-item-desc">{n.description}</div>}
            {n.rejectionReason && <div className="rn-item-notes">Reason: {n.rejectionReason}</div>}
            {n.adminNotes && <div className="rn-item-notes">Admin: {n.adminNotes}</div>}
            {n.approvedByName && <div className="rn-item-notes">Approved by: {n.approvedByName}</div>}
            <div className="rn-item-actions">
              {n.status === 'PENDING' && (
                <>
                  <button className="rn-btn rn-btn--approve" onClick={() => approveMutation.mutate(n.id)}>Approve</button>
                  <button className="rn-btn rn-btn--reject" onClick={() => rejectMutation.mutate(n.id)}>Reject</button>
                </>
              )}
              {n.status === 'APPROVED' && (
                <button className="rn-btn rn-btn--progress" onClick={() => inProgressMutation.mutate(n.id)}>Start Work</button>
              )}
              {n.status === 'IN_PROGRESS' && (
                <button className="rn-btn rn-btn--complete" onClick={() => completedMutation.mutate(n.id)}>Mark Done</button>
              )}
              <button className="rn-btn rn-btn--edit" onClick={() => openEdit(n)}>Edit</button>
              <button className="rn-btn rn-btn--delete" onClick={() => deleteMutation.mutate(n.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="rn-overlay" onClick={closeModal}>
          <div className="rn-modal" onClick={e => e.stopPropagation()}>
            <div className="rn-modal-header">
              <h3>{editingId ? 'Edit NOC' : 'Apply for Renovation NOC'}</h3>
              <button className="rn-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="rn-form">
              <div className="rn-form-grid">
                <div className="rn-field">
                  <label>Flat Number</label>
                  <input value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>Wing</label>
                  <input value={form.wing} onChange={e => setForm({ ...form, wing: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>Renovation Type *</label>
                  <select value={form.renovationType} onChange={e => setForm({ ...form, renovationType: e.target.value })}>
                    {renovationTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="rn-field">
                  <label>Estimated Cost (₹)</label>
                  <input type="number" min="0" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>Start Date</label>
                  <input type="date" value={form.estimatedStartDate} onChange={e => setForm({ ...form, estimatedStartDate: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>End Date</label>
                  <input type="date" value={form.estimatedEndDate} onChange={e => setForm({ ...form, estimatedEndDate: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>Contractor Name</label>
                  <input value={form.contractorName} onChange={e => setForm({ ...form, contractorName: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>Contractor Phone</label>
                  <input value={form.contractorPhone} onChange={e => setForm({ ...form, contractorPhone: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>Deposit (₹)</label>
                  <input type="number" min="0" value={form.depositAmount} onChange={e => setForm({ ...form, depositAmount: e.target.value })} />
                </div>
                <div className="rn-field">
                  <label>Deposit Status</label>
                  <select value={form.depositStatus} onChange={e => setForm({ ...form, depositStatus: e.target.value })}>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div className="rn-field rn-field--full">
                  <label>Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="rn-field rn-field--full">
                  <label className="rn-checkbox-label">
                    <input type="checkbox" checked={form.termsAccepted} onChange={e => setForm({ ...form, termsAccepted: e.target.checked })} />
                    I agree to society renovation rules and will restore common areas if affected
                  </label>
                </div>
              </div>
              <div className="rn-form-actions">
                <button type="button" className="rn-btn rn-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="rn-btn rn-btn--primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
