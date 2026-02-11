import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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

export default function Wings() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const urlSocietyId = searchParams.get('society')
  
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingWing, setEditingWing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSociety, setFilterSociety] = useState(urlSocietyId || '')
  const [formErrors, setFormErrors] = useState({})

  // Check if user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine the effective society ID
  const effectiveSocietyId = isPlatformLevel ? filterSociety : user?.societyId

  // Fetch societies (for PLATFORM_OWNER dropdown)
  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel,
  })

  // Fetch current society details for capacity limits
  const { data: currentSociety } = useQuery({
    queryKey: ['society', effectiveSocietyId],
    queryFn: () => societyApi.getById(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId,
  })

  // Fetch wings
  const { data: wings = [], isLoading } = useQuery({
    queryKey: ['wings', effectiveSocietyId],
    queryFn: () => {
      if (effectiveSocietyId) {
        return wingApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return wingApi.getAll().then(res => res.data)
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => wingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      setShowModal(false)
    },
    onError: (error) => {
      console.error('Create wing error:', error.response?.data || error.message)
      alert('Failed to create wing: ' + (error.response?.data?.message || error.message))
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => wingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
      setShowModal(false)
      setEditingWing(null)
    },
    onError: (error) => {
      console.error('Update wing error:', error.response?.data || error.message)
      alert('Failed to update wing: ' + (error.response?.data?.message || error.message))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => wingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wings'])
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
    if (!editingWing && currentSociety) {
      const currentWingCount = wings.filter(w => w.societyId === effectiveSocietyId).length
      const maxWings = currentSociety.totalWings || 0
      if (currentWingCount >= maxWings) {
        errors.capacity = `Cannot create more wings. Society capacity: ${currentWingCount}/${maxWings} wings`
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    setFormErrors({})
    
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    console.log('Society ID:', societyId, 'User:', user, 'isPlatformLevel:', isPlatformLevel)

    if (!societyId) {
      alert('Society ID is required.')
      return
    }

    const data = {
      societyId: parseInt(societyId),
      name: name,
      totalFloors: totalFloors,
    }

    console.log('Sending wing data:', data)

    if (editingWing) {
      updateMutation.mutate({ id: editingWing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="wings-page">
      {/* Header */}
      <div className="wings-header">
        <div>
          <h1 className="wings-title">Wings</h1>
          <p className="wings-subtitle">Manage society wings and towers</p>
          {currentSociety && effectiveSocietyId && (
            <p className="wings-capacity">
              Capacity: {wings.filter(w => w.societyId === effectiveSocietyId).length}/{currentSociety.totalWings || 0} wings
            </p>
          )}
        </div>
        <div className="wings-actions">
          <button
            onClick={() => setShowBulkImport(true)}
            className="wings-action-btn wings-action-btn--outline"
          >
            <Upload size={20} />
            Bulk Import
          </button>
          <button
            onClick={() => { setEditingWing(null); setFormErrors({}); setShowModal(true) }}
            className="wings-action-btn wings-action-btn--primary"
          >
            <Plus size={20} />
            Add Wing
          </button>
        </div>
      </div>

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
            <p className="wings-capacity">Add your first wing to get started</p>
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
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this wing?')) {
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
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
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
      {showBulkImport && (
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
          apiValidate={wingApi.validateBulkImport}
          apiProcess={wingApi.processBulkImport}
          apiTemplate={wingApi.downloadImportTemplate}
          societyId={effectiveSocietyId}
          userId={user?.id}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => queryClient.invalidateQueries(['wings'])}
        />
      )}
    </div>
  )
}
