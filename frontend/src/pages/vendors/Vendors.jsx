import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { vendorApi, societyApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, Truck, Phone, Mail, Eye, Building2, Landmark, FileText, User, MapPin, Upload } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, PhoneInput, SmartSelect, FormTextarea, InfoTooltip, NeonSweepButton } from '../../components'
import { PermissionDenied } from '../../components'
import { BulkImportModal } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDate } from '../../utils/formatUtils'

const approvalBadgeClass = {
  APPROVED: 'bg-green-600',
  REJECTED: 'bg-red-600',
  PENDING: 'bg-yellow-500',
}

export default function Vendors() {
  const { user, canManageVendors } = useAuth()
  const [searchParams] = useSearchParams()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingVendor, setViewingVendor] = useState(null)

  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = user?.role === 'MASTER_ADMIN' && Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
    ? parsedSocietyIdFromUrl
    : null
  const isPlatformLevel = user?.role === 'MASTER_ADMIN' && !scopedSocietyId
  const effectiveSocietyId = scopedSocietyId || user?.societyId
  const canApproveRejectVendors = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY'].includes(user?.role)

  const { data: vendors = [], isLoading, isError } = useQuery({
    queryKey: ['vendors', effectiveSocietyId, isPlatformLevel],
    queryFn: () => {
      if (effectiveSocietyId) {
        return vendorApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return vendorApi.getAll().then(res => res.data)
    },
  })

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel,
  })

  const createMutation = useMutation({
    mutationFn: (data) => vendorApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors'])
      closeModal(true)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vendorApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors'])
      closeModal(true)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, force = false }) => vendorApi.delete(id, user.id, force),
    onSuccess: () => queryClient.invalidateQueries(['vendors']),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete vendor')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id) => vendorApi.approve(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors'])
      setViewingVendor(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => vendorApi.reject(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors'])
      setViewingVendor(null)
    },
  })

  const filteredVendors = useMemo(() => vendors.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [vendors, searchTerm])

  const closeModal = (force = false) => {
    if (!force && (createMutation.isPending || updateMutation.isPending)) return
    setShowModal(false)
    setEditingVendor(null)
  }

  const handleApprove = async (vendor) => {
    if (!canApproveRejectVendors) {
      toast.error('You do not have permission to approve vendors')
      return
    }

    const confirmed = await confirmDialog({
      title: 'Approve Vendor',
      message: 'Approve this vendor for partnership?',
      confirmText: 'Approve',
      tone: 'neutral',
      details: [
        { label: 'Vendor', value: vendor?.name || '-' },
        { label: 'Service', value: vendor?.serviceType || '-' },
        { label: 'Status', value: vendor?.approvalStatus || 'PENDING' },
      ],
      impacts: [
        { label: 'Approval Status', count: 1 },
      ],
    })
    if (confirmed) {
      approveMutation.mutate(vendor?.id)
    }
  }

  const handleReject = async (vendor) => {
    if (!canApproveRejectVendors) {
      toast.error('You do not have permission to reject vendors')
      return
    }

    const confirmed = await confirmDialog({
      title: 'Reject Vendor',
      message: 'Reject this vendor application?',
      confirmText: 'Reject',
      tone: 'warning',
      details: [
        { label: 'Vendor', value: vendor?.name || '-' },
        { label: 'Service', value: vendor?.serviceType || '-' },
        { label: 'Status', value: vendor?.approvalStatus || 'PENDING' },
      ],
      impacts: [
        { label: 'Approval Status', count: 1 },
      ],
    })
    if (confirmed) {
      rejectMutation.mutate(vendor?.id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // For non-MASTER_ADMIN, always set societyId to user's society
    const submittedSocietyId = Number(formData.get('societyId'))
    const societyId = isPlatformLevel
      ? (submittedSocietyId || editingVendor?.societyId)
      : effectiveSocietyId
    
    if (!societyId) {
      toast.error('Society is required. Please select a society or log in again.')
      return
    }
    
    const data = {
      societyId,
      name: formData.get('name'),
      serviceType: formData.get('serviceType'),
      contactPerson: formData.get('contactPerson'),
      contactPersonPhone: formData.get('contactPersonPhone'),
      contactPersonEmail: formData.get('contactPersonEmail'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      gstNumber: formData.get('gstNumber'),
      panNumber: formData.get('panNumber'),
      bankName: formData.get('bankName'),
      accountNumber: formData.get('accountNumber'),
      ifscCode: formData.get('ifscCode'),
    }

    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  // Permission check
  if (!canManageVendors()) {
    return <PermissionDenied message="You don't have permission to manage vendors" />
  }

  if (showSkeleton) return (
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={2} />
      <FiltersSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vendors</h1>
            <InfoTooltip text="Manage service providers and contractors" />
          </div>
        </div>
        {canManageVendors() && (
          <div className="flex gap-2 flex-wrap">
            <NeonSweepButton
              tone="slate"
              size="md"
              onClick={() => setShowBulkImport(true)}
              className="w-full sm:w-auto"
            >
              <Upload size={20} />
              Bulk Import
            </NeonSweepButton>
            <NeonSweepButton
              tone="violet"
              size="md"
              onClick={() => { 
                setEditingVendor(null)
                setShowModal(true) 
              }}
              className="w-full sm:w-auto"
            >
              <Plus size={20} />
              Add Vendor
            </NeonSweepButton>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm transition-[border-color,box-shadow] duration-200 hover:shadow-md hover:border-[var(--border-strong)]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-[14px] bg-gradient-to-br from-orange-50 to-orange-200">
                  <Truck className="w-7 h-7 text-orange-600" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewingVendor(vendor)}
                    className="inline-flex items-center justify-center p-2 rounded-[10px] bg-transparent text-[var(--text-tertiary)] transition-colors hover:bg-green-100 hover:text-green-600"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => { 
                      setEditingVendor(vendor)
                      setShowModal(true) 
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-[10px] bg-transparent text-[var(--text-tertiary)] transition-colors hover:bg-blue-100/50 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      const confirmed = await confirmDialog({
                        title: 'Delete Vendor',
                        message: 'Are you sure you want to delete this vendor? This action cannot be undone.',
                        confirmText: 'Delete',
                        tone: 'danger',
                        details: [
                          { label: 'Vendor', value: vendor.name || '-' },
                          { label: 'Service', value: vendor.serviceType || '-' },
                          { label: 'Contact', value: vendor.contactPerson || vendor.phone || '-' },
                          { label: 'Status', value: vendor.approvalStatus || 'PENDING' },
                        ],
                        impacts: [
                          { label: 'Vendor Profile', count: 1 },
                        ],
                        caution: 'This action permanently removes vendor records.',
                      })
                      if (confirmed) {
                        deleteMutation.mutate({ id: vendor.id, force: false }, {
                          onError: async (error) => {
                            const msg = error.response?.data?.message || ''
                            if (error.response?.status === 409 && msg.toLowerCase().includes('force')) {
                              const forceConfirmed = await confirm({
                                title: 'Force Delete Vendor?',
                                message: msg + '\n\nThis will also remove all related bills and contracts. Continue?',
                                tone: 'danger',
                              })
                              if (forceConfirmed) {
                                deleteMutation.mutate({ id: vendor.id, force: true })
                              }
                            }
                          }
                        })
                      }
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-[10px] bg-transparent text-[var(--text-tertiary)] transition-colors hover:bg-red-100 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 truncate" title={vendor.name}>{vendor.name}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100">
                  {vendor.serviceType}
                </span>
                <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white', approvalBadgeClass[vendor.approvalStatus] || approvalBadgeClass.PENDING)}>
                  {vendor.approvalStatus === 'APPROVED' ? '✓ Approved' :
                   vendor.approvalStatus === 'REJECTED' ? 'Rejected' :
                   '⏳ Pending'}
                </span>
              </div>
              <div className="grid gap-2.5 mb-4 text-sm">
                {vendor.contactPerson && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[var(--bg-tertiary)] text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-violet-100 inline-flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-violet-700">{vendor.contactPerson.charAt(0)}</span>
                    </div>
                    <span className="font-semibold truncate">{vendor.contactPerson}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Phone size={16} className="flex-shrink-0 text-green-600" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] overflow-hidden">
                    <Mail size={16} className="flex-shrink-0 text-blue-600" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewingVendor(vendor)}
                className="w-full mt-2 px-4 py-2.5 rounded-xl border-none bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold inline-flex items-center justify-center gap-2 shadow-[0_6px_12px_rgba(37,99,235,0.2)] transition-[filter,box-shadow] duration-200 hover:brightness-105 hover:shadow-[0_8px_14px_rgba(37,99,235,0.22)]"
              >
                <Eye size={16} />
                View Full Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <div className="sticky top-0 bg-[var(--bg-card)] flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
              <button onClick={() => closeModal()} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 grid gap-4">
              <SmartSelect
                label="Service Type"
                name="serviceType"
                defaultValue={editingVendor?.serviceType}
                options={[
                  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                  { value: 'SECURITY', label: 'Security' },
                  { value: 'ELECTRICIAN', label: 'Electrician' },
                  { value: 'PLUMBER', label: 'Plumber' },
                  { value: 'PEST_CONTROL', label: 'Pest Control' },
                  { value: 'LIFT_MAINTENANCE', label: 'Lift Maintenance' },
                  { value: 'GENERATOR', label: 'Generator' },
                  { value: 'CCTV', label: 'CCTV' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                required
                placeholder="Select Type"
              />
              
              {/* Society dropdown - only show for MASTER_ADMIN */}
              {isPlatformLevel && (
                <SmartSelect
                  label="Society"
                  name="societyId"
                  defaultValue={editingVendor?.societyId}
                  options={societies.map(s => ({ value: s.id, label: s.name }))}
                  required
                  icon={Building2}
                  placeholder="Select Society"
                  emptyMessage="No societies available"
                />
              )}
              
              {/* Contact Person Section */}
              <div className="border-t border-[var(--border-light)] pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 inline-flex items-center gap-2">
                  <User size={16} />
                  Contact Person Details
                </h3>
                <div className="grid gap-4">
                  <FormInput
                    label="Contact Person Name"
                    name="contactPerson"
                    defaultValue={editingVendor?.contactPerson}
                    placeholder="e.g., John Doe"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                    <PhoneInput
                      label="Contact Phone"
                      name="contactPersonPhone"
                      defaultValue={editingVendor?.contactPersonPhone}
                      required
                    />
                    <FormInput
                      label="Contact Email"
                      name="contactPersonEmail"
                      type="email"
                      defaultValue={editingVendor?.contactPersonEmail}
                      placeholder="Contact email"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Business Contact Section */}
              <div className="border-t border-[var(--border-light)] pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 inline-flex items-center gap-2">
                  <Building2 size={16} />
                  Vendor Business Contact
                </h3>
                <div className="grid gap-4">
                  <FormInput
                    label="Vendor Name"
                    name="name"
                    defaultValue={editingVendor?.name}
                    required
                    placeholder="Vendor's business name"
                  />
                  <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                    <PhoneInput
                      label="Business Phone"
                      name="phone"
                      defaultValue={editingVendor?.phone}
                      required
                    />
                    <FormInput
                      label="Business Email"
                      name="email"
                      type="email"
                      defaultValue={editingVendor?.email}
                      placeholder="Vendor's business email"
                      required
                    />
                  </div>
                </div>
              </div>
              <FormTextarea
                label="Address"
                name="address"
                defaultValue={editingVendor?.address}
                rows={2}
                required
              />

              {/* Tax Details */}
              <div className="border-t border-[var(--border-light)] pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Tax Details</h4>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <FormInput
                    label="GST Number"
                    name="gstNumber"
                    defaultValue={editingVendor?.gstNumber}
                    placeholder="22AAAAA0000A1Z5"
                    required
                  />
                  <FormInput
                    label="PAN Number"
                    name="panNumber"
                    defaultValue={editingVendor?.panNumber}
                    placeholder="AAAAA0000A"
                    required
                  />
                </div>
              </div>

              {/* Banking Details */}
              <div className="border-t border-[var(--border-light)] pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Banking Details</h4>
                <div className="grid gap-4">
                  <FormInput
                    label="Bank Name"
                    name="bankName"
                    defaultValue={editingVendor?.bankName}
                    placeholder="HDFC Bank"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                    <FormInput
                      label="Account Number"
                      name="accountNumber"
                      defaultValue={editingVendor?.accountNumber}
                      placeholder="1234567890"
                      required
                    />
                    <FormInput
                      label="IFSC Code"
                      name="ifscCode"
                      defaultValue={editingVendor?.ifscCode}
                      placeholder="HDFC0000123"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={() => closeModal()}
                  className="flex-1"
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingVendor ? 'Update' : 'Create')}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-[960px] max-h-[90vh] bg-[var(--bg-card)] rounded-[20px] overflow-hidden flex flex-col shadow-[0_30px_70px_rgba(15,23,42,0.25)]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)] bg-gradient-to-r from-orange-50 to-orange-200">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-[14px] bg-[var(--bg-card)] shadow-[0_6px_14px_rgba(15,23,42,0.15)]">
                  <Truck className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">{viewingVendor.name}</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">Complete Vendor Information</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingVendor(null)} 
                className="border-none bg-transparent text-[var(--text-tertiary)] p-2 rounded-[10px] transition-colors hover:bg-white/70 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto grid gap-6">
              {/* Basic Information */}
              <div className="grid gap-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] inline-flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
                  <Building2 size={16} />
                  Basic Information
                </h4>
                
                {/* Service Type - Hero Card */}
                <div className="relative overflow-hidden rounded-[18px] p-6 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-[0_16px_30px_rgba(79,70,229,0.2)]">
                  <div className="absolute w-[120px] h-[120px] top-[-40px] right-[-40px] rounded-full bg-white/12"></div>
                  <div className="absolute w-[100px] h-[100px] bottom-[-40px] left-[-30px] rounded-full bg-white/8"></div>
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-2">Service Type</p>
                    <p className="text-[28px] font-extrabold">{viewingVendor.serviceType}</p>
                  </div>
                </div>

                {/* Society Info - only show for MASTER_ADMIN */}
                {isPlatformLevel && viewingVendor.societyName && (
                  <div className="p-4 rounded-[14px] border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[10px] bg-orange-200">
                        <Building2 className="w-[18px] h-[18px] text-orange-700" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-orange-700 mb-1">Assigned Society</p>
                        <p className="text-base font-bold text-[var(--text-primary)]">{viewingVendor.societyName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid gap-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] inline-flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
                  <User size={16} />
                  Contact Information
                </h4>
                
                {/* Contact Person Details */}
                {viewingVendor.contactPerson && (
                  <div className="p-4 rounded-[14px] border border-purple-300/30 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 inline-flex items-center justify-center text-white font-bold text-lg shadow-[0_6px_12px_rgba(139,92,246,0.3)]">
                        {viewingVendor.contactPerson.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-violet-700 mb-1">PRIMARY CONTACT PERSON</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{viewingVendor.contactPerson}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {viewingVendor.contactPersonPhone && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/70">
                          <Phone className="w-4 h-4 text-violet-500" />
                          <div>
                            <p className="text-xs text-[var(--text-tertiary)]">Direct Phone</p>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{viewingVendor.contactPersonPhone}</p>
                          </div>
                        </div>
                      )}
                      {viewingVendor.contactPersonEmail && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/70">
                          <Mail className="w-4 h-4 text-violet-500" />
                          <div>
                            <p className="text-xs text-[var(--text-tertiary)]">Direct Email</p>
                            <p className="text-sm font-semibold text-[var(--text-primary)] break-words">{viewingVendor.contactPersonEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vendor Business Contact */}
                <div className="grid gap-3">
                  <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Business Contact</p>
                  
                  {viewingVendor.phone && (
                    <div className="flex items-center gap-3 p-4 rounded-[14px] border border-green-200/50 bg-gradient-to-r from-green-50 to-green-100">
                      <div className="p-2.5 rounded-[10px] bg-green-600/10">
                        <Phone className="w-[18px] h-[18px] text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Business Phone</p>
                        <p className="text-base font-bold text-[var(--text-primary)]">{viewingVendor.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingVendor.email && (
                    <div className="flex items-center gap-3 p-4 rounded-[14px] border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100">
                      <div className="p-2.5 rounded-[10px] bg-blue-600/10">
                        <Mail className="w-[18px] h-[18px] text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Business Email</p>
                        <p className="text-base font-bold text-[var(--text-primary)] break-words">{viewingVendor.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingVendor.address && (
                    <div className="p-4 rounded-[14px] border border-slate-300/15 bg-[var(--bg-tertiary)]">
                      <p className="text-xs font-semibold text-[var(--text-tertiary)] inline-flex items-center gap-1.5 mb-2">
                        <MapPin size={14} />
                        Address
                      </p>
                      <p className="text-base font-semibold text-[var(--text-primary)]">{viewingVendor.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Details */}
              <div className="grid gap-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] inline-flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
                  <FileText size={16} />
                  Tax Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-[14px] bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-400">
                    <p className="text-xs font-semibold text-amber-700 mb-2">GST Number</p>
                    <p className="text-base font-bold text-[var(--text-primary)] font-mono">{viewingVendor.gstNumber || 'Not Provided'}</p>
                  </div>
                  <div className="p-4 rounded-[14px] bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-400">
                    <p className="text-xs font-semibold text-amber-700 mb-2">PAN Number</p>
                    <p className="text-base font-bold text-[var(--text-primary)] font-mono">{viewingVendor.panNumber || 'Not Provided'}</p>
                  </div>
                </div>
              </div>

              {/* Banking Details */}
              <div className="grid gap-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] inline-flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
                  <Landmark size={16} />
                  Banking Details
                </h4>
                <div className="grid gap-3">
                  <div className="p-4 rounded-[14px] bg-gradient-to-br from-indigo-100 to-indigo-200 border-l-4 border-indigo-500">
                    <p className="text-xs font-semibold text-indigo-700 mb-2">Bank Name</p>
                    <p className="text-base font-bold text-[var(--text-primary)] font-mono">{viewingVendor.bankName || 'Not Provided'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-[14px] bg-gradient-to-br from-indigo-100 to-indigo-200 border-l-4 border-indigo-500">
                      <p className="text-xs font-semibold text-indigo-700 mb-2">Account Number</p>
                      <p className="text-base font-bold text-[var(--text-primary)] font-mono">{viewingVendor.accountNumber || 'Not Provided'}</p>
                    </div>
                    <div className="p-4 rounded-[14px] bg-gradient-to-br from-indigo-100 to-indigo-200 border-l-4 border-indigo-500">
                      <p className="text-xs font-semibold text-indigo-700 mb-2">IFSC Code</p>
                      <p className="text-base font-bold text-[var(--text-primary)] font-mono">{viewingVendor.ifscCode || 'Not Provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Approval */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-light)]">
                <div className="grid gap-4">
                  <div className="flex justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-2">Approval Status</p>
                      <span className={clsx('inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white shadow-[0_10px_18px_rgba(15,23,42,0.15)]', approvalBadgeClass[viewingVendor.approvalStatus] || approvalBadgeClass.PENDING)}>
                        {viewingVendor.approvalStatus === 'APPROVED' ? '✓ Approved' :
                         viewingVendor.approvalStatus === 'REJECTED' ? '✗ Rejected' :
                         '⏳ Pending Approval'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-2">Active Status</p>
                      <span className={clsx('inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white shadow-[0_10px_18px_rgba(15,23,42,0.15)]', viewingVendor.isActive ? 'bg-green-600' : 'bg-slate-500')}>
                        {viewingVendor.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border-light)] flex-wrap">
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Created At</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {viewingVendor.createdAt ? formatDate(viewingVendor.createdAt) : 'N/A'}
                      </p>
                    </div>
                    
                    {/* Approval Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {canApproveRejectVendors && viewingVendor.approvalStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(viewingVendor)}
                          className="px-4 py-2 rounded-[10px] text-sm font-bold border-none text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {canApproveRejectVendors && viewingVendor.approvalStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(viewingVendor)}
                          className="px-4 py-2 rounded-[10px] text-sm font-bold border-none text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          ✗ Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 p-6 border-t border-[var(--border-light)] bg-[var(--bg-tertiary)]">
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => { 
                    setViewingVendor(null)
                    setEditingVendor(viewingVendor)
                    setShowModal(true) 
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold border-none hover:bg-blue-700 transition-colors"
                >
                  <Edit size={18} />
                  Edit Vendor
                </button>
                <button
                  onClick={() => setViewingVendor(null)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] bg-transparent text-slate-700 font-semibold hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          title="Bulk Import Vendors"
          entityName="Vendors"
          templateFilename="vendor_import_template.xlsx"
          columns={[
            { letter: 'A', label: 'Vendor Name', required: true, description: 'Name of the vendor/company' },
            { letter: 'B', label: 'Service Type', required: true, description: 'PLUMBER, ELECTRICIAN, SECURITY, etc.' },
            { letter: 'C', label: 'Contact Person', required: false, description: 'Primary contact person name' },
            { letter: 'D', label: 'Phone', required: false, description: 'Contact phone number' },
            { letter: 'E', label: 'Email', required: false, description: 'Contact email address' },
            { letter: 'F', label: 'Address', required: false, description: 'Business address' },
            { letter: 'G', label: 'GST Number', required: false, description: 'GST registration number' },
            { letter: 'H', label: 'PAN Number', required: false, description: 'PAN card number' },
          ]}
          tableColumns={[
            { key: 'name', label: 'Vendor Name' },
            { key: 'serviceType', label: 'Service Type' },
          ]}
          apiValidate={vendorApi.validateBulkImport}
          apiProcess={vendorApi.processBulkImport}
          apiTemplate={vendorApi.downloadImportTemplate}
          societyId={user?.societyId}
          userId={user?.id}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => queryClient.invalidateQueries(['vendors'])}
        />
      )}

    </div>
  )
}
