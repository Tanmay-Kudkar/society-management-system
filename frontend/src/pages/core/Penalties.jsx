import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { penaltyApi } from '../../../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageShell from '../../components/PageShell'
import NeonSweepButton from '../../components/NeonSweepButton'
import EmptyStateSection from '../../components/EmptyStateSection'
import { Ban, Plus, Search, X } from 'lucide-react'

const penaltyTypeOptions = [
  { value: 'VIOLATION', label: 'Rule Violation' },
  { value: 'LATE_PAYMENT', label: 'Late Payment' },
  { value: 'NOISE', label: 'Noise Complaint' },
  { value: 'PARKING', label: 'Parking Violation' },
  { value: 'DAMAGE', label: 'Property Damage' },
  { value: 'UNAUTHORIZED', label: 'Unauthorized Activity' },
  { value: 'PET', label: 'Pet Violation' },
  { value: 'LITTERING', label: 'Littering' },
  { value: 'OTHER', label: 'Other' },
]

const statusEmoji = { ACTIVE: '🔴', WAIVED: '🟢', APPEALED: '🟡' }
const statusLabel = { ACTIVE: 'Active', WAIVED: 'Waived', APPEALED: 'Appealed' }
const paymentEmoji = { UNPAID: '💸', PAID: '✅', WAIVED: '🟢' }

const itemBorderMap = {
  active: 'border-l-4 border-l-[var(--error,#ef4444)]',
  waived: 'border-l-4 border-l-cyan-500',
  appealed: 'border-l-4 border-l-[var(--warning,#f59e0b)]',
}
const badgeMap = {
  active: 'bg-red-100 text-red-900',
  waived: 'bg-cyan-100 text-cyan-800',
  appealed: 'bg-amber-100 text-amber-800',
}

const emptyForm = {
  issuedToId: '', flatNumber: '', wing: '', penaltyType: 'VIOLATION',
  title: '', description: '', amount: '', dueDate: '', adminNotes: '',
}

export default function Penalties() {
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

  const { data: penalties = [], isLoading } = useQuery({
    queryKey: ['penalties', societyId],
    queryFn: () => penaltyApi.getBySociety(societyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['penalties-counts', societyId],
    queryFn: () => penaltyApi.getCounts(societyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['penalties'] }); qc.invalidateQueries({ queryKey: ['penalties-counts'] }) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? penaltyApi.update(editingId, userId, data) : penaltyApi.create(userId, data),
    onSuccess: () => { toast.success(editingId ? 'Updated' : 'Penalty issued'); invalidate(); closeModal(true) },
    onError: () => toast.error('Failed to save'),
  })
  const payMut = useMutation({ mutationFn: (id) => penaltyApi.markPaid(id, userId), onSuccess: () => { toast.success('Marked paid'); invalidate() } })
  const waiveMut = useMutation({ mutationFn: (id) => penaltyApi.waive(id, userId), onSuccess: () => { toast.success('Waived'); invalidate() } })
  const appealMut = useMutation({ mutationFn: (id) => penaltyApi.appeal(id, userId), onSuccess: () => { toast.success('Appealed'); invalidate() } })
  const deleteMut = useMutation({ mutationFn: (id) => penaltyApi.delete(id, userId), onSuccess: () => { toast.success('Deleted'); invalidate() } })

  const filtered = useMemo(() => {
    let list = penalties
    if (statusFilter) list = list.filter(p => p.status === statusFilter)
    if (typeFilter) list = list.filter(p => p.penaltyType === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.title?.toLowerCase().includes(q) || p.issuedToName?.toLowerCase().includes(q) || p.flatNumber?.toLowerCase().includes(q))
    }
    return list
  }, [penalties, statusFilter, typeFilter, search])

  const closeModal = (force = false) => {
    if (!force && saveMutation.isPending) return
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const openEdit = (p) => {
    setEditingId(p.id)
    setForm({
      issuedToId: p.issuedToId || '', flatNumber: p.flatNumber || '', wing: p.wing || '',
      penaltyType: p.penaltyType || 'VIOLATION', title: p.title || '', description: p.description || '',
      amount: p.amount || '', dueDate: p.dueDate || '', adminNotes: p.adminNotes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({ ...form, societyId, issuedToId: Number(form.issuedToId), amount: Number(form.amount) || 0 })
  }

  const summaryCards = [
    { label: 'Active', value: counts.active ?? 0, cls: 'border-l-4 border-l-[var(--error,#ef4444)]' },
    { label: 'Unpaid', value: counts.unpaid ?? 0, cls: 'border-l-4 border-l-[var(--warning,#f59e0b)]' },
    { label: 'Paid', value: counts.paid ?? 0, cls: 'border-l-4 border-l-[var(--success,#22c55e)]' },
    { label: 'Waived', value: counts.waived ?? 0, cls: 'border-l-4 border-l-cyan-500' },
    { label: 'Appealed', value: counts.appealed ?? 0, cls: 'border-l-4 border-l-[var(--primary,#6366f1)]' },
  ]

  return (
    <PageShell title="Penalties & Fines" icon={Ban} loading={canLoadSocietyData && isLoading}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 mb-6 max-[600px]:grid-cols-2">
        {summaryCards.map(c => (
          <div key={c.label} className={`flex flex-col items-center px-3 py-4 rounded-xl bg-[var(--card)] border border-[var(--border-default)] ${c.cls}`}>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">{c.value}</span>
            <span className="text-[0.8rem] text-[var(--text-secondary)] mt-0.5">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 flex-1 min-w-[180px]"><Search size={16} /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="border-none bg-transparent outline-none w-full text-[0.92rem] text-[var(--text-primary)] focus:outline-none" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option><option value="WAIVED">Waived</option><option value="APPEALED">Appealed</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Types</option>
          {penaltyTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <NeonSweepButton tone="violet" size="md" onClick={() => setShowModal(true)}><Plus size={16} /> Issue Penalty</NeonSweepButton>
      </div>

      <div className="flex flex-col gap-3.5">
        {filtered.length === 0 && (
          <EmptyStateSection
            title="No penalties found"
            description="No penalties match your selected filters right now."
            icon={Ban}
            className="p-10"
          />
        )}
        {filtered.map(p => (
          <div key={p.id} className={`bg-[var(--card)] border border-[var(--border-default)] rounded-xl px-5 py-4 ${itemBorderMap[p.status?.toLowerCase()] || ''}`}>
            <div className="flex justify-between items-center mb-[0.45rem]">
              <div className="flex items-center gap-2 text-base">
                <span className="text-lg">{statusEmoji[p.status]}</span>
                <strong>{p.title}</strong>
                <span className="text-[0.78rem] text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-0.5 rounded-full">{penaltyTypeOptions.find(o => o.value === p.penaltyType)?.label || p.penaltyType}</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${badgeMap[p.status?.toLowerCase()] || ''}`}>{statusLabel[p.status]}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-[0.84rem] text-[var(--text-secondary)] mb-1.5">
              <span>👤 {p.issuedToName}</span>
              {p.flatNumber && <span>🏠 {p.wing ? `${p.wing}-` : ''}{p.flatNumber}</span>}
              <span>💰 ₹{Number(p.amount).toLocaleString()}</span>
              <span>{paymentEmoji[p.paymentStatus]} {p.paymentStatus}</span>
              {p.dueDate && <span>📅 Due: {p.dueDate}</span>}
              <span>By: {p.issuedByName}</span>
            </div>
            {p.description && <div className="text-[0.88rem] text-[var(--text-primary)] mb-1">{p.description}</div>}
            {p.waivedReason && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-0.5">Waiver: {p.waivedReason}</div>}
            {p.appealNotes && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-0.5">Appeal: {p.appealNotes}</div>}
            <div className="flex flex-wrap gap-[0.45rem] mt-2.5">
              {p.paymentStatus === 'UNPAID' && p.status === 'ACTIVE' && (
                <button className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--success,#22c55e)] text-white" onClick={() => payMut.mutate(p.id)}>Mark Paid</button>
              )}
              {p.status === 'ACTIVE' && (
                <>
                  <button className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-cyan-500 text-white" onClick={() => waiveMut.mutate(p.id)}>Waive</button>
                  <button className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--warning,#f59e0b)] text-white" onClick={() => appealMut.mutate(p.id)}>Appeal</button>
                </>
              )}
              <button className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]" onClick={() => openEdit(p)}>Edit</button>
              <button className="inline-flex items-center gap-1.5 px-3.5 py-[0.42rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-transparent text-[var(--error,#ef4444)] border border-[var(--error,#ef4444)]" onClick={() => deleteMut.mutate(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={closeModal}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]"><h3 className="m-0 text-lg">{editingId ? 'Edit Penalty' : 'Issue Penalty'}</h3><button className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]" onClick={closeModal}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-2 items-start gap-3.5 max-[600px]:grid-cols-1">
                <div className="flex flex-col gap-1"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Issued To (User ID) *</label><input required type="number" value={form.issuedToId} onChange={e => setForm({ ...form, issuedToId: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
                <div className="flex flex-col gap-1"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Flat Number</label><input value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
                <div className="flex flex-col gap-1"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Wing</label><input value={form.wing} onChange={e => setForm({ ...form, wing: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
                <div className="flex flex-col gap-1"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Type *</label>
                  <select value={form.penaltyType} onChange={e => setForm({ ...form, penaltyType: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]">
                    {penaltyTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1 col-span-full"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Title *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
                <div className="flex flex-col gap-1"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Amount (₹) *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
                <div className="flex flex-col gap-1"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
                <div className="flex flex-col gap-1 col-span-full"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
                <div className="flex flex-col gap-1 col-span-full"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Admin Notes</label><textarea rows={2} value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} className="px-[0.7rem] py-[0.45rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" /></div>
              </div>
              <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-[var(--border-default)]">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={closeModal}>Cancel</NeonSweepButton>
                <NeonSweepButton type="submit" tone="violet" size="md" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Issue'}</NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
