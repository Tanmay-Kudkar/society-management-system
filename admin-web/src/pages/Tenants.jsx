import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { tenantApi, flatApi } from '../../../api'
import { Plus, Edit, Trash2, Search, X, User, Calendar, Phone, Mail, Upload } from 'lucide-react'
import { FormInput, PhoneInput, SmartSelect, NumberInput } from '../components/FormComponents'
import BulkImportModal from '../components/BulkImportModal'

export default function Tenants() {
  const { user, canManageTenants } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is PLATFORM_OWNER or ORGANIZATION_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: allTenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll().then(res => res.data),
  })

  // Filter tenants by society
  const tenants = useMemo(() => {
    if (!effectiveSocietyId) return allTenants
    return allTenants.filter(t => t.societyId === effectiveSocietyId)
  }, [allTenants, effectiveSocietyId])

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', effectiveSocietyId],
    queryFn: () => flatApi.getBySociety(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => tenantApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants'])
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tenantApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants'])
      setShowModal(false)
      setEditingTenant(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => tenantApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['tenants']),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => tenantApi.deactivate(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['tenants']),
  })

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.phone?.includes(searchTerm) ||
                         t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && t.isActive) ||
                         (filterStatus === 'inactive' && !t.isActive)
    return matchesSearch && matchesStatus
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      flatId: parseInt(formData.get('flatId')),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      agreementStartDate: formData.get('agreementStartDate'),
      agreementEndDate: formData.get('agreementEndDate'),
      rentAmount: parseFloat(formData.get('rentAmount')) || 0,
      depositAmount: parseFloat(formData.get('depositAmount')) || 0,
      idProofType: formData.get('idProofType'),
      idProofNumber: formData.get('idProofNumber'),
    }

    if (editingTenant) {
      updateMutation.mutate({ id: editingTenant.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const getFlatDisplay = (flatId) => {
    const flat = flats.find(f => f.id === flatId)
    if (!flat) return 'N/A'
    // Only show society name for PLATFORM_OWNER
    return isPlatformLevel ? `${flat.flatNumber} - ${flat.societyName || 'N/A'}` : flat.flatNumber
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString()
  }

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false
    const end = new Date(endDate)
    const today = new Date()
    const daysUntil = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    return daysUntil > 0 && daysUntil <= 30
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tenant details and agreements</p>
        </div>
        {canManageTenants() && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { setEditingTenant(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus size={20} />
              Add Tenant
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Flat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Agreement Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {tenant.name?.charAt(0)?.toUpperCase() || 'T'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {getFlatDisplay(tenant.flatId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Phone size={14} />
                          {tenant.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Mail size={14} />
                          {tenant.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-700 dark:text-gray-300">{formatDate(tenant.agreementStartDate)}</div>
                        <div className={`text-gray-500 dark:text-gray-400 ${isExpiringSoon(tenant.agreementEndDate) ? 'text-orange-600 dark:text-orange-400 font-medium' : ''}`}>
                          to {formatDate(tenant.agreementEndDate)}
                          {isExpiringSoon(tenant.agreementEndDate) && ' ⚠️'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      ₹{tenant.rentAmount?.toLocaleString() || 0}/mo
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingTenant(tenant); setShowModal(true) }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition cursor-pointer"
                        >
                          <Edit size={18} />
                        </button>
                        {tenant.isActive && (
                          <button
                            onClick={() => {
                              if (confirm('Deactivate this tenant?')) {
                                deactivateMutation.mutate(tenant.id)
                              }
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition cursor-pointer"
                            title="Deactivate"
                          >
                            <User size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this tenant?')) {
                              deleteMutation.mutate(tenant.id)
                            }
                          }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No tenants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingTenant ? 'Edit Tenant' : 'Add Tenant'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); setEditingTenant(null) }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-gray-500 dark:text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <SmartSelect
                  label="Flat"
                  name="flatId"
                  defaultValue={editingTenant?.flatId || ''}
                  options={flats.map(f => ({
                    value: f.id,
                    label: isPlatformLevel ? `${f.flatNumber} - ${f.societyName || 'N/A'}` : f.flatNumber
                  }))}
                  required
                  placeholder="Select Flat"
                  emptyMessage="No flats available"
                />

                <FormInput
                  label="Tenant Name"
                  name="name"
                  defaultValue={editingTenant?.name || ''}
                  required
                  placeholder="Full name"
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={editingTenant?.email || ''}
                    placeholder="tenant@example.com"
                  />
                  <PhoneInput
                    name="phone"
                    defaultValue={editingTenant?.phone || ''}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Agreement Start"
                    name="agreementStartDate"
                    type="date"
                    defaultValue={editingTenant?.agreementStartDate || ''}
                    required
                  />
                  <FormInput
                    label="Agreement End"
                    name="agreementEndDate"
                    type="date"
                    defaultValue={editingTenant?.agreementEndDate || ''}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumberInput
                    label="Monthly Rent (₹)"
                    name="rentAmount"
                    defaultValue={editingTenant?.rentAmount || ''}
                    min={0}
                    placeholder="0"
                  />
                  <NumberInput
                    label="Deposit (₹)"
                    name="depositAmount"
                    defaultValue={editingTenant?.depositAmount || ''}
                    min={0}
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SmartSelect
                    label="ID Proof Type"
                    name="idProofType"
                    defaultValue={editingTenant?.idProofType || ''}
                    options={[
                      { value: 'AADHAR', label: 'Aadhar Card' },
                      { value: 'PAN', label: 'PAN Card' },
                      { value: 'PASSPORT', label: 'Passport' },
                      { value: 'DRIVING_LICENSE', label: 'Driving License' },
                      { value: 'VOTER_ID', label: 'Voter ID' },
                    ]}
                    placeholder="Select Type"
                  />
                  <FormInput
                    label="ID Proof Number"
                    name="idProofNumber"
                    defaultValue={editingTenant?.idProofNumber || ''}
                    placeholder="ID number"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingTenant(null) }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          title="Bulk Import Tenants"
          entityName="Tenants"
          templateFilename="tenant_import_template.xlsx"
          columns={[
            { letter: 'A', label: 'Unit Number', required: true, description: 'Must match an existing unit (e.g., A-101)' },
            { letter: 'B', label: 'Tenant Name', required: true, description: 'Full name of the tenant' },
            { letter: 'C', label: 'Phone', required: false, description: '10-digit phone number' },
            { letter: 'D', label: 'Email', required: false, description: 'Valid email address' },
            { letter: 'E', label: 'Agreement Start', required: false, description: 'yyyy-MM-dd format' },
            { letter: 'F', label: 'Agreement End', required: false, description: 'yyyy-MM-dd format' },
            { letter: 'G', label: 'Rent Amount', required: false, description: 'Monthly rent amount' },
            { letter: 'H', label: 'Deposit Amount', required: false, description: 'Security deposit' },
            { letter: 'I', label: 'ID Proof Type', required: false, description: 'AADHAAR, PAN, PASSPORT, etc.' },
            { letter: 'J', label: 'ID Proof Number', required: false, description: 'ID proof document number' },
          ]}
          tableColumns={[
            { key: 'name', label: 'Tenant Name' },
            { key: 'flatNumber', label: 'Unit' },
          ]}
          apiValidate={tenantApi.validateBulkImport}
          apiProcess={tenantApi.processBulkImport}
          apiTemplate={tenantApi.downloadImportTemplate}
          societyId={effectiveSocietyId}
          userId={user?.id}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => queryClient.invalidateQueries(['tenants'])}
        />
      )}
    </div>
  )
}
