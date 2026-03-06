import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth, useToast, useConfirmDialog } from '../../context'
import { societyRateConfigApi } from '../../../../api'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Tag } from 'lucide-react'
import { AsyncButton } from '../../components'
import { HeroSkeleton } from '../../components/SkeletonLoaders'
import clsx from 'clsx'

const CHARGE_TYPES = [
  'MAINTENANCE',
  'WATER_CHARGES',
  'PARKING',
  'SINKING_FUND',
  'REPAIR_FUND',
  'LIFT_CHARGES',
  'SECURITY',
  'COMMON_ELECTRICITY',
  'PROPERTY_TAX',
  'GARBAGE',
  'CLUB_HOUSE',
  'OTHER',
]

const APPLICABLE_TO_OPTIONS = ['ALL', 'FLAT', 'SHOP', 'OFFICE']

const EMPTY_FORM = {
  chargeType: 'MAINTENANCE',
  description: '',
  amount: '',
  applicableTo: 'ALL',
  isPerSqft: false,
  displayOrder: 0,
  isActive: true,
}

export default function SocietyRateConfig() {
  const { user, isAdminLevel, canViewFinancials } = useAuth()
  const toast = useToast()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [searchTerm, setSearchTerm] = useState('')

  const isPlatformLevel = isAdminLevel && user?.role !== 'SOCIETY_ADMIN'
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['rateConfigs', effectiveSocietyId],
    queryFn: () => societyRateConfigApi.getBySociety(effectiveSocietyId).then(r => r.data),
    enabled: !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => societyRateConfigApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rateConfigs', effectiveSocietyId])
      closeModal()
      toast.success('Rate configuration created')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => societyRateConfigApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rateConfigs', effectiveSocietyId])
      closeModal()
      toast.success('Rate configuration updated')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => societyRateConfigApi.toggleActive(id),
    onSuccess: () => queryClient.invalidateQueries(['rateConfigs', effectiveSocietyId]),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to toggle'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => societyRateConfigApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rateConfigs', effectiveSocietyId])
      toast.success('Rate configuration deleted')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete'),
  })

  const filtered = useMemo(() =>
    configs.filter(c =>
      c.chargeType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [configs, searchTerm])

  const totalMonthlyEstimate = useMemo(() =>
    configs.filter(c => c.isActive && !c.isPerSqft)
      .reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [configs])

  function openCreate() {
    setEditingConfig(null)
    setForm({ ...EMPTY_FORM, societyId: effectiveSocietyId })
    setShowModal(true)
  }

  function openEdit(config) {
    setEditingConfig(config)
    setForm({
      chargeType: config.chargeType,
      description: config.description,
      amount: String(config.amount),
      applicableTo: config.applicableTo,
      isPerSqft: config.isPerSqft,
      displayOrder: config.displayOrder,
      isActive: config.isActive,
      societyId: effectiveSocietyId,
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingConfig(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      societyId: effectiveSocietyId,
      chargeType: form.chargeType,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      applicableTo: form.applicableTo,
      isPerSqft: form.isPerSqft,
      displayOrder: parseInt(form.displayOrder) || 0,
      isActive: form.isActive,
    }
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleDelete(config) {
    confirmDialog.confirm({
      title: 'Delete Rate Config',
      message: `Delete "${config.description}" (${config.chargeType})?`,
      onConfirm: () => deleteMutation.mutate(config.id),
    })
  }

  const canManage = canViewFinancials?.()

  if (!effectiveSocietyId) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <Tag size={48} />
          <p>No society selected. Please select a society to manage rate configurations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rate Configuration</h1>
          <p className="page-subtitle">
            Define default charge rates for automatic bill generation
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Rate
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__label">Total Rates</div>
          <div className="stat-card__value">{configs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Active Rates</div>
          <div className="stat-card__value">{configs.filter(c => c.isActive).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Est. Monthly (flat rates)</div>
          <div className="stat-card__value">₹{totalMonthlyEstimate.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search charge type or description..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <HeroSkeleton />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Tag size={48} />
          <p>{configs.length === 0
            ? 'No rate configurations yet. Add your first rate to enable auto bill generation.'
            : 'No results match your search.'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Charge Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Applicable To</th>
                <th>Per Sqft</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(config => (
                <tr key={config.id} className={clsx(!config.isActive && 'row--inactive')}>
                  <td className="text-center">{config.displayOrder}</td>
                  <td>
                    <span className="badge badge--outline">{config.chargeType}</span>
                  </td>
                  <td>{config.description}</td>
                  <td className="text-right font-mono">
                    ₹{Number(config.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {config.isPerSqft && <span className="text-muted"> /sqft</span>}
                  </td>
                  <td>{config.applicableTo}</td>
                  <td className="text-center">
                    {config.isPerSqft ? '✓' : '—'}
                  </td>
                  <td>
                    {canManage ? (
                      <button
                        className={clsx('btn btn-icon', config.isActive ? 'btn-success' : 'btn-muted')}
                        onClick={() => toggleMutation.mutate(config.id)}
                        title={config.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                      >
                        {config.isActive
                          ? <ToggleRight size={20} />
                          : <ToggleLeft size={20} />}
                      </button>
                    ) : (
                      <span className={clsx('badge', config.isActive ? 'badge--success' : 'badge--muted')}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="actions-cell">
                      <button className="btn btn-icon btn-ghost" onClick={() => openEdit(config)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn btn-icon btn-danger-ghost" onClick={() => handleDelete(config)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal--medium">
            <div className="modal__header">
              <h2>{editingConfig ? 'Edit Rate Configuration' : 'New Rate Configuration'}</h2>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-row">
                <div className="form-group">
                  <label>Charge Type *</label>
                  <select
                    value={form.chargeType}
                    onChange={e => setForm(f => ({ ...f, chargeType: e.target.value }))}
                    required
                    className="form-control"
                  >
                    {CHARGE_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Applicable To *</label>
                  <select
                    value={form.applicableTo}
                    onChange={e => setForm(f => ({ ...f, applicableTo: e.target.value }))}
                    className="form-control"
                  >
                    {APPLICABLE_TO_OPTIONS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Monthly maintenance charge"
                  required
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row form-row--checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isPerSqft}
                    onChange={e => setForm(f => ({ ...f, isPerSqft: e.target.checked }))}
                  />
                  <span>Per Sq.Ft. (amount × flat area)</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span>Active</span>
                </label>
              </div>

              {form.isPerSqft && (
                <p className="form-hint">
                  Bill amount = <strong>₹{form.amount || '0'}</strong> × flat area in sq.ft.
                </p>
              )}

              <div className="modal__footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <AsyncButton
                  type="submit"
                  className="btn btn-primary"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingConfig ? 'Save Changes' : 'Create Rate'}
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
