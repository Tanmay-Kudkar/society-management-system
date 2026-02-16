import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { vendorApi, societyApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, Truck, Phone, Mail, Eye, Building2, Landmark, FileText, User, MapPin, Upload } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, PhoneInput, SmartSelect, FormTextarea } from '../../components'
import { PermissionDenied } from '../../components'
import { BulkImportModal } from '../../components'

const approvalClasses = {
  APPROVED: 'vendors-approval-badge--approved',
  REJECTED: 'vendors-approval-badge--rejected',
  PENDING: 'vendors-approval-badge--pending',
}

export default function Vendors() {
  const { user, canManageVendors } = useAuth()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  
  // Permission check
  if (!canManageVendors()) {
    return <PermissionDenied message="You don't have permission to manage vendors" />
  }

  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingVendor, setViewingVendor] = useState(null)

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorApi.getAll().then(res => res.data),
    placeholderData: [],
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
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vendorApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors'])
      setShowModal(false)
      setEditingVendor(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => vendorApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['vendors']),
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

  const filteredVendors = vendors.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApprove = async (vendor) => {
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
    
    // For non-PLATFORM_OWNER, always set societyId to user's society
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId'))
      : user?.societyId
    
    if (!societyId) {
      alert('Society is required. Please select a society or log in again.')
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

  return (
    <div>
      {/* Header */}
      <div className="vendors-header">
        <div>
          <h1 className="vendors-title">Vendors</h1>
          <p className="vendors-subtitle">Manage service providers and contractors</p>
        </div>
        {canManageVendors() && (
          <div className="vendors-actions">
            <button
              onClick={() => setShowBulkImport(true)}
              className="vendors-action-button vendors-action-button--outline"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { 
                setEditingVendor(null)
                setShowModal(true) 
              }}
              className="vendors-action-button vendors-action-button--primary"
            >
              <Plus size={20} />
              Add Vendor
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="vendors-filters">
        <div className="vendors-search">
          <Search className="vendors-search-icon" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="vendors-input"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="vendors-loading">
          <div className="vendors-spinner"></div>
        </div>
      ) : (
        <div className="vendors-grid">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="vendors-card">
              <div className="vendors-card-header">
                <div className="vendors-card-icon">
                  <Truck className="vendors-card-icon-symbol" />
                </div>
                <div className="vendors-card-actions">
                  <button
                    onClick={() => setViewingVendor(vendor)}
                    className="vendors-card-action vendors-card-action--view"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => { 
                      setEditingVendor(vendor)
                      setShowModal(true) 
                    }}
                    className="vendors-card-action vendors-card-action--edit"
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
                        deleteMutation.mutate(vendor.id)
                      }
                    }}
                    className="vendors-card-action vendors-card-action--delete"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="vendors-card-title">{vendor.name}</h3>
              <div className="vendors-card-tags">
                <span className="vendors-service-badge">
                  {vendor.serviceType}
                </span>
                <span className={clsx('vendors-approval-badge', approvalClasses[vendor.approvalStatus] || approvalClasses.PENDING)}>
                  {vendor.approvalStatus === 'APPROVED' ? '✓ Approved' :
                   vendor.approvalStatus === 'REJECTED' ? 'Rejected' :
                   '⏳ Pending'}
                </span>
              </div>
              <div className="vendors-contact-list">
                {vendor.contactPerson && (
                  <div className="vendors-contact-card">
                    <div className="vendors-contact-avatar">
                      <span className="vendors-contact-initial">{vendor.contactPerson.charAt(0)}</span>
                    </div>
                    <span className="vendors-contact-name">{vendor.contactPerson}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="vendors-contact-row">
                    <Phone size={16} className="vendors-contact-icon vendors-contact-icon--phone" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="vendors-contact-row vendors-contact-row--email">
                    <Mail size={16} className="vendors-contact-icon vendors-contact-icon--email" />
                    <span className="vendors-contact-email">{vendor.email}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewingVendor(vendor)}
                className="vendors-details-button"
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
        <div className="vendors-modal">
          <div className="vendors-modal-card">
            <div className="vendors-modal-header">
              <h3 className="vendors-modal-title">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
              <button onClick={() => setShowModal(false)} className="vendors-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="vendors-form">
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
              
              {/* Society dropdown - only show for PLATFORM_OWNER */}
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
              <div className="vendors-form-section">
                <h3 className="vendors-form-section-title">
                  <User size={16} />
                  Contact Person Details
                </h3>
                <div className="vendors-form-stack">
                  <FormInput
                    label="Contact Person Name"
                    name="contactPerson"
                    defaultValue={editingVendor?.contactPerson}
                    placeholder="e.g., John Doe"
                    required
                  />
                  <div className="vendors-form-grid">
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
              <div className="vendors-form-section">
                <h3 className="vendors-form-section-title">
                  <Building2 size={16} />
                  Vendor Business Contact
                </h3>
                <div className="vendors-form-stack">
                  <FormInput
                    label="Vendor Name"
                    name="name"
                    defaultValue={editingVendor?.name}
                    required
                    placeholder="Vendor's business name"
                  />
                  <div className="vendors-form-grid">
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
              <div className="vendors-form-section">
                <h4 className="vendors-form-section-title">Tax Details</h4>
                <div className="vendors-form-grid">
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
              <div className="vendors-form-section">
                <h4 className="vendors-form-section-title">Banking Details</h4>
                <div className="vendors-form-stack">
                  <FormInput
                    label="Bank Name"
                    name="bankName"
                    defaultValue={editingVendor?.bankName}
                    placeholder="HDFC Bank"
                    required
                  />
                  <div className="vendors-form-grid">
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

              <div className="vendors-form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="vendors-btn vendors-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vendors-btn vendors-btn--primary"
                >
                  {editingVendor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingVendor && (
        <div className="vendors-view-modal">
          <div className="vendors-view-card">
            {/* Header */}
            <div className="vendors-view-header">
              <div className="vendors-view-header-main">
                <div className="vendors-view-header-icon">
                  <Truck className="vendors-view-header-icon-symbol" />
                </div>
                <div>
                  <h3 className="vendors-view-title">{viewingVendor.name}</h3>
                  <p className="vendors-view-subtitle">Complete Vendor Information</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingVendor(null)} 
                className="vendors-view-close"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="vendors-view-content">
              {/* Basic Information */}
              <div className="vendors-view-section">
                <h4 className="vendors-view-section-title">
                  <Building2 size={16} />
                  Basic Information
                </h4>
                
                {/* Service Type - Hero Card */}
                <div className="vendors-service-hero">
                  <div className="vendors-service-hero-circle vendors-service-hero-circle--top"></div>
                  <div className="vendors-service-hero-circle vendors-service-hero-circle--bottom"></div>
                  <div className="vendors-service-hero-content">
                    <p className="vendors-service-hero-label">Service Type</p>
                    <p className="vendors-service-hero-value">{viewingVendor.serviceType}</p>
                  </div>
                </div>

                {/* Society Info - only show for PLATFORM_OWNER */}
                {isPlatformLevel && viewingVendor.societyName && (
                  <div className="vendors-society-card">
                    <div className="vendors-society-row">
                      <div className="vendors-society-icon">
                        <Building2 className="vendors-society-icon-symbol" />
                      </div>
                      <div className="vendors-society-text">
                        <p className="vendors-society-label">Assigned Society</p>
                        <p className="vendors-society-name">{viewingVendor.societyName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="vendors-view-section">
                <h4 className="vendors-view-section-title">
                  <User size={16} />
                  Contact Information
                </h4>
                
                {/* Contact Person Details */}
                {viewingVendor.contactPerson && (
                  <div className="vendors-contact-person-card">
                    <div className="vendors-contact-person-header">
                      <div className="vendors-contact-person-avatar">
                        <span className="vendors-contact-person-initial">{viewingVendor.contactPerson.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="vendors-contact-person-text">
                        <p className="vendors-contact-person-label">PRIMARY CONTACT PERSON</p>
                        <p className="vendors-contact-person-name">{viewingVendor.contactPerson}</p>
                      </div>
                    </div>
                    
                    <div className="vendors-contact-grid">
                      {viewingVendor.contactPersonPhone && (
                        <div className="vendors-contact-info-card">
                          <Phone className="vendors-contact-info-icon" />
                          <div>
                            <p className="vendors-contact-info-label">Direct Phone</p>
                            <p className="vendors-contact-info-value">{viewingVendor.contactPersonPhone}</p>
                          </div>
                        </div>
                      )}
                      {viewingVendor.contactPersonEmail && (
                        <div className="vendors-contact-info-card">
                          <Mail className="vendors-contact-info-icon" />
                          <div className="vendors-contact-info-text">
                            <p className="vendors-contact-info-label">Direct Email</p>
                            <p className="vendors-contact-info-value vendors-contact-info-value--wrap">{viewingVendor.contactPersonEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vendor Business Contact */}
                <div className="vendors-business-section">
                  <p className="vendors-business-title">Business Contact</p>
                  
                  {viewingVendor.phone && (
                    <div className="vendors-business-card vendors-business-card--phone">
                      <div className="vendors-business-icon vendors-business-icon--phone">
                        <Phone className="vendors-business-icon-symbol" />
                      </div>
                      <div className="vendors-business-text">
                        <p className="vendors-business-label">Business Phone</p>
                        <p className="vendors-business-value">{viewingVendor.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingVendor.email && (
                    <div className="vendors-business-card vendors-business-card--email">
                      <div className="vendors-business-icon vendors-business-icon--email">
                        <Mail className="vendors-business-icon-symbol" />
                      </div>
                      <div className="vendors-business-text vendors-business-text--wrap">
                        <p className="vendors-business-label">Business Email</p>
                        <p className="vendors-business-value vendors-business-value--wrap">{viewingVendor.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingVendor.address && (
                    <div className="vendors-business-card vendors-business-card--address">
                      <p className="vendors-business-address-label">
                        <MapPin size={14} />
                        Address
                      </p>
                      <p className="vendors-business-address">{viewingVendor.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Details */}
              <div className="vendors-view-section">
                <h4 className="vendors-view-section-title">
                  <FileText size={16} />
                  Tax Details
                </h4>
                <div className="vendors-tax-grid">
                  <div className="vendors-tax-card">
                    <p className="vendors-tax-label">GST Number</p>
                    <p className="vendors-tax-value">{viewingVendor.gstNumber || 'Not Provided'}</p>
                  </div>
                  <div className="vendors-tax-card">
                    <p className="vendors-tax-label">PAN Number</p>
                    <p className="vendors-tax-value">{viewingVendor.panNumber || 'Not Provided'}</p>
                  </div>
                </div>
              </div>

              {/* Banking Details */}
              <div className="vendors-view-section">
                <h4 className="vendors-view-section-title">
                  <Landmark size={16} />
                  Banking Details
                </h4>
                <div className="vendors-bank-stack">
                  <div className="vendors-bank-card">
                    <p className="vendors-bank-label">Bank Name</p>
                    <p className="vendors-bank-value">{viewingVendor.bankName || 'Not Provided'}</p>
                  </div>
                  <div className="vendors-bank-grid">
                    <div className="vendors-bank-subcard">
                      <p className="vendors-bank-label">Account Number</p>
                      <p className="vendors-bank-value">{viewingVendor.accountNumber || 'Not Provided'}</p>
                    </div>
                    <div className="vendors-bank-subcard">
                      <p className="vendors-bank-label">IFSC Code</p>
                      <p className="vendors-bank-value">{viewingVendor.ifscCode || 'Not Provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Approval */}
              <div className="vendors-status-card">
                <div className="vendors-status-stack">
                  <div className="vendors-status-row">
                    <div>
                      <p className="vendors-status-label">Approval Status</p>
                      <span className={clsx('vendors-status-badge', approvalClasses[viewingVendor.approvalStatus] || approvalClasses.PENDING)}>
                        {viewingVendor.approvalStatus === 'APPROVED' ? '✓ Approved' :
                         viewingVendor.approvalStatus === 'REJECTED' ? '✗ Rejected' :
                         '⏳ Pending Approval'}
                      </span>
                    </div>
                    <div>
                      <p className="vendors-status-label">Active Status</p>
                      <span className={clsx('vendors-status-badge', viewingVendor.isActive ? 'vendors-status-badge--active' : 'vendors-status-badge--inactive')}>
                        {viewingVendor.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="vendors-status-footer">
                    <div>
                      <p className="vendors-status-meta-label">Created At</p>
                      <p className="vendors-status-meta-value">
                        {viewingVendor.createdAt ? new Date(viewingVendor.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    
                    {/* Approval Action Buttons */}
                    <div className="vendors-status-actions">
                      {viewingVendor.approvalStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(viewingVendor)}
                          className="vendors-approve-btn"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {viewingVendor.approvalStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(viewingVendor)}
                          className="vendors-reject-btn"
                        >
                          ✗ Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="vendors-view-footer">
              <div className="vendors-view-footer-actions">
                <button
                  onClick={() => { 
                    setViewingVendor(null)
                    setEditingVendor(viewingVendor)
                    setShowModal(true) 
                  }}
                  className="vendors-view-edit-btn"
                >
                  <Edit size={18} />
                  Edit Vendor
                </button>
                <button
                  onClick={() => setViewingVendor(null)}
                  className="vendors-view-close-btn"
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
