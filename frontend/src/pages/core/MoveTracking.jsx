import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moveRecordApi } from '../../../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageShell from '../../components/PageShell'
import { ArrowLeftRight, Plus, Search, X } from 'lucide-react'

const moveTypeOptions = [
  { value: 'MOVE_IN', label: 'Move In' },
  { value: 'MOVE_OUT', label: 'Move Out' },
]

const vehicleTypeOptions = [
  { value: 'TRUCK', label: 'Truck' },
  { value: 'TEMPO', label: 'Tempo' },
  { value: 'VAN', label: 'Van' },
  { value: 'CAR', label: 'Car' },
  { value: 'OTHER', label: 'Other' },
]

const statusEmoji = { SCHEDULED: '📅', IN_PROGRESS: '🚚', COMPLETED: '✅', CANCELLED: '🚫' }
const statusLabel = { SCHEDULED: 'Scheduled', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }

const itemBorderMap = {
  scheduled: 'border-l-4 border-l-[var(--warning,#f59e0b)]',
  'in-progress': 'border-l-4 border-l-[var(--primary,#6366f1)]',
  completed: 'border-l-4 border-l-[var(--success,#22c55e)]',
  cancelled: 'border-l-4 border-l-[var(--text-secondary,#94a3b8)]',
}

const statusBadgeMap = {
  scheduled: 'bg-[#fef3c7] text-[#92400e]',
  'in-progress': 'bg-[#e0e7ff] text-[#3730a3]',
  completed: 'bg-[#dcfce7] text-[#166534]',
  cancelled: 'bg-[var(--bg-card)] text-[var(--text-secondary)]',
}

const typeBadgeMap = {
  'move-in': 'bg-[#cffafe] text-[#155e75]',
  'move-out': 'bg-[#ffedd5] text-[#9a3412]',
}

const emptyForm = {
  flatNumber: '', wing: '', moveType: 'MOVE_IN', moveDate: '', scheduledTime: '',
  vehicleNumber: '', vehicleType: 'TRUCK', moversCompany: '', moversPhone: '',
  numberOfHelpers: 0, itemsDescription: '', elevatorRequired: false,
  depositAmount: '', depositStatus: 'UNPAID', adminNotes: '',
}

export default function MoveTracking() {
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

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['move-records', societyId],
    queryFn: () => moveRecordApi.getBySociety(societyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['move-records-counts', societyId],
    queryFn: () => moveRecordApi.getCounts(societyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['move-records'] }); qc.invalidateQueries({ queryKey: ['move-records-counts'] }) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? moveRecordApi.update(editingId, userId, data) : moveRecordApi.create(userId, data),
    onSuccess: () => { toast.success(editingId ? 'Record updated' : 'Record created'); invalidate(); closeModal() },
    onError: () => toast.error('Failed to save'),
  })
  const inProgressMut = useMutation({ mutationFn: (id) => moveRecordApi.markInProgress(id, userId), onSuccess: () => { toast.success('Started'); invalidate() } })
  const completedMut = useMutation({ mutationFn: (id) => moveRecordApi.markCompleted(id, userId), onSuccess: () => { toast.success('Completed'); invalidate() } })
  const cancelledMut = useMutation({ mutationFn: (id) => moveRecordApi.markCancelled(id, userId), onSuccess: () => { toast.success('Cancelled'); invalidate() } })
  const deleteMut = useMutation({ mutationFn: (id) => moveRecordApi.delete(id, userId), onSuccess: () => { toast.success('Deleted'); invalidate() } })

  const filtered = useMemo(() => {
    let list = records
    if (statusFilter) list = list.filter(r => r.status === statusFilter)
    if (typeFilter) list = list.filter(r => r.moveType === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => r.userName?.toLowerCase().includes(q) || r.flatNumber?.toLowerCase().includes(q) || r.moversCompany?.toLowerCase().includes(q))
    }
    return list
  }, [records, statusFilter, typeFilter, search])

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (r) => {
    setEditingId(r.id)
    setForm({
      flatNumber: r.flatNumber || '', wing: r.wing || '', moveType: r.moveType || 'MOVE_IN',
      moveDate: r.moveDate || '', scheduledTime: r.scheduledTime || '',
      vehicleNumber: r.vehicleNumber || '', vehicleType: r.vehicleType || 'TRUCK',
      moversCompany: r.moversCompany || '', moversPhone: r.moversPhone || '',
      numberOfHelpers: r.numberOfHelpers || 0, itemsDescription: r.itemsDescription || '',
      elevatorRequired: r.elevatorRequired || false, depositAmount: r.depositAmount || '',
      depositStatus: r.depositStatus || 'UNPAID', adminNotes: r.adminNotes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      ...form, societyId, userId,
      numberOfHelpers: Number(form.numberOfHelpers) || 0,
      depositAmount: form.depositAmount ? Number(form.depositAmount) : 0,
    })
  }

  const summaryCards = [
    { label: 'Scheduled', value: counts.scheduled ?? 0, cls: 'border-l-4 border-l-[var(--warning,#f59e0b)]' },
    { label: 'In Progress', value: counts.inProgress ?? 0, cls: 'border-l-4 border-l-[var(--primary,#6366f1)]' },
    { label: 'Completed', value: counts.completed ?? 0, cls: 'border-l-4 border-l-[var(--success,#22c55e)]' },
    { label: 'Move Ins', value: counts.moveIn ?? 0, cls: 'border-l-4 border-l-[#06b6d4]' },
    { label: 'Move Outs', value: counts.moveOut ?? 0, cls: 'border-l-4 border-l-[#f97316]' },
  ]

  return (
    <PageShell title="Move-In / Move-Out" icon={ArrowLeftRight} loading={canLoadSocietyData && isLoading}>
      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 mb-6">
        {summaryCards.map(c => (
          <div key={c.label} className={`flex flex-col items-center px-3 py-4 rounded-xl bg-[var(--card)] border border-[var(--border-default)] ${c.cls}`}>
            <span className="text-2xl font-extrabold text-[var(--text-primary)]">{c.value}</span>
            <span className="text-[0.8rem] text-[var(--text-secondary)] mt-[0.15rem]">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-[0.4rem] bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-[0.4rem] flex-1 min-w-[180px]">
          <Search size={16} />
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="border-none bg-transparent outline-none w-full text-[0.92rem] text-[var(--text-primary)]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Types</option>
          {moveTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Record
        </button>
      </div>

      <div className="flex flex-col gap-[0.85rem]">
        {filtered.length === 0 && <div className="text-center text-[var(--text-secondary)] p-10 text-[0.95rem]">No move records found.</div>}
        {filtered.map(r => (
          <div key={r.id} className={`bg-[var(--card)] border border-[var(--border-default)] rounded-xl px-[1.2rem] py-4 ${itemBorderMap[r.status?.toLowerCase().replace('_', '-')] || ''}`}>
            <div className="flex justify-between items-center mb-[0.45rem]">
              <div className="flex items-center gap-2 text-base">
                <span className="text-[1.15rem]">{statusEmoji[r.status]}</span>
                <strong>{r.wing ? `${r.wing}-` : ''}{r.flatNumber || 'N/A'}</strong>
                <span className={`text-[0.78rem] py-[0.15rem] px-[0.55rem] rounded-full ${typeBadgeMap[r.moveType?.toLowerCase().replace('_', '-')] || ''}`}>
                  {r.moveType === 'MOVE_IN' ? '📦 Move In' : '📤 Move Out'}
                </span>
              </div>
              <span className={`text-xs font-bold py-[0.2rem] px-[0.65rem] rounded-full uppercase tracking-[0.04em] ${statusBadgeMap[r.status?.toLowerCase().replace('_', '-')] || ''}`}>{statusLabel[r.status]}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-[0.84rem] text-[var(--text-secondary)] mb-[0.35rem]">
              <span>👤 {r.userName}</span>
              <span>📅 {r.moveDate}</span>
              {r.scheduledTime && <span>🕐 {r.scheduledTime}</span>}
              {r.vehicleNumber && <span>🚗 {r.vehicleNumber}</span>}
              {r.moversCompany && <span>🏢 {r.moversCompany}</span>}
              {r.elevatorRequired && <span>🛗 Elevator</span>}
              {r.depositAmount > 0 && <span>🏦 ₹{Number(r.depositAmount).toLocaleString()} ({r.depositStatus})</span>}
            </div>
            {r.itemsDescription && <div className="text-[0.88rem] text-[var(--text-primary)] mb-[0.3rem]">{r.itemsDescription}</div>}
            {r.adminNotes && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Admin: {r.adminNotes}</div>}
            {r.damageReported && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Damage: {r.damageReported}</div>}
            <div className="flex flex-wrap gap-[0.45rem] mt-[0.6rem]">
              {r.status === 'SCHEDULED' && (
                <>
                  <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" onClick={() => inProgressMut.mutate(r.id)}>Start</button>
                  <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--warning,#f59e0b)] text-white" onClick={() => cancelledMut.mutate(r.id)}>Cancel</button>
                </>
              )}
              {r.status === 'IN_PROGRESS' && (
                <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--success,#22c55e)] text-white" onClick={() => completedMut.mutate(r.id)}>Complete</button>
              )}
              <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]" onClick={() => openEdit(r)}>Edit</button>
              <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-transparent text-[var(--error,#ef4444)] border border-[var(--error,#ef4444)]" onClick={() => deleteMut.mutate(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={closeModal}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[640px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-[1.1rem]">{editingId ? 'Edit Record' : 'New Move Record'}</h3>
              <button className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-[0.9rem]">
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Flat Number</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Wing</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.wing} onChange={e => setForm({ ...form, wing: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Move Type *</label>
                  <select className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.moveType} onChange={e => setForm({ ...form, moveType: e.target.value })}>
                    {moveTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Move Date *</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="date" required value={form.moveDate} onChange={e => setForm({ ...form, moveDate: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Scheduled Time</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="time" value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Vehicle Number</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Vehicle Type</label>
                  <select className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                    {vehicleTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Movers Company</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.moversCompany} onChange={e => setForm({ ...form, moversCompany: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Movers Phone</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.moversPhone} onChange={e => setForm({ ...form, moversPhone: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Helpers</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="number" min="0" value={form.numberOfHelpers} onChange={e => setForm({ ...form, numberOfHelpers: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Deposit (₹)</label><input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="number" min="0" value={form.depositAmount} onChange={e => setForm({ ...form, depositAmount: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Deposit Status</label>
                  <select className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.depositStatus} onChange={e => setForm({ ...form, depositStatus: e.target.value })}>
                    <option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem] col-span-full"><label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Items Description</label><textarea className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" rows={2} value={form.itemsDescription} onChange={e => setForm({ ...form, itemsDescription: e.target.value })} /></div>
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="flex items-center gap-2 text-[0.88rem] text-[var(--text-primary)] cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" checked={form.elevatorRequired} onChange={e => setForm({ ...form, elevatorRequired: e.target.checked })} />
                    Elevator required
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-[0.65rem] mt-5 pt-4 border-t border-[var(--border-default)]">
                <button type="button" className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]" onClick={closeModal}>Cancel</button>
                <button type="submit" className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
