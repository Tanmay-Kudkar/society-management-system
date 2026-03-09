import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { staffShiftApi } from '../../../../api'
import PageShell from '../../components/PageShell'
import {
  Plus, Search, X, Calendar, Clock, MapPin, User,
  LogIn, LogOut, UserX, Trash2, CheckCircle,
} from 'lucide-react'

const shiftTypes = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FULL_DAY']

const statusColors = {
  SCHEDULED: 'bg-[var(--color-blue-100)] text-[var(--color-blue-700)]',
  CHECKED_IN: 'bg-[var(--color-emerald-100)] text-[var(--color-emerald-700)]',
  COMPLETED: 'bg-[var(--color-violet-100)] text-[var(--color-violet-700)]',
  ABSENT: 'bg-[var(--color-red-100)] text-[var(--color-red-700)]',
}

export default function StaffShifts() {
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
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  const [form, setForm] = useState({
    staffUserId: '', shiftDate: new Date().toISOString().split('T')[0],
    shiftType: 'MORNING', startTime: '', endTime: '', location: '', notes: '',
  })

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['staffShifts', effectiveSocietyId],
    queryFn: () => staffShiftApi.getBySociety(effectiveSocietyId, user.id).then(r => r.data),
    enabled: !!effectiveSocietyId,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['staffShiftCounts', effectiveSocietyId, filterDate],
    queryFn: () => staffShiftApi.getDayCounts(effectiveSocietyId, filterDate, user.id).then(r => r.data),
    enabled: !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => staffShiftApi.create(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffShifts'] })
      queryClient.invalidateQueries({ queryKey: ['staffShiftCounts'] })
      showToast('Shift created', 'success')
      setShowModal(false)
    },
    onError: () => showToast('Failed to create shift', 'error'),
  })

  const checkInMutation = useMutation({
    mutationFn: (id) => staffShiftApi.checkIn(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffShifts'] })
      queryClient.invalidateQueries({ queryKey: ['staffShiftCounts'] })
      showToast('Checked in', 'success')
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: (id) => staffShiftApi.checkOut(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffShifts'] })
      queryClient.invalidateQueries({ queryKey: ['staffShiftCounts'] })
      showToast('Checked out', 'success')
    },
  })

  const absentMutation = useMutation({
    mutationFn: (id) => staffShiftApi.markAbsent(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffShifts'] })
      queryClient.invalidateQueries({ queryKey: ['staffShiftCounts'] })
      showToast('Marked absent', 'success')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => staffShiftApi.delete(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffShifts'] })
      queryClient.invalidateQueries({ queryKey: ['staffShiftCounts'] })
      showToast('Shift deleted', 'success')
    },
  })

  const filtered = useMemo(() => {
    return shifts.filter(s => {
      const matchSearch = !search || s.staffUserName?.toLowerCase().includes(search.toLowerCase())
        || s.location?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || s.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [shifts, search, filterStatus])

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      societyId: effectiveSocietyId,
      staffUserId: parseInt(form.staffUserId),
    })
  }

  return (
    <PageShell title="Staff Attendance & Shifts" subtitle="Manage staff schedules and attendance">
      {/* Summary */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 mb-6 max-sm:grid-cols-2">
        <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl">
          <Calendar size={20} className="shrink-0 text-[var(--color-blue-500)]" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[var(--text-primary)]">{counts.scheduled || 0}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-secondary)]">Scheduled</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl">
          <LogIn size={20} className="shrink-0 text-[var(--color-emerald-500)]" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[var(--text-primary)]">{counts.checkedIn || 0}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-secondary)]">Checked In</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl">
          <CheckCircle size={20} className="shrink-0 text-[var(--color-violet-500)]" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[var(--text-primary)]">{counts.completed || 0}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-secondary)]">Completed</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl">
          <UserX size={20} className="shrink-0 text-[var(--color-red-500)]" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[var(--text-primary)]">{counts.absent || 0}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-secondary)]">Absent</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg flex-1 min-w-[180px]">
          <Search size={16} />
          <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="border-none bg-transparent outline-none text-[0.88rem] text-[var(--text-primary)] w-full focus:outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.85rem] font-semibold">
          <option value="">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="COMPLETED">Completed</option>
          <option value="ABSENT">Absent</option>
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.85rem] font-semibold" />
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-all duration-150 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-600)]" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Shift
        </button>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-center p-12 text-[var(--text-secondary)] font-semibold">Loading shifts...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-12 text-[var(--text-secondary)] font-semibold">No shifts found</div>
        ) : (
          filtered.map(shift => (
            <div key={shift.id} className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl px-5 py-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-[0.95rem] font-bold text-[var(--text-primary)] flex items-center gap-1.5 m-0"><User size={16} /> {shift.staffUserName}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{shift.shiftType}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[0.7rem] font-bold uppercase ${statusColors[shift.status] || ''}`}>{shift.status?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex flex-wrap gap-y-2 gap-x-5 mb-2">
                <div className="flex items-center gap-1.5 text-[0.82rem] font-[550] text-[var(--text-primary)]"><Calendar size={14} /><span>{new Date(shift.shiftDate).toLocaleDateString()}</span></div>
                {shift.startTime && <div className="flex items-center gap-1.5 text-[0.82rem] font-[550] text-[var(--text-primary)]"><Clock size={14} /><span>{shift.startTime} - {shift.endTime}</span></div>}
                {shift.location && <div className="flex items-center gap-1.5 text-[0.82rem] font-[550] text-[var(--text-primary)]"><MapPin size={14} /><span>{shift.location}</span></div>}
                {shift.checkInTime && <div className="flex items-center gap-1.5 text-[0.82rem] font-[550] text-[var(--text-muted)]"><LogIn size={14} /><span>In: {new Date(shift.checkInTime).toLocaleTimeString()}</span></div>}
                {shift.checkOutTime && <div className="flex items-center gap-1.5 text-[0.82rem] font-[550] text-[var(--text-muted)]"><LogOut size={14} /><span>Out: {new Date(shift.checkOutTime).toLocaleTimeString()}</span></div>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {shift.status === 'SCHEDULED' && (
                  <>
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 bg-[var(--color-emerald-50)] text-[var(--color-emerald-700)]" onClick={() => checkInMutation.mutate(shift.id)}><LogIn size={14} /> Check In</button>
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 bg-[var(--color-amber-50)] text-[var(--color-amber-700)]" onClick={() => absentMutation.mutate(shift.id)}><UserX size={14} /> Absent</button>
                  </>
                )}
                {shift.status === 'CHECKED_IN' && (
                  <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 bg-[var(--color-blue-50)] text-[var(--color-blue-700)]" onClick={() => checkOutMutation.mutate(shift.id)}><LogOut size={14} /> Check Out</button>
                )}
                <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.8rem] font-semibold cursor-pointer transition-all duration-150 bg-[var(--color-red-50)] text-[var(--color-red-600)]" onClick={() => deleteMutation.mutate(shift.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between p-5 border-b border-[var(--border-default)]">
              <h2 className="text-lg font-bold m-0">Create Shift</h2>
              <button className="bg-transparent border-none cursor-pointer text-[var(--text-secondary)]" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Staff User ID *</label>
                <input type="number" value={form.staffUserId} onChange={e => setForm({ ...form, staffUserId: e.target.value })} required className="px-3 py-[0.55rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem]" />
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Shift Date *</label>
                  <input type="date" value={form.shiftDate} onChange={e => setForm({ ...form, shiftDate: e.target.value })} required className="px-3 py-[0.55rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Shift Type *</label>
                  <select value={form.shiftType} onChange={e => setForm({ ...form, shiftType: e.target.value })} className="px-3 py-[0.55rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem]">
                    {shiftTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Start Time</label>
                  <input type="text" placeholder="e.g. 06:00" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="px-3 py-[0.55rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">End Time</label>
                  <input type="text" placeholder="e.g. 14:00" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="px-3 py-[0.55rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Location</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="px-3 py-[0.55rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.82rem] font-semibold text-[var(--text-secondary)]">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="px-3 py-[0.55rem] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.88rem]" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-all duration-150 bg-[var(--bg-secondary)] text-[var(--text-secondary)]" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold cursor-pointer transition-all duration-150 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-600)]">Create Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
