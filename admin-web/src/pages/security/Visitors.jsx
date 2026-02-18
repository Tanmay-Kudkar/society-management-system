import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { visitorApi } from '../../../../api'
import { Plus, Search, X, UserCheck, UserX, Clock, LogIn, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, FiltersSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusIcons = {
  EXPECTED: Clock,
  CHECKED_IN: LogIn,
  CHECKED_OUT: LogOut,
  REJECTED: UserX,
  CANCELLED: X,
}

export default function Visitors() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  const isMember = user?.role && user.role !== 'VISITOR'
  if (!isMember) {
    return <PermissionDenied message="You don't have permission to access visitor management" />
  }

  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
  const isStaff = ['PLATFORM_OWNER', 'ORGANIZATION_OWNER', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE', 'MANAGER', 'EMPLOYEE'].includes(user?.role)
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? societyIdFromUrl : user?.societyId

  const { data: visitors = [], isLoading, isError } = useQuery({
    queryKey: ['visitors', user?.id, effectiveSocietyId],
    queryFn: () => visitorApi.getBySociety(effectiveSocietyId, user.id).then(res => res.data),
    enabled: !!user?.id && !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => visitorApi.create(user.id, data),
    onSuccess: () => { queryClient.invalidateQueries(['visitors']); setShowModal(false) },
  })

  const checkInMutation = useMutation({
    mutationFn: (id) => visitorApi.checkIn(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const checkOutMutation = useMutation({
    mutationFn: (id) => visitorApi.checkOut(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => visitorApi.updateStatus(id, user.id, 'REJECTED'),
    onSuccess: () => queryClient.invalidateQueries(['visitors']),
  })

  const filteredVisitors = useMemo(() => visitors.filter(v => {
    const matchesSearch = v.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.visitorPhone?.includes(searchTerm) ||
                         v.approvalCode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || v.status === filterStatus
    const matchesType = !filterType || v.visitorType === filterType
    return matchesSearch && matchesStatus && matchesType
  }), [visitors, searchTerm, filterStatus, filterType])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createMutation.mutate({
      visitorName: formData.get('visitorName'),
      visitorPhone: formData.get('visitorPhone'),
      visitorType: formData.get('visitorType'),
      purpose: formData.get('purpose'),
      vehicleNumber: formData.get('vehicleNumber'),
      notes: formData.get('notes'),
      societyId: user.societyId,
      isPreApproved: formData.get('isPreApproved') === 'on',
    })
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <FiltersSkeleton filterCount={2} />
        <ListSkeleton count={4} />
      </div>
    )
  }

  return (
    <div>
      <div className="visitors-header">
        <div>
          <h1 className="visitors-title">Visitor Management</h1>
          <p className="visitors-subtitle">Track and manage visitors</p>
        </div>
        <button onClick={() => setShowModal(true)} className="visitors-action-button">
          <Plus size={20} /> Pre-approve Visitor
        </button>
      </div>

      <div className="visitors-summary">
        <div className="visitors-summary-card">
          <p className="visitors-summary-label">Expected</p>
          <p className="visitors-summary-value visitors-summary-value--expected">{visitors.filter(v => v.status === 'EXPECTED').length}</p>
        </div>
        <div className="visitors-summary-card">
          <p className="visitors-summary-label">Checked In</p>
          <p className="visitors-summary-value visitors-summary-value--in">{visitors.filter(v => v.status === 'CHECKED_IN').length}</p>
        </div>
        <div className="visitors-summary-card">
          <p className="visitors-summary-label">Checked Out</p>
          <p className="visitors-summary-value visitors-summary-value--out">{visitors.filter(v => v.status === 'CHECKED_OUT').length}</p>
        </div>
        <div className="visitors-summary-card">
          <p className="visitors-summary-label">Total</p>
          <p className="visitors-summary-value visitors-summary-value--total">{visitors.length}</p>
        </div>
      </div>

      <div className="visitors-filters">
        <div className="visitors-filters-row">
          <div className="visitors-search">
            <Search className="visitors-search-icon" />
            <input type="text" placeholder="Search visitors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="visitors-input" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="visitors-select">
            <option value="">All Status</option>
            <option value="EXPECTED">Expected</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="visitors-select">
            <option value="">All Types</option>
            <option value="GUEST">Guest</option>
            <option value="DELIVERY">Delivery</option>
            <option value="CAB">Cab</option>
            <option value="SERVICE">Service</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="visitors-list">
        {filteredVisitors.length === 0 && (
          <div className="visitors-item" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No visitors found
          </div>
        )}
        {filteredVisitors.map((visitor) => {
          const StatusIcon = statusIcons[visitor.status] || Clock
          return (
            <div key={visitor.id} className="visitors-item">
              <div className="visitors-item-row">
                <div className="visitors-item-main">
                  <div className={clsx('visitors-item-icon',
                    visitor.status === 'EXPECTED' && 'visitors-item-icon--expected',
                    visitor.status === 'CHECKED_IN' && 'visitors-item-icon--in',
                    visitor.status === 'CHECKED_OUT' && 'visitors-item-icon--out',
                    visitor.status === 'REJECTED' && 'visitors-item-icon--rejected',
                  )}>
                    <StatusIcon className={clsx('visitors-item-icon-symbol',
                      visitor.status === 'EXPECTED' && 'visitors-item-icon-symbol--expected',
                      visitor.status === 'CHECKED_IN' && 'visitors-item-icon-symbol--in',
                      visitor.status === 'CHECKED_OUT' && 'visitors-item-icon-symbol--out',
                      visitor.status === 'REJECTED' && 'visitors-item-icon-symbol--rejected',
                    )} />
                  </div>
                  <div>
                    <div className="visitors-item-meta">
                      <span className={clsx('visitors-status-badge',
                        visitor.status === 'EXPECTED' && 'visitors-status--expected',
                        visitor.status === 'CHECKED_IN' && 'visitors-status--checked_in',
                        visitor.status === 'CHECKED_OUT' && 'visitors-status--checked_out',
                        visitor.status === 'REJECTED' && 'visitors-status--rejected',
                        visitor.status === 'CANCELLED' && 'visitors-status--cancelled',
                      )}>{visitor.status?.replace('_', ' ')}</span>
                      <span className="visitors-type-badge">{visitor.visitorType}</span>
                      {visitor.isPreApproved && <span className="visitors-status-badge visitors-status--expected">PRE-APPROVED</span>}
                    </div>
                    <h3 className="visitors-item-title">{visitor.visitorName}</h3>
                    {visitor.purpose && <p className="visitors-item-description">{visitor.purpose}</p>}
                    <div className="visitors-item-footer">
                      {visitor.visitorPhone && <span className="visitors-item-footer-text">Phone: {visitor.visitorPhone}</span>}
                      {visitor.flatNumber && <span className="visitors-item-footer-text">Flat: {visitor.flatNumber}</span>}
                      {visitor.vehicleNumber && <span className="visitors-item-footer-text">Vehicle: {visitor.vehicleNumber}</span>}
                      {visitor.approvalCode && <span className="visitors-item-footer-text">Code: {visitor.approvalCode}</span>}
                      <span className="visitors-item-footer-text">{visitor.createdAt && new Date(visitor.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {isStaff && (
                  <div className="visitors-item-actions">
                    {(visitor.status === 'EXPECTED') && (
                      <>
                        <button onClick={() => checkInMutation.mutate(visitor.id)} className="visitors-btn visitors-btn--checkin">Check In</button>
                        <button onClick={() => rejectMutation.mutate(visitor.id)} className="visitors-btn visitors-btn--reject">Reject</button>
                      </>
                    )}
                    {visitor.status === 'CHECKED_IN' && (
                      <button onClick={() => checkOutMutation.mutate(visitor.id)} className="visitors-btn visitors-btn--checkout">Check Out</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="visitors-modal">
          <div className="visitors-modal-card">
            <div className="visitors-modal-header">
              <h3 className="visitors-modal-title">Pre-approve Visitor</h3>
              <button onClick={() => setShowModal(false)} className="visitors-modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="visitors-form">
              <FormInput label="Visitor Name" name="visitorName" required />
              <FormInput label="Phone Number" name="visitorPhone" />
              <SmartSelect label="Visitor Type" name="visitorType" required options={[
                { value: 'GUEST', label: 'Guest' },
                { value: 'DELIVERY', label: 'Delivery' },
                { value: 'CAB', label: 'Cab' },
                { value: 'SERVICE', label: 'Service' },
                { value: 'OTHER', label: 'Other' },
              ]} placeholder="Select Type" />
              <FormInput label="Purpose" name="purpose" />
              <FormInput label="Vehicle Number" name="vehicleNumber" />
              <FormTextarea label="Notes" name="notes" rows={3} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                <input type="checkbox" name="isPreApproved" defaultChecked /> Pre-approve this visitor
              </label>
              <div className="visitors-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="visitors-btn visitors-btn--ghost">Cancel</button>
                <AsyncButton type="submit" className="visitors-btn visitors-btn--primary" isLoading={createMutation.isPending} loadingText="Adding...">Add Visitor</AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
