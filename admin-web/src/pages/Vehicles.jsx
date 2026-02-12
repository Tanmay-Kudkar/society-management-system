import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { vehicleApi, flatApi } from '../../../api'
import { Plus, Edit, Trash2, Search, X, Car, Bike, Upload } from 'lucide-react'
import { FormInput, SmartSelect } from '../components/FormComponents'
import BulkImportModal from '../components/BulkImportModal'

export default function Vehicles() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is PLATFORM_OWNER or ORGANIZATION_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: allVehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll().then(res => res.data),
  })

  // Filter vehicles by society
  const vehicles = useMemo(() => {
    if (!effectiveSocietyId) return allVehicles
    return allVehicles.filter(v => v.societyId === effectiveSocietyId)
  }, [allVehicles, effectiveSocietyId])

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', effectiveSocietyId],
    queryFn: () => flatApi.getBySociety(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => vehicleApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles'])
      setShowModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vehicleApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles'])
      setShowModal(false)
      setEditingVehicle(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => vehicleApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['vehicles']),
  })

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || v.vehicleType === filterType
    return matchesSearch && matchesType
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      flatId: parseInt(formData.get('flatId')),
      vehicleNumber: formData.get('vehicleNumber'),
      vehicleType: formData.get('vehicleType'),
      brand: formData.get('brand'),
      model: formData.get('model'),
      color: formData.get('color'),
      ownerName: formData.get('ownerName'),
      parkingSlot: formData.get('parkingSlot'),
    }

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data })
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

  const VehicleIcon = ({ type }) => {
    if (type === 'TWO_WHEELER') {
      return <Bike className="vehicles-icon-svg vehicles-icon-svg--green" />
    }
    return <Car className="vehicles-icon-svg vehicles-icon-svg--blue" />
  } 

  return (
    <div className="vehicles-page">
      {/* Header */}
      <div className="vehicles-header">
        <div>
          <h1 className="vehicles-title">Vehicles</h1>
          <p className="vehicles-subtitle">Manage resident vehicles and parking</p>
        </div>
        <div className="vehicles-header-actions">
          <button
            onClick={() => setShowBulkImport(true)}
            className="vehicles-bulk-button"
          >
            <Upload size={20} />
            Bulk Import
          </button>
          <button
            onClick={() => { setEditingVehicle(null); setShowModal(true) }}
            className="vehicles-add-button"
          >
            <Plus size={20} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="vehicles-filters">
        <div className="vehicles-filters-row">
          <div className="vehicles-search">
            <Search className="vehicles-search-icon" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="vehicles-search-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="vehicles-filter-select"
          >
            <option value="">All Types</option>
            <option value="TWO_WHEELER">Two Wheeler</option>
            <option value="FOUR_WHEELER">Four Wheeler</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="vehicles-stats">
        <div className="vehicles-stat-card">
          <div className="vehicles-stat-content">
            <div className="vehicles-stat-icon vehicles-stat-icon--blue">
              <Car className="vehicles-stat-icon-svg" />
            </div>
            <div>
              <p className="vehicles-stat-value">
                {vehicles.filter(v => v.vehicleType === 'FOUR_WHEELER').length}
              </p>
              <p className="vehicles-stat-label">Four Wheelers</p>
            </div>
          </div>
        </div>
        <div className="vehicles-stat-card">
          <div className="vehicles-stat-content">
            <div className="vehicles-stat-icon vehicles-stat-icon--green">
              <Bike className="vehicles-stat-icon-svg" />
            </div>
            <div>
              <p className="vehicles-stat-value">
                {vehicles.filter(v => v.vehicleType === 'TWO_WHEELER').length}
              </p>
              <p className="vehicles-stat-label">Two Wheelers</p>
            </div>
          </div>
        </div>
        <div className="vehicles-stat-card">
          <div className="vehicles-stat-content">
            <div className="vehicles-stat-icon vehicles-stat-icon--purple">
              <Car className="vehicles-stat-icon-svg" />
            </div>
            <div>
              <p className="vehicles-stat-value">{vehicles.length}</p>
              <p className="vehicles-stat-label">Total Vehicles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="vehicles-table-card">
        {isLoading ? (
          <div className="vehicles-loading">
            <div className="vehicles-spinner" />
          </div>
        ) : (
          <div className="vehicles-table-scroll">
            <table className="vehicles-table">
              <thead className="vehicles-thead">
                <tr>
                  <th className="vehicles-th">Vehicle</th>
                  <th className="vehicles-th">Type</th>
                  <th className="vehicles-th">Flat</th>
                  <th className="vehicles-th">Owner</th>
                  <th className="vehicles-th">Parking</th>
                  <th className="vehicles-th vehicles-th--right">Actions</th>
                </tr>
              </thead>
              <tbody className="vehicles-tbody">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="vehicles-row">
                    <td className="vehicles-cell">
                      <div className="vehicles-cell-vehicle">
                        <div className="vehicles-cell-icon">
                          <VehicleIcon type={vehicle.vehicleType} />
                        </div>
                        <div>
                          <span className="vehicles-cell-number">{vehicle.vehicleNumber}</span>
                          <p className="vehicles-cell-detail">{vehicle.brand} {vehicle.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="vehicles-cell">
                      <span className={`vehicles-type-badge ${
                        vehicle.vehicleType === 'FOUR_WHEELER' 
                          ? 'vehicles-type-badge--four' 
                          : 'vehicles-type-badge--two'
                      }`}>
                        {vehicle.vehicleType === 'FOUR_WHEELER' ? 'Four Wheeler' : 'Two Wheeler'}
                      </span>
                    </td>
                    <td className="vehicles-cell vehicles-cell--muted">
                      {getFlatDisplay(vehicle.flatId)}
                    </td>
                    <td className="vehicles-cell vehicles-cell--muted">
                      {vehicle.ownerName || 'N/A'}
                    </td>
                    <td className="vehicles-cell">
                      {vehicle.parkingSlot ? (
                        <span className="vehicles-parking-badge">
                          {vehicle.parkingSlot}
                        </span>
                      ) : (
                        <span className="vehicles-parking-empty">Not assigned</span>
                      )}
                    </td>
                    <td className="vehicles-cell vehicles-cell--right">
                      <div className="vehicles-cell-actions">
                        <button
                          onClick={() => { setEditingVehicle(vehicle); setShowModal(true) }}
                          className="vehicles-action-button vehicles-action-button--edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this vehicle?')) {
                              deleteMutation.mutate(vehicle.id)
                            }
                          }}
                          className="vehicles-action-button vehicles-action-button--delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan="6" className="vehicles-empty">
                      No vehicles found
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
        <div className="vehicles-modal">
          <div className="vehicles-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="vehicles-modal-card">
            <div className="vehicles-modal-header">
              <h2 className="vehicles-modal-title">
                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingVehicle(null) }}
                className="vehicles-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="vehicles-modal-body">
              <SmartSelect
                label="Flat"
                name="flatId"
                defaultValue={editingVehicle?.flatId || ''}
                required
                options={flats.map(f => ({ value: f.id, label: isPlatformLevel ? `${f.flatNumber} - ${f.societyName || 'N/A'}` : f.flatNumber }))}
                placeholder="Select Flat"
                emptyMessage="No flats available"
              />

              <div className="vehicles-form-grid">
                <FormInput
                  label="Vehicle Number"
                  name="vehicleNumber"
                  defaultValue={editingVehicle?.vehicleNumber || ''}
                  placeholder="MH01AB1234"
                  required
                />
                <SmartSelect
                  label="Vehicle Type"
                  name="vehicleType"
                  defaultValue={editingVehicle?.vehicleType || ''}
                  required
                  options={[
                    { value: 'TWO_WHEELER', label: 'Two Wheeler' },
                    { value: 'FOUR_WHEELER', label: 'Four Wheeler' },
                  ]}
                  placeholder="Select Type"
                />
              </div>

              <div className="vehicles-form-grid">
                <FormInput
                  label="Brand"
                  name="brand"
                  defaultValue={editingVehicle?.brand || ''}
                  placeholder="Honda, Maruti, etc."
                />
                <FormInput
                  label="Model"
                  name="model"
                  defaultValue={editingVehicle?.model || ''}
                  placeholder="City, Swift, etc."
                />
              </div>

              <div className="vehicles-form-grid">
                <FormInput
                  label="Color"
                  name="color"
                  defaultValue={editingVehicle?.color || ''}
                />
                <FormInput
                  label="Parking Slot"
                  name="parkingSlot"
                  defaultValue={editingVehicle?.parkingSlot || ''}
                  placeholder="A-101"
                />
              </div>

              <FormInput
                label="Owner Name"
                name="ownerName"
                defaultValue={editingVehicle?.ownerName || ''}
              />

              <div className="vehicles-modal-actions">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingVehicle(null) }}
                  className="vehicles-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="vehicles-submit-button"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          title="Bulk Import Vehicles"
          entityName="Vehicles"
          templateFilename="vehicle_import_template.xlsx"
          columns={[
            { letter: 'A', label: 'Unit Number', required: true, description: 'Must match an existing unit (e.g., A-101)' },
            { letter: 'B', label: 'Vehicle Type', required: true, description: 'TWO_WHEELER or FOUR_WHEELER' },
            { letter: 'C', label: 'Vehicle Number', required: true, description: 'Registration number (e.g., MH02AB1234)' },
            { letter: 'D', label: 'Brand', required: false, description: 'Vehicle manufacturer' },
            { letter: 'E', label: 'Model', required: false, description: 'Vehicle model name' },
            { letter: 'F', label: 'Color', required: false, description: 'Vehicle color' },
            { letter: 'G', label: 'Owner Name', required: false, description: 'Name of vehicle owner' },
            { letter: 'H', label: 'Parking Slot', required: false, description: 'Assigned parking slot' },
          ]}
          tableColumns={[
            { key: 'vehicleNumber', label: 'Vehicle No.' },
            { key: 'flatNumber', label: 'Unit' },
          ]}
          apiValidate={vehicleApi.validateBulkImport}
          apiProcess={vehicleApi.processBulkImport}
          apiTemplate={vehicleApi.downloadImportTemplate}
          societyId={effectiveSocietyId}
          userId={user?.id}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => queryClient.invalidateQueries(['vehicles'])}
        />
      )}
    </div>
  )
}
