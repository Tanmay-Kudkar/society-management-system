import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  SCHEDULED: 'ss-badge--scheduled', CHECKED_IN: 'ss-badge--checkedin',
  COMPLETED: 'ss-badge--completed', ABSENT: 'ss-badge--absent',
}

export default function StaffShifts() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const societyId = user?.societyId

  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  const [form, setForm] = useState({
    staffUserId: '', shiftDate: new Date().toISOString().split('T')[0],
    shiftType: 'MORNING', startTime: '', endTime: '', location: '', notes: '',
  })

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['staffShifts', societyId],
    queryFn: () => staffShiftApi.getBySociety(societyId, user.id).then(r => r.data),
    enabled: !!societyId,
  })

  const { data: counts = {} } = useQuery({
    queryKey: ['staffShiftCounts', societyId, filterDate],
    queryFn: () => staffShiftApi.getDayCounts(societyId, filterDate, user.id).then(r => r.data),
    enabled: !!societyId,
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
      societyId,
      staffUserId: parseInt(form.staffUserId),
    })
  }

  return (
    <PageShell title="Staff Attendance & Shifts" subtitle="Manage staff schedules and attendance">
      {/* Summary */}
      <div className="ss-summary">
        <div className="ss-summary-card">
          <Calendar size={20} className="ss-icon ss-icon--scheduled" />
          <div className="ss-summary-info">
            <span className="ss-summary-value">{counts.scheduled || 0}</span>
            <span className="ss-summary-label">Scheduled</span>
          </div>
        </div>
        <div className="ss-summary-card">
          <LogIn size={20} className="ss-icon ss-icon--checkedin" />
          <div className="ss-summary-info">
            <span className="ss-summary-value">{counts.checkedIn || 0}</span>
            <span className="ss-summary-label">Checked In</span>
          </div>
        </div>
        <div className="ss-summary-card">
          <CheckCircle size={20} className="ss-icon ss-icon--completed" />
          <div className="ss-summary-info">
            <span className="ss-summary-value">{counts.completed || 0}</span>
            <span className="ss-summary-label">Completed</span>
          </div>
        </div>
        <div className="ss-summary-card">
          <UserX size={20} className="ss-icon ss-icon--absent" />
          <div className="ss-summary-info">
            <span className="ss-summary-value">{counts.absent || 0}</span>
            <span className="ss-summary-label">Absent</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ss-toolbar">
        <div className="ss-search">
          <Search size={16} />
          <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="COMPLETED">Completed</option>
          <option value="ABSENT">Absent</option>
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="ss-date-filter" />
        <button className="ss-btn ss-btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Shift
        </button>
      </div>

      {/* List */}
      <div className="ss-list">
        {isLoading ? (
          <div className="ss-empty">Loading shifts...</div>
        ) : filtered.length === 0 ? (
          <div className="ss-empty">No shifts found</div>
        ) : (
          filtered.map(shift => (
            <div key={shift.id} className="ss-card">
              <div className="ss-card-header">
                <div className="ss-card-info">
                  <h3 className="ss-card-name"><User size={16} /> {shift.staffUserName}</h3>
                  <span className="ss-card-type">{shift.shiftType}</span>
                </div>
                <span className={`ss-badge ${statusColors[shift.status] || ''}`}>{shift.status?.replace(/_/g, ' ')}</span>
              </div>
              <div className="ss-card-body">
                <div className="ss-card-detail"><Calendar size={14} /><span>{new Date(shift.shiftDate).toLocaleDateString()}</span></div>
                {shift.startTime && <div className="ss-card-detail"><Clock size={14} /><span>{shift.startTime} - {shift.endTime}</span></div>}
                {shift.location && <div className="ss-card-detail"><MapPin size={14} /><span>{shift.location}</span></div>}
                {shift.checkInTime && <div className="ss-card-detail ss-card-detail--muted"><LogIn size={14} /><span>In: {new Date(shift.checkInTime).toLocaleTimeString()}</span></div>}
                {shift.checkOutTime && <div className="ss-card-detail ss-card-detail--muted"><LogOut size={14} /><span>Out: {new Date(shift.checkOutTime).toLocaleTimeString()}</span></div>}
              </div>
              <div className="ss-card-actions">
                {shift.status === 'SCHEDULED' && (
                  <>
                    <button className="ss-btn ss-btn--success ss-btn--sm" onClick={() => checkInMutation.mutate(shift.id)}><LogIn size={14} /> Check In</button>
                    <button className="ss-btn ss-btn--warning ss-btn--sm" onClick={() => absentMutation.mutate(shift.id)}><UserX size={14} /> Absent</button>
                  </>
                )}
                {shift.status === 'CHECKED_IN' && (
                  <button className="ss-btn ss-btn--info ss-btn--sm" onClick={() => checkOutMutation.mutate(shift.id)}><LogOut size={14} /> Check Out</button>
                )}
                <button className="ss-btn ss-btn--danger ss-btn--sm" onClick={() => deleteMutation.mutate(shift.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ss-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ss-modal" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h2>Create Shift</h2>
              <button className="ss-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="ss-form">
              <div className="ss-form-group">
                <label>Staff User ID *</label>
                <input type="number" value={form.staffUserId} onChange={e => setForm({ ...form, staffUserId: e.target.value })} required />
              </div>
              <div className="ss-form-row">
                <div className="ss-form-group">
                  <label>Shift Date *</label>
                  <input type="date" value={form.shiftDate} onChange={e => setForm({ ...form, shiftDate: e.target.value })} required />
                </div>
                <div className="ss-form-group">
                  <label>Shift Type *</label>
                  <select value={form.shiftType} onChange={e => setForm({ ...form, shiftType: e.target.value })}>
                    {shiftTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="ss-form-row">
                <div className="ss-form-group">
                  <label>Start Time</label>
                  <input type="text" placeholder="e.g. 06:00" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="ss-form-group">
                  <label>End Time</label>
                  <input type="text" placeholder="e.g. 14:00" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <div className="ss-form-group">
                <label>Location</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="ss-form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="ss-form-actions">
                <button type="button" className="ss-btn ss-btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="ss-btn ss-btn--primary">Create Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
