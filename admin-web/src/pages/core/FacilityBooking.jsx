import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

const emptyForm = {
  facilityName: '', facilityType: 'CLUBHOUSE', bookingDate: '', startTime: '', endTime: '',
  purpose: '', attendees: 1, amount: '', paymentStatus: 'UNPAID', adminNotes: '', cancelledReason: '',
}

export default function FacilityBooking() {
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const societyId = user?.societyId
  const userId = user?.id

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['facility-bookings', societyId],
    queryFn: () => facilityBookingApi.getBySociety(societyId, userId).then(r => r.data),
    enabled: !!societyId,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['facility-bookings-counts', societyId],
    queryFn: () => facilityBookingApi.getCounts(societyId, userId).then(r => r.data),
    enabled: !!societyId,
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
    saveMutation.mutate({ ...form, societyId, bookedById: userId, attendees: Number(form.attendees) || 1, amount: form.amount ? Number(form.amount) : 0 })
  }

  const summaryCards = [
    { label: 'Pending', value: counts.pending ?? 0, cls: 'fb-card--pending' },
    { label: 'Approved', value: counts.approved ?? 0, cls: 'fb-card--approved' },
    { label: 'Rejected', value: counts.rejected ?? 0, cls: 'fb-card--rejected' },
    { label: 'Cancelled', value: counts.cancelled ?? 0, cls: 'fb-card--cancelled' },
  ]

  return (
    <PageShell title="Facility Booking" icon={CalendarRange} loading={isLoading}>
      {/* Summary */}
      <div className="fb-summary">
        {summaryCards.map(c => (
          <div key={c.label} className={`fb-summary-card ${c.cls}`}>
            <span className="fb-summary-value">{c.value}</span>
            <span className="fb-summary-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="fb-toolbar">
        <div className="fb-search-wrap">
          <Search size={16} />
          <input placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)} className="fb-search" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="fb-filter">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="fb-filter">
          <option value="">All Types</option>
          {facilityTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="fb-btn fb-btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Booking
        </button>
      </div>

      {/* Booking List */}
      <div className="fb-list">
        {filtered.length === 0 && <div className="fb-empty">No bookings found.</div>}
        {filtered.map(b => (
          <div key={b.id} className={`fb-item fb-item--${b.status?.toLowerCase()}`}>
            <div className="fb-item-header">
              <div className="fb-item-title">
                <span className="fb-item-emoji">{statusEmoji[b.status]}</span>
                <strong>{b.facilityName}</strong>
                <span className="fb-item-type">{facilityTypeOptions.find(o => o.value === b.facilityType)?.label || b.facilityType}</span>
              </div>
              <span className={`fb-badge fb-badge--${b.status?.toLowerCase()}`}>{statusLabel[b.status]}</span>
            </div>
            <div className="fb-item-meta">
              <span>📅 {b.bookingDate}</span>
              <span>🕐 {b.startTime} – {b.endTime}</span>
              <span>👤 {b.bookedByName}</span>
              {b.attendees > 0 && <span>👥 {b.attendees}</span>}
              {b.amount > 0 && <span>💰 ₹{Number(b.amount).toLocaleString()}</span>}
              {b.paymentStatus && b.paymentStatus !== 'UNPAID' && <span>Payment: {paymentLabel[b.paymentStatus]}</span>}
            </div>
            {b.purpose && <div className="fb-item-purpose">{b.purpose}</div>}
            {b.adminNotes && <div className="fb-item-notes">Admin: {b.adminNotes}</div>}
            {b.cancelledReason && <div className="fb-item-notes">Reason: {b.cancelledReason}</div>}
            <div className="fb-item-actions">
              {b.status === 'PENDING' && (
                <>
                  <button className="fb-btn fb-btn--approve" onClick={() => approveMutation.mutate(b.id)}>Approve</button>
                  <button className="fb-btn fb-btn--reject" onClick={() => rejectMutation.mutate(b.id)}>Reject</button>
                </>
              )}
              {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                <button className="fb-btn fb-btn--cancel" onClick={() => cancelMutation.mutate(b.id)}>Cancel</button>
              )}
              <button className="fb-btn fb-btn--edit" onClick={() => openEdit(b)}>Edit</button>
              <button className="fb-btn fb-btn--delete" onClick={() => deleteMutation.mutate(b.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fb-overlay" onClick={closeModal}>
          <div className="fb-modal" onClick={e => e.stopPropagation()}>
            <div className="fb-modal-header">
              <h3>{editingId ? 'Edit Booking' : 'New Booking'}</h3>
              <button className="fb-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="fb-form">
              <div className="fb-form-grid">
                <div className="fb-field">
                  <label>Facility Name *</label>
                  <input required value={form.facilityName} onChange={e => setForm({ ...form, facilityName: e.target.value })} />
                </div>
                <div className="fb-field">
                  <label>Facility Type *</label>
                  <select value={form.facilityType} onChange={e => setForm({ ...form, facilityType: e.target.value })}>
                    {facilityTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="fb-field">
                  <label>Booking Date *</label>
                  <input type="date" required value={form.bookingDate} onChange={e => setForm({ ...form, bookingDate: e.target.value })} />
                </div>
                <div className="fb-field">
                  <label>Start Time *</label>
                  <input type="time" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="fb-field">
                  <label>End Time *</label>
                  <input type="time" required value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                </div>
                <div className="fb-field">
                  <label>Attendees</label>
                  <input type="number" min="1" value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} />
                </div>
                <div className="fb-field">
                  <label>Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="fb-field">
                  <label>Payment Status</label>
                  <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div className="fb-field fb-field--full">
                  <label>Purpose</label>
                  <textarea rows={2} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
                </div>
                <div className="fb-field fb-field--full">
                  <label>Admin Notes</label>
                  <textarea rows={2} value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} />
                </div>
              </div>
              <div className="fb-form-actions">
                <button type="button" className="fb-btn fb-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="fb-btn fb-btn--primary" disabled={saveMutation.isPending}>
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
