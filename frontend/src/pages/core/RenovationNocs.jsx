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

const itemBorderMap = { pending: 'border-l-4 border-l-[var(--warning,#f59e0b)]', approved: 'border-l-4 border-l-[var(--success,#22c55e)]', 'in-progress': 'border-l-4 border-l-[var(--primary,#6366f1)]', completed: 'border-l-4 border-l-[#06b6d4]', rejected: 'border-l-4 border-l-[var(--error,#ef4444)]' }
const badgeMap = { pending: 'bg-[#fef3c7] text-[#92400e]', approved: 'bg-[#dcfce7] text-[#166534]', 'in-progress': 'bg-[#e0e7ff] text-[#3730a3]', completed: 'bg-[#cffafe] text-[#155e75]', rejected: 'bg-[#fee2e2] text-[#991b1b]' }

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
    { label: 'Pending', value: counts.pending ?? 0, cls: 'border-l-4 border-l-[var(--warning,#f59e0b)]' },
    { label: 'Approved', value: counts.approved ?? 0, cls: 'border-l-4 border-l-[var(--success,#22c55e)]' },
    { label: 'In Progress', value: counts.inProgress ?? 0, cls: 'border-l-4 border-l-[var(--primary,#6366f1)]' },
    { label: 'Completed', value: counts.completed ?? 0, cls: 'border-l-4 border-l-[#06b6d4]' },
    { label: 'Rejected', value: counts.rejected ?? 0, cls: 'border-l-4 border-l-[var(--error,#ef4444)]' },
  ]

  return (
    <PageShell title="Renovation NOC" icon={HardHat} loading={canLoadSocietyData && isLoading}>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 mb-6">
        {summaryCards.map(c => (
          <div key={c.label} className={`flex flex-col items-center py-4 px-3 rounded-xl bg-[var(--card)] border border-[var(--border-default)] ${c.cls}`}>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">{c.value}</span>
            <span className="text-[0.8rem] text-[var(--text-secondary)] mt-[0.15rem]">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-[0.4rem] bg-[var(--card)] border border-[var(--border-default)] rounded-lg py-[0.4rem] px-3 flex-1 min-w-[180px]">
          <Search size={16} />
          <input placeholder="Search NOCs..." value={search} onChange={e => setSearch(e.target.value)} className="border-none bg-transparent outline-none w-full text-[0.92rem] text-[var(--text-primary)]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Types</option>
          {renovationTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Apply NOC
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-[0.85rem]">
        {filtered.length === 0 && <div className="text-center text-[var(--text-secondary)] py-10 text-[0.95rem]">No renovation NOCs found.</div>}
        {filtered.map(n => (
          <div key={n.id} className={`bg-[var(--card)] border border-[var(--border-default)] rounded-xl py-4 px-5 ${itemBorderMap[n.status?.toLowerCase().replace('_', '-')] || ''}`}>
            <div className="flex justify-between items-center mb-[0.45rem]">
              <div className="flex items-center gap-2 text-base">
                <span className="text-[1.15rem]">{statusEmoji[n.status]}</span>
                <strong>{n.flatNumber ? `${n.wing ? n.wing + '-' : ''}${n.flatNumber}` : 'Unit N/A'}</strong>
                <span className="text-[0.78rem] text-[var(--text-secondary)] bg-[var(--bg-card)] py-[0.15rem] px-[0.55rem] rounded-full">{renovationTypeOptions.find(o => o.value === n.renovationType)?.label || n.renovationType}</span>
              </div>
              <span className={`text-xs font-bold py-[0.2rem] px-[0.65rem] rounded-full uppercase tracking-[0.04em] ${badgeMap[n.status?.toLowerCase().replace('_', '-')] || ''}`}>{statusLabel[n.status]}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-[0.84rem] text-[var(--text-secondary)] mb-[0.35rem]">
              <span>👤 {n.requestedByName}</span>
              {n.contractorName && <span>🔧 {n.contractorName}</span>}
              {n.estimatedStartDate && <span>📅 {n.estimatedStartDate} → {n.estimatedEndDate || '?'}</span>}
              {n.estimatedCost > 0 && <span>💰 ₹{Number(n.estimatedCost).toLocaleString()}</span>}
              {n.depositAmount > 0 && <span>🏦 Deposit: ₹{Number(n.depositAmount).toLocaleString()} ({n.depositStatus})</span>}
            </div>
            {n.description && <div className="text-[0.88rem] text-[var(--text-primary)] mb-[0.3rem]">{n.description}</div>}
            {n.rejectionReason && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Reason: {n.rejectionReason}</div>}
            {n.adminNotes && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Admin: {n.adminNotes}</div>}
            {n.approvedByName && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Approved by: {n.approvedByName}</div>}
            <div className="flex flex-wrap gap-[0.45rem] mt-[0.6rem]">
              {n.status === 'PENDING' && (
                <>
                  <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--success,#22c55e)] text-white" onClick={() => approveMutation.mutate(n.id)}>Approve</button>
                  <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--error,#ef4444)] text-white" onClick={() => rejectMutation.mutate(n.id)}>Reject</button>
                </>
              )}
              {n.status === 'APPROVED' && (
                <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" onClick={() => inProgressMutation.mutate(n.id)}>Start Work</button>
              )}
              {n.status === 'IN_PROGRESS' && (
                <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[#06b6d4] text-white" onClick={() => completedMutation.mutate(n.id)}>Mark Done</button>
              )}
              <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]" onClick={() => openEdit(n)}>Edit</button>
              <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-transparent text-[var(--error,#ef4444)] border border-[var(--error,#ef4444)]" onClick={() => deleteMutation.mutate(n.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={closeModal}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[640px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-[1.1rem]">{editingId ? 'Edit NOC' : 'Apply for Renovation NOC'}</h3>
              <button className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-[0.9rem]">
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Flat Number</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Wing</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.wing} onChange={e => setForm({ ...form, wing: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Renovation Type *</label>
                  <select className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.renovationType} onChange={e => setForm({ ...form, renovationType: e.target.value })}>
                    {renovationTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Estimated Cost (₹)</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="number" min="0" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Start Date</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="date" value={form.estimatedStartDate} onChange={e => setForm({ ...form, estimatedStartDate: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">End Date</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="date" value={form.estimatedEndDate} onChange={e => setForm({ ...form, estimatedEndDate: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Contractor Name</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.contractorName} onChange={e => setForm({ ...form, contractorName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Contractor Phone</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.contractorPhone} onChange={e => setForm({ ...form, contractorPhone: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Deposit (₹)</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="number" min="0" value={form.depositAmount} onChange={e => setForm({ ...form, depositAmount: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Deposit Status</label>
                  <select className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.depositStatus} onChange={e => setForm({ ...form, depositStatus: e.target.value })}>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Description</label>
                  <textarea className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="flex items-center gap-2 text-[0.88rem] text-[var(--text-primary)] cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" checked={form.termsAccepted} onChange={e => setForm({ ...form, termsAccepted: e.target.checked })} />
                    I agree to society renovation rules and will restore common areas if affected
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-[0.65rem] mt-5 pt-4 border-t border-[var(--border-default)]">
                <button type="button" className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]" onClick={closeModal}>Cancel</button>
                <button type="submit" className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" disabled={saveMutation.isPending}>
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
