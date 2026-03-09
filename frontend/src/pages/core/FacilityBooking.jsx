import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { facilityBookingApi } from '../../../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageShell from '../../components/PageShell'
import { CalendarRange, Plus, Search, X } from 'lucide-react'

const facilityTypeOptions = [
  { value: 'CLUBHOUSE', label: 'Clubhouse' },
  { value: 'SWIMMING_POOL', label: 'Swimming Pool' },
  { value: 'GYM', label: 'Gym' },
  { value: 'BANQUET_HALL', label: 'Banquet Hall' },
  { value: 'COMMUNITY_HALL', label: 'Community Hall' },
  { value: 'SPORTS_COURT', label: 'Sports Court' },
  { value: 'GARDEN', label: 'Garden / Lawn' },
  { value: 'TERRACE', label: 'Terrace' },
  { value: 'PARKING', label: 'Parking Space' },
  { value: 'PARTY_AREA', label: 'Party Area' },
  { value: 'OTHER', label: 'Other' },
]

const statusEmoji = { PENDING: '⏳', APPROVED: '✅', REJECTED: '❌', CANCELLED: '🚫' }
const statusLabel = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', CANCELLED: 'Cancelled' }
const paymentLabel = { UNPAID: 'Unpaid', PAID: 'Paid', PARTIAL: 'Partial', REFUNDED: 'Refunded' }

const itemBorderMap = {
  pending: 'border-l-4 border-l-[var(--warning,#f59e0b)]',
  approved: 'border-l-4 border-l-[var(--success,#22c55e)]',
  rejected: 'border-l-4 border-l-[var(--error,#ef4444)]',
  cancelled: 'border-l-4 border-l-[var(--text-secondary,#94a3b8)]',
}

const badgeMap = {
  pending: 'bg-[#fef3c7] text-[#92400e]',
  approved: 'bg-[#dcfce7] text-[#166534]',
  rejected: 'bg-[#fee2e2] text-[#991b1b]',
  cancelled: 'bg-[var(--bg-card)] text-[var(--text-secondary)]',
}

const emptyForm = {
  facilityName: '', facilityType: 'CLUBHOUSE', bookingDate: '', startTime: '', endTime: '',
  purpose: '', attendees: 1, amount: '', paymentStatus: 'UNPAID', adminNotes: '', cancelledReason: '',
}

export default function FacilityBooking() {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = user?.role === 'MASTER_ADMIN' && Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
    ? parsedSocietyIdFromUrl
    : null
  const effectiveSocietyId = scopedSocietyId || user?.societyId
  const userId = user?.id
  const canLoadSocietyData = Boolean(effectiveSocietyId && userId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['facility-bookings', effectiveSocietyId],
    queryFn: () => facilityBookingApi.getBySociety(effectiveSocietyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['facility-bookings-counts', effectiveSocietyId],
    queryFn: () => facilityBookingApi.getCounts(effectiveSocietyId, userId).then(r => r.data),
    enabled: canLoadSocietyData,
  })

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['facility-bookings'] }); qc.invalidateQueries({ queryKey: ['facility-bookings-counts'] }) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId
      ? facilityBookingApi.update(editingId, userId, data)
      : facilityBookingApi.create(userId, data),
    onSuccess: () => { toast.success(editingId ? 'Booking updated' : 'Booking created'); invalidate(); closeModal() },
    onError: () => toast.error('Failed to save booking'),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => facilityBookingApi.approve(id, userId),
    onSuccess: () => { toast.success('Booking approved'); invalidate() },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => facilityBookingApi.reject(id, userId),
    onSuccess: () => { toast.success('Booking rejected'); invalidate() },
    onError: () => toast.error('Failed to reject'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => facilityBookingApi.cancel(id, userId),
    onSuccess: () => { toast.success('Booking cancelled'); invalidate() },
    onError: () => toast.error('Failed to cancel'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => facilityBookingApi.delete(id, userId),
    onSuccess: () => { toast.success('Booking deleted'); invalidate() },
    onError: () => toast.error('Failed to delete'),
  })

  const filtered = useMemo(() => {
    let list = bookings
    if (statusFilter) list = list.filter(b => b.status === statusFilter)
    if (typeFilter) list = list.filter(b => b.facilityType === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(b => b.facilityName?.toLowerCase().includes(q) || b.bookedByName?.toLowerCase().includes(q) || b.purpose?.toLowerCase().includes(q))
    }
    return list
  }, [bookings, statusFilter, typeFilter, search])

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm) }

  const openEdit = (b) => {
    setEditingId(b.id)
    setForm({
      facilityName: b.facilityName || '', facilityType: b.facilityType || 'CLUBHOUSE',
      bookingDate: b.bookingDate || '', startTime: b.startTime || '', endTime: b.endTime || '',
      purpose: b.purpose || '', attendees: b.attendees || 1, amount: b.amount || '',
      paymentStatus: b.paymentStatus || 'UNPAID', adminNotes: b.adminNotes || '', cancelledReason: b.cancelledReason || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate({ ...form, societyId: effectiveSocietyId, bookedById: userId, attendees: Number(form.attendees) || 1, amount: form.amount ? Number(form.amount) : 0 })
  }

  const summaryCards = [
    { label: 'Pending', value: counts.pending ?? 0, cls: 'border-l-4 border-l-[var(--warning,#f59e0b)]' },
    { label: 'Approved', value: counts.approved ?? 0, cls: 'border-l-4 border-l-[var(--success,#22c55e)]' },
    { label: 'Rejected', value: counts.rejected ?? 0, cls: 'border-l-4 border-l-[var(--error,#ef4444)]' },
    { label: 'Cancelled', value: counts.cancelled ?? 0, cls: 'border-l-4 border-l-[var(--text-secondary,#94a3b8)]' },
  ]

  return (
    <PageShell title="Facility Booking" icon={CalendarRange} loading={canLoadSocietyData && isLoading}>
      {/* Summary */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 mb-6">
        {summaryCards.map(c => (
          <div key={c.label} className={`flex flex-col items-center py-[1.1rem] px-3 rounded-xl bg-[var(--card)] border border-[var(--border-default)] ${c.cls}`}>
            <span className="text-[1.55rem] font-extrabold text-[var(--text-primary)]">{c.value}</span>
            <span className="text-[0.8rem] text-[var(--text-secondary)] mt-[0.15rem]">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-[0.4rem] bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-[0.4rem] flex-1 min-w-[180px]">
          <Search size={16} />
          <input placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)} className="border-none bg-transparent outline-none w-full text-[0.92rem] text-[var(--text-primary)]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="py-[0.45rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--card)] text-[var(--text-primary)] text-[0.88rem]">
          <option value="">All Types</option>
          {facilityTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--primary,#6366f1)] text-white" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Booking
        </button>
      </div>

      {/* Booking List */}
      <div className="flex flex-col gap-[0.85rem]">
        {filtered.length === 0 && <div className="text-center text-[var(--text-secondary)] p-10 text-[0.95rem]">No bookings found.</div>}
        {filtered.map(b => (
          <div key={b.id} className={`bg-[var(--card)] border border-[var(--border-default)] rounded-xl px-[1.2rem] py-4 ${itemBorderMap[b.status?.toLowerCase()] || ''}`}>
            <div className="flex justify-between items-center mb-[0.45rem]">
              <div className="flex items-center gap-2 text-base">
                <span className="text-[1.15rem]">{statusEmoji[b.status]}</span>
                <strong>{b.facilityName}</strong>
                <span className="text-[0.78rem] text-[var(--text-secondary)] bg-[var(--bg-card)] py-[0.15rem] px-[0.55rem] rounded-full">{facilityTypeOptions.find(o => o.value === b.facilityType)?.label || b.facilityType}</span>
              </div>
              <span className={`text-xs font-bold py-[0.2rem] px-[0.65rem] rounded-full uppercase tracking-[0.04em] ${badgeMap[b.status?.toLowerCase()] || ''}`}>{statusLabel[b.status]}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-[0.84rem] text-[var(--text-secondary)] mb-[0.35rem]">
              <span>📅 {b.bookingDate}</span>
              <span>🕐 {b.startTime} – {b.endTime}</span>
              <span>👤 {b.bookedByName}</span>
              {b.attendees > 0 && <span>👥 {b.attendees}</span>}
              {b.amount > 0 && <span>💰 ₹{Number(b.amount).toLocaleString()}</span>}
              {b.paymentStatus && b.paymentStatus !== 'UNPAID' && <span>Payment: {paymentLabel[b.paymentStatus]}</span>}
            </div>
            {b.purpose && <div className="text-[0.88rem] text-[var(--text-primary)] mb-[0.3rem]">{b.purpose}</div>}
            {b.adminNotes && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Admin: {b.adminNotes}</div>}
            {b.cancelledReason && <div className="text-[0.82rem] text-[var(--text-secondary)] italic mb-[0.2rem]">Reason: {b.cancelledReason}</div>}
            <div className="flex flex-wrap gap-[0.45rem] mt-[0.6rem]">
              {b.status === 'PENDING' && (
                <>
                  <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--success,#22c55e)] text-white" onClick={() => approveMutation.mutate(b.id)}>Approve</button>
                  <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--error,#ef4444)] text-white" onClick={() => rejectMutation.mutate(b.id)}>Reject</button>
                </>
              )}
              {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--warning,#f59e0b)] text-white" onClick={() => cancelMutation.mutate(b.id)}>Cancel</button>
              )}
              <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border-default)]" onClick={() => openEdit(b)}>Edit</button>
              <button className="inline-flex items-center gap-[0.35rem] py-[0.42rem] px-[0.9rem] rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-opacity hover:opacity-85 bg-transparent text-[var(--error,#ef4444)] border border-[var(--error,#ef4444)]" onClick={() => deleteMutation.mutate(b.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1200]" onClick={closeModal}>
          <div className="relative isolate bg-[var(--bg-secondary,#ffffff)] border border-[var(--border-default)] rounded-xl w-[95%] max-w-[620px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.18)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="m-0 text-[1.1rem]">{editingId ? 'Edit Booking' : 'New Booking'}</h3>
              <button className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-2 items-start gap-[0.9rem]">
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Facility Name *</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" required value={form.facilityName} onChange={e => setForm({ ...form, facilityName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Facility Type *</label>
                  <select className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.facilityType} onChange={e => setForm({ ...form, facilityType: e.target.value })}>
                    {facilityTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Booking Date *</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="date" required value={form.bookingDate} onChange={e => setForm({ ...form, bookingDate: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Start Time *</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="time" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">End Time *</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="time" required value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Attendees</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="number" min="1" value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Amount (₹)</label>
                  <input className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Payment Status</label>
                  <select className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Purpose</label>
                  <textarea className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" rows={2} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.3rem] col-span-full">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Admin Notes</label>
                  <textarea className="py-[0.45rem] px-[0.7rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-[0.9rem]" rows={2} value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-[0.65rem] mt-5">
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
