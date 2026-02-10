import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { flatApi, societyApi, wingApi } from '../../../api'
import { Plus, Edit, Trash2, Search, X, Home, Store, Briefcase, Layers, AlertCircle } from 'lucide-react'
import { FormInput, PhoneInput, SmartSelect, NumberInput, FormErrorSummary } from '../components/FormComponents'

export default function Flats() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
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

  const getUnitColor = (unitType) => {
    switch (unitType) {
      case 'SHOP': return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      case 'OFFICE': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      default: return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Units</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage society flats, shops, and offices</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Unit
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search flats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          {/* Only show society filter for PLATFORM_OWNER */}
          {isPlatformLevel && (
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Wing</th>
                  {isPlatformLevel && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Society</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredFlats.map((flat) => {
                  const UnitIcon = getUnitIcon(flat.unitType)
                  return (
                  <tr key={flat.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getUnitColor(flat.unitType)}`}>
                          <UnitIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{flat.flatNumber}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Floor {flat.floor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {flat.wingName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          <Layers className="w-3 h-3" />
                          {flat.wingName}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    {isPlatformLevel && <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{flat.societyName}</td>}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-gray-900 dark:text-white">{flat.ownerName || '-'}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{flat.ownerPhone || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">{flat.flatType || '-'}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{flat.unitType || 'FLAT'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{flat.area ? `${flat.area} sq.ft` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenModal(flat)}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this flat?')) {
                            deleteMutation.mutate(flat.id)
                          }
                        }}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 transition ml-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold dark:text-white">{editingFlat ? 'Edit Unit' : 'Add Unit'}</h3>
              <button onClick={() => { setShowModal(false); setFormErrors({}); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <SmartSelect
                  label="Unit Type"
                  name="unitType"
                  value={selectedUnitType}
                  onChange={(e) => setSelectedUnitType(e.target.value)}
                  options={[
                    { value: 'FLAT', label: '🏠 Flat' },
                    { value: 'SHOP', label: '🏪 Shop' },
                    { value: 'OFFICE', label: '🏢 Office' },
                  ]}
                />
                <SmartSelect
                  label={`Wing ${selectedWingId && wings.find(w => w.id === parseInt(selectedWingId))?.totalFloors ? `(Max Floor: ${wings.find(w => w.id === parseInt(selectedWingId))?.totalFloors})` : ''}`}
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

              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
                />
              </div>
              <FormInput
                label={selectedUnitType === 'SHOP' ? 'Shop Owner / Tenant Name' : selectedUnitType === 'OFFICE' ? 'Company / Owner Name' : 'Owner Name'}
                name="ownerName"
                defaultValue={editingFlat?.ownerName}
                maxLength={100}
                placeholder={selectedUnitType === 'SHOP' ? 'e.g., ABC Stores Pvt Ltd' : selectedUnitType === 'OFFICE' ? 'e.g., Tech Corp' : 'e.g., John Doe'}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Contact Email"
                  name="ownerEmail"
                  type="email"
                  defaultValue={editingFlat?.ownerEmail}
                  placeholder="example@email.com"
                  error={formErrors.ownerEmail}
                />
                <PhoneInput
                  label="Contact Phone"
                  name="ownerPhone"
                  defaultValue={editingFlat?.ownerPhone}
                  error={formErrors.ownerPhone}
                />
              </div>
              <FormErrorSummary errors={formErrors} />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormErrors({}); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
