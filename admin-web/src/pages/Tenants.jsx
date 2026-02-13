import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfirmDialog } from '../context/ConfirmDialogContext'
import { tenantApi, flatApi } from '../../../api'
import { Plus, Edit, Trash2, Search, X, User, Calendar, Phone, Mail, Upload } from 'lucide-react'
import { FormInput, PhoneInput, SmartSelect, NumberInput } from '../components/FormComponents'
import BulkImportModal from '../components/BulkImportModal'

export default function Tenants() {
  const { user, canManageTenants } = useAuth()
  const confirmDialog = useConfirmDialog()
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
  const canEditTenants = canManageTenants()

  const { data: allTenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll().then(res => res.data),
    placeholderData: [],
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
    <div className="tenants-page">
      {/* Header */}
      <div className="tenants-header">
        <div>
          <h1 className="tenants-title">Tenants</h1>
          <p className="tenants-subtitle">Manage tenant details and agreements</p>
        </div>
        {canEditTenants && (
          <div className="tenants-header-actions">
            <button
              onClick={() => setShowBulkImport(true)}
              className="tenants-bulk-button"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { setEditingTenant(null); setShowModal(true) }}
              className="tenants-add-button"
            >
              <Plus size={20} />
              Add Tenant
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="tenants-filters">
        <div className="tenants-filters-row">
          <div className="tenants-search">
            <Search className="tenants-search-icon" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tenants-search-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="tenants-filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="tenants-table-card">
        {isLoading ? (
          <div className="tenants-loading">
            <div className="tenants-spinner" />
          </div>
        ) : (
          <div className="tenants-table-scroll">
            <table className="tenants-table">
              <thead className="tenants-thead">
                <tr>
                  <th className="tenants-th">Tenant</th>
                  <th className="tenants-th">Flat</th>
                  <th className="tenants-th">Contact</th>
                  <th className="tenants-th">Agreement Period</th>
                  <th className="tenants-th">Rent</th>
                  <th className="tenants-th">Status</th>
                  <th className="tenants-th tenants-th--right">Actions</th>
                </tr>
              </thead>
              <tbody className="tenants-tbody">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="tenants-row">
                    <td className="tenants-cell">
                      <div className="tenants-tenant">
                        <div className="tenants-avatar">
                          <span className="tenants-avatar-text">
                            {tenant.name?.charAt(0)?.toUpperCase() || 'T'}
                          </span>
                        </div>
                        <span className="tenants-tenant-name">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="tenants-cell tenants-cell--muted">
                      {getFlatDisplay(tenant.flatId)}
                    </td>
                    <td className="tenants-cell">
                      <div className="tenants-contact">
                        <div className="tenants-contact-row">
                          <Phone size={14} />
                          {tenant.phone || 'N/A'}
                        </div>
                        <div className="tenants-contact-row tenants-contact-row--muted">
                          <Mail size={14} />
                          {tenant.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="tenants-cell">
                      <div className="tenants-agreement">
                        <div className="tenants-agreement-start">{formatDate(tenant.agreementStartDate)}</div>
                        <div className={isExpiringSoon(tenant.agreementEndDate)
                          ? 'tenants-agreement-end tenants-agreement-end--warning'
                          : 'tenants-agreement-end'
                        }>
                          to {formatDate(tenant.agreementEndDate)}
                          {isExpiringSoon(tenant.agreementEndDate) && ' ⚠️'}
                        </div>
                      </div>
                    </td>
                    <td className="tenants-cell tenants-cell--muted">
                      ₹{tenant.rentAmount?.toLocaleString() || 0}/mo
                    </td>
                    <td className="tenants-cell">
                      <span className={tenant.isActive
                        ? 'tenants-status tenants-status--active'
                        : 'tenants-status tenants-status--inactive'
                      }>
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="tenants-cell tenants-cell--right">
                      {canEditTenants ? (
                        <div className="tenants-actions">
                          <button
                            onClick={() => { setEditingTenant(tenant); setShowModal(true) }}
                            className="tenants-action-button tenants-action-button--edit"
                          >
                            <Edit size={18} />
                          </button>
                          {tenant.isActive && (
                            <button
                              onClick={async () => {
                                const confirmed = await confirmDialog({
                                  title: 'Deactivate Tenant',
                                  message: 'Are you sure you want to deactivate this tenant?',
                                  confirmText: 'Deactivate',
                                  tone: 'warning',
                                  details: [
                                    { label: 'Tenant', value: tenant.name || '-' },
                                    { label: 'Unit', value: tenant.flatNumber || '-' },
                                    { label: 'Rent', value: `₹${tenant.rentAmount?.toLocaleString() || 0}/mo` },
                                    { label: 'Ends', value: formatDate(tenant.agreementEndDate) || '-' },
                                  ],
                                  caution: 'Tenant record will be marked inactive.',
                                })
                                if (confirmed) {
                                  deactivateMutation.mutate(tenant.id)
                                }
                              }}
                              className="tenants-action-button tenants-action-button--deactivate"
                              title="Deactivate"
                            >
                              <User size={18} />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Delete Tenant',
                                message: 'Are you sure you want to delete this tenant? This action cannot be undone.',
                                confirmText: 'Delete',
                                tone: 'danger',
                                details: [
                                  { label: 'Tenant', value: tenant.name || '-' },
                                  { label: 'Unit', value: tenant.flatNumber || '-' },
                                  { label: 'Phone', value: tenant.phone || '-' },
                                  { label: 'Email', value: tenant.email || '-' },
                                ],
                                caution: 'This action permanently removes tenant data.',
                              })
                              if (confirmed) {
                                deleteMutation.mutate(tenant.id)
                              }
                            }}
                            className="tenants-action-button tenants-action-button--delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="tenants-cell--muted">Read only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan="7" className="tenants-empty">
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
      {showModal && canEditTenants && (
        <div className="tenants-modal">
          <div className="tenants-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="tenants-modal-card">
            <div className="tenants-modal-header">
              <h2 className="tenants-modal-title">
                  {editingTenant ? 'Edit Tenant' : 'Add Tenant'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingTenant(null) }}
                className="tenants-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="tenants-modal-body">
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

                <div className="tenants-modal-grid">
                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={editingTenant?.email || ''}
                    placeholder="tenant@example.com"
                    required
                  />
                  <PhoneInput
                    name="phone"
                    defaultValue={editingTenant?.phone || ''}
                    required
                  />
                </div>

                <div className="tenants-modal-grid">
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

                <div className="tenants-modal-grid">
                  <NumberInput
                    label="Monthly Rent (₹)"
                    name="rentAmount"
                    defaultValue={editingTenant?.rentAmount || ''}
                    min={0}
                    placeholder="0"
                    required
                  />
                  <NumberInput
                    label="Deposit (₹)"
                    name="depositAmount"
                    defaultValue={editingTenant?.depositAmount || ''}
                    min={0}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="tenants-modal-grid">
                  <SmartSelect
                    label="ID Proof Type"
                    name="idProofType"
                    defaultValue={editingTenant?.idProofType || ''}
                    required
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
                    required
                  />
                </div>

                <div className="tenants-modal-actions">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingTenant(null) }}
                    className="tenants-cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="tenants-submit-button"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && canEditTenants && (
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
