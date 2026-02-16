import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { contractApi, vendorApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { FormInput, SmartSelect, NumberInput, FormTextarea } from '../../components'

const contractTypes = [
  'AMC', 'INSURANCE', 'PEST_CONTROL', 'HOUSEKEEPING', 'CCTV', 
  'LIFT', 'GENERATOR', 'SECURITY', 'FD', 'OTHER'
]

export default function Contracts() {
  const { user, canManageContracts } = useAuth()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractApi.getAll().then(res => res.data),
    placeholderData: [],
  })

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorApi.getAll().then(res => res.data),
  })



  const createMutation = useMutation({
    mutationFn: (data) => contractApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts'])
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contractApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts'])
      setShowModal(false)
      setEditingContract(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => contractApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['contracts']),
  })

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || c.contractType === filterType
    return matchesSearch && matchesType
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      societyId: user.societyId,
      vendorId: formData.get('vendorId') ? parseInt(formData.get('vendorId')) : null,
      contractType: formData.get('contractType'),
      title: formData.get('title'),
      description: formData.get('description'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      reminderDays: parseInt(formData.get('reminderDays')) || 30,
      isActive: true,
    }

    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div>
      {/* Header */}
      <div className="contracts-header">
        <div>
          <h1 className="contracts-title">Contracts</h1>
          <p className="contracts-subtitle">Manage AMC and service contracts</p>
        </div>
        {canManageContracts() && (
          <button
            onClick={() => { setEditingContract(null); setShowModal(true) }}
            className="contracts-action-button"
          >
            <Plus size={20} />
            Add Contract
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="contracts-filters">
        <div className="contracts-filters-row">
          <div className="contracts-search">
            <Search className="contracts-search-icon" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="contracts-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="contracts-select"
          >
            <option value="">All Types</option>
            {contractTypes.map(type => (
              <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="contracts-table-card">
        {isLoading ? (
          <div className="contracts-loading">
            <div className="contracts-spinner"></div>
          </div>
        ) : (
          <div className="contracts-table-scroll">
            <table className="contracts-table">
              <thead className="contracts-thead">
                <tr>
                  <th className="contracts-th">Contract</th>
                  <th className="contracts-th">Type</th>
                  <th className="contracts-th">Vendor</th>
                  <th className="contracts-th">Period</th>
                  <th className="contracts-th">Status</th>
                  <th className="contracts-th contracts-th--right">Actions</th>
                </tr>
              </thead>
              <tbody className="contracts-tbody">
                {filteredContracts.map((contract) => {
                  const daysLeft = getDaysUntilExpiry(contract.endDate)
                  const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft > 0
                  const isExpired = daysLeft !== null && daysLeft <= 0
                  
                  return (
                    <tr key={contract.id} className="contracts-row">
                      <td className="contracts-cell">
                        <div className="contracts-contract">
                          <div className="contracts-icon">
                            <FileText className="contracts-icon-symbol" />
                          </div>
                          <div>
                            <span className="contracts-contract-title">{contract.title}</span>
                            {isPlatformLevel && <p className="contracts-contract-society">{contract.societyName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="contracts-cell">
                        <span className="contracts-type-pill">
                          {contract.contractType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="contracts-cell contracts-cell-muted">{contract.vendorName || '-'}</td>
                      <td className="contracts-cell contracts-cell-muted">
                        {contract.startDate && new Date(contract.startDate).toLocaleDateString()} - {contract.endDate && new Date(contract.endDate).toLocaleDateString()}
                      </td>
                      <td className="contracts-cell">
                        {isExpired ? (
                          <span className="contracts-status contracts-status--expired">
                            <AlertTriangle size={12} /> Expired
                          </span>
                        ) : isExpiring ? (
                          <span className="contracts-status contracts-status--warning">
                            <AlertTriangle size={12} /> {daysLeft} days left
                          </span>
                        ) : (
                          <span className="contracts-status contracts-status--active">
                            <CheckCircle size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td className="contracts-cell contracts-cell--right">
                        <button
                          onClick={() => { setEditingContract(contract); setShowModal(true) }}
                          className="contracts-icon-button contracts-icon-button--edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await confirmDialog({
                              title: 'Delete Contract',
                              message: 'Are you sure you want to delete this contract? This action cannot be undone.',
                              confirmText: 'Delete',
                              tone: 'danger',
                              details: [
                                { label: 'Contract', value: contract.contractNumber || contract.title || '-' },
                                { label: 'Type', value: contract.contractType?.replace('_', ' ') || '-' },
                                { label: 'Vendor', value: contract.vendorName || '-' },
                                { label: 'Amount', value: contract.amount ? `₹${contract.amount.toLocaleString()}` : '-' },
                              ],
                              caution: 'This action permanently removes contract records.',
                            })
                            if (confirmed) {
                              deleteMutation.mutate(contract.id)
                            }
                          }}
                          className="contracts-icon-button contracts-icon-button--delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="contracts-modal">
          <div className="contracts-modal-card">
            <div className="contracts-modal-header">
              <h3 className="contracts-modal-title">{editingContract ? 'Edit Contract' : 'Add Contract'}</h3>
              <button onClick={() => setShowModal(false)} className="contracts-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="contracts-form">
              <FormInput
                label="Title"
                name="title"
                defaultValue={editingContract?.title}
                required
              />
              <div className="contracts-form-grid">
                <SmartSelect
                  label="Type"
                  name="contractType"
                  defaultValue={editingContract?.contractType}
                  required
                  options={contractTypes.map(type => ({ value: type, label: type.replace('_', ' ') }))}
                  placeholder="Select Type"
                />
                <SmartSelect
                  label="Vendor"
                  name="vendorId"
                  defaultValue={editingContract?.vendorId}
                  required
                  options={vendors.map(v => ({ value: v.id, label: v.name }))}
                  placeholder="None"
                  emptyMessage="No vendors available"
                />
              </div>
              <div className="contracts-form-grid">
                <FormInput
                  label="Start Date"
                  name="startDate"
                  type="date"
                  defaultValue={editingContract?.startDate}
                  required
                />
                <FormInput
                  label="End Date"
                  name="endDate"
                  type="date"
                  defaultValue={editingContract?.endDate}
                  required
                />
              </div>
              <NumberInput
                label="Reminder Days Before Expiry"
                name="reminderDays"
                defaultValue={editingContract?.reminderDays || 30}
                required
              />
              <FormTextarea
                label="Description (Optional)"
                name="description"
                defaultValue={editingContract?.description}
                rows={3}
              />
              <div className="contracts-form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="contracts-btn contracts-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="contracts-btn contracts-btn--primary"
                >
                  {editingContract ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
