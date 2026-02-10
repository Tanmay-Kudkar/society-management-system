import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { vendorApi, societyApi } from '../../../api'
import { Plus, Edit, Trash2, Search, X, Truck, Phone, Mail, Eye, Building2, CreditCard, Landmark, FileText, User, MapPin, Upload } from 'lucide-react'
import { FormInput, PhoneInput, SmartSelect, FormTextarea } from '../components/FormComponents'
import BulkImportModal from '../components/BulkImportModal'

export default function Vendors() {
  const { user, canManageVendors } = useAuth()
  const queryClient = useQueryClient()
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

  const handleApprove = (id) => {
    if (window.confirm('Approve this vendor for partnership?')) {
      approveMutation.mutate(id)
    }
  }

  const handleReject = (id) => {
    if (window.confirm('Reject this vendor application?')) {
      rejectMutation.mutate(id)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage service providers and contractors</p>
        </div>
        {canManageVendors() && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { 
                setEditingVendor(null)
                setShowModal(true) 
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Add Vendor
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 group-hover:scale-110 transition-transform duration-300">
                  <Truck className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewingVendor(vendor)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => { 
                      setEditingVendor(vendor)
                      setShowModal(true) 
                    }}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this vendor?')) {
                        deleteMutation.mutate(vendor.id)
                      }
                    }}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{vendor.name}</h3>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                  {vendor.serviceType}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  vendor.approvalStatus === 'APPROVED' ? 'bg-green-500 text-white' :
                  vendor.approvalStatus === 'REJECTED' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {vendor.approvalStatus === 'APPROVED' ? '✓ Approved' :
                   vendor.approvalStatus === 'REJECTED' ? 'Rejected' :
                   '⏳ Pending'}
                </span>
              </div>
              <div className="space-y-2.5 text-sm mb-4">
                {vendor.contactPerson && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">{vendor.contactPerson.charAt(0)}</span>
                    </div>
                    <span className="truncate">{vendor.contactPerson}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Phone size={16} className="text-green-600 dark:text-green-400" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                    <Mail size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewingVendor(vendor)}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold dark:text-white">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <User size={16} />
                  Contact Person Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <FormInput
                    label="Contact Person Name"
                    name="contactPerson"
                    defaultValue={editingVendor?.contactPerson}
                    placeholder="e.g., John Doe"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <PhoneInput
                      label="Contact Phone"
                      name="contactPersonPhone"
                      defaultValue={editingVendor?.contactPersonPhone}
                    />
                    <FormInput
                      label="Contact Email"
                      name="contactPersonEmail"
                      type="email"
                      defaultValue={editingVendor?.contactPersonEmail}
                      placeholder="Contact email"
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Business Contact Section */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Building2 size={16} />
                  Vendor Business Contact
                </h3>
                <div className="space-y-4">
                  <FormInput
                    label="Vendor Name"
                    name="name"
                    defaultValue={editingVendor?.name}
                    required
                    placeholder="Vendor's business name"
                  />
                  <div className="grid grid-cols-2 gap-4">
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
                    />
                  </div>
                </div>
              </div>
              <FormTextarea
                label="Address"
                name="address"
                defaultValue={editingVendor?.address}
                rows={2}
              />

              {/* Tax Details */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tax Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="GST Number"
                    name="gstNumber"
                    defaultValue={editingVendor?.gstNumber}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  <FormInput
                    label="PAN Number"
                    name="panNumber"
                    defaultValue={editingVendor?.panNumber}
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>

              {/* Banking Details */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Banking Details</h4>
                <div className="space-y-4">
                  <FormInput
                    label="Bank Name"
                    name="bankName"
                    defaultValue={editingVendor?.bankName}
                    placeholder="HDFC Bank"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Account Number"
                      name="accountNumber"
                      defaultValue={editingVendor?.accountNumber}
                      placeholder="1234567890"
                    />
                    <FormInput
                      label="IFSC Code"
                      name="ifscCode"
                      defaultValue={editingVendor?.ifscCode}
                      placeholder="HDFC0000123"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-700 shadow-md">
                  <Truck className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingVendor.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Complete Vendor Information</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingVendor(null)} 
                className="p-2 hover:bg-white/80 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <Building2 size={16} />
                  Basic Information
                </h4>
                
                {/* Service Type - Hero Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 dark:from-purple-700 dark:via-purple-800 dark:to-indigo-900 rounded-2xl p-6 mb-4 shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative">
                    <p className="text-purple-100 text-xs font-semibold uppercase tracking-wide mb-2">Service Type</p>
                    <p className="text-white text-3xl font-black">{viewingVendor.serviceType}</p>
                  </div>
                </div>

                {/* Society Info - only show for PLATFORM_OWNER */}
                {isPlatformLevel && viewingVendor.societyName && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-200 dark:bg-orange-800/50">
                        <Building2 className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold mb-1">Assigned Society</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{viewingVendor.societyName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <User size={16} />
                  Contact Information
                </h4>
                
                {/* Contact Person Details */}
                {viewingVendor.contactPerson && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{viewingVendor.contactPerson.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">PRIMARY CONTACT PERSON</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{viewingVendor.contactPerson}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {viewingVendor.contactPersonPhone && (
                        <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                          <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Direct Phone</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{viewingVendor.contactPersonPhone}</p>
                          </div>
                        </div>
                      )}
                      {viewingVendor.contactPersonEmail && (
                        <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                          <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Direct Email</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{viewingVendor.contactPersonEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vendor Business Contact */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Business Contact</p>
                  
                  {viewingVendor.phone && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 border border-green-200/50 dark:border-green-800/30">
                      <div className="p-2.5 rounded-lg bg-green-500/10 dark:bg-green-500/20">
                        <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">Business Phone</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">{viewingVendor.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingVendor.email && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">Business Email</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white break-all">{viewingVendor.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {viewingVendor.address && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-700/50 dark:to-slate-700/30 rounded-xl p-4 border border-gray-200/50 dark:border-slate-600/30">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <MapPin size={14} />
                        Address
                      </p>
                      <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">{viewingVendor.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tax Details */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <FileText size={16} />
                  Tax Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-4 border-l-4 border-amber-500 dark:border-amber-400">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">GST Number</p>
                    <p className="text-base font-mono font-bold text-gray-900 dark:text-white">{viewingVendor.gstNumber || 'Not Provided'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-4 border-l-4 border-amber-500 dark:border-amber-400">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">PAN Number</p>
                    <p className="text-base font-mono font-bold text-gray-900 dark:text-white">{viewingVendor.panNumber || 'Not Provided'}</p>
                  </div>
                </div>
              </div>

              {/* Banking Details */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <Landmark size={16} />
                  Banking Details
                </h4>
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-4 border-l-4 border-indigo-500 dark:border-indigo-400">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">Bank Name</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{viewingVendor.bankName || 'Not Provided'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-800/30">
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">Account Number</p>
                      <p className="text-base font-mono font-bold text-gray-900 dark:text-white">{viewingVendor.accountNumber || 'Not Provided'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-800/30">
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">IFSC Code</p>
                      <p className="text-base font-mono font-bold text-gray-900 dark:text-white">{viewingVendor.ifscCode || 'Not Provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Approval */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700/50 dark:to-slate-700/30 rounded-xl p-5 border border-gray-200/50 dark:border-slate-600/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Approval Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${
                        viewingVendor.approvalStatus === 'APPROVED' ? 'bg-green-500 text-white shadow-green-200 shadow-md' :
                        viewingVendor.approvalStatus === 'REJECTED' ? 'bg-red-500 text-white shadow-red-200 shadow-md' :
                        'bg-yellow-500 text-white shadow-yellow-200 shadow-md'
                      }`}>
                        {viewingVendor.approvalStatus === 'APPROVED' ? '✓ Approved' :
                         viewingVendor.approvalStatus === 'REJECTED' ? '✗ Rejected' :
                         '⏳ Pending Approval'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Active Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${viewingVendor.isActive ? 'bg-green-500 text-white shadow-green-200 shadow-md' : 'bg-gray-500 text-white shadow-gray-200 shadow-md'}`}>
                        {viewingVendor.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-600">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {viewingVendor.createdAt ? new Date(viewingVendor.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    
                    {/* Approval Action Buttons */}
                    <div className="flex gap-2">
                      {viewingVendor.approvalStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(viewingVendor.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {viewingVendor.approvalStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReject(viewingVendor.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          ✗ Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex gap-3">
                <button
                  onClick={() => { 
                    setViewingVendor(null)
                    setEditingVendor(viewingVendor)
                    setShowModal(true) 
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Edit Vendor
                </button>
                <button
                  onClick={() => setViewingVendor(null)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition font-medium"
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
