import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfirmDialog } from '../context/ConfirmDialogContext'
import { flatApi, societyApi, wingApi } from '../../../api'
import { Plus, Edit, Trash2, Search, X, Home, Store, Briefcase, Layers, AlertCircle } from 'lucide-react'
import { FormInput, PhoneInput, SmartSelect, NumberInput, FormErrorSummary } from '../components/FormComponents'
import PermissionDenied from '../components/PermissionDenied'

export default function Flats() {
  const { user, canManageFlats } = useAuth()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  
  // Permission check
  if (!canManageFlats()) {
    return <PermissionDenied message="You don't have permission to manage flats/units" />
  }
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [editingFlat, setEditingFlat] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSociety, setFilterSociety] = useState('')
  const [selectedUnitType, setSelectedUnitType] = useState('FLAT')
  const [selectedWingId, setSelectedWingId] = useState('')
  const [selectedFlatType, setSelectedFlatType] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Initialize form when editing
  useEffect(() => {
    if (editingFlat) {
      setSelectedUnitType(editingFlat.unitType || 'FLAT')
      setSelectedWingId(editingFlat.wingId ? String(editingFlat.wingId) : '')
      setSelectedFlatType(editingFlat.flatType || '')
    } else {
      setSelectedUnitType('FLAT')
      setSelectedWingId('')
      setSelectedFlatType('')
    }
  }, [editingFlat])

  // Update flatType default when unitType changes
  useEffect(() => {
    if (!editingFlat) {
      if (selectedUnitType === 'FLAT') {
        setSelectedFlatType('2BHK')
      } else if (selectedUnitType === 'SHOP') {
        setSelectedFlatType('RETAIL')
      } else if (selectedUnitType === 'OFFICE') {
        setSelectedFlatType('STANDARD')
      }
    }
  }, [selectedUnitType, editingFlat])

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is PLATFORM_OWNER or ORGANIZATION_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: flats = [], isLoading } = useQuery({
    queryKey: ['flats', effectiveSocietyId],
    queryFn: () => flatApi.getBySociety(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId,
    placeholderData: [],
  })

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel, // Only fetch if PLATFORM_OWNER
  })

  // Fetch wings for the effective society
  const { data: wings = [] } = useQuery({
    queryKey: ['wings', effectiveSocietyId],
    queryFn: () => effectiveSocietyId 
      ? wingApi.getBySociety(effectiveSocietyId).then(res => res.data)
      : [],
    enabled: !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => flatApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flats'])
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => flatApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['flats'])
      setShowModal(false)
      setEditingFlat(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => flatApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['flats']),
  })

  const filteredFlats = flats.filter(f => {
    const matchesSearch = f.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSociety = !filterSociety || f.societyId === parseInt(filterSociety)
    return matchesSearch && matchesSociety
  })

  // Get icon based on unit type
  const getUnitIcon = (unitType) => {
    switch (unitType) {
      case 'SHOP': return Store
      case 'OFFICE': return Briefcase
      default: return Home
    }
  }

  const getUnitToneClass = (unitType) => {
    switch (unitType) {
      case 'SHOP': return 'flats-unit-icon flats-unit-icon--shop'
      case 'OFFICE': return 'flats-unit-icon flats-unit-icon--office'
      default: return 'flats-unit-icon flats-unit-icon--flat'
    }
  }

  const validateForm = (formData) => {
    const errors = {}
    const unitNumber = formData.get('flatNumber')
    const floor = formData.get('floor')
    const area = formData.get('area')
    const ownerEmail = formData.get('ownerEmail')
    const ownerPhone = formData.get('ownerPhone')
    const unitType = formData.get('unitType')
    const wingIdValue = formData.get('wingId')

    // Unit Number validation - alphanumeric with optional dash/slash
    const unitNumberRegex = /^[A-Za-z0-9][A-Za-z0-9\-\/]*$/
    if (!unitNumber || !unitNumber.trim()) {
      errors.flatNumber = 'Unit number is required'
    } else if (!unitNumberRegex.test(unitNumber)) {
      errors.flatNumber = 'Invalid format. Use letters, numbers, dash or slash only'
    } else if (unitNumber.length > 20) {
      errors.flatNumber = 'Unit number must be max 20 characters'
    }

    // Floor validation - must be non-negative and within wing limits
    const floorNum = parseInt(floor)
    if (floor === '' || isNaN(floorNum)) {
      errors.floor = 'Floor number is required'
    } else if (floorNum < 0) {
      errors.floor = 'Floor must be 0 or greater'
    } else if (wingIdValue) {
      const selectedWing = wings.find(w => w.id === parseInt(wingIdValue))
      if (selectedWing && selectedWing.totalFloors && floorNum > selectedWing.totalFloors) {
        errors.floor = `Floor cannot exceed ${selectedWing.totalFloors} (wing's max floor)`
      }
    }

    // Area validation - must be positive
    const areaNum = parseFloat(area)
    if (area && !isNaN(areaNum)) {
      if (areaNum <= 0) {
        errors.area = 'Area must be greater than 0'
      } else if (areaNum > 100000) {
        errors.area = 'Area seems unrealistic (max 100,000 sq.ft)'
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (ownerEmail && !emailRegex.test(ownerEmail)) {
      errors.ownerEmail = 'Invalid email format'
    }

    // Phone validation - Indian format (10 digits, optionally with +91)
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/
    if (ownerPhone && !phoneRegex.test(ownerPhone.replace(/[-\s]/g, ''))) {
      errors.ownerPhone = 'Invalid phone number. Use 10-digit Indian mobile number'
    }

    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Validate form
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    
    // For non-PLATFORM_OWNER, use user's societyId directly
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    if (!societyId) {
      alert('Society ID is required. Please log out and log back in.')
      return
    }

    const wingIdValue = formData.get('wingId')
    
    const data = {
      societyId,
      wingId: wingIdValue ? parseInt(wingIdValue) : null,
      flatNumber: formData.get('flatNumber'),
      unitType: formData.get('unitType') || 'FLAT',
      flatType: formData.get('flatType'),
      floor: parseInt(formData.get('floor')) || 0,
      area: parseFloat(formData.get('area')) || 0,
      ownerName: formData.get('ownerName'),
      ownerEmail: formData.get('ownerEmail'),
      ownerPhone: formData.get('ownerPhone'),
    }

    if (editingFlat) {
      updateMutation.mutate({ id: editingFlat.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleOpenModal = (flat = null) => {
    setEditingFlat(flat)
    setFormErrors({})
    if (!flat) {
      // Reset to defaults for new unit
      setSelectedUnitType('FLAT')
      setSelectedWingId('')
      setSelectedFlatType('2BHK')
    }
    setShowModal(true)
  }

  return (
    <div className="flats-page">
      {/* Header */}
      <div className="flats-header">
        <div>
          <h1 className="flats-title">Units</h1>
          <p className="flats-subtitle">Manage society flats, shops, and offices</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="flats-add-button"
        >
          <Plus size={20} />
          Add Unit
        </button>
      </div>

      {/* Filters */}
      <div className="flats-filters">
        <div className="flats-filters-row">
          <div className="flats-search">
            <Search className="flats-search-icon" />
            <input
              type="text"
              placeholder="Search flats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flats-search-input"
            />
          </div>
          {/* Only show society filter for PLATFORM_OWNER */}
          {isPlatformLevel && (
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              className="flats-filter-select"
            >
              <option value="">All Societies</option>
              {societies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flats-table-card">
        {isLoading ? (
          <div className="flats-loading">
            <div className="flats-spinner" />
          </div>
        ) : (
          <div className="flats-table-scroll">
            <table className="flats-table">
              <thead className="flats-thead">
                <tr>
                  <th className="flats-th">Unit</th>
                  <th className="flats-th">Wing</th>
                  {isPlatformLevel && <th className="flats-th">Society</th>}
                  <th className="flats-th">Owner</th>
                  <th className="flats-th">Type</th>
                  <th className="flats-th">Area</th>
                  <th className="flats-th flats-th--right">Actions</th>
                </tr>
              </thead>
              <tbody className="flats-tbody">
                {filteredFlats.map((flat) => {
                  const UnitIcon = getUnitIcon(flat.unitType)
                  return (
                  <tr key={flat.id} className="flats-row">
                    <td className="flats-cell">
                      <div className="flats-unit">
                        <div className={getUnitToneClass(flat.unitType)}>
                          <UnitIcon className="flats-unit-icon-svg" />
                        </div>
                        <div className="flats-unit-meta">
                          <span className="flats-unit-number">{flat.flatNumber}</span>
                          <p className="flats-unit-floor">Floor {flat.floor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="flats-cell">
                      {flat.wingName ? (
                        <span className="flats-wing-badge">
                          <Layers className="flats-wing-icon" />
                          {flat.wingName}
                        </span>
                      ) : (
                        <span className="flats-empty">-</span>
                      )}
                    </td>
                    {isPlatformLevel && <td className="flats-cell flats-cell--muted">{flat.societyName}</td>}
                    <td className="flats-cell">
                      <div>
                        <span className="flats-owner-name">{flat.ownerName || '-'}</span>
                        <p className="flats-owner-phone">{flat.ownerPhone || ''}</p>
                      </div>
                    </td>
                    <td className="flats-cell">
                      <div>
                        <span className="flats-type">{flat.flatType || '-'}</span>
                        <p className="flats-type-label">{flat.unitType || 'FLAT'}</p>
                      </div>
                    </td>
                    <td className="flats-cell flats-cell--muted">{flat.area ? `${flat.area} sq.ft` : '-'}</td>
                    <td className="flats-cell flats-cell--right">
                      <button
                        onClick={() => handleOpenModal(flat)}
                        className="flats-action-button flats-action-edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = await confirmDialog({
                            title: 'Delete Flat',
                            message: 'Are you sure you want to delete this flat? This action cannot be undone.',
                            confirmText: 'Delete',
                            tone: 'danger',
                            details: [
                              { label: 'Flat', value: flat.flatNumber || '-' },
                              { label: 'Type', value: flat.flatType || flat.unitType || 'FLAT' },
                              { label: 'Wing', value: flat.wingName || 'No Wing' },
                              { label: 'Owner', value: flat.ownerName || 'Unassigned' },
                            ],
                            caution: 'This action permanently removes this unit.',
                          })
                          if (confirmed) {
                            deleteMutation.mutate(flat.id)
                          }
                        }}
                          className="flats-action-button flats-action-delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="flats-modal">
          <div className="flats-modal-card">
            <div className="flats-modal-header">
              <h3 className="flats-modal-title">{editingFlat ? 'Edit Unit' : 'Add Unit'}</h3>
              <button onClick={() => { setShowModal(false); setFormErrors({}); }} className="flats-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flats-modal-body">
              {/* Society field - only show dropdown for PLATFORM_OWNER, auto-set for others */}
              {isPlatformLevel ? (
                <SmartSelect
                  label="Society"
                  name="societyId"
                  defaultValue={editingFlat?.societyId}
                  options={societies.map(s => ({ value: s.id, label: s.name }))}
                  required
                  icon={Home}
                  placeholder="Select Society"
                  emptyMessage="No societies available"
                />
              ) : (
                <input type="hidden" name="societyId" value={user?.societyId || ''} />
              )}
              
              {/* Unit Type and Wing Selection */}
              <div className="flats-form-row">
                <SmartSelect
                  label="Unit Type"
                  name="unitType"
                  value={selectedUnitType}
                  onChange={(e) => setSelectedUnitType(e.target.value)}
                  required
                  options={[
                    { value: 'FLAT', label: '🏠 Flat' },
                    { value: 'SHOP', label: '🏪 Shop' },
                    { value: 'OFFICE', label: '🏢 Office' },
                  ]}
                />
                <SmartSelect
                  label={`Wing (Optional) ${selectedWingId && wings.find(w => w.id === parseInt(selectedWingId))?.totalFloors ? `(Max Floor: ${wings.find(w => w.id === parseInt(selectedWingId))?.totalFloors})` : ''}`}
                  name="wingId"
                  value={selectedWingId}
                  onChange={(e) => setSelectedWingId(e.target.value)}
                  options={wings.map(w => ({
                    value: w.id,
                    label: `${w.name} ${w.totalFloors ? `(${w.totalFloors} floors)` : ''}`
                  }))}
                  placeholder="No Wing"
                />
              </div>

              <div className="flats-form-row">
                <FormInput
                  label="Unit Number"
                  name="flatNumber"
                  defaultValue={editingFlat?.flatNumber}
                  required
                  placeholder={selectedUnitType === 'SHOP' ? 'e.g., S-101' : selectedUnitType === 'OFFICE' ? 'e.g., O-201' : 'e.g., A-101'}
                  maxLength={20}
                  error={formErrors.flatNumber}
                />
                <SmartSelect
                  label={selectedUnitType === 'FLAT' ? 'Configuration' : selectedUnitType === 'SHOP' ? 'Shop Type' : 'Office Type'}
                  name="flatType"
                  value={selectedFlatType}
                  onChange={(e) => setSelectedFlatType(e.target.value)}
                  required
                  options={
                    selectedUnitType === 'FLAT' ? [
                      { value: '1RK', label: '1 RK' }, { value: '1BHK', label: '1 BHK' },
                      { value: '2BHK', label: '2 BHK' }, { value: '3BHK', label: '3 BHK' },
                      { value: '4BHK', label: '4 BHK' }, { value: '5BHK', label: '5 BHK' },
                      { value: 'PENTHOUSE', label: 'Penthouse' }, { value: 'DUPLEX', label: 'Duplex' },
                      { value: 'STUDIO', label: 'Studio' }, { value: 'OTHER', label: 'Other' },
                    ] : selectedUnitType === 'SHOP' ? [
                      { value: 'RETAIL', label: 'Retail Shop' }, { value: 'SHOWROOM', label: 'Showroom' },
                      { value: 'KIOSK', label: 'Kiosk' }, { value: 'FOOD', label: 'Food Court' },
                      { value: 'PHARMACY', label: 'Pharmacy' }, { value: 'SALON', label: 'Salon/Spa' },
                      { value: 'SMALL', label: 'Small Shop' }, { value: 'MEDIUM', label: 'Medium Shop' },
                      { value: 'LARGE', label: 'Large Shop' }, { value: 'OTHER', label: 'Other' },
                    ] : [
                      { value: 'STANDARD', label: 'Standard Office' }, { value: 'CABIN', label: 'Cabin' },
                      { value: 'CUBICLE', label: 'Cubicle' }, { value: 'SHARED', label: 'Shared Space' },
                      { value: 'COWORKING', label: 'Co-working' }, { value: 'EXECUTIVE', label: 'Executive Office' },
                      { value: 'SMALL', label: 'Small Office' }, { value: 'MEDIUM', label: 'Medium Office' },
                      { value: 'LARGE', label: 'Large Office' }, { value: 'OTHER', label: 'Other' },
                    ]
                  }
                />
              </div>
              <div className="flats-form-row">
                <NumberInput
                  label={`Floor${selectedWingId && wings.find(w => w.id === parseInt(selectedWingId))?.totalFloors ? ` (0 to ${wings.find(w => w.id === parseInt(selectedWingId))?.totalFloors})` : ''}`}
                  name="floor"
                  defaultValue={editingFlat?.floor || 0}
                  required
                  min={0}
                  max={selectedWingId && wings.find(w => w.id === parseInt(selectedWingId))?.totalFloors || 100}
                  error={formErrors.floor}
                />
                <NumberInput
                  label="Area (sq.ft)"
                  name="area"
                  step={0.01}
                  min={0.01}
                  max={100000}
                  defaultValue={editingFlat?.area}
                  placeholder={selectedUnitType === 'SHOP' ? 'e.g., 500' : selectedUnitType === 'OFFICE' ? 'e.g., 800' : 'e.g., 1200'}
                  error={formErrors.area}
                  required
                />
              </div>
              <FormInput
                label={selectedUnitType === 'SHOP' ? 'Shop Owner / Tenant Name' : selectedUnitType === 'OFFICE' ? 'Company / Owner Name' : 'Owner Name'}
                name="ownerName"
                defaultValue={editingFlat?.ownerName}
                maxLength={100}
                placeholder={selectedUnitType === 'SHOP' ? 'e.g., ABC Stores Pvt Ltd' : selectedUnitType === 'OFFICE' ? 'e.g., Tech Corp' : 'e.g., John Doe'}
                required
              />
              <div className="flats-form-row">
                <FormInput
                  label="Contact Email"
                  name="ownerEmail"
                  type="email"
                  defaultValue={editingFlat?.ownerEmail}
                  placeholder="example@email.com"
                  error={formErrors.ownerEmail}
                  required
                />
                <PhoneInput
                  label="Contact Phone"
                  name="ownerPhone"
                  defaultValue={editingFlat?.ownerPhone}
                  error={formErrors.ownerPhone}
                  required
                />
              </div>
              <FormErrorSummary errors={formErrors} />
              <div className="flats-form-actions">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormErrors({}); }}
                  className="flats-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flats-submit-button"
                >
                  {editingFlat ? 'Update' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
