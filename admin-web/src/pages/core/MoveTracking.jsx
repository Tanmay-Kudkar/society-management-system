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

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['move-records', societyId],
    queryFn: () => moveRecordApi.getBySociety(societyId, userId).then(r => r.data),
    enabled: !!societyId,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['move-records-counts', societyId],
    queryFn: () => moveRecordApi.getCounts(societyId, userId).then(r => r.data),
    enabled: !!societyId,
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
    { label: 'Scheduled', value: counts.scheduled ?? 0, cls: 'mv-card--scheduled' },
    { label: 'In Progress', value: counts.inProgress ?? 0, cls: 'mv-card--progress' },
    { label: 'Completed', value: counts.completed ?? 0, cls: 'mv-card--completed' },
    { label: 'Move Ins', value: counts.moveIn ?? 0, cls: 'mv-card--in' },
    { label: 'Move Outs', value: counts.moveOut ?? 0, cls: 'mv-card--out' },
  ]

  return (
    <PageShell title="Move-In / Move-Out" icon={ArrowLeftRight} loading={isLoading}>
      <div className="mv-summary">
        {summaryCards.map(c => (
          <div key={c.label} className={`mv-summary-card ${c.cls}`}>
            <span className="mv-summary-value">{c.value}</span>
            <span className="mv-summary-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mv-toolbar">
        <div className="mv-search-wrap">
          <Search size={16} />
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="mv-search" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mv-filter">
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="mv-filter">
          <option value="">All Types</option>
          {moveTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="mv-btn mv-btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Record
        </button>
      </div>

      <div className="mv-list">
        {filtered.length === 0 && <div className="mv-empty">No move records found.</div>}
        {filtered.map(r => (
          <div key={r.id} className={`mv-item mv-item--${r.status?.toLowerCase().replace('_', '-')}`}>
            <div className="mv-item-header">
              <div className="mv-item-title">
                <span className="mv-item-emoji">{statusEmoji[r.status]}</span>
                <strong>{r.wing ? `${r.wing}-` : ''}{r.flatNumber || 'N/A'}</strong>
                <span className={`mv-type-badge mv-type--${r.moveType?.toLowerCase().replace('_', '-')}`}>
                  {r.moveType === 'MOVE_IN' ? '📦 Move In' : '📤 Move Out'}
                </span>
              </div>
              <span className={`mv-badge mv-badge--${r.status?.toLowerCase().replace('_', '-')}`}>{statusLabel[r.status]}</span>
            </div>
            <div className="mv-item-meta">
              <span>👤 {r.userName}</span>
              <span>📅 {r.moveDate}</span>
              {r.scheduledTime && <span>🕐 {r.scheduledTime}</span>}
              {r.vehicleNumber && <span>🚗 {r.vehicleNumber}</span>}
              {r.moversCompany && <span>🏢 {r.moversCompany}</span>}
              {r.elevatorRequired && <span>🛗 Elevator</span>}
              {r.depositAmount > 0 && <span>🏦 ₹{Number(r.depositAmount).toLocaleString()} ({r.depositStatus})</span>}
            </div>
            {r.itemsDescription && <div className="mv-item-desc">{r.itemsDescription}</div>}
            {r.adminNotes && <div className="mv-item-notes">Admin: {r.adminNotes}</div>}
            {r.damageReported && <div className="mv-item-notes">Damage: {r.damageReported}</div>}
            <div className="mv-item-actions">
              {r.status === 'SCHEDULED' && (
                <>
                  <button className="mv-btn mv-btn--progress" onClick={() => inProgressMut.mutate(r.id)}>Start</button>
                  <button className="mv-btn mv-btn--cancel" onClick={() => cancelledMut.mutate(r.id)}>Cancel</button>
                </>
              )}
              {r.status === 'IN_PROGRESS' && (
                <button className="mv-btn mv-btn--complete" onClick={() => completedMut.mutate(r.id)}>Complete</button>
              )}
              <button className="mv-btn mv-btn--edit" onClick={() => openEdit(r)}>Edit</button>
              <button className="mv-btn mv-btn--delete" onClick={() => deleteMut.mutate(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="mv-overlay" onClick={closeModal}>
          <div className="mv-modal" onClick={e => e.stopPropagation()}>
            <div className="mv-modal-header">
              <h3>{editingId ? 'Edit Record' : 'New Move Record'}</h3>
              <button className="mv-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="mv-form">
              <div className="mv-form-grid">
                <div className="mv-field"><label>Flat Number</label><input value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })} /></div>
                <div className="mv-field"><label>Wing</label><input value={form.wing} onChange={e => setForm({ ...form, wing: e.target.value })} /></div>
                <div className="mv-field">
                  <label>Move Type *</label>
                  <select value={form.moveType} onChange={e => setForm({ ...form, moveType: e.target.value })}>
                    {moveTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="mv-field"><label>Move Date *</label><input type="date" required value={form.moveDate} onChange={e => setForm({ ...form, moveDate: e.target.value })} /></div>
                <div className="mv-field"><label>Scheduled Time</label><input type="time" value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })} /></div>
                <div className="mv-field"><label>Vehicle Number</label><input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
                <div className="mv-field">
                  <label>Vehicle Type</label>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                    {vehicleTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="mv-field"><label>Movers Company</label><input value={form.moversCompany} onChange={e => setForm({ ...form, moversCompany: e.target.value })} /></div>
                <div className="mv-field"><label>Movers Phone</label><input value={form.moversPhone} onChange={e => setForm({ ...form, moversPhone: e.target.value })} /></div>
                <div className="mv-field"><label>Helpers</label><input type="number" min="0" value={form.numberOfHelpers} onChange={e => setForm({ ...form, numberOfHelpers: e.target.value })} /></div>
                <div className="mv-field"><label>Deposit (₹)</label><input type="number" min="0" value={form.depositAmount} onChange={e => setForm({ ...form, depositAmount: e.target.value })} /></div>
                <div className="mv-field">
                  <label>Deposit Status</label>
                  <select value={form.depositStatus} onChange={e => setForm({ ...form, depositStatus: e.target.value })}>
                    <option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div className="mv-field mv-field--full"><label>Items Description</label><textarea rows={2} value={form.itemsDescription} onChange={e => setForm({ ...form, itemsDescription: e.target.value })} /></div>
                <div className="mv-field mv-field--full">
                  <label className="mv-checkbox-label">
                    <input type="checkbox" checked={form.elevatorRequired} onChange={e => setForm({ ...form, elevatorRequired: e.target.checked })} />
                    Elevator required
                  </label>
                </div>
              </div>
              <div className="mv-form-actions">
                <button type="button" className="mv-btn mv-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="mv-btn mv-btn--primary" disabled={saveMutation.isPending}>
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
