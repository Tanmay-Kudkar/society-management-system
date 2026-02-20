import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { patrolApi } from '../../../../api'
import { Plus, Search, X, MapPin, Clock, Shield, Calendar, CheckCircle, XCircle, UserCheck, LogIn, LogOut, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const shiftOptions = [
  { value: 'MORNING', label: 'Morning (6AM–2PM)' },
  { value: 'AFTERNOON', label: 'Afternoon (2PM–10PM)' },
  { value: 'NIGHT', label: 'Night (10PM–6AM)' },
  { value: 'CUSTOM', label: 'Custom' },
]

const dutyStatusColors = {
  SCHEDULED: 'blue',
  ON_DUTY: 'green',
  COMPLETED: 'green',
  ABSENT: 'red',
  LEAVE: 'amber',
}

export default function GuardPatrol() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('duty')
  const [showModal, setShowModal] = useState(null) // 'checkpoint' | 'patrol' | 'duty' | null
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) return <PermissionDenied message="You don't have permission to access guard patrol management" />

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isAdmin = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'].includes(user?.role)
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  // Queries
  const { data: checkpoints = [], isLoading: cpLoading, isError: cpError } = useQuery({
    queryKey: ['patrol-checkpoints', effectiveSocietyId],
    queryFn: () => patrolApi.getCheckpoints(effectiveSocietyId, user.id).then(r => r.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'checkpoints',
  })

  const { data: patrolLogs = [], isLoading: plLoading, isError: plError } = useQuery({
    queryKey: ['patrol-logs', effectiveSocietyId],
    queryFn: () => patrolApi.getPatrolLogs(effectiveSocietyId, user.id).then(r => r.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'patrol',
  })

  const { data: dutyRoster = [], isLoading: drLoading, isError: drError } = useQuery({
    queryKey: ['duty-roster', effectiveSocietyId, selectedDate],
    queryFn: () => patrolApi.getDutyRosterByDate(effectiveSocietyId, user.id, selectedDate).then(r => r.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'duty',
  })

  // Mutations
  const createCheckpointMutation = useMutation({
    mutationFn: (data) => patrolApi.createCheckpoint(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['patrol-checkpoints']); setShowModal(null) },
  })
  const deleteCheckpointMutation = useMutation({
    mutationFn: (id) => patrolApi.deleteCheckpoint(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['patrol-checkpoints']),
  })
  const logPatrolMutation = useMutation({
    mutationFn: (data) => patrolApi.logPatrol(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['patrol-logs']); setShowModal(null) },
  })
  const createDutyMutation = useMutation({
    mutationFn: (data) => patrolApi.createDutyRoster(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['duty-roster']); setShowModal(null) },
  })
  const checkInMutation = useMutation({
    mutationFn: (id) => patrolApi.checkIn(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['duty-roster']),
  })
  const checkOutMutation = useMutation({
    mutationFn: (id) => patrolApi.checkOut(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['duty-roster']),
  })
  const markAbsentMutation = useMutation({
    mutationFn: (id) => patrolApi.markAbsent(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['duty-roster']),
  })
  const markLeaveMutation = useMutation({
    mutationFn: (id) => patrolApi.markLeave(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['duty-roster']),
  })
  const deleteDutyMutation = useMutation({
    mutationFn: (id) => patrolApi.deleteDutyRoster(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['duty-roster']),
  })

  // Filters
  const filteredCheckpoints = useMemo(() => checkpoints.filter(c =>
    c.checkpointName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [checkpoints, searchTerm])

  const filteredPatrolLogs = useMemo(() => patrolLogs.filter(l =>
    l.guardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.checkpointName?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [patrolLogs, searchTerm])

  const filteredDutyRoster = useMemo(() => dutyRoster.filter(d =>
    d.guardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.shiftName?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [dutyRoster, searchTerm])

  // Handlers
  const handleCheckpointSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    createCheckpointMutation.mutate({
      checkpointName: fd.get('checkpointName'),
      location: fd.get('location'),
      description: fd.get('description'),
      societyId: user.societyId,
    })
  }

  const handlePatrolSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    logPatrolMutation.mutate({
      checkpointId: Number(fd.get('checkpointId')),
      notes: fd.get('notes'),
      societyId: user.societyId,
    })
  }

  const handleDutySubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    createDutyMutation.mutate({
      guardId: Number(fd.get('guardId')),
      shiftName: fd.get('shiftName'),
      shiftStart: fd.get('shiftStart'),
      shiftEnd: fd.get('shiftEnd'),
      dutyDate: fd.get('dutyDate'),
      notes: fd.get('notes'),
      societyId: user.societyId,
    })
  }

  const isLoading = activeTab === 'checkpoints' ? cpLoading : activeTab === 'patrol' ? plLoading : drLoading
  const isError = activeTab === 'checkpoints' ? cpError : activeTab === 'patrol' ? plError : drError
  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (<div><WakeUpBanner /><HeroSkeleton /><SummaryRowSkeleton count={4} /><FiltersSkeleton filterCount={1} /><ListSkeleton count={4} /></div>)
  }

  return (
    <div>
      <div className="patrol-header">
        <div>
          <h1 className="patrol-title">Guard Patrol & Duty Roster</h1>
          <p className="patrol-subtitle">Checkpoints, patrol tracking, and shift management</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeTab === 'checkpoints' && isAdmin && (
            <button onClick={() => setShowModal('checkpoint')} className="patrol-action-btn"><Plus size={20} /> Add Checkpoint</button>
          )}
          {activeTab === 'patrol' && isStaff && (
            <button onClick={() => setShowModal('patrol')} className="patrol-action-btn"><Plus size={20} /> Log Patrol</button>
          )}
          {activeTab === 'duty' && isAdmin && (
            <button onClick={() => setShowModal('duty')} className="patrol-action-btn"><Plus size={20} /> Add Duty</button>
          )}
        </div>
      </div>

      <div className="patrol-tabs">
        <button className={clsx('patrol-tab', activeTab === 'duty' && 'patrol-tab--active')} onClick={() => { setActiveTab('duty'); setSearchTerm('') }}>Duty Roster</button>
        <button className={clsx('patrol-tab', activeTab === 'patrol' && 'patrol-tab--active')} onClick={() => { setActiveTab('patrol'); setSearchTerm('') }}>Patrol Logs</button>
        <button className={clsx('patrol-tab', activeTab === 'checkpoints' && 'patrol-tab--active')} onClick={() => { setActiveTab('checkpoints'); setSearchTerm('') }}>Checkpoints</button>
      </div>

      {/* DUTY ROSTER TAB */}
      {activeTab === 'duty' && (
        <>
          <div className="patrol-summary">
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Scheduled</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-blue)' }}>{dutyRoster.filter(d => d.status === 'SCHEDULED').length}</p>
            </div>
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">On Duty</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-green)' }}>{dutyRoster.filter(d => d.status === 'ON_DUTY').length}</p>
            </div>
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Completed</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-green)' }}>{dutyRoster.filter(d => d.status === 'COMPLETED').length}</p>
            </div>
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Absent</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-red)' }}>{dutyRoster.filter(d => d.status === 'ABSENT').length}</p>
            </div>
          </div>

          <div className="patrol-filters">
            <div className="patrol-filters-row">
              <div className="patrol-search">
                <Search className="patrol-search-icon" />
                <input type="text" placeholder="Search by guard name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="patrol-input" />
              </div>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="patrol-date-input" />
            </div>
          </div>

          <div className="patrol-list">
            {filteredDutyRoster.length === 0 && <div className="patrol-empty">No duty roster entries for this date</div>}
            {filteredDutyRoster.map((d) => (
              <div key={d.id} className="patrol-item">
                <div className="patrol-item-row">
                  <div className="patrol-item-main">
                    <div className={clsx('patrol-item-icon', `patrol-item-icon--${dutyStatusColors[d.status] || 'blue'}`)}>
                      <UserCheck className={clsx('patrol-item-icon-sym', `patrol-item-icon-sym--${dutyStatusColors[d.status] || 'blue'}`)} />
                    </div>
                    <div>
                      <div className="patrol-item-meta">
                        <span className={clsx('patrol-badge', `patrol-badge--${dutyStatusColors[d.status] || 'blue'}`)}>{d.status?.replace('_', ' ')}</span>
                        <span className="patrol-badge patrol-badge--violet">{d.shiftName}</span>
                      </div>
                      <h3 className="patrol-item-title">{d.guardName}</h3>
                      <div className="patrol-item-footer">
                        <span className="patrol-item-footer-text"><Clock size={12} /> {d.shiftStart} – {d.shiftEnd}</span>
                        <span className="patrol-item-footer-text"><Calendar size={12} /> {d.dutyDate}</span>
                        {d.checkInTime && <span className="patrol-item-footer-text"><LogIn size={12} /> In: {new Date(d.checkInTime).toLocaleTimeString()}</span>}
                        {d.checkOutTime && <span className="patrol-item-footer-text"><LogOut size={12} /> Out: {new Date(d.checkOutTime).toLocaleTimeString()}</span>}
                      </div>
                      {d.notes && <p className="patrol-item-notes">{d.notes}</p>}
                    </div>
                  </div>
                  {isStaff && (
                    <div className="patrol-item-actions">
                      {d.status === 'SCHEDULED' && <button onClick={() => checkInMutation.mutate(d.id)} className="patrol-btn patrol-btn--green">Check In</button>}
                      {d.status === 'ON_DUTY' && <button onClick={() => checkOutMutation.mutate(d.id)} className="patrol-btn patrol-btn--blue">Check Out</button>}
                      {isAdmin && d.status === 'SCHEDULED' && (
                        <>
                          <button onClick={() => markAbsentMutation.mutate(d.id)} className="patrol-btn patrol-btn--red">Absent</button>
                          <button onClick={() => markLeaveMutation.mutate(d.id)} className="patrol-btn patrol-btn--amber">Leave</button>
                        </>
                      )}
                      {isAdmin && <button onClick={() => { if (confirm('Delete this duty entry?')) deleteDutyMutation.mutate(d.id) }} className="patrol-btn patrol-btn--ghost"><X size={14} /></button>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PATROL LOGS TAB */}
      {activeTab === 'patrol' && (
        <>
          <div className="patrol-summary">
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Total Scans</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-blue)' }}>{patrolLogs.length}</p>
            </div>
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">On Time</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-green)' }}>{patrolLogs.filter(l => l.status === 'ON_TIME').length}</p>
            </div>
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Late</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-amber)' }}>{patrolLogs.filter(l => l.status === 'LATE').length}</p>
            </div>
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Missed</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-red)' }}>{patrolLogs.filter(l => l.status === 'MISSED').length}</p>
            </div>
          </div>

          <div className="patrol-filters">
            <div className="patrol-filters-row">
              <div className="patrol-search">
                <Search className="patrol-search-icon" />
                <input type="text" placeholder="Search patrol logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="patrol-input" />
              </div>
            </div>
          </div>

          <div className="patrol-list">
            {filteredPatrolLogs.length === 0 && <div className="patrol-empty">No patrol logs found</div>}
            {filteredPatrolLogs.map((l) => (
              <div key={l.id} className="patrol-item">
                <div className="patrol-item-row">
                  <div className="patrol-item-main">
                    <div className={clsx('patrol-item-icon', l.status === 'ON_TIME' ? 'patrol-item-icon--green' : l.status === 'LATE' ? 'patrol-item-icon--amber' : 'patrol-item-icon--red')}>
                      {l.status === 'ON_TIME' ? <CheckCircle className="patrol-item-icon-sym patrol-item-icon-sym--green" /> : l.status === 'LATE' ? <Clock className="patrol-item-icon-sym patrol-item-icon-sym--amber" /> : <XCircle className="patrol-item-icon-sym patrol-item-icon-sym--red" />}
                    </div>
                    <div>
                      <div className="patrol-item-meta">
                        <span className={clsx('patrol-badge', l.status === 'ON_TIME' ? 'patrol-badge--green' : l.status === 'LATE' ? 'patrol-badge--amber' : 'patrol-badge--red')}>{l.status?.replace('_', ' ')}</span>
                      </div>
                      <h3 className="patrol-item-title">{l.checkpointName}</h3>
                      <div className="patrol-item-footer">
                        <span className="patrol-item-footer-text"><Shield size={12} /> {l.guardName}</span>
                        {l.checkpointLocation && <span className="patrol-item-footer-text"><MapPin size={12} /> {l.checkpointLocation}</span>}
                        <span className="patrol-item-footer-text"><Clock size={12} /> {l.scannedAt && new Date(l.scannedAt).toLocaleString()}</span>
                      </div>
                      {l.notes && <p className="patrol-item-notes">{l.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CHECKPOINTS TAB */}
      {activeTab === 'checkpoints' && (
        <>
          <div className="patrol-summary">
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Total</p>
              <p className="patrol-summary-value" style={{ color: 'var(--text-primary)' }}>{checkpoints.length}</p>
            </div>
            <div className="patrol-summary-card">
              <p className="patrol-summary-label">Active</p>
              <p className="patrol-summary-value" style={{ color: 'var(--color-green)' }}>{checkpoints.filter(c => c.active).length}</p>
            </div>
          </div>

          <div className="patrol-filters">
            <div className="patrol-filters-row">
              <div className="patrol-search">
                <Search className="patrol-search-icon" />
                <input type="text" placeholder="Search checkpoints..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="patrol-input" />
              </div>
            </div>
          </div>

          <div className="patrol-list">
            {filteredCheckpoints.length === 0 && <div className="patrol-empty">No checkpoints configured</div>}
            {filteredCheckpoints.map((c) => (
              <div key={c.id} className={clsx('patrol-item', !c.active && 'patrol-item--inactive')}>
                <div className="patrol-item-row">
                  <div className="patrol-item-main">
                    <div className={clsx('patrol-item-icon', c.active ? 'patrol-item-icon--green' : 'patrol-item-icon--grey')}>
                      <MapPin className={clsx('patrol-item-icon-sym', c.active ? 'patrol-item-icon-sym--green' : 'patrol-item-icon-sym--grey')} />
                    </div>
                    <div>
                      <h3 className="patrol-item-title">{c.checkpointName}</h3>
                      {c.location && <p className="patrol-item-description"><MapPin size={13} /> {c.location}</p>}
                      {c.description && <p className="patrol-item-notes">{c.description}</p>}
                      {c.qrCode && <span className="patrol-item-footer-text">QR: {c.qrCode}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="patrol-item-actions">
                      <button onClick={() => { if (confirm('Deactivate this checkpoint?')) deleteCheckpointMutation.mutate(c.id) }} className="patrol-btn patrol-btn--ghost"><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODALS */}
      {showModal === 'checkpoint' && (
        <div className="patrol-modal">
          <div className="patrol-modal-card">
            <div className="patrol-modal-header">
              <h3 className="patrol-modal-title">Add Checkpoint</h3>
              <button onClick={() => setShowModal(null)} className="patrol-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleCheckpointSubmit} className="patrol-form">
              <FormInput label="Checkpoint Name" name="checkpointName" required />
              <FormInput label="Location" name="location" placeholder="e.g. Block A, Ground Floor" />
              <FormTextarea label="Description" name="description" rows={2} />
              <div className="patrol-form-actions">
                <button type="button" onClick={() => setShowModal(null)} className="patrol-btn patrol-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="patrol-btn patrol-btn--primary" isLoading={createCheckpointMutation.isPending} loadingText="Saving...">Save</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'patrol' && (
        <div className="patrol-modal">
          <div className="patrol-modal-card">
            <div className="patrol-modal-header">
              <h3 className="patrol-modal-title">Log Patrol Scan</h3>
              <button onClick={() => setShowModal(null)} className="patrol-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handlePatrolSubmit} className="patrol-form">
              <SmartSelect label="Checkpoint" name="checkpointId" required options={checkpoints.filter(c => c.active).map(c => ({ value: String(c.id), label: c.checkpointName }))} placeholder="Select Checkpoint" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="patrol-form-actions">
                <button type="button" onClick={() => setShowModal(null)} className="patrol-btn patrol-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="patrol-btn patrol-btn--primary" isLoading={logPatrolMutation.isPending} loadingText="Logging...">Log Scan</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'duty' && (
        <div className="patrol-modal">
          <div className="patrol-modal-card">
            <div className="patrol-modal-header">
              <h3 className="patrol-modal-title">Add Duty Entry</h3>
              <button onClick={() => setShowModal(null)} className="patrol-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleDutySubmit} className="patrol-form">
              <FormInput label="Guard User ID" name="guardId" type="number" required />
              <SmartSelect label="Shift" name="shiftName" required options={shiftOptions} placeholder="Select Shift" />
              <FormInput label="Shift Start" name="shiftStart" type="time" required />
              <FormInput label="Shift End" name="shiftEnd" type="time" required />
              <FormInput label="Duty Date" name="dutyDate" type="date" required />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="patrol-form-actions">
                <button type="button" onClick={() => setShowModal(null)} className="patrol-btn patrol-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="patrol-btn patrol-btn--primary" isLoading={createDutyMutation.isPending} loadingText="Saving...">Save</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
