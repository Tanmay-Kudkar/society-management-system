import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { useConfirmDialog } from '../../context'
import { societyApi, userApi } from '../../../../api'
import { parseApiError } from '../../utils'
import { Plus, Edit, Trash2, Search, X, Building2, Eye, EyeOff, ChevronRight, Home, Store, Briefcase, Layers } from 'lucide-react'
import { FormInput, PhoneInput, PincodeInput, NumberInput, FormTextarea, StateCitySelector } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

export default function Societies() {
  const { user, canManageSocieties } = useAuth()
  const confirmDialog = useConfirmDialog()
  const isPlatformOwner = user?.role === 'MASTER_ADMIN'
  const isSocietyAdmin = user?.role === 'SOCIETY_ADMIN'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingSociety, setEditingSociety] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formError, setFormError] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const { data: societies = [], isLoading, isError } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: async ({ societyData, adminData }) => {
      const societyResponse = await societyApi.create(societyData, user.id)
      const createdSociety = societyResponse.data

      if (adminData && createdSociety?.id) {
        await userApi.create({
          name: adminData.name,
          email: adminData.email,
          password: adminData.password,
          phone: adminData.phone,
          role: 'SOCIETY_ADMIN',
          societyId: createdSociety.id,
        })
      }

      return createdSociety
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['societies'])
      queryClient.invalidateQueries(['users'])
      setShowModal(false)
      setFormError('')
      toast.success('Society created successfully')
    },
    onError: (error) => setFormError(parseApiError(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => societyApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['societies'])
      setShowModal(false)
      setEditingSociety(null)
      setFormError('')
      toast.success('Society updated successfully')
    },
    onError: (error) => setFormError(parseApiError(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, force = false }) => societyApi.delete(id, user.id, force),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries(['societies'])
      toast.success(variables?.force ? 'Society force-deleted successfully' : 'Society deleted successfully')
    },
    onError: (error) => toast.error(parseApiError(error)),
  })

  const confirmAndDeleteSociety = async (society) => {
    const confirmed = await confirmDialog({
      title: 'Delete Society',
      message: 'Are you sure you want to delete this society? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Society', value: society.name || '-' },
        { label: 'City', value: society.city || '-' },
        { label: 'Flats', value: society.totalFlats || society.actualFlats || 0 },
        { label: 'Shops', value: society.totalShops || society.actualShops || 0 },
      ],
      impacts: [
        {
          label: 'Configured Units',
          count:
            (society.totalFlats || society.actualFlats || 0)
            + (society.totalShops || society.actualShops || 0)
            + (society.totalOffices || society.actualOffices || 0),
        },
        { label: 'Society Record', count: 1 },
      ],
      caution: 'Deleting a society may affect linked users and records.',
    })

    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync({ id: society.id, force: false })
    } catch (error) {
      const serverMessage = error?.response?.data?.message || parseApiError(error)
      const shouldOfferForceDelete =
        error?.response?.status === 409 &&
        String(serverMessage).toLowerCase().includes('use force delete')

      if (!shouldOfferForceDelete) {
        return
      }

      const finalWarning = await confirmDialog({
        title: 'Final Warning: Force Delete Society',
        message: `Force delete society "${society.name}" and auto-clean all linked records?`,
        confirmText: 'Force Delete',
        cancelText: 'Cancel',
        tone: 'danger',
        details: [
          { label: 'Society', value: society.name || '-' },
          { label: 'City', value: society.city || '-' },
        ],
        caution: 'This is irreversible and will delete or unlink related records tied to this society.',
      })

      if (!finalWarning) return
      await deleteMutation.mutateAsync({ id: society.id, force: true })
    }
  }

  const filteredSocieties = societies.filter((society) => {
    const matchesSearch =
      society.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      society.address?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const societyData = {
      name: formData.get('name'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      pincode: formData.get('pincode'),
      registrationNumber: formData.get('registrationNumber'),
      email: formData.get('email'),
      telephone: formData.get('telephone'),
      totalFlats: parseInt(formData.get('totalFlats')) || 0,
      totalShops: parseInt(formData.get('totalShops')) || 0,
      totalOffices: parseInt(formData.get('totalOffices')) || 0,
      totalWings: parseInt(formData.get('totalWings')) || 0,
    }

    const shouldCreateAdmin = !editingSociety && (isPlatformOwner || isSocietyAdmin)
    const adminData = shouldCreateAdmin
      ? {
          name: formData.get('adminName')?.trim(),
          email: formData.get('adminEmail')?.trim(),
          password: formData.get('adminPassword')?.trim(),
          phone: formData.get('adminPhone')?.trim(),
        }
      : null

    if (adminData && (!adminData.name || !adminData.email || !adminData.password)) {
      setFormError('Society Admin name, email, and password are required')
      return
    }

    if (editingSociety) {
      updateMutation.mutate({ id: editingSociety.id, data: societyData })
    } else {
      createMutation.mutate({ societyData, adminData })
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div className="block">
      <WakeUpBanner />
      <HeroSkeleton statCount={3} />
      <FiltersSkeleton filterCount={2} />
      <CardGridSkeleton count={6} />
    </div>
  )

  return (
    <div className="block">
      {/* Header with gradient background */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)] opacity-40" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="inline-flex items-center gap-3 text-[1.9rem] font-bold">
              <Building2 className="h-8 w-8" />
              Societies
            </h1>
            <p className="mt-2 text-blue-100/90">Manage housing societies and their properties</p>
          </div>
          {canManageSocieties() && (
            <button
              onClick={() => { setEditingSociety(null); setFormError(''); setShowAdminPassword(false); setShowModal(true) }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/20 px-5 py-2.5 font-semibold text-white backdrop-blur-sm transition hover:-translate-y-px hover:shadow-lg"
            >
              <Plus size={20} />
              Add Society
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 rounded-xl border border-slate-400/40 bg-[var(--bg-card)] p-4 shadow-lg">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search societies by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-transparent py-3 pl-12 pr-4 text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredSocieties.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-blue-500/20 to-indigo-500/10">
            <Building2 className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">No societies found</h3>
          <p className="my-2 text-[var(--text-tertiary)]">Get started by creating your first society</p>
          <button
            onClick={() => { setEditingSociety(null); setFormError(''); setShowAdminPassword(false); setShowModal(true) }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
          >
            <Plus size={20} />
            Add Society
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSocieties.map((society, index) => (
            <div
              key={society.id}
              className="group rounded-[1.25rem] border border-slate-400/30 bg-[var(--bg-card)] p-6 shadow-lg transition hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="relative cursor-pointer rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg transition hover:opacity-90"
                  onClick={() => navigate(`/societies/${society.id}`)}
                >
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => navigate(`/societies/${society.id}`)}
                    className="rounded-xl p-2 text-[var(--text-tertiary)] transition hover:bg-blue-500/10 hover:text-blue-600"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => { setEditingSociety(society); setFormError(''); setShowAdminPassword(false); setShowModal(true) }}
                    className="rounded-xl p-2 text-[var(--text-tertiary)] transition hover:bg-amber-500/10 hover:text-amber-600"
                    title="Edit society"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => confirmAndDeleteSociety(society)}
                    className="rounded-xl p-2 text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-600"
                    title="Delete society"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3
                className="cursor-pointer text-[1.1rem] font-bold text-[var(--text-primary)] hover:text-blue-600"
                onClick={() => navigate(`/societies/${society.id}`)}
              >
                {society.name}
              </h3>
              <p className="line-clamp-2 mb-4 text-sm text-[var(--text-tertiary)]">{society.address}</p>

              <div className="mb-4 grid grid-cols-4 gap-2">
                <div className="rounded-xl bg-blue-500/10 p-2 text-center">
                  <Home className="mx-auto mb-1 h-4 w-4" />
                  <p className="text-base font-bold text-blue-600">{society.totalFlats || society.actualFlats || 0}</p>
                  <p className="text-[0.65rem] text-[var(--text-tertiary)]">Flats</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-2 text-center">
                  <Store className="mx-auto mb-1 h-4 w-4" />
                  <p className="text-base font-bold text-emerald-600">{society.totalShops || society.actualShops || 0}</p>
                  <p className="text-[0.65rem] text-[var(--text-tertiary)]">Shops</p>
                </div>
                <div className="rounded-xl bg-violet-500/10 p-2 text-center">
                  <Briefcase className="mx-auto mb-1 h-4 w-4" />
                  <p className="text-base font-bold text-violet-600">{society.totalOffices || society.actualOffices || 0}</p>
                  <p className="text-[0.65rem] text-[var(--text-tertiary)]">Offices</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-2 text-center">
                  <Layers className="mx-auto mb-1 h-4 w-4" />
                  <p className="text-base font-bold text-amber-600">{society.totalWings || society.actualWings || 0}</p>
                  <p className="text-[0.65rem] text-[var(--text-tertiary)]">Wings</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-slate-400/20 pt-3 text-sm text-[var(--text-tertiary)]">
                <p className="inline-flex items-center gap-1.5">
                  <span className="font-semibold">📍</span>
                  {society.city}{society.state ? `, ${society.state}` : ''}
                </p>
                {society.telephone && (
                  <p className="inline-flex items-center gap-1.5">
                    <span className="font-semibold">📞</span> {society.telephone}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate(`/societies/${society.id}`)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-px hover:shadow-xl [&>svg]:transition [&>svg]:hover:translate-x-1"
              >
                View Details
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-h-[calc(100vh-3rem)] max-w-[42rem] overflow-y-auto rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {editingSociety ? 'Edit Society' : 'Add New Society'}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  {editingSociety ? 'Update society details and capacity' : 'Create a new society with its properties'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-[var(--text-tertiary)] transition hover:bg-slate-400/20"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/15 px-3 py-2.5 text-sm text-red-800">
                  <X size={16} className="cursor-pointer shrink-0" onClick={() => setFormError('')} />
                  {formError}
                </div>
              )}
              <div className="flex flex-col gap-4">
                <h4 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <Building2 size={16} className="text-blue-500" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="col-span-full">
                    <FormInput
                      label="Society Name"
                      name="name"
                      defaultValue={editingSociety?.name}
                      required
                      placeholder="Enter society name"
                    />
                  </div>
                  <div className="col-span-full">
                    <FormTextarea
                      label="Address"
                      name="address"
                      defaultValue={editingSociety?.address}
                      rows={2}
                      required
                      placeholder="Full address"
                    />
                  </div>
                  <div className="col-span-full">
                    <StateCitySelector
                      stateDefaultValue={editingSociety?.state}
                      cityDefaultValue={editingSociety?.city}
                      stateRequired={true}
                      cityRequired={true}
                    />
                  </div>
                  <PincodeInput
                    name="pincode"
                    defaultValue={editingSociety?.pincode}
                    required
                  />
                  <FormInput
                    label="Registration Number"
                    name="registrationNumber"
                    defaultValue={editingSociety?.registrationNumber}
                    required
                    placeholder="Registration number"
                  />
                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={editingSociety?.email}
                    required
                    placeholder="Society email"
                  />
                  <PhoneInput
                    label="Telephone"
                    name="telephone"
                    defaultValue={editingSociety?.telephone}
                    required
                  />
                </div>
              </div>

              {!editingSociety && (isPlatformOwner || isOrganizationOwner) && (
                <div className="flex flex-col gap-4 border-t border-[var(--border-light)] pt-4">
                  <h4 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    <Building2 size={16} className="text-violet-500" />
                    Society Admin Credentials
                  </h4>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    These credentials will create the initial Society Admin linked to this society.
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormInput
                      label="Admin Name"
                      name="adminName"
                      required
                      placeholder="Enter society admin name"
                    />
                    <FormInput
                      label="Admin Email"
                      name="adminEmail"
                      type="email"
                      required
                      placeholder="admin@society.com"
                    />
                    <div className="relative">
                      <FormInput
                        label="Admin Password"
                        name="adminPassword"
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-9 inline-flex items-center justify-center rounded-lg border-none bg-transparent p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        title={showAdminPassword ? 'Hide password' : 'Show password'}
                      >
                        {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <PhoneInput
                      label="Admin Phone"
                      name="adminPhone"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Property Capacity Section */}
              <div className="flex flex-col gap-4 border-t border-[var(--border-light)] pt-4">
                <h4 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <Layers size={16} className="text-violet-500" />
                  Property Capacity
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <NumberInput
                    label="Total Flats"
                    name="totalFlats"
                    min={0}
                    defaultValue={editingSociety?.totalFlats || 0}
                    icon={Home}
                    required
                  />
                  <NumberInput
                    label="Total Shops"
                    name="totalShops"
                    min={0}
                    defaultValue={editingSociety?.totalShops || 0}
                    icon={Store}
                    required
                  />
                  <NumberInput
                    label="Total Offices"
                    name="totalOffices"
                    min={0}
                    defaultValue={editingSociety?.totalOffices || 0}
                    icon={Briefcase}
                    required
                  />
                  <NumberInput
                    label="Total Wings"
                    name="totalWings"
                    min={0}
                    defaultValue={editingSociety?.totalWings || 0}
                    icon={Layers}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-[var(--border-light)] pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setShowAdminPassword(false) }}
                  className="flex-1 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] py-3 px-4 font-semibold text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] py-3 px-4 font-semibold text-[var(--text-primary)] shadow-lg transition hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      {editingSociety ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingSociety ? 'Update Society' : 'Create Society'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
