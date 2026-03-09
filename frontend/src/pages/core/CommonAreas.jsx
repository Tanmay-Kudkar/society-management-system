import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
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

const badgeMap = {
  active: 'bg-[var(--color-emerald-100)] text-[var(--color-emerald-700)]',
  paused: 'bg-[var(--color-amber-100)] text-[var(--color-amber-700)]',
  overdue: 'bg-[var(--color-red-100)] text-[var(--color-red-700)]',
}

export default function CommonAreas() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = user?.role === 'MASTER_ADMIN' && Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
    ? parsedSocietyIdFromUrl
    : null
  const effectiveSocietyId = scopedSocietyId || user?.societyId

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
    queryKey: ['commonAreas', effectiveSocietyId],
    queryFn: () => commonAreaApi.getBySociety(effectiveSocietyId, user.id).then(r => r.data),
    enabled: !!effectiveSocietyId,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['commonAreaCounts', effectiveSocietyId],
    queryFn: () => commonAreaApi.getCounts(effectiveSocietyId, user.id).then(r => r.data),
    enabled: !!effectiveSocietyId,
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
      societyId: effectiveSocietyId,
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
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-6">
        <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl">
          <CheckCircle size={20} className="shrink-0 text-[var(--color-emerald-500)]" />
          <div className="flex flex-col">
            <span className="text-[1.35rem] font-bold text-[var(--text-primary)]">{counts.active || 0}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-secondary)]">Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl">
          <PauseCircle size={20} className="shrink-0 text-[var(--color-amber-500)]" />
          <div className="flex flex-col">
            <span className="text-[1.35rem] font-bold text-[var(--text-primary)]">{counts.paused || 0}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-secondary)]">Paused</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl">
          <AlertTriangle size={20} className="shrink-0 text-[var(--color-red-500)]" />
          <div className="flex flex-col">
            <span className="text-[1.35rem] font-bold text-[var(--text-primary)]">{counts.overdue || 0}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-secondary)]">Overdue</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-2 py-2 px-3 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg flex-1 min-w-[180px]">
          <Search size={16} />
          <input type="text" placeholder="Search areas..." value={search} onChange={e => setSearch(e.target.value)} className="border-none bg-transparent outline-none text-[0.88rem] text-[var(--text-primary)] w-full" />
        </div>
        <select className="py-2 px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.85rem] font-semibold" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
        <select className="py-2 px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.85rem] font-semibold" value={filterAreaType} onChange={e => setFilterAreaType(e.target.value)}>
          <option value="">All Areas</option>
          {areaTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <button className="inline-flex items-center gap-[0.4rem] py-2 px-4 border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-all bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-600)]" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center p-12 text-[var(--text-secondary)] font-semibold">Loading schedules...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-12 text-[var(--text-secondary)] font-semibold">No maintenance schedules found</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className={`rounded-xl p-5 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${isOverdue(item) ? 'border border-[var(--color-red-300)] bg-[var(--color-red-50)]' : 'bg-[var(--bg-primary)] border border-[var(--border-default)]'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[0.8rem] font-semibold text-[var(--text-secondary)]">{areaTypeLabels[item.areaType] || item.areaType}</span>
                  <h3 className="text-[1.05rem] font-bold text-[var(--text-primary)] m-0">{item.areaName}</h3>
                </div>
                <div className="flex gap-[0.4rem]">
                  <span className={`py-[0.2rem] px-[0.55rem] rounded-md text-[0.7rem] font-bold uppercase ${badgeMap[item.status?.toLowerCase()] || ''}`}>{item.status}</span>
                  {isOverdue(item) && <span className="py-[0.2rem] px-[0.55rem] rounded-md text-[0.7rem] font-bold uppercase bg-[var(--color-red-100)] text-[var(--color-red-700)]">OVERDUE</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3">
                <div className="flex items-center gap-[0.35rem] text-[0.82rem] font-[550] text-[var(--text-primary)]">
                  <RefreshCw size={14} />
                  <span>{maintenanceTypeLabels[item.maintenanceType] || item.maintenanceType} · {item.frequency}</span>
                </div>
                {item.timeSlot && (
                  <div className="flex items-center gap-[0.35rem] text-[0.82rem] font-[550] text-[var(--text-primary)]">
                    <Clock size={14} /><span>{item.timeSlot}</span>
                  </div>
                )}
                {item.assignedTo && (
                  <div className="flex items-center gap-[0.35rem] text-[0.82rem] font-[550] text-[var(--text-primary)]">
                    <User size={14} /><span>{item.assignedTo}</span>
                  </div>
                )}
                {item.vendorName && (
                  <div className="flex items-center gap-[0.35rem] text-[0.82rem] font-[550] text-[var(--text-primary)]">
                    <Truck size={14} /><span>{item.vendorName}</span>
                  </div>
                )}
                {item.nextDueDate && (
                  <div className="flex items-center gap-[0.35rem] text-[0.82rem] font-[550] text-[var(--text-primary)]">
                    <Calendar size={14} /><span>Next: {new Date(item.nextDueDate).toLocaleDateString()}</span>
                  </div>
                )}
                {item.costPerService && (
                  <div className="flex items-center gap-[0.35rem] text-[0.82rem] font-[550] text-[var(--text-primary)]">
                    <IndianRupee size={14} /><span>₹{Number(item.costPerService).toLocaleString()}</span>
                  </div>
                )}
                {item.lastCompletedAt && (
                  <div className="flex items-center gap-[0.35rem] text-[0.82rem] font-[550] text-[var(--text-muted)]">
                    <CheckCircle size={14} /><span>Last done: {new Date(item.lastCompletedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {item.status === 'ACTIVE' && (
                  <>
                    <button className="inline-flex items-center gap-[0.4rem] py-[0.35rem] px-[0.65rem] border-none rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all bg-[var(--color-emerald-50)] text-[var(--color-emerald-700)] hover:bg-[var(--color-emerald-100)]" onClick={() => completeMutation.mutate(item.id)}>
                      <CheckCircle size={14} /> Done
                    </button>
                    <button className="inline-flex items-center gap-[0.4rem] py-[0.35rem] px-[0.65rem] border-none rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all bg-[var(--color-amber-50)] text-[var(--color-amber-700)] hover:bg-[var(--color-amber-100)]" onClick={() => pauseMutation.mutate(item.id)}>
                      <PauseCircle size={14} /> Pause
                    </button>
                  </>
                )}
                {item.status === 'PAUSED' && (
                  <button className="inline-flex items-center gap-[0.4rem] py-[0.35rem] px-[0.65rem] border-none rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all bg-[var(--color-blue-50)] text-[var(--color-blue-700)] hover:bg-[var(--color-blue-100)]" onClick={() => resumeMutation.mutate(item.id)}>
                    <PlayCircle size={14} /> Resume
                  </button>
                )}
                <button className="inline-flex items-center gap-[0.4rem] py-[0.35rem] px-[0.65rem] border-none rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" onClick={() => openEdit(item)}>
                  <Edit size={14} />
                </button>
                <button className="inline-flex items-center gap-[0.4rem] py-[0.35rem] px-[0.65rem] border-none rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all bg-[var(--color-red-50)] text-[var(--color-red-600)] hover:bg-[var(--color-red-100)]" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={closeModal}>
          <div className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-[600px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--border-default)]">
              <h2 className="text-[1.15rem] font-bold text-[var(--text-primary)] m-0">{editItem ? 'Edit Schedule' : 'New Maintenance Schedule'}</h2>
              <button className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)] p-1" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Area Name *</label>
                  <input className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" type="text" value={form.areaName} onChange={e => setForm({ ...form, areaName: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Area Type *</label>
                  <select className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" value={form.areaType} onChange={e => setForm({ ...form, areaType: e.target.value })}>
                    {areaTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-[0.35rem]">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Description</label>
                <textarea className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550] resize-y" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Maintenance Type *</label>
                  <select className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" value={form.maintenanceType} onChange={e => setForm({ ...form, maintenanceType: e.target.value })}>
                    {maintenanceTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Frequency</label>
                  <select className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                    {frequencyOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Time Slot</label>
                  <input className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" type="text" placeholder="e.g. 6:00 AM - 8:00 AM" value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Next Due Date</label>
                  <input className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" type="date" value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Assigned To</label>
                  <input className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" type="text" placeholder="Person or team" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Vendor Name</label>
                  <input className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" type="text" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-[0.35rem]">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Cost per Service</label>
                <input className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550]" type="number" step="0.01" value={form.costPerService} onChange={e => setForm({ ...form, costPerService: e.target.value })} />
              </div>
              <div className="flex flex-col gap-[0.35rem]">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Notes</label>
                <textarea className="py-[0.55rem] px-3 border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem] font-[550] resize-y" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="inline-flex items-center gap-[0.4rem] py-2 px-4 border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-all bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" onClick={closeModal}>Cancel</button>
                <button type="submit" className="inline-flex items-center gap-[0.4rem] py-2 px-4 border-none rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-all bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-600)]">
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
