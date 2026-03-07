import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { wingApi, societyApi } from '../../../../api'
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
import { FormInput, SmartSelect, NumberInput, FormErrorSummary, BulkImportModal, AsyncButton } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

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

  const isPlatformLevel = user?.role === 'MASTER_ADMIN' || user?.role === 'MASTER_ADMIN'

  // Determine the effective society ID
  const effectiveSocietyId = isPlatformLevel ? filterSociety : user?.societyId
  const effectiveSocietyIdNum = effectiveSocietyId ? Number(effectiveSocietyId) : null
  const canEditWings = canManageWings()

  // Fetch societies (for MASTER_ADMIN dropdown)
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
  const { data: wings = [], isLoading, isError } = useQuery({
    queryKey: ['wings', effectiveSocietyIdNum],
    queryFn: () => {
      if (effectiveSocietyIdNum) {
        return wingApi.getBySociety(effectiveSocietyIdNum).then(res => res.data)
      }
      return wingApi.getAll().then(res => res.data)
    },
  })

  const currentWingCount = useMemo(() => {
    if (!effectiveSocietyIdNum) {
      return 0
    }
    return wings.filter((wingItem) => Number(wingItem.societyId) === effectiveSocietyIdNum).length
  }, [wings, effectiveSocietyIdNum])
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
    mutationFn: ({ id, force = false }) => wingApi.delete(id, force),
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
  const filteredWings = useMemo(() => {
    return wings.filter(wing => {
      const matchesSearch = wing.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSociety = !filterSociety || wing.societyId?.toString() === filterSociety
      return matchesSearch && matchesSociety
    })
  }, [wings, searchTerm, filterSociety])

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

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div className="min-h-[calc(100vh-68px)] bg-[var(--bg-secondary)] px-6 pb-12 pt-7 text-[var(--text-primary)]">
      <WakeUpBanner />
      <HeroSkeleton statCount={2} />
      <FiltersSkeleton filterCount={1} />
      <CardGridSkeleton count={6} showBadge={false} />
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[var(--bg-secondary)] px-6 pb-12 pt-7 text-[var(--text-primary)]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="m-0 text-[28px] font-bold text-[var(--text-primary)]">Wings</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Manage society wings and towers</p>
          {currentSociety && effectiveSocietyIdNum && (
            <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
              Capacity: {currentWingCount}/{maxWings || '∞'} wings
            </p>
          )}
        </div>
        {canEditWings && (
          <div className="flex flex-wrap gap-2.5 max-md:w-full">
            <button
              onClick={handleBulkImportOpen}
              className="inline-flex items-center gap-2.5 rounded-xl border border-slate-900/15 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.16)] dark:border-slate-400/30 dark:bg-slate-950"
              disabled={!effectiveSocietyIdNum || wingsCapacityReached}
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => { setEditingWing(null); setFormErrors({}); setShowModal(true) }}
              className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[0_8px_20px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--bg-tertiary)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
              disabled={wingsCapacityReached}
            >
              <Plus size={20} />
              Add Wing
            </button>
          </div>
        )}
      </div>

      {pageError && (
        <div className="mb-[18px] flex items-start gap-3 rounded-[14px] border border-red-500/35 bg-gradient-to-r from-red-500/15 to-red-400/10 px-4 py-3.5" role="alert">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 font-bold text-white">!</div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-red-200">Action blocked</p>
            <p className="mt-1 text-[13px] text-red-300">{pageError}</p>
          </div>
          <button
            type="button"
            onClick={() => setPageError('')}
            className="rounded-lg border-none bg-transparent p-1 text-red-300 transition-colors hover:bg-red-400/15"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={20} />
            <input
              type="text"
              placeholder="Search wings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-2.5 pl-10 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"
            />
          </div>
          {isPlatformLevel && (
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
        {filteredWings.length === 0 ? (
          <div className="col-[1/-1] px-8 py-8 text-center text-[var(--text-tertiary)]">
            <Layers className="mb-3 text-gray-300" size={48} />
            <p>No wings found</p>
            <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{canEditWings ? 'Add your first wing to get started' : 'You have read-only access'}</p>
          </div>
        ) : (
          filteredWings.map((wing) => (
            <div 
              key={wing.id} 
              className="group overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent-primary)_45%,var(--border-default))] hover:shadow-lg"
            >
              {/* Wing Header with 3D Effect */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[color-mix(in_srgb,var(--accent-primary)_70%,#4f46e5)] to-[color-mix(in_srgb,var(--accent-secondary)_60%,#312e81)] p-[18px] text-white">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+")' }} />
                <div className="relative flex items-start gap-3.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-transform duration-200 group-hover:scale-105">
                    <Layers size={28} />
                  </div>
                  <div>
                    <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-lg font-bold">{wing.name}</h3>
                    {isPlatformLevel && (
                      <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-white/80">{wing.societyName}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Wing Body with Stats */}
              <div className="p-[18px]">
                {wing.description && (
                  <p className="mb-4 line-clamp-2 text-[13px] text-[var(--text-secondary)]">{wing.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_28%,var(--border-default))] bg-[var(--bg-tertiary)] px-3 py-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[color-mix(in_srgb,var(--accent-primary)_78%,var(--text-secondary))]">
                      <Building2 size={16} />
                      <span>Floors</span>
                    </div>
                    <p className="m-0 text-[20px] font-bold text-[var(--text-primary)]">{wing.totalFloors || 0}</p>
                  </div>
                  <div className="rounded-xl border border-[color-mix(in_srgb,#7c3aed_30%,var(--border-default))] bg-[var(--bg-tertiary)] px-3 py-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[color-mix(in_srgb,#7c3aed_72%,var(--text-secondary))]">
                      <Hash size={16} />
                      <span>Wing ID</span>
                    </div>
                    <p className="m-0 text-[20px] font-bold text-[var(--text-primary)]">{wing.id}</p>
                  </div>
                </div>
              </div>

              {/* Actions with Better Hover */}
              {canEditWings && (
                <div className="flex justify-end gap-2.5 border-t border-[var(--border-default)] bg-[var(--bg-tertiary)] px-[18px] py-3.5">
                  <button
                    onClick={() => { setEditingWing(wing); setFormErrors({}); setShowModal(true) }}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-transparent bg-[color-mix(in_srgb,var(--accent-primary)_18%,var(--bg-card))] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-primary)_26%,var(--bg-card))]"
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
                      if (!confirmed) return

                      try {
                        await deleteMutation.mutateAsync({ id: wing.id, force: false })
                      } catch (error) {
                        const msg = error?.response?.data?.message || ''
                        if (error?.response?.status === 409 && msg.toLowerCase().includes('force delete')) {
                          const forceConfirmed = await confirmDialog({
                            title: 'Force Delete Wing',
                            message: `${msg}\n\nForce delete will remove all linked units. Continue?`,
                            confirmText: 'Force Delete',
                            tone: 'danger',
                          })
                          if (forceConfirmed) {
                            deleteMutation.mutate({ id: wing.id, force: true })
                          }
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-transparent bg-[color-mix(in_srgb,#dc2626_14%,var(--bg-card))] px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-[color-mix(in_srgb,#dc2626_20%,var(--bg-card))]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-card)] px-[18px] py-4">
              <h3 className="m-0 text-lg font-bold">{editingWing ? 'Edit Wing' : 'Add Wing'}</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg border-none bg-transparent p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-[18px]">
              <FormErrorSummary message={formErrors.capacity} />
              
              {/* Society field - only show dropdown for MASTER_ADMIN */}
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-[var(--border-default)] bg-transparent px-3.5 py-2.5 font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)]"
                >
                  Cancel
                </button>
                <AsyncButton
                  type="submit"
                  className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-2.5 font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--bg-tertiary)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
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
