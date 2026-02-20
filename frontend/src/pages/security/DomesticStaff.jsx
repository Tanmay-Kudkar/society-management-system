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
      <div className="staff-header">
        <div>
          <h1 className="staff-title">Domestic Staff</h1>
          <p className="staff-subtitle">Manage domestic helpers and attendance</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isStaff && activeTab === 'staff' && (
            <button onClick={() => setShowModal(true)} className="staff-action-button"><Plus size={20} /> Add Staff</button>
          )}
          {isStaff && activeTab === 'attendance' && (
            <button onClick={() => setShowAttendanceModal(true)} className="staff-action-button"><Clock size={20} /> Record Attendance</button>
          )}
        </div>
      </div>

      <div className="staff-tabs">
        <button className={clsx('staff-tab', activeTab === 'staff' && 'staff-tab--active')} onClick={() => setActiveTab('staff')}>Staff Directory</button>
        <button className={clsx('staff-tab', activeTab === 'attendance' && 'staff-tab--active')} onClick={() => setActiveTab('attendance')}>Attendance</button>
      </div>

      {activeTab === 'staff' && (
        <>
          <div className="staff-summary">
            <div className="staff-summary-card">
              <p className="staff-summary-label">Active</p>
              <p className="staff-summary-value staff-summary-value--active">{staffList.filter(s => s.isActive).length}</p>
            </div>
            <div className="staff-summary-card">
              <p className="staff-summary-label">Inactive</p>
              <p className="staff-summary-value staff-summary-value--inactive">{staffList.filter(s => !s.isActive).length}</p>
            </div>
            <div className="staff-summary-card">
              <p className="staff-summary-label">Verified</p>
              <p className="staff-summary-value staff-summary-value--verified">{staffList.filter(s => s.isVerified).length}</p>
            </div>
            <div className="staff-summary-card">
              <p className="staff-summary-label">Total</p>
              <p className="staff-summary-value staff-summary-value--total">{staffList.length}</p>
            </div>
          </div>

          <div className="staff-filters">
            <div className="staff-filters-row">
              <div className="staff-search">
                <Search className="staff-search-icon" />
                <input type="text" placeholder="Search staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="staff-input" />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="staff-select">
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

          <div className="staff-list">
            {filteredStaff.length === 0 && (
              <div className="staff-item" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No staff members found</div>
            )}
            {filteredStaff.map((staff) => (
              <div key={staff.id} className="staff-item">
                <div className="staff-item-row">
                  <div className="staff-item-main">
                    <div className={clsx('staff-item-icon', staff.isActive ? 'staff-item-icon--active' : 'staff-item-icon--inactive')}>
                      <Users className="staff-item-icon-symbol" />
                    </div>
                    <div>
                      <div className="staff-item-meta">
                        <span className={clsx('staff-status-badge', staff.isActive ? 'staff-status--active' : 'staff-status--inactive')}>
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="staff-type-badge">{staff.staffType}</span>
                        {staff.isVerified && <span className="staff-status-badge staff-status--verified">Verified</span>}
                      </div>
                      <h3 className="staff-item-title">{staff.name}</h3>
                      <div className="staff-item-footer">
                        {staff.phone && <span className="staff-item-footer-text">Phone: {staff.phone}</span>}
                        {staff.idProofType && <span className="staff-item-footer-text">{staff.idProofType}: {staff.idProofNumber}</span>}
                        {staff.address && <span className="staff-item-footer-text">Address: {staff.address}</span>}
                        {isPlatformLevel && <span className="staff-item-footer-text">{staff.societyName}</span>}
                      </div>
                    </div>
                  </div>
                  {isStaff && (
                    <div className="staff-item-actions">
                      {isAdmin && !staff.isVerified && (
                        <button onClick={() => verifyMutation.mutate(staff.id)} className="staff-btn staff-btn--verify">Verify</button>
                      )}
                      <button onClick={() => toggleMutation.mutate(staff.id)} className="staff-btn staff-btn--toggle">
                        {staff.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {isAdmin && (
                        <button onClick={() => { if (confirm('Delete this staff member?')) deleteMutation.mutate(staff.id) }} className="staff-btn staff-btn--delete">Delete</button>
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
          <div className="staff-summary">
            <div className="staff-summary-card">
              <p className="staff-summary-label">Present Today</p>
              <p className="staff-summary-value staff-summary-value--active">{attendance.filter(a => a.status === 'PRESENT').length}</p>
            </div>
            <div className="staff-summary-card">
              <p className="staff-summary-label">Absent</p>
              <p className="staff-summary-value staff-summary-value--inactive">{attendance.filter(a => a.status === 'ABSENT').length}</p>
            </div>
            <div className="staff-summary-card">
              <p className="staff-summary-label">Late</p>
              <p className="staff-summary-value" style={{ color: 'var(--color-amber)' }}>{attendance.filter(a => a.status === 'LATE').length}</p>
            </div>
            <div className="staff-summary-card">
              <p className="staff-summary-label">Total Records</p>
              <p className="staff-summary-value staff-summary-value--total">{attendance.length}</p>
            </div>
          </div>

          {attendance.length === 0 ? (
            <div className="staff-item" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No attendance records for today</div>
          ) : (
            <table className="staff-attendance-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Type</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  {isStaff && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.staffName}</td>
                    <td><span className="staff-type-badge">{record.staffType}</span></td>
                    <td>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                    <td>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                    <td><span className={clsx('staff-status-badge', record.status === 'PRESENT' ? 'staff-status--active' : record.status === 'ABSENT' ? 'staff-status--inactive' : 'staff-status--verified')}>{record.status}</span></td>
                    {isStaff && (
                      <td>
                        {!record.checkOutTime && record.status === 'PRESENT' && (
                          <button onClick={() => checkOutMutation.mutate(record.id)} className="staff-btn staff-btn--toggle">Check Out</button>
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
        <div className="staff-modal">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <h3 className="staff-modal-title">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="staff-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="staff-form">
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
              <div className="staff-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="staff-btn staff-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="staff-btn staff-btn--primary" isLoading={createMutation.isPending} loadingText="Adding...">Add Staff</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      {showAttendanceModal && (
        <div className="staff-modal">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <h3 className="staff-modal-title">Record Attendance</h3>
              <button onClick={() => setShowAttendanceModal(false)} className="staff-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleAttendanceSubmit} className="staff-form">
              <SmartSelect label="Staff Member" name="staffId" required options={
                staffList.filter(s => s.isActive).map(s => ({ value: String(s.id), label: `${s.name} (${s.staffType})` }))
              } placeholder="Select Staff" />
              <SmartSelect label="Status" name="status" options={[
                { value: 'PRESENT', label: 'Present' }, { value: 'ABSENT', label: 'Absent' },
                { value: 'LATE', label: 'Late' }, { value: 'HALF_DAY', label: 'Half Day' },
              ]} placeholder="Select Status" />
              <FormTextarea label="Notes" name="notes" rows={2} />
              <div className="staff-form-actions">
                <button type="button" onClick={() => setShowAttendanceModal(false)} className="staff-btn staff-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="staff-btn staff-btn--primary" isLoading={attendanceMutation.isPending} loadingText="Recording...">Record</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
