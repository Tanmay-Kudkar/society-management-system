import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { commonAreaApi } from '../../../../api'
import PageShell from '../../components/PageShell'
import {
  Plus, Search, X, Calendar, Clock, MapPin, User, Truck,
  CheckCircle, PauseCircle, PlayCircle, Trash2, Edit,
  AlertTriangle, RefreshCw, IndianRupee,
} from 'lucide-react'

const areaTypeOptions = [
  'LOBBY', 'PARKING', 'GARDEN', 'GYM', 'POOL', 'CLUBHOUSE',
  'TERRACE', 'STAIRCASE', 'ELEVATOR', 'CORRIDOR', 'PLAYGROUND', 'OTHER',
]

const maintenanceTypeOptions = [
  'CLEANING', 'PEST_CONTROL', 'PAINTING', 'PLUMBING', 'ELECTRICAL',
  'LANDSCAPING', 'SECURITY_CHECK', 'FIRE_SAFETY', 'WASTE_MANAGEMENT', 'OTHER',
]

const frequencyOptions = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']

const areaTypeLabels = {
  LOBBY: '🏢 Lobby', PARKING: '🅿️ Parking', GARDEN: '🌿 Garden', GYM: '💪 Gym',
  POOL: '🏊 Pool', CLUBHOUSE: '🎉 Clubhouse', TERRACE: '🌅 Terrace',
  STAIRCASE: '🪜 Staircase', ELEVATOR: '🛗 Elevator', CORRIDOR: '🚪 Corridor',
  PLAYGROUND: '🎠 Playground', OTHER: '📦 Other',
}

const maintenanceTypeLabels = {
  CLEANING: '🧹 Cleaning', PEST_CONTROL: '🐛 Pest Control', PAINTING: '🎨 Painting',
  PLUMBING: '🔧 Plumbing', ELECTRICAL: '⚡ Electrical', LANDSCAPING: '🌳 Landscaping',
  SECURITY_CHECK: '🔒 Security Check', FIRE_SAFETY: '🔥 Fire Safety',
  WASTE_MANAGEMENT: '♻️ Waste Mgmt', OTHER: '📋 Other',
}

export default function CommonAreas() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const societyId = user?.societyId

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAreaType, setFilterAreaType] = useState('')

  const [form, setForm] = useState({
    areaName: '', areaType: 'OTHER', description: '', maintenanceType: 'CLEANING',
    frequency: 'DAILY', dayOfWeek: '', dayOfMonth: '', timeSlot: '',
    assignedTo: '', vendorName: '', nextDueDate: '', costPerService: '', notes: '',
  })

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['commonAreas', societyId],
    queryFn: () => commonAreaApi.getBySociety(societyId, user.id).then(r => r.data),
    enabled: !!societyId,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['commonAreaCounts', societyId],
    queryFn: () => commonAreaApi.getCounts(societyId, user.id).then(r => r.data),
    enabled: !!societyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => commonAreaApi.create(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonAreas'] })
      queryClient.invalidateQueries({ queryKey: ['commonAreaCounts'] })
      showToast('Schedule created', 'success')
      closeModal()
    },
    onError: () => showToast('Failed to create schedule', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => commonAreaApi.update(id, user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonAreas'] })
      showToast('Schedule updated', 'success')
      closeModal()
    },
    onError: () => showToast('Failed to update', 'error'),
  })

  const completeMutation = useMutation({
    mutationFn: (id) => commonAreaApi.markCompleted(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonAreas'] })
      queryClient.invalidateQueries({ queryKey: ['commonAreaCounts'] })
      showToast('Marked as completed', 'success')
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (id) => commonAreaApi.pause(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonAreas'] })
      queryClient.invalidateQueries({ queryKey: ['commonAreaCounts'] })
      showToast('Schedule paused', 'success')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id) => commonAreaApi.resume(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonAreas'] })
      queryClient.invalidateQueries({ queryKey: ['commonAreaCounts'] })
      showToast('Schedule resumed', 'success')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => commonAreaApi.delete(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonAreas'] })
      queryClient.invalidateQueries({ queryKey: ['commonAreaCounts'] })
      showToast('Schedule deleted', 'success')
    },
  })

  const filtered = useMemo(() => {
    return schedules.filter(s => {
      const matchSearch = !search || s.areaName?.toLowerCase().includes(search.toLowerCase())
        || s.assignedTo?.toLowerCase().includes(search.toLowerCase())
        || s.vendorName?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || s.status === filterStatus
      const matchType = !filterAreaType || s.areaType === filterAreaType
      return matchSearch && matchStatus && matchType
    })
  }, [schedules, search, filterStatus, filterAreaType])

  const closeModal = () => {
    setShowModal(false)
    setEditItem(null)
    setForm({
      areaName: '', areaType: 'OTHER', description: '', maintenanceType: 'CLEANING',
      frequency: 'DAILY', dayOfWeek: '', dayOfMonth: '', timeSlot: '',
      assignedTo: '', vendorName: '', nextDueDate: '', costPerService: '', notes: '',
    })
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      areaName: item.areaName || '', areaType: item.areaType || 'OTHER',
      description: item.description || '', maintenanceType: item.maintenanceType || 'CLEANING',
      frequency: item.frequency || 'DAILY', dayOfWeek: item.dayOfWeek || '',
      dayOfMonth: item.dayOfMonth || '', timeSlot: item.timeSlot || '',
      assignedTo: item.assignedTo || '', vendorName: item.vendorName || '',
      nextDueDate: item.nextDueDate || '', costPerService: item.costPerService || '',
      notes: item.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      societyId,
      dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth) : null,
      costPerService: form.costPerService ? parseFloat(form.costPerService) : null,
      nextDueDate: form.nextDueDate || null,
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isOverdue = (item) => item.status === 'ACTIVE' && item.nextDueDate && new Date(item.nextDueDate) < new Date()

  return (
    <PageShell title="Common Area Maintenance" subtitle="Schedule and track common area upkeep">
      {/* Summary Cards */}
      <div className="ca-summary">
        <div className="ca-summary-card">
          <CheckCircle size={20} className="ca-summary-icon ca-summary-icon--active" />
          <div className="ca-summary-info">
            <span className="ca-summary-value">{counts.active || 0}</span>
            <span className="ca-summary-label">Active</span>
          </div>
        </div>
        <div className="ca-summary-card">
          <PauseCircle size={20} className="ca-summary-icon ca-summary-icon--paused" />
          <div className="ca-summary-info">
            <span className="ca-summary-value">{counts.paused || 0}</span>
            <span className="ca-summary-label">Paused</span>
          </div>
        </div>
        <div className="ca-summary-card">
          <AlertTriangle size={20} className="ca-summary-icon ca-summary-icon--overdue" />
          <div className="ca-summary-info">
            <span className="ca-summary-value">{counts.overdue || 0}</span>
            <span className="ca-summary-label">Overdue</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ca-toolbar">
        <div className="ca-search">
          <Search size={16} />
          <input type="text" placeholder="Search areas..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
        <select value={filterAreaType} onChange={e => setFilterAreaType(e.target.value)}>
          <option value="">All Areas</option>
          {areaTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <button className="ca-btn ca-btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      {/* List */}
      <div className="ca-list">
        {isLoading ? (
          <div className="ca-loading">Loading schedules...</div>
        ) : filtered.length === 0 ? (
          <div className="ca-empty">No maintenance schedules found</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className={`ca-card ${isOverdue(item) ? 'ca-card--overdue' : ''}`}>
              <div className="ca-card-header">
                <div className="ca-card-title-row">
                  <span className="ca-card-area-type">{areaTypeLabels[item.areaType] || item.areaType}</span>
                  <h3 className="ca-card-title">{item.areaName}</h3>
                </div>
                <div className="ca-card-badges">
                  <span className={`ca-badge ca-badge--${item.status?.toLowerCase()}`}>{item.status}</span>
                  {isOverdue(item) && <span className="ca-badge ca-badge--overdue">OVERDUE</span>}
                </div>
              </div>

              <div className="ca-card-body">
                <div className="ca-card-detail">
                  <RefreshCw size={14} />
                  <span>{maintenanceTypeLabels[item.maintenanceType] || item.maintenanceType} · {item.frequency}</span>
                </div>
                {item.timeSlot && (
                  <div className="ca-card-detail">
                    <Clock size={14} /><span>{item.timeSlot}</span>
                  </div>
                )}
                {item.assignedTo && (
                  <div className="ca-card-detail">
                    <User size={14} /><span>{item.assignedTo}</span>
                  </div>
                )}
                {item.vendorName && (
                  <div className="ca-card-detail">
                    <Truck size={14} /><span>{item.vendorName}</span>
                  </div>
                )}
                {item.nextDueDate && (
                  <div className="ca-card-detail">
                    <Calendar size={14} /><span>Next: {new Date(item.nextDueDate).toLocaleDateString()}</span>
                  </div>
                )}
                {item.costPerService && (
                  <div className="ca-card-detail">
                    <IndianRupee size={14} /><span>₹{Number(item.costPerService).toLocaleString()}</span>
                  </div>
                )}
                {item.lastCompletedAt && (
                  <div className="ca-card-detail ca-card-detail--muted">
                    <CheckCircle size={14} /><span>Last done: {new Date(item.lastCompletedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="ca-card-actions">
                {item.status === 'ACTIVE' && (
                  <>
                    <button className="ca-btn ca-btn--success ca-btn--sm" onClick={() => completeMutation.mutate(item.id)}>
                      <CheckCircle size={14} /> Done
                    </button>
                    <button className="ca-btn ca-btn--warning ca-btn--sm" onClick={() => pauseMutation.mutate(item.id)}>
                      <PauseCircle size={14} /> Pause
                    </button>
                  </>
                )}
                {item.status === 'PAUSED' && (
                  <button className="ca-btn ca-btn--info ca-btn--sm" onClick={() => resumeMutation.mutate(item.id)}>
                    <PlayCircle size={14} /> Resume
                  </button>
                )}
                <button className="ca-btn ca-btn--ghost ca-btn--sm" onClick={() => openEdit(item)}>
                  <Edit size={14} />
                </button>
                <button className="ca-btn ca-btn--danger ca-btn--sm" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ca-modal-overlay" onClick={closeModal}>
          <div className="ca-modal" onClick={e => e.stopPropagation()}>
            <div className="ca-modal-header">
              <h2>{editItem ? 'Edit Schedule' : 'New Maintenance Schedule'}</h2>
              <button className="ca-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="ca-form">
              <div className="ca-form-row">
                <div className="ca-form-group">
                  <label>Area Name *</label>
                  <input type="text" value={form.areaName} onChange={e => setForm({ ...form, areaName: e.target.value })} required />
                </div>
                <div className="ca-form-group">
                  <label>Area Type *</label>
                  <select value={form.areaType} onChange={e => setForm({ ...form, areaType: e.target.value })}>
                    {areaTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="ca-form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="ca-form-row">
                <div className="ca-form-group">
                  <label>Maintenance Type *</label>
                  <select value={form.maintenanceType} onChange={e => setForm({ ...form, maintenanceType: e.target.value })}>
                    {maintenanceTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="ca-form-group">
                  <label>Frequency</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                    {frequencyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="ca-form-row">
                <div className="ca-form-group">
                  <label>Time Slot</label>
                  <input type="text" placeholder="e.g. 6:00 AM - 8:00 AM" value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })} />
                </div>
                <div className="ca-form-group">
                  <label>Next Due Date</label>
                  <input type="date" value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} />
                </div>
              </div>
              <div className="ca-form-row">
                <div className="ca-form-group">
                  <label>Assigned To</label>
                  <input type="text" placeholder="Person or team" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
                </div>
                <div className="ca-form-group">
                  <label>Vendor Name</label>
                  <input type="text" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} />
                </div>
              </div>
              <div className="ca-form-group">
                <label>Cost per Service</label>
                <input type="number" step="0.01" value={form.costPerService} onChange={e => setForm({ ...form, costPerService: e.target.value })} />
              </div>
              <div className="ca-form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="ca-form-actions">
                <button type="button" className="ca-btn ca-btn--ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="ca-btn ca-btn--primary">
                  {editItem ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
