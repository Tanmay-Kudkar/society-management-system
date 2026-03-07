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

const iconBgMap = {
  green: 'bg-[rgba(34,197,94,0.1)]',
  blue: 'bg-[rgba(59,130,246,0.1)]',
  amber: 'bg-[rgba(245,158,11,0.1)]',
  red: 'bg-[rgba(239,68,68,0.1)]',
  grey: 'bg-[rgba(107,114,128,0.1)]',
}

const iconColorMap = {
  green: 'text-[var(--color-green)]',
  blue: 'text-[var(--color-blue)]',
  amber: 'text-[var(--color-amber)]',
  red: 'text-[var(--color-red)]',
  grey: 'text-[var(--text-tertiary)]',
}

const badgeMap = {
  green: 'bg-[rgba(34,197,94,0.1)] text-[var(--color-green)]',
  blue: 'bg-[rgba(59,130,246,0.1)] text-[var(--color-blue)]',
  amber: 'bg-[rgba(245,158,11,0.1)] text-[var(--color-amber)]',
  red: 'bg-[rgba(239,68,68,0.1)] text-[var(--color-red)]',
  violet: 'bg-[rgba(139,92,246,0.1)] text-[var(--color-violet)]',
}

const btnMap = {
  green: 'bg-[rgba(34,197,94,0.1)] text-[var(--color-green)] border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.2)]',
  blue: 'bg-[rgba(59,130,246,0.1)] text-[var(--color-blue)] border-[rgba(59,130,246,0.3)] hover:bg-[rgba(59,130,246,0.2)]',
  red: 'bg-[rgba(239,68,68,0.1)] text-[var(--color-red)] border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.2)]',
  amber: 'bg-[rgba(245,158,11,0.1)] text-[var(--color-amber)] border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.2)]',
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
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Guard Patrol & Duty Roster</h1>
          <p className="mt-1 text-[var(--text-tertiary)]">Checkpoints, patrol tracking, and shift management</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeTab === 'checkpoints' && isAdmin && (
            <button onClick={() => setShowModal('checkpoint')} className="inline-flex items-center gap-2 py-2 px-4 rounded-[10px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)] text-sm cursor-pointer transition-colors hover:opacity-90 hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)]"><Plus size={20} /> Add Checkpoint</button>
          )}
          {activeTab === 'patrol' && isStaff && (
            <button onClick={() => setShowModal('patrol')} className="inline-flex items-center gap-2 py-2 px-4 rounded-[10px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)] text-sm cursor-pointer transition-colors hover:opacity-90 hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)]"><Plus size={20} /> Log Patrol</button>
          )}
          {activeTab === 'duty' && isAdmin && (
            <button onClick={() => setShowModal('duty')} className="inline-flex items-center gap-2 py-2 px-4 rounded-[10px] bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-default)] text-sm cursor-pointer transition-colors hover:opacity-90 hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)]"><Plus size={20} /> Add Duty</button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-5 p-1 bg-[var(--bg-tertiary)] rounded-[10px] w-fit">
        <button className={clsx('py-2 px-4 rounded-lg text-sm font-medium cursor-pointer border-none transition-all', activeTab === 'duty' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-transparent text-[var(--text-tertiary)]')} onClick={() => { setActiveTab('duty'); setSearchTerm('') }}>Duty Roster</button>
        <button className={clsx('py-2 px-4 rounded-lg text-sm font-medium cursor-pointer border-none transition-all', activeTab === 'patrol' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-transparent text-[var(--text-tertiary)]')} onClick={() => { setActiveTab('patrol'); setSearchTerm('') }}>Patrol Logs</button>
        <button className={clsx('py-2 px-4 rounded-lg text-sm font-medium cursor-pointer border-none transition-all', activeTab === 'checkpoints' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'bg-transparent text-[var(--text-tertiary)]')} onClick={() => { setActiveTab('checkpoints'); setSearchTerm('') }}>Checkpoints</button>
      </div>

      {/* DUTY ROSTER TAB */}
      {activeTab === 'duty' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Scheduled</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-blue)' }}>{dutyRoster.filter(d => d.status === 'SCHEDULED').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">On Duty</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-green)' }}>{dutyRoster.filter(d => d.status === 'ON_DUTY').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Completed</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-green)' }}>{dutyRoster.filter(d => d.status === 'COMPLETED').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Absent</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-red)' }}>{dutyRoster.filter(d => d.status === 'ABSENT').length}</p>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
                <input type="text" placeholder="Search by guard name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2 pr-3 pl-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm" />
              </div>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="py-2 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredDutyRoster.length === 0 && <div className="p-8 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)]">No duty roster entries for this date</div>}
            {filteredDutyRoster.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 items-start flex-1">
                    <div className={clsx('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0', iconBgMap[dutyStatusColors[d.status] || 'blue'])}>
                      <UserCheck className={clsx('w-5 h-5', iconColorMap[dutyStatusColors[d.status] || 'blue'])} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={clsx('inline-flex items-center py-[2px] px-2 rounded-full text-[11px] font-semibold uppercase', badgeMap[dutyStatusColors[d.status] || 'blue'])}>{d.status?.replace('_', ' ')}</span>
                        <span className={clsx('inline-flex items-center py-[2px] px-2 rounded-full text-[11px] font-semibold uppercase', badgeMap.violet)}>{d.shiftName}</span>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{d.guardName}</h3>
                      <div className="flex gap-4 flex-wrap mt-2">
                        <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]"><Clock size={12} /> {d.shiftStart} – {d.shiftEnd}</span>
                        <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]"><Calendar size={12} /> {d.dutyDate}</span>
                        {d.checkInTime && <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]"><LogIn size={12} /> In: {new Date(d.checkInTime).toLocaleTimeString()}</span>}
                        {d.checkOutTime && <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]"><LogOut size={12} /> Out: {new Date(d.checkOutTime).toLocaleTimeString()}</span>}
                      </div>
                      {d.notes && <p className="text-[13px] text-[var(--text-tertiary)] mt-1">{d.notes}</p>}
                    </div>
                  </div>
                  {isStaff && (
                    <div className="flex gap-[6px] shrink-0 flex-wrap">
                      {d.status === 'SCHEDULED' && <button onClick={() => checkInMutation.mutate(d.id)} className={clsx('py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border inline-flex items-center gap-1 transition-all', btnMap.green)}>Check In</button>}
                      {d.status === 'ON_DUTY' && <button onClick={() => checkOutMutation.mutate(d.id)} className={clsx('py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border inline-flex items-center gap-1 transition-all', btnMap.blue)}>Check Out</button>}
                      {isAdmin && d.status === 'SCHEDULED' && (
                        <>
                          <button onClick={() => markAbsentMutation.mutate(d.id)} className={clsx('py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border inline-flex items-center gap-1 transition-all', btnMap.red)}>Absent</button>
                          <button onClick={() => markLeaveMutation.mutate(d.id)} className={clsx('py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border inline-flex items-center gap-1 transition-all', btnMap.amber)}>Leave</button>
                        </>
                      )}
                      {isAdmin && <button onClick={() => { if (confirm('Delete this duty entry?')) deleteDutyMutation.mutate(d.id) }} className="py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border border-[var(--border-default)] inline-flex items-center gap-1 transition-all bg-transparent text-[var(--text-secondary)]"><X size={14} /></button>}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Total Scans</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-blue)' }}>{patrolLogs.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">On Time</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-green)' }}>{patrolLogs.filter(l => l.status === 'ON_TIME').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Late</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-amber)' }}>{patrolLogs.filter(l => l.status === 'LATE').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Missed</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-red)' }}>{patrolLogs.filter(l => l.status === 'MISSED').length}</p>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
                <input type="text" placeholder="Search patrol logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2 pr-3 pl-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredPatrolLogs.length === 0 && <div className="p-8 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)]">No patrol logs found</div>}
            {filteredPatrolLogs.map((l) => (
              <div key={l.id} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 items-start flex-1">
                    <div className={clsx('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0', l.status === 'ON_TIME' ? iconBgMap.green : l.status === 'LATE' ? iconBgMap.amber : iconBgMap.red)}>
                      {l.status === 'ON_TIME' ? <CheckCircle className={clsx('w-5 h-5', iconColorMap.green)} /> : l.status === 'LATE' ? <Clock className={clsx('w-5 h-5', iconColorMap.amber)} /> : <XCircle className={clsx('w-5 h-5', iconColorMap.red)} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={clsx('inline-flex items-center py-[2px] px-2 rounded-full text-[11px] font-semibold uppercase', l.status === 'ON_TIME' ? badgeMap.green : l.status === 'LATE' ? badgeMap.amber : badgeMap.red)}>{l.status?.replace('_', ' ')}</span>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{l.checkpointName}</h3>
                      <div className="flex gap-4 flex-wrap mt-2">
                        <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]"><Shield size={12} /> {l.guardName}</span>
                        {l.checkpointLocation && <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]"><MapPin size={12} /> {l.checkpointLocation}</span>}
                        <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]"><Clock size={12} /> {l.scannedAt && new Date(l.scannedAt).toLocaleString()}</span>
                      </div>
                      {l.notes && <p className="text-[13px] text-[var(--text-tertiary)] mt-1">{l.notes}</p>}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Total</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{checkpoints.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)]">
              <p className="text-[13px] text-[var(--text-tertiary)]">Active</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-green)' }}>{checkpoints.filter(c => c.active).length}</p>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
                <input type="text" placeholder="Search checkpoints..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2 pr-3 pl-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredCheckpoints.length === 0 && <div className="p-8 text-center text-[var(--text-tertiary)] bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)]">No checkpoints configured</div>}
            {filteredCheckpoints.map((c) => (
              <div key={c.id} className={clsx('p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]', !c.active && 'opacity-60')}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 items-start flex-1">
                    <div className={clsx('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0', c.active ? iconBgMap.green : iconBgMap.grey)}>
                      <MapPin className={clsx('w-5 h-5', c.active ? iconColorMap.green : iconColorMap.grey)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{c.checkpointName}</h3>
                      {c.location && <p className="text-[13px] text-[var(--text-secondary)] mt-[2px] flex items-center gap-1"><MapPin size={13} /> {c.location}</p>}
                      {c.description && <p className="text-[13px] text-[var(--text-tertiary)] mt-1">{c.description}</p>}
                      {c.qrCode && <span className="inline-flex items-center gap-[3px] text-xs text-[var(--text-tertiary)]">QR: {c.qrCode}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-[6px] shrink-0 flex-wrap">
                      <button onClick={() => { if (confirm('Deactivate this checkpoint?')) deleteCheckpointMutation.mutate(c.id) }} className="py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border border-[var(--border-default)] inline-flex items-center gap-1 transition-all bg-transparent text-[var(--text-secondary)]"><X size={14} /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Checkpoint</h3>
              <button onClick={() => setShowModal(null)} className="text-[var(--text-tertiary)] cursor-pointer bg-none border-none p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleCheckpointSubmit} className="flex flex-col gap-4">
              <FormInput label="Checkpoint Name" name="checkpointName" required />
              <FormInput label="Location" name="location" placeholder="e.g. Block A, Ground Floor" />
              <FormTextarea label="Description" name="description" rows={2} />
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(null)} className="py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border border-[var(--border-default)] inline-flex items-center gap-1 transition-all bg-transparent text-[var(--text-secondary)]">Cancel</button>
                <AsyncButton type="submit" className="py-2 px-4 rounded-lg text-[13px] font-medium cursor-pointer border-none inline-flex items-center gap-1 transition-all bg-[var(--color-blue)] text-white hover:opacity-90" isLoading={createCheckpointMutation.isPending} loadingText="Saving...">Save</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'patrol' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Log Patrol Scan</h3>
              <button onClick={() => setShowModal(null)} className="text-[var(--text-tertiary)] cursor-pointer bg-none border-none p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handlePatrolSubmit} className="flex flex-col gap-4">
              <SmartSelect label="Checkpoint" name="checkpointId" required options={checkpoints.filter(c => c.active).map(c => ({ value: String(c.id), label: c.checkpointName }))} placeholder="Select Checkpoint" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(null)} className="py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border border-[var(--border-default)] inline-flex items-center gap-1 transition-all bg-transparent text-[var(--text-secondary)]">Cancel</button>
                <AsyncButton type="submit" className="py-2 px-4 rounded-lg text-[13px] font-medium cursor-pointer border-none inline-flex items-center gap-1 transition-all bg-[var(--color-blue)] text-white hover:opacity-90" isLoading={logPatrolMutation.isPending} loadingText="Logging...">Log Scan</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'duty' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Duty Entry</h3>
              <button onClick={() => setShowModal(null)} className="text-[var(--text-tertiary)] cursor-pointer bg-none border-none p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleDutySubmit} className="flex flex-col gap-4">
              <FormInput label="Guard User ID" name="guardId" type="number" required />
              <SmartSelect label="Shift" name="shiftName" required options={shiftOptions} placeholder="Select Shift" />
              <FormInput label="Shift Start" name="shiftStart" type="time" required />
              <FormInput label="Shift End" name="shiftEnd" type="time" required />
              <FormInput label="Duty Date" name="dutyDate" type="date" required />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(null)} className="py-[6px] px-3 rounded-lg text-[13px] font-medium cursor-pointer border border-[var(--border-default)] inline-flex items-center gap-1 transition-all bg-transparent text-[var(--text-secondary)]">Cancel</button>
                <AsyncButton type="submit" className="py-2 px-4 rounded-lg text-[13px] font-medium cursor-pointer border-none inline-flex items-center gap-1 transition-all bg-[var(--color-blue)] text-white hover:opacity-90" isLoading={createDutyMutation.isPending} loadingText="Saving...">Save</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
