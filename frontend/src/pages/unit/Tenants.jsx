import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { tenantApi, flatApi, userApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, User, Calendar, Phone, Mail, Upload } from 'lucide-react'
import { FormInput, PhoneInput, SmartSelect, NumberInput, BulkImportModal, AsyncButton, InfoTooltip } from '../../components'
import { HeroSkeleton, FiltersSkeleton, TableSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

export default function Tenants() {
  const { user, canManageTenants } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = user?.role === 'MASTER_ADMIN' && Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
    ? parsedSocietyIdFromUrl
    : null

  // Check if current user is MASTER_ADMIN or SOCIETY_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN' && !scopedSocietyId

  // Determine effective society ID for filtering
  const effectiveSocietyId = scopedSocietyId || user?.societyId
  const canEditTenants = canManageTenants()

  const { data: tenants = [], isLoading, isError } = useQuery({
    queryKey: ['tenants', effectiveSocietyId, isPlatformLevel],
    queryFn: () => {
      if (effectiveSocietyId) {
        return tenantApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return tenantApi.getAll().then(res => res.data)
    },
  })

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
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete tenant')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => tenantApi.deactivate(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['tenants']),
  })

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.phone?.includes(searchTerm) ||
                           t.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || 
                           (filterStatus === 'active' && t.isActive) ||
                           (filterStatus === 'inactive' && !t.isActive)
      return matchesSearch && matchesStatus
    })
  }, [tenants, searchTerm, filterStatus])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      flatId: parseInt(formData.get('flatId')),
      userId: formData.get('userId') ? parseInt(formData.get('userId')) : null,
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
    // Only show society name for MASTER_ADMIN
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

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FiltersSkeleton />
      <TableSkeleton rows={8} cols={5} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tenants</h1>
            <InfoTooltip text="Manage tenant details and agreements" />
          </div>
        </div>
        {canEditTenants && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-2 py-[0.55rem] px-4 rounded-xl font-semibold border border-[rgba(15,23,42,0.12)] text-[#f8fafc] bg-[#0f172a] transition-transform hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.16)] dark:border-[rgba(148,163,184,0.26)] dark:bg-[#020617]"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { setEditingTenant(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 py-[0.55rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-transform hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] hover:opacity-90 dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
            >
              <Plus size={20} />
              Add Tenant
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-[0.55rem] pr-3 pl-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] overflow-hidden">
        {(
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[860px]">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Tenant</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Flat</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Contact</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Agreement Period</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Rent</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Status</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="transition-colors hover:bg-[var(--bg-tertiary)]">
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(147,51,234,0.15)]">
                          <span className="text-[#7c3aed] font-semibold">
                            {tenant.name?.charAt(0)?.toUpperCase() || 'T'}
                          </span>
                        </div>
                        <span className="font-semibold">{tenant.name}</span>
                      </div>
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">
                      {getFlatDisplay(tenant.flatId)}
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                      <div className="flex flex-col gap-1 text-[0.85rem]">
                        <div className="inline-flex items-center gap-[0.35rem] text-[var(--text-secondary)]">
                          <Phone size={14} />
                          {tenant.phone || 'N/A'}
                        </div>
                        <div className="inline-flex items-center gap-[0.35rem] text-[var(--text-tertiary)]">
                          <Mail size={14} />
                          {tenant.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                      <div className="flex flex-col gap-[0.2rem] text-[0.85rem]">
                        <div className="text-[var(--text-secondary)]">{formatDate(tenant.agreementStartDate)}</div>
                        <div className={isExpiringSoon(tenant.agreementEndDate)
                          ? 'text-[#ea580c] font-semibold'
                          : 'text-[var(--text-tertiary)]'
                        }>
                          to {formatDate(tenant.agreementEndDate)}
                          {isExpiringSoon(tenant.agreementEndDate) && ' ⚠️'}
                        </div>
                      </div>
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">
                      ₹{tenant.rentAmount?.toLocaleString() || 0}/mo
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                      <span className={tenant.isActive
                        ? 'inline-flex py-1 px-[0.65rem] rounded-full text-xs font-semibold bg-[#dcfce7] text-[#166534]'
                        : 'inline-flex py-1 px-[0.65rem] rounded-full text-xs font-semibold bg-[rgba(255,255,255,0.1)] text-[var(--text-secondary)]'
                      }>
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)] text-right">
                      {canEditTenants ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => { setEditingTenant(tenant); setShowModal(true) }}
                            className="p-[0.45rem] rounded-[0.65rem] text-[var(--text-tertiary)] transition-colors hover:text-[#2563eb] hover:bg-[rgba(37,99,235,0.12)]"
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
                              className="p-[0.45rem] rounded-[0.65rem] text-[var(--text-tertiary)] transition-colors hover:text-[#ea580c] hover:bg-[rgba(249,115,22,0.12)]"
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
                            className="p-[0.45rem] rounded-[0.65rem] text-[var(--text-tertiary)] transition-colors hover:text-[#dc2626] hover:bg-[rgba(239,68,68,0.12)]"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">Read only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[var(--text-tertiary)]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative z-[1] w-full max-w-[32rem] max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">
                  {editingTenant ? 'Edit Tenant' : 'Add Tenant'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingTenant(null) }}
                className="p-[0.45rem] rounded-[0.65rem] text-[var(--text-tertiary)] hover:bg-[rgba(148,163,184,0.2)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingTenant(null) }}
                    className="py-[0.55rem] px-4 rounded-xl font-semibold bg-[rgba(255,255,255,0.1)] text-[#334155]"
                  >
                    Cancel
                  </button>
                  <AsyncButton
                    type="submit"
                    className="py-[0.55rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:opacity-90 hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] disabled:opacity-60 disabled:cursor-not-allowed dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    loadingText="Saving..."
                  >
                    Save
                  </AsyncButton>
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
