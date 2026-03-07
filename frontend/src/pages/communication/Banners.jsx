import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { bannerApi } from '../../../../api'
import { Plus, Search, X, Image, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, NumberInput, AsyncButton } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

export default function Banners() {
  const { user, canManageBanners } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

  const { data: banners = [], isLoading, isError } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerApi.getAll().then(res => res.data),
  })



  const createMutation = useMutation({
    mutationFn: (data) => bannerApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['banners'])
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bannerApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['banners'])
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => bannerApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['banners']),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete banner')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (banner) => bannerApi.update(banner.id, { ...banner, isActive: !banner.isActive }, user.id),
    onSuccess: () => queryClient.invalidateQueries(['banners']),
  })

  const filteredBanners = useMemo(() => {
    return banners.filter(b => {
      const matchesSearch = b.title?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === '' || 
        (filterStatus === 'active' && b.isActive) || 
        (filterStatus === 'inactive' && !b.isActive)
      return matchesSearch && matchesStatus
    })
  }, [banners, searchTerm, filterStatus])

  const closeModal = () => {
    setShowModal(false)
    setEditingBanner(null)
  }

  const confirmAndDeleteBanner = async (banner) => {
    const confirmed = await confirmDialog({
      title: 'Delete Banner',
      message: 'Are you sure you want to delete this banner? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Title', value: banner.title || '-' },
        { label: 'Status', value: banner.isActive ? 'Active' : 'Inactive' },
      ],
      caution: 'This action permanently removes the banner.',
    })
    if (confirmed) {
      deleteMutation.mutate(banner.id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      societyId: user.societyId,
      title: formData.get('title'),
      imageUrl: formData.get('imageUrl'),
      redirectUrl: formData.get('redirectUrl') || null,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      displayOrder: parseInt(formData.get('displayOrder')) || 1,
    }
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FiltersSkeleton filterCount={1} />
      <CardGridSkeleton count={4} showAvatar={false} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Banners</h1>
          <p className="mt-1 text-[var(--text-tertiary)]">Manage promotional banners for mobile app</p>
        </div>
        {canManageBanners() && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-[var(--text-primary)] transition duration-200 hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/20 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus size={20} />
            Add Banner
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] px-3 py-2 pl-10 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-auto sm:min-w-[170px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Banners Grid */}
      {(
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBanners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
              {/* Banner Image */}
              <div className="relative aspect-video bg-[var(--bg-tertiary)]">
                {banner.imageUrl ? (
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-12 w-12 text-slate-300" />
                  </div>
                )}
                <div className={clsx(
                  'absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold',
                  banner.isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-white/70 text-slate-700 backdrop-blur'
                )}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Banner Details */}
              <div className="p-4">
                <h3 className="mb-1 font-semibold text-[var(--text-primary)]">{banner.title}</h3>
                {isPlatformLevel && <p className="mb-3 text-sm text-[var(--text-tertiary)]">{banner.societyName || 'All Societies'}</p>}
                
                <div className="mb-4 grid gap-1 text-xs text-[var(--text-tertiary)]">
                  <p>Start: {banner.startDate && new Date(banner.startDate).toLocaleDateString()}</p>
                  <p>End: {banner.endDate && new Date(banner.endDate).toLocaleDateString()}</p>
                  <p>Order: {banner.displayOrder}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate(banner)}
                    className={clsx(
                      'inline-flex flex-1 items-center justify-center gap-1 rounded-[10px] border border-transparent px-3 py-1.5 text-xs transition',
                      banner.isActive 
                        ? 'bg-[var(--bg-tertiary)] text-slate-700 hover:bg-white/10'
                        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                    )}
                  >
                    {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {banner.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { setEditingBanner(banner); setShowModal(true) }}
                    className="inline-flex items-center justify-center rounded-[10px] border border-transparent bg-transparent p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => confirmAndDeleteBanner(banner)}
                    className="inline-flex items-center justify-center rounded-[10px] border border-transparent bg-transparent p-1.5 text-red-500 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-[520px] overflow-y-auto rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border-light)] bg-inherit p-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h3>
              <button onClick={closeModal} className="rounded-lg border-0 bg-transparent p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-4">
              <FormInput
                label="Title"
                name="title"
                defaultValue={editingBanner?.title || ''}
                required
              />
              <FormInput
                label="Image URL"
                name="imageUrl"
                type="url"
                defaultValue={editingBanner?.imageUrl || ''}
                required
                placeholder="https://example.com/image.jpg"
              />
              <FormInput
                label="Redirect URL (Optional)"
                name="redirectUrl"
                type="url"
                defaultValue={editingBanner?.redirectUrl || ''}
                placeholder="https://example.com"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Start Date"
                  name="startDate"
                  type="date"
                  defaultValue={editingBanner?.startDate || ''}
                  required
                />
                <FormInput
                  label="End Date"
                  name="endDate"
                  type="date"
                  defaultValue={editingBanner?.endDate || ''}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumberInput
                  label="Display Order"
                  name="displayOrder"
                  defaultValue={editingBanner?.displayOrder || 1}
                  min={1}
                  required
                />
                <SmartSelect
                  label="Status"
                  name="isActive"
                  defaultValue={editingBanner?.isActive?.toString() || 'true'}
                  required
                  options={[
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                  ]}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 rounded-[10px] border border-[var(--border-light)] bg-[var(--bg-card)] px-4 py-2 font-semibold text-slate-700 transition hover:bg-[var(--bg-tertiary)]">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="flex-1 rounded-[10px] border border-transparent bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  loadingText={editingBanner ? 'Updating...' : 'Creating...'}
                >
                  {editingBanner ? 'Update' : 'Create'}
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
