import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { penaltyApi } from '../../../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import PageShell from '../../components/PageShell'
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
    onSuccess: () => { toast.success(editingId ? 'Updated' : 'Penalty issued'); invalidate(); closeModal() },
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

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm) }

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
    { label: 'Active', value: counts.active ?? 0, cls: 'pn-card--active' },
    { label: 'Unpaid', value: counts.unpaid ?? 0, cls: 'pn-card--unpaid' },
    { label: 'Paid', value: counts.paid ?? 0, cls: 'pn-card--paid' },
    { label: 'Waived', value: counts.waived ?? 0, cls: 'pn-card--waived' },
    { label: 'Appealed', value: counts.appealed ?? 0, cls: 'pn-card--appealed' },
  ]

  return (
    <PageShell title="Penalties & Fines" icon={Ban} loading={canLoadSocietyData && isLoading}>
      <div className="pn-summary">
        {summaryCards.map(c => (
          <div key={c.label} className={`pn-summary-card ${c.cls}`}>
            <span className="pn-summary-value">{c.value}</span>
            <span className="pn-summary-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="pn-toolbar">
        <div className="pn-search-wrap"><Search size={16} /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pn-search" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="pn-filter">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option><option value="WAIVED">Waived</option><option value="APPEALED">Appealed</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="pn-filter">
          <option value="">All Types</option>
          {penaltyTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="pn-btn pn-btn--primary" onClick={() => setShowModal(true)}><Plus size={16} /> Issue Penalty</button>
      </div>

      <div className="pn-list">
        {filtered.length === 0 && <div className="pn-empty">No penalties found.</div>}
        {filtered.map(p => (
          <div key={p.id} className={`pn-item pn-item--${p.status?.toLowerCase()}`}>
            <div className="pn-item-header">
              <div className="pn-item-title">
                <span className="pn-item-emoji">{statusEmoji[p.status]}</span>
                <strong>{p.title}</strong>
                <span className="pn-item-type">{penaltyTypeOptions.find(o => o.value === p.penaltyType)?.label || p.penaltyType}</span>
              </div>
              <span className={`pn-badge pn-badge--${p.status?.toLowerCase()}`}>{statusLabel[p.status]}</span>
            </div>
            <div className="pn-item-meta">
              <span>👤 {p.issuedToName}</span>
              {p.flatNumber && <span>🏠 {p.wing ? `${p.wing}-` : ''}{p.flatNumber}</span>}
              <span>💰 ₹{Number(p.amount).toLocaleString()}</span>
              <span>{paymentEmoji[p.paymentStatus]} {p.paymentStatus}</span>
              {p.dueDate && <span>📅 Due: {p.dueDate}</span>}
              <span>By: {p.issuedByName}</span>
            </div>
            {p.description && <div className="pn-item-desc">{p.description}</div>}
            {p.waivedReason && <div className="pn-item-notes">Waiver: {p.waivedReason}</div>}
            {p.appealNotes && <div className="pn-item-notes">Appeal: {p.appealNotes}</div>}
            <div className="pn-item-actions">
              {p.paymentStatus === 'UNPAID' && p.status === 'ACTIVE' && (
                <button className="pn-btn pn-btn--pay" onClick={() => payMut.mutate(p.id)}>Mark Paid</button>
              )}
              {p.status === 'ACTIVE' && (
                <>
                  <button className="pn-btn pn-btn--waive" onClick={() => waiveMut.mutate(p.id)}>Waive</button>
                  <button className="pn-btn pn-btn--appeal" onClick={() => appealMut.mutate(p.id)}>Appeal</button>
                </>
              )}
              <button className="pn-btn pn-btn--edit" onClick={() => openEdit(p)}>Edit</button>
              <button className="pn-btn pn-btn--delete" onClick={() => deleteMut.mutate(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="pn-overlay" onClick={closeModal}>
          <div className="pn-modal" onClick={e => e.stopPropagation()}>
            <div className="pn-modal-header"><h3>{editingId ? 'Edit Penalty' : 'Issue Penalty'}</h3><button className="pn-modal-close" onClick={closeModal}><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="pn-form">
              <div className="pn-form-grid">
                <div className="pn-field"><label>Issued To (User ID) *</label><input required type="number" value={form.issuedToId} onChange={e => setForm({ ...form, issuedToId: e.target.value })} /></div>
                <div className="pn-field"><label>Flat Number</label><input value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })} /></div>
                <div className="pn-field"><label>Wing</label><input value={form.wing} onChange={e => setForm({ ...form, wing: e.target.value })} /></div>
                <div className="pn-field"><label>Type *</label>
                  <select value={form.penaltyType} onChange={e => setForm({ ...form, penaltyType: e.target.value })}>
                    {penaltyTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="pn-field pn-field--full"><label>Title *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="pn-field"><label>Amount (₹) *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="pn-field"><label>Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
                <div className="pn-field pn-field--full"><label>Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="pn-field pn-field--full"><label>Admin Notes</label><textarea rows={2} value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} /></div>
              </div>
              <div className="pn-form-actions">
                <button type="button" className="pn-btn pn-btn--secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="pn-btn pn-btn--primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Issue'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
