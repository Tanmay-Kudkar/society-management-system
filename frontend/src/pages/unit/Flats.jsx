import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { flatApi, societyApi, wingApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, Home, Store, Briefcase, Layers, AlertCircle } from 'lucide-react'
import { FormInput, PhoneInput, SmartSelect, NumberInput, FormErrorSummary, AsyncButton } from '../../components'
import { PermissionDenied } from '../../components'

export default function Flats() {
  const { user, canManageFlats } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
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

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is MASTER_ADMIN or SOCIETY_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

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
    enabled: isPlatformLevel, // Only fetch if MASTER_ADMIN
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
    mutationFn: ({ id, force = false }) => flatApi.delete(id, user.id, force),
    onSuccess: () => queryClient.invalidateQueries(['flats']),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete unit')
    },
  })

  const filteredFlats = useMemo(() => flats.filter(f => {
    const matchesSearch = f.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSociety = !filterSociety || f.societyId === parseInt(filterSociety)
    return matchesSearch && matchesSociety
  }), [flats, searchTerm, filterSociety])

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
      case 'SHOP': return 'w-8 h-8 rounded-xl inline-flex items-center justify-center bg-[#dcfce7] text-[#16a34a]'
      case 'OFFICE': return 'w-8 h-8 rounded-xl inline-flex items-center justify-center bg-[#ede9fe] text-[#7c3aed]'
      default: return 'w-8 h-8 rounded-xl inline-flex items-center justify-center bg-[#dbeafe] text-[#2563eb]'
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
    
    // For non-MASTER_ADMIN, use user's societyId directly
    const societyId = isPlatformLevel 
      ? parseInt(formData.get('societyId')) 
      : user?.societyId

    if (!societyId) {
      toast.error('Society ID is required. Please log out and log back in.')
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
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Units</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Manage society flats, shops, and offices</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-[#2563eb] text-white font-semibold transition-all hover:bg-[#1d4ed8] hover:-translate-y-px"
        >
          <Plus size={20} />
          Add Unit
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_20px_rgba(15,23,42,0.08)] mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search flats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-3 pl-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
          {/* Only show society filter for MASTER_ADMIN */}
          {isPlatformLevel && (
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
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
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] overflow-hidden shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 mx-auto rounded-full border-[3px] border-[rgba(37,99,235,0.2)] border-t-[#2563eb] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Unit</th>
                  <th className="py-3 px-6 text-left text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Wing</th>
                  {isPlatformLevel && <th className="py-3 px-6 text-left text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Society</th>}
                  <th className="py-3 px-6 text-left text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Owner</th>
                  <th className="py-3 px-6 text-left text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Type</th>
                  <th className="py-3 px-6 text-left text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Area</th>
                  <th className="py-3 px-6 text-right text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="border-t border-[var(--border-light)]">
                {filteredFlats.map((flat) => {
                  const UnitIcon = getUnitIcon(flat.unitType)
                  return (
                  <tr key={flat.id} className="hover:bg-[var(--bg-tertiary)]">
                    <td className="py-4 px-6 whitespace-nowrap text-[var(--text-primary)]">
                      <div className="flex items-center gap-3">
                        <div className={getUnitToneClass(flat.unitType)}>
                          <UnitIcon className="w-4 h-4" />
                        </div>
                        <div className="grid">
                          <span className="font-bold text-[var(--text-primary)]">{flat.flatNumber}</span>
                          <p className="text-xs text-[var(--text-tertiary)]">Floor {flat.floor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-[var(--text-primary)]">
                      {flat.wingName ? (
                        <span className="inline-flex items-center gap-[0.4rem] py-1 px-[0.6rem] rounded-full text-xs font-semibold bg-[#eef2ff] text-[#4338ca]">
                          <Layers className="w-3 h-3" />
                          {flat.wingName}
                        </span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">-</span>
                      )}
                    </td>
                    {isPlatformLevel && <td className="py-4 px-6 whitespace-nowrap text-[var(--text-tertiary)]">{flat.societyName}</td>}
                    <td className="py-4 px-6 whitespace-nowrap text-[var(--text-primary)]">
                      <div>
                        <span className="text-[var(--text-primary)]">{flat.ownerName || '-'}</span>
                        <p className="text-xs text-[var(--text-tertiary)]">{flat.ownerPhone || ''}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-[var(--text-primary)]">
                      <div>
                        <span className="text-[var(--text-secondary)]">{flat.flatType || '-'}</span>
                        <p className="text-xs text-[var(--text-tertiary)]">{flat.unitType || 'FLAT'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-[var(--text-tertiary)]">{flat.area ? `${flat.area} sq.ft` : '-'}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenModal(flat)}
                        className="p-[0.35rem] rounded-[0.6rem] transition-colors text-[var(--text-tertiary)] hover:text-[#2563eb] hover:bg-[rgba(37,99,235,0.1)]"
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
                          if (!confirmed) return

                          try {
                            await deleteMutation.mutateAsync({ id: flat.id, force: false })
                          } catch (error) {
                            const msg = error?.response?.data?.message || ''
                            if (error?.response?.status === 409 && msg.toLowerCase().includes('force delete')) {
                              const forceConfirmed = await confirmDialog({
                                title: 'Force Delete Unit',
                                message: `${msg}\n\nForce delete will remove all linked records. Continue?`,
                                confirmText: 'Force Delete',
                                tone: 'danger',
                              })
                              if (forceConfirmed) {
                                deleteMutation.mutate({ id: flat.id, force: true })
                              }
                            }
                          }
                        }}
                          className="p-[0.35rem] rounded-[0.6rem] transition-colors text-[var(--text-tertiary)] ml-2 hover:text-[#dc2626] hover:bg-[rgba(220,38,38,0.1)]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="sticky top-0 z-[2] flex items-center justify-between p-4 border-b border-[var(--border-light)] bg-inherit">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingFlat ? 'Edit Unit' : 'Add Unit'}</h3>
              <button onClick={() => { setShowModal(false); setFormErrors({}); }} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-4">
              {/* Society field - only show dropdown for MASTER_ADMIN, auto-set for others */}
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
              <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormErrors({}); }}
                  className="flex-1 py-2 px-4 rounded-xl font-semibold border border-[var(--border-light)] bg-transparent text-[#334155] hover:bg-[var(--bg-tertiary)]"
                >
                  Cancel
                </button>
                <AsyncButton
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:opacity-90"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  loadingText="Saving..."
                >
                  {editingFlat ? 'Update' : 'Create Unit'}
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
