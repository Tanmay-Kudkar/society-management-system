import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfirmDialog } from '../context/ConfirmDialogContext'
import { wingApi, societyApi } from '../../../api'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Layers,
  Building2,
  Hash,
  Upload
} from 'lucide-react'
import { FormInput, SmartSelect, NumberInput, FormErrorSummary } from '../components/FormComponents'
import BulkImportModal from '../components/BulkImportModal'
import '../styles/pages/wings.css'

export default function Wings() {
  const { user, canManageWings } = useAuth()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const urlSocietyId = searchParams.get('society')
  
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingWing, setEditingWing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSociety, setFilterSociety] = useState(urlSocietyId || '')
  const [formErrors, setFormErrors] = useState({})
  const [pageError, setPageError] = useState('')

  // Check if user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine the effective society ID
  const effectiveSocietyId = isPlatformLevel ? filterSociety : user?.societyId
  const effectiveSocietyIdNum = effectiveSocietyId ? Number(effectiveSocietyId) : null
  const canEditWings = canManageWings()

  // Fetch societies (for PLATFORM_OWNER dropdown)
  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel,
  })

  // Fetch current society details for capacity limits
  const { data: currentSociety } = useQuery({
    queryKey: ['society', effectiveSocietyIdNum],
    queryFn: () => societyApi.getById(effectiveSocietyIdNum).then(res => res.data),
    enabled: !!effectiveSocietyIdNum,
  })

  // Fetch wings
  const { data: wings = [], isLoading } = useQuery({
    queryKey: ['wings', effectiveSocietyIdNum],
    queryFn: () => {
      if (effectiveSocietyIdNum) {
        return wingApi.getBySociety(effectiveSocietyIdNum).then(res => res.data)
      }
      return wingApi.getAll().then(res => res.data)
    },
    placeholderData: [],
  })

  const currentWingCount = effectiveSocietyIdNum
    ? wings.filter((wingItem) => Number(wingItem.societyId) === effectiveSocietyIdNum).length
    : 0
  const maxWings = currentSociety?.totalWings || 0
  const hasWingLimit = maxWings > 0
  const wingsCapacityReached = hasWingLimit && currentWingCount >= maxWings
  const remainingWingSlots = hasWingLimit ? Math.max(maxWings - currentWingCount, 0) : null

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => wingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      queryClient.invalidateQueries(['society', effectiveSocietyIdNum])
      setShowModal(false)
      setPageError('')
    },
    onError: (error) => {
      setPageError(error.response?.data?.message || 'Failed to create wing')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => wingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      setShowModal(false)
      setEditingWing(null)
      setPageError('')
    },
    onError: (error) => {
      setPageError(error.response?.data?.message || 'Failed to update wing')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => wingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      queryClient.invalidateQueries(['society', effectiveSocietyIdNum])
      setPageError('')
    },
    onError: (error) => {
      setPageError(error.response?.data?.message || 'Failed to delete wing')
    },
  })

  // Filter wings
  const filteredWings = wings.filter(wing => {
    const matchesSearch = wing.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSociety = !filterSociety || wing.societyId?.toString() === filterSociety
    return matchesSearch && matchesSociety
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const name = formData.get('name')?.trim()
    const totalFloors = parseInt(formData.get('totalFloors')) || 0
    
    // Validation
    const errors = {}
    
    // Wing name must contain at least one letter
    if (!name || !/[A-Za-z]/.test(name)) {
      errors.name = 'Wing name must contain at least one letter (e.g., "A Wing", "Tower 1")'
    }
    
    // Total floors must be at least 1
    if (totalFloors < 1) {
      errors.totalFloors = 'Total floors must be at least 1'
    }
    
    // Check wings capacity limit (only for new wings)
    if (!editingWing && hasWingLimit && wingsCapacityReached) {
        errors.capacity = `Cannot create more wings. Society capacity: ${currentWingCount}/${maxWings} wings`
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    setFormErrors({})
    
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    if (!societyId) {
      setFormErrors(prev => ({
        ...prev,
        capacity: 'Please select a society before creating a wing.',
      }))
      return
    }

    const data = {
      societyId: parseInt(societyId),
      name: name,
      totalFloors: totalFloors,
    }

    if (editingWing) {
      updateMutation.mutate({ id: editingWing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleBulkImportOpen = () => {
    setPageError('')
    if (!canEditWings) {
      setPageError('You have read-only access for wings.')
      return
    }
    if (!effectiveSocietyIdNum) {
      setPageError('Please select a society before using Bulk Import.')
      return
    }
    if (wingsCapacityReached) {
      setPageError(`Wing capacity reached (${currentWingCount}/${maxWings}). Delete a wing or increase society wing capacity before importing.`)
      return
    }
    setShowBulkImport(true)
  }

  const validateWingImportWithCapacity = async (file, societyId) => {
    if (!societyId) {
      throw { response: { data: { message: 'Society ID is required for bulk import.' } } }
    }
    const response = await wingApi.validateBulkImport(file, societyId)
    const validRows = response?.data?.successCount || 0
    if (hasWingLimit && validRows > remainingWingSlots) {
      throw {
        response: {
          data: {
            message: `Import exceeds capacity. Available slots: ${remainingWingSlots}, valid rows in file: ${validRows}.`,
          },
        },
      }
    }
    return response
  }

  const processWingImportWithCapacity = async (file, societyId) => {
    if (!societyId) {
      throw { response: { data: { message: 'Society ID is required for bulk import.' } } }
    }
    if (hasWingLimit && remainingWingSlots === 0) {
      throw {
        response: {
          data: {
            message: `Wing capacity reached (${currentWingCount}/${maxWings}). Cannot import more wings.`,
          },
        },
      }
    }
    return wingApi.processBulkImport(file, societyId)
  }

  return (
    <div className="wings-page">
      {/* Header */}
      <div className="wings-header">
        <div>
          <h1 className="wings-title">Wings</h1>
          <p className="wings-subtitle">Manage society wings and towers</p>
          {currentSociety && effectiveSocietyIdNum && (
            <p className="wings-capacity">
              Capacity: {currentWingCount}/{maxWings || '∞'} wings
            </p>
          )}
        </div>
        {canEditWings && (
          <div className="wings-actions">
            <button
              onClick={handleBulkImportOpen}
              className="wings-action-btn wings-action-btn--outline"
              disabled={!effectiveSocietyIdNum || wingsCapacityReached}
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { setEditingWing(null); setFormErrors({}); setShowModal(true) }}
              className="wings-action-btn wings-action-btn--primary"
              disabled={wingsCapacityReached}
            >
              <Plus size={20} />
              Add Wing
            </button>
          </div>
        )}
      </div>

      {pageError && (
        <div className="wings-alert wings-alert--error" role="alert">
          <div className="wings-alert__icon">!</div>
          <div className="wings-alert__content">
            <p className="wings-alert__title">Action blocked</p>
            <p className="wings-alert__text">{pageError}</p>
          </div>
          <button
            type="button"
            onClick={() => setPageError('')}
            className="wings-alert__close"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="wings-filters">
        <div className="wings-filters__row">
          <div className="wings-search">
            <Search className="wings-search__icon" size={20} />
            <input
              type="text"
              placeholder="Search wings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="wings-search__input"
            />
          </div>
          {isPlatformLevel && (
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              className="wings-filter-select"
            >
              <option value="">All Societies</option>
              {societies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid View */}
      <div className="wings-grid">
        {isLoading ? (
          <div className="wings-loading">
            <div className="wings-loading__spinner"></div>
          </div>
        ) : filteredWings.length === 0 ? (
          <div className="wings-empty">
            <Layers className="wings-empty__icon" size={48} />
            <p>No wings found</p>
            <p className="wings-capacity">{canEditWings ? 'Add your first wing to get started' : 'You have read-only access'}</p>
          </div>
        ) : (
          filteredWings.map((wing) => (
            <div 
              key={wing.id} 
              className="wings-card"
            >
              {/* Wing Header with 3D Effect */}
              <div className="wings-card__hero">
                <div className="wings-card__pattern"></div>
                <div className="wings-card__top">
                  <div className="wings-card__icon">
                    <Layers size={28} />
                  </div>
                  <div>
                    <h3 className="wings-card__name">{wing.name}</h3>
                    {isPlatformLevel && (
                      <p className="wings-card__society">{wing.societyName}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Wing Body with Stats */}
              <div className="wings-card__body">
                {wing.description && (
                  <p className="wings-card__desc">{wing.description}</p>
                )}
                
                <div className="wings-card__stats">
                  <div className="wings-stat wings-stat--floors">
                    <div className="wings-stat__label">
                      <Building2 size={16} />
                      <span>Floors</span>
                    </div>
                    <p className="wings-stat__value">{wing.totalFloors || 0}</p>
                  </div>
                  <div className="wings-stat wings-stat--id">
                    <div className="wings-stat__label wings-stat__label--purple">
                      <Hash size={16} />
                      <span>Wing ID</span>
                    </div>
                    <p className="wings-stat__value">{wing.id}</p>
                  </div>
                </div>
              </div>

              {/* Actions with Better Hover */}
              {canEditWings && (
                <div className="wings-card__footer">
                  <button
                    onClick={() => { setEditingWing(wing); setFormErrors({}); setShowModal(true) }}
                    className="wings-card__btn wings-card__btn--edit"
                    title="Edit Wing"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={async () => {
                      const confirmed = await confirmDialog({
                        title: 'Delete Wing',
                        message: 'Are you sure you want to delete this wing? This action cannot be undone.',
                        confirmText: 'Delete',
                        tone: 'danger',
                        details: [
                          { label: 'Wing', value: wing.name || '-' },
                          { label: 'Floors', value: wing.totalFloors || 0 },
                          { label: 'Description', value: wing.description || '-' },
                        ],
                        caution: 'This action permanently removes the wing.',
                      })
                      if (confirmed) {
                        deleteMutation.mutate(wing.id)
                      }
                    }}
                    className="wings-card__btn wings-card__btn--delete"
                    title="Delete Wing"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && canEditWings && (
        <div className="wings-modal">
          <div className="wings-modal__panel">
            <div className="wings-modal__header">
              <h3 className="wings-modal__title">{editingWing ? 'Edit Wing' : 'Add Wing'}</h3>
              <button onClick={() => setShowModal(false)} className="wings-modal__close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="wings-modal__form">
              <FormErrorSummary message={formErrors.capacity} />
              
              {/* Society field - only show dropdown for PLATFORM_OWNER */}
              {isPlatformLevel ? (
                <SmartSelect
                  label="Society"
                  name="societyId"
                  defaultValue={editingWing?.societyId}
                  options={societies.map(s => ({ value: s.id, label: s.name }))}
                  required
                  icon={Building2}
                  placeholder="Select Society"
                  emptyMessage="No societies available"
                />
              ) : (
                <input type="hidden" name="societyId" value={user?.societyId || ''} />
              )}

              <FormInput
                label="Wing Name"
                name="name"
                defaultValue={editingWing?.name}
                required
                placeholder="e.g., A Wing, Tower 1, Building A"
                maxLength={50}
                error={formErrors.name}
                onChange={() => setFormErrors(prev => ({ ...prev, name: null }))}
              />

              <NumberInput
                label="Total Floors"
                name="totalFloors"
                defaultValue={editingWing?.totalFloors || 1}
                min={1}
                max={200}
                required
                error={formErrors.totalFloors}
                onChange={() => setFormErrors(prev => ({ ...prev, totalFloors: null }))}
              />

              <div className="wings-modal__actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="wings-modal__btn wings-modal__btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="wings-modal__btn wings-modal__btn--primary"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && canEditWings && (
        <BulkImportModal
          title="Bulk Import Wings"
          entityName="Wings"
          templateFilename="wing_import_template.xlsx"
          columns={[
            { letter: 'A', label: 'Wing Name', required: true, description: 'Name of the wing/tower' },
            { letter: 'B', label: 'Description', required: false, description: 'Optional description' },
            { letter: 'C', label: 'Total Floors', required: false, description: 'Number of floors (1-200)' },
          ]}
          tableColumns={[
            { key: 'name', label: 'Wing Name' },
          ]}
          apiValidate={validateWingImportWithCapacity}
          apiProcess={processWingImportWithCapacity}
          apiTemplate={wingApi.downloadImportTemplate}
          societyId={effectiveSocietyIdNum}
          userId={user?.id}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['wings'])
            queryClient.invalidateQueries(['society', effectiveSocietyIdNum])
          }}
        />
      )}
    </div>
  )
}
