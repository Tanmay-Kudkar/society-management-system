import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { vehicleApi, flatApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, Car, Bike, Upload } from 'lucide-react'
import { FormInput, SmartSelect, BulkImportModal, AsyncButton } from '../../components'
import { HeroSkeleton, StatCardSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

export default function Vehicles() {
  const { user, canManageVehicles } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')

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
  const canEditVehicles = canManageVehicles()

  const { data: allVehicles = [], isLoading, isError } = useQuery({
    queryKey: ['vehicles', effectiveSocietyId, isPlatformLevel],
    queryFn: () => {
      if (effectiveSocietyId) {
        return vehicleApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return vehicleApi.getAll().then(res => res.data)
    },
  })

  const vehicles = allVehicles

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
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete vehicle')
    },
  })

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || v.vehicleType === filterType
      return matchesSearch && matchesType
    })
  }, [vehicles, searchTerm, filterType])

  const vehicleStats = useMemo(() => {
    return {
      fourWheelers: vehicles.filter(v => v.vehicleType === 'FOUR_WHEELER').length,
      twoWheelers: vehicles.filter(v => v.vehicleType === 'TWO_WHEELER').length,
      total: vehicles.length,
    }
  }, [vehicles])

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
    // Only show society name for MASTER_ADMIN
    return isPlatformLevel ? `${flat.flatNumber} - ${flat.societyName || 'N/A'}` : flat.flatNumber
  }

  const VehicleIcon = ({ type }) => {
    if (type === 'TWO_WHEELER') {
      return <Bike className="h-5 w-5 text-green-600" />
    }
    return <Car className="h-5 w-5 text-blue-600" />
  } 

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <StatCardSkeleton count={3} />
        <div style={{height:20}} />
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vehicles</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Manage resident vehicles and parking</p>
        </div>
        {canEditVehicles && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-900/15 bg-slate-900 px-4 py-2 font-medium text-slate-50 transition hover:shadow-[0_8px_20px_rgba(15,23,42,0.16)] dark:border-slate-400/25 dark:bg-slate-950"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { setEditingVehicle(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 font-medium text-[var(--text-primary)] transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
            >
              <Plus size={20} />
              Add Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.3)]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.3)]"
          >
            <option value="">All Types</option>
            <option value="TWO_WHEELER">Two Wheeler</option>
            <option value="FOUR_WHEELER">Four Wheeler</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/15 p-2">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {vehicleStats.fourWheelers}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">Four Wheelers</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/15 p-2">
              <Bike className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {vehicleStats.twoWheelers}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">Two Wheelers</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/15 p-2">
              <Car className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{vehicleStats.total}</p>
              <p className="text-sm text-[var(--text-tertiary)]">Total Vehicles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Flat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Parking</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-[var(--border-light)] transition hover:bg-[var(--bg-tertiary)]">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                          <VehicleIcon type={vehicle.vehicleType} />
                        </div>
                        <div>
                          <span className="font-medium text-[var(--text-primary)]">{vehicle.vehicleNumber}</span>
                          <p className="text-xs text-[var(--text-tertiary)]">{vehicle.brand} {vehicle.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        vehicle.vehicleType === 'FOUR_WHEELER' 
                          ? 'bg-blue-500/15 text-blue-600' 
                          : 'bg-green-500/15 text-green-600'
                      }`}>
                        {vehicle.vehicleType === 'FOUR_WHEELER' ? 'Four Wheeler' : 'Two Wheeler'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[var(--text-secondary)]">
                      {getFlatDisplay(vehicle.flatId)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[var(--text-secondary)]">
                      {vehicle.ownerName || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {vehicle.parkingSlot ? (
                        <span className="inline-flex rounded-full bg-[var(--bg-tertiary)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">
                          {vehicle.parkingSlot}
                        </span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">Not assigned</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {canEditVehicles ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingVehicle(vehicle); setShowModal(true) }}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-blue-500/10 hover:text-blue-600"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Delete Vehicle',
                                message: 'Are you sure you want to delete this vehicle? This action cannot be undone.',
                                confirmText: 'Delete',
                                tone: 'danger',
                                details: [
                                  { label: 'Vehicle No', value: vehicle.vehicleNumber || '-' },
                                  { label: 'Type', value: vehicle.vehicleType === 'FOUR_WHEELER' ? 'Four Wheeler' : 'Two Wheeler' },
                                  { label: 'Owner', value: vehicle.ownerName || '-' },
                                  { label: 'Parking', value: vehicle.parkingSlot || 'Not assigned' },
                                ],
                                caution: 'This action permanently removes vehicle details.',
                              })
                              if (confirmed) {
                                deleteMutation.mutate(vehicle.id)
                              }
                            }}
                            className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Read only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-[var(--text-tertiary)]">
                      No vehicles found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Modal */}
      {showModal && canEditVehicles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingVehicle(null) }}
                className="rounded-lg p-2 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <SmartSelect
                label="Flat"
                name="flatId"
                defaultValue={editingVehicle?.flatId || ''}
                required
                options={flats.map(f => ({ value: f.id, label: isPlatformLevel ? `${f.flatNumber} - ${f.societyName || 'N/A'}` : f.flatNumber }))}
                placeholder="Select Flat"
                emptyMessage="No flats available"
              />

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Brand"
                  name="brand"
                  defaultValue={editingVehicle?.brand || ''}
                  placeholder="Honda, Maruti, etc."
                  required
                />
                <FormInput
                  label="Model"
                  name="model"
                  defaultValue={editingVehicle?.model || ''}
                  placeholder="City, Swift, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Color"
                  name="color"
                  defaultValue={editingVehicle?.color || ''}
                  required
                />
                <FormInput
                  label="Parking Slot"
                  name="parkingSlot"
                  defaultValue={editingVehicle?.parkingSlot || ''}
                  placeholder="A-101"
                  required
                />
              </div>

              <FormInput
                label="Owner Name"
                name="ownerName"
                defaultValue={editingVehicle?.ownerName || ''}
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingVehicle(null) }}
                  className="rounded-lg bg-[var(--bg-tertiary)] px-4 py-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <AsyncButton
                  type="submit"
                  className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
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
      {showBulkImport && canEditVehicles && (
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
