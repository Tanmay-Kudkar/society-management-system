import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { domesticStaffApi } from '../../../../api'
import { Plus, Search, X, UserCheck, Shield, ShieldCheck, Users, Clock } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

export default function DomesticStaff() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('staff') // 'staff' or 'attendance'
  const [showModal, setShowModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) {
    return <PermissionDenied message="You don't have permission to access domestic staff management" />
  }

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const isStaff = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const isAdmin = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER'].includes(user?.role)
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const { data: staffList = [], isLoading, isError } = useQuery({
    queryKey: ['domestic-staff', user?.id, effectiveSocietyId],
    queryFn: () => domesticStaffApi.getBySociety(effectiveSocietyId, user.id).then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId,
  })

  const { data: attendance = [] } = useQuery({
    queryKey: ['staff-attendance', effectiveSocietyId],
    queryFn: () => domesticStaffApi.getAttendanceBySociety(effectiveSocietyId, user.id).then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId && activeTab === 'attendance',
  })

  const createMutation = useMutation({
    mutationFn: (data) => domesticStaffApi.create(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['domestic-staff']); setShowModal(false) },
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => domesticStaffApi.toggleStatus(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['domestic-staff']),
  })

  const verifyMutation = useMutation({
    mutationFn: (id) => domesticStaffApi.verify(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['domestic-staff']),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => domesticStaffApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['domestic-staff']),
  })

  const attendanceMutation = useMutation({
    mutationFn: (data) => domesticStaffApi.recordAttendance(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['staff-attendance']); setShowAttendanceModal(false) },
  })

  const checkOutMutation = useMutation({
    mutationFn: (id) => domesticStaffApi.markCheckOut(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['staff-attendance']),
  })

  const filteredStaff = useMemo(() => staffList.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.phone?.includes(searchTerm)
    const matchesType = !filterType || s.staffType === filterType
    return matchesSearch && matchesType
  }), [staffList, searchTerm, filterType])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createMutation.mutate({
      name: formData.get('name'),
      phone: formData.get('phone'),
      staffType: formData.get('staffType'),
      idProofType: formData.get('idProofType'),
      idProofNumber: formData.get('idProofNumber'),
      address: formData.get('address'),
      societyId: user.societyId,
    })
  }

  const handleAttendanceSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    attendanceMutation.mutate({
      staffId: Number(formData.get('staffId')),
      status: formData.get('status') || 'PRESENT',
      notes: formData.get('notes'),
      societyId: user.societyId,
    })
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)
  if (showSkeleton) {
    return (<div><WakeUpBanner /><HeroSkeleton /><SummaryRowSkeleton count={4} /><FiltersSkeleton filterCount={1} /><ListSkeleton count={4} /></div>)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Domestic Staff</h1>
          <p className="mt-1 text-[var(--text-tertiary)]">Manage domestic helpers and attendance</p>
        </div>
        <div className="flex gap-2">
          {isStaff && activeTab === 'staff' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900"
            >
              <Plus size={20} /> Add Staff
            </button>
          )}
          {isStaff && activeTab === 'attendance' && (
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900"
            >
              <Clock size={20} /> Record Attendance
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex w-fit gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1">
        <button
          className={clsx(
            'rounded-md px-4 py-2 text-sm font-medium text-[var(--text-tertiary)] transition',
            activeTab === 'staff' && 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
          )}
          onClick={() => setActiveTab('staff')}
        >
          Staff Directory
        </button>
        <button
          className={clsx(
            'rounded-md px-4 py-2 text-sm font-medium text-[var(--text-tertiary)] transition',
            activeTab === 'attendance' && 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
          )}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
      </div>

      {activeTab === 'staff' && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Active</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">{staffList.filter(s => s.isActive).length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Inactive</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-300">{staffList.filter(s => !s.isActive).length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Verified</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-300">{staffList.filter(s => s.isVerified).length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Total</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{staffList.length}</p>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
              >
                <option value="">All Types</option>
                <option value="MAID">Maid</option>
                <option value="COOK">Cook</option>
                <option value="DRIVER">Driver</option>
                <option value="GARDENER">Gardener</option>
                <option value="WATCHMAN">Watchman</option>
                <option value="PLUMBER">Plumber</option>
                <option value="ELECTRICIAN">Electrician</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {filteredStaff.length === 0 && (
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 text-center text-[var(--text-tertiary)]">No staff members found</div>
            )}
            {filteredStaff.map((staff) => (
              <div key={staff.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 transition hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', staff.isActive ? 'bg-emerald-500/10' : 'bg-rose-500/10')}>
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase', staff.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-300')}>
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-300">{staff.staffType}</span>
                        {staff.isVerified && <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-blue-600 dark:text-blue-300">Verified</span>}
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{staff.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-4">
                        {staff.phone && <span className="text-xs text-[var(--text-tertiary)]">Phone: {staff.phone}</span>}
                        {staff.idProofType && <span className="text-xs text-[var(--text-tertiary)]">{staff.idProofType}: {staff.idProofNumber}</span>}
                        {staff.address && <span className="text-xs text-[var(--text-tertiary)]">Address: {staff.address}</span>}
                        {isPlatformLevel && <span className="text-xs text-[var(--text-tertiary)]">{staff.societyName}</span>}
                      </div>
                    </div>
                  </div>
                  {isStaff && (
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {isAdmin && !staff.isVerified && (
                        <button onClick={() => verifyMutation.mutate(staff.id)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-300">Verify</button>
                      )}
                      <button onClick={() => toggleMutation.mutate(staff.id)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-300">
                        {staff.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {isAdmin && (
                        <button onClick={() => { if (confirm('Delete this staff member?')) deleteMutation.mutate(staff.id) }} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300">Delete</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'attendance' && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Present Today</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">{attendance.filter(a => a.status === 'PRESENT').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Absent</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-300">{attendance.filter(a => a.status === 'ABSENT').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Late</p>
              <p className="mt-1 text-2xl font-bold text-amber-500 dark:text-amber-300">{attendance.filter(a => a.status === 'LATE').length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
              <p className="text-[13px] text-[var(--text-tertiary)]">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{attendance.length}</p>
            </div>
          </div>

          {attendance.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 text-center text-[var(--text-tertiary)]">No attendance records for today</div>
          ) : (
            <table className="w-full overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="border-b border-[var(--border-default)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-tertiary)]">Staff Name</th>
                  <th className="border-b border-[var(--border-default)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-tertiary)]">Type</th>
                  <th className="border-b border-[var(--border-default)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-tertiary)]">Check In</th>
                  <th className="border-b border-[var(--border-default)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-tertiary)]">Check Out</th>
                  <th className="border-b border-[var(--border-default)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-tertiary)]">Status</th>
                  {isStaff && <th className="border-b border-[var(--border-default)] px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-tertiary)]">Action</th>}
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-primary)]">{record.staffName}</td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-primary)]"><span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-300">{record.staffType}</span></td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-primary)]">{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-primary)]">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                    <td className="border-b border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-primary)]"><span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase', record.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : record.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'bg-blue-500/10 text-blue-600 dark:text-blue-300')}>{record.status}</span></td>
                    {isStaff && (
                      <td className="border-b border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-primary)]">
                        {!record.checkOutTime && record.status === 'PRESENT' && (
                          <button onClick={() => checkOutMutation.mutate(record.id)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-300">Check Out</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-[var(--bg-card)] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-[var(--text-tertiary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormInput label="Full Name" name="name" required />
              <FormInput label="Phone Number" name="phone" />
              <SmartSelect label="Staff Type" name="staffType" required options={[
                { value: 'MAID', label: 'Maid' }, { value: 'COOK', label: 'Cook' },
                { value: 'DRIVER', label: 'Driver' }, { value: 'GARDENER', label: 'Gardener' },
                { value: 'WATCHMAN', label: 'Watchman' }, { value: 'PLUMBER', label: 'Plumber' },
                { value: 'ELECTRICIAN', label: 'Electrician' }, { value: 'OTHER', label: 'Other' },
              ]} placeholder="Select Type" />
              <SmartSelect label="ID Proof Type" name="idProofType" options={[
                { value: 'AADHAAR', label: 'Aadhaar' }, { value: 'PAN', label: 'PAN Card' },
                { value: 'VOTER_ID', label: 'Voter ID' }, { value: 'DRIVING_LICENSE', label: 'Driving License' },
              ]} placeholder="Select ID Proof" />
              <FormInput label="ID Proof Number" name="idProofNumber" />
              <FormInput label="Address" name="address" />
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-[var(--border-default)] bg-transparent px-4 py-2 text-[var(--text-secondary)]">Cancel</button>
                <AsyncButton type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white" isLoading={createMutation.isPending} loadingText="Adding...">Add Staff</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-[var(--bg-card)] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Record Attendance</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="rounded-md p-1 text-[var(--text-tertiary)]"><X size={20} /></button>
            </div>
            <form onSubmit={handleAttendanceSubmit} className="flex flex-col gap-4">
              <SmartSelect label="Staff Member" name="staffId" required options={
                staffList.filter(s => s.isActive).map(s => ({ value: String(s.id), label: `${s.name} (${s.staffType})` }))
              } placeholder="Select Staff" />
              <SmartSelect label="Status" name="status" options={[
                { value: 'PRESENT', label: 'Present' }, { value: 'ABSENT', label: 'Absent' },
                { value: 'LATE', label: 'Late' }, { value: 'HALF_DAY', label: 'Half Day' },
              ]} placeholder="Select Status" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAttendanceModal(false)} className="rounded-lg border border-[var(--border-default)] bg-transparent px-4 py-2 text-[var(--text-secondary)]">Cancel</button>
                <AsyncButton type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white" isLoading={attendanceMutation.isPending} loadingText="Recording...">Record</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
