import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { useConfirmDialog } from '../../context'
import { societyApi, userApi, organizationApi } from '../../../../api'
import { parseApiError } from '../../utils'
import { Plus, Edit, Trash2, Search, X, Building2, Eye, EyeOff, ChevronRight, Home, Store, Briefcase, Layers } from 'lucide-react'
import { FormInput, PhoneInput, PincodeInput, NumberInput, FormTextarea, StateCitySelector } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

export default function Societies() {
  const { user, canManageSocieties } = useAuth()
  const confirmDialog = useConfirmDialog()
  const isPlatformOwner = user?.role === 'PLATFORM_OWNER'
  const isOrganizationOwner = user?.role === 'ORGANIZATION_OWNER'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingSociety, setEditingSociety] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formError, setFormError] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [organizationFilter, setOrganizationFilter] = useState('all')

  const { data: societies = [], isLoading, isError } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
  })

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: () => organizationApi.getAll().then(res => res.data).catch(() => []),
    enabled: isPlatformOwner,
    placeholderData: [],
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

  const hasOrganization = (society) => Boolean(
    society?.organizationId
    || society?.organizationName
    || society?.organization?.id
    || society?.organization?.name
    || (typeof society?.organization === 'string' && society.organization.trim())
  )

  const filteredSocieties = societies.filter((society) => {
    const matchesSearch =
      society.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      society.address?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (organizationFilter === 'assigned') return hasOrganization(society)
    if (organizationFilter === 'unassigned') return !hasOrganization(society)
    return true
  })

  const getOrganizationLabel = (society) => (
    society.organizationName
    || society.organization?.name
    || society.organization
    || null
  )

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
      ...(isPlatformOwner && formData.get('organizationId')
        ? { organizationId: parseInt(formData.get('organizationId'), 10) }
        : {}),
    }

    const shouldCreateAdmin = !editingSociety && (isPlatformOwner || isOrganizationOwner)
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
    <div className="societies-page">
      <WakeUpBanner />
      <HeroSkeleton statCount={3} />
      <FiltersSkeleton filterCount={2} />
      <CardGridSkeleton count={6} />
    </div>
  )

  return (
    <div className="societies-page">
      {/* Header with gradient background */}
      <div className="societies-hero">
        <div className="societies-hero-overlay"></div>
        <div className="societies-hero-content">
          <div>
            <h1 className="societies-hero-title">
              <Building2 className="societies-hero-icon" />
              Societies
            </h1>
            <p className="societies-hero-subtitle">Manage housing societies and their properties</p>
          </div>
          {canManageSocieties() && (
            <button
              onClick={() => { setEditingSociety(null); setFormError(''); setShowAdminPassword(false); setShowModal(true) }}
              className="societies-hero-button"
            >
              <Plus size={20} />
              Add Society
            </button>
          )}
        </div>
      </div>

      {/* Search with glass effect */}
      <div className="societies-search-card">
        <div className="societies-search">
          <Search className="societies-search-icon" />
          <input
            type="text"
            placeholder="Search societies by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="societies-search-input"
          />
        </div>
        <div className="societies-filters">
          <button
            type="button"
            className={`societies-filter-btn ${organizationFilter === 'all' ? 'societies-filter-btn--active' : ''}`}
            onClick={() => setOrganizationFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`societies-filter-btn ${organizationFilter === 'assigned' ? 'societies-filter-btn--active' : ''}`}
            onClick={() => setOrganizationFilter('assigned')}
          >
            Assigned
          </button>
          <button
            type="button"
            className={`societies-filter-btn ${organizationFilter === 'unassigned' ? 'societies-filter-btn--active' : ''}`}
            onClick={() => setOrganizationFilter('unassigned')}
          >
            Unassigned
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredSocieties.length === 0 ? (
        <div className="societies-empty">
          <div className="societies-empty-icon">
            <Building2 className="societies-empty-icon-svg" />
          </div>
          <h3 className="societies-empty-title">No societies found</h3>
          <p className="societies-empty-text">Get started by creating your first society</p>
          <button
            onClick={() => { setEditingSociety(null); setFormError(''); setShowAdminPassword(false); setShowModal(true) }}
            className="societies-primary-button"
          >
            <Plus size={20} />
            Add Society
          </button>
        </div>
      ) : (
        <div className="societies-grid">
          {filteredSocieties.map((society, index) => {
            const organizationLabel = getOrganizationLabel(society)

            return (
            <div 
              key={society.id} 
              className="societies-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card Header */}
              <div className="societies-card-header">
                <div 
                  className="societies-card-icon"
                  onClick={() => navigate(`/societies/${society.id}`)}
                >
                  <Building2 className="societies-card-icon-svg" />
                  <div className="societies-card-icon-glow"></div>
                </div>
                <div className="societies-card-actions">
                  <button
                    onClick={() => navigate(`/societies/${society.id}`)}
                    className="societies-icon-button"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => { setEditingSociety(society); setFormError(''); setShowAdminPassword(false); setShowModal(true) }}
                    className="societies-icon-button societies-icon-button--warn"
                    title="Edit society"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => confirmAndDeleteSociety(society)}
                    className="societies-icon-button societies-icon-button--danger"
                    title="Delete society"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Society Name & Address */}
              <h3 
                className="societies-card-title"
                onClick={() => navigate(`/societies/${society.id}`)}
              >
                {society.name}
              </h3>
              <p className="societies-card-address line-clamp-2">{society.address}</p>

              {/* Unit Stats Grid */}
              <div className="societies-stats">
                <div className="societies-stat societies-stat--blue">
                  <Home className="societies-stat-icon" />
                  <p className="societies-stat-value societies-stat-value--blue">
                    {society.totalFlats || society.actualFlats || 0}
                  </p>
                  <p className="societies-stat-label">Flats</p>
                </div>
                <div className="societies-stat societies-stat--green">
                  <Store className="societies-stat-icon" />
                  <p className="societies-stat-value societies-stat-value--green">
                    {society.totalShops || society.actualShops || 0}
                  </p>
                  <p className="societies-stat-label">Shops</p>
                </div>
                <div className="societies-stat societies-stat--purple">
                  <Briefcase className="societies-stat-icon" />
                  <p className="societies-stat-value societies-stat-value--purple">
                    {society.totalOffices || society.actualOffices || 0}
                  </p>
                  <p className="societies-stat-label">Offices</p>
                </div>
                <div className="societies-stat societies-stat--amber">
                  <Layers className="societies-stat-icon" />
                  <p className="societies-stat-value societies-stat-value--amber">
                    {society.totalWings || society.actualWings || 0}
                  </p>
                  <p className="societies-stat-label">Wings</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="societies-contact">
                <p className="societies-contact-row">
                  <span className="societies-contact-icon">🏢</span>
                  <span className={`societies-org-badge ${organizationLabel ? 'societies-org-badge--linked' : 'societies-org-badge--unassigned'}`}>
                    {organizationLabel || 'Unassigned'}
                  </span>
                </p>
                <p className="societies-contact-row">
                  <span className="societies-contact-icon">📍</span> 
                  {society.city}{society.state ? `, ${society.state}` : ''}
                </p>
                {society.telephone && (
                  <p className="societies-contact-row">
                    <span className="societies-contact-icon">📞</span> {society.telephone}
                  </p>
                )}
              </div>

              {/* View Details Button */}
              <button
                onClick={() => navigate(`/societies/${society.id}`)}
                className="societies-view-button"
              >
                View Details
                <ChevronRight size={16} className="societies-view-button-icon" />
              </button>
            </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="societies-modal">
          <div className="societies-modal-card">
            <div className="societies-modal-header">
              <div>
                <h3 className="societies-modal-title">
                  {editingSociety ? 'Edit Society' : 'Add New Society'}
                </h3>
                <p className="societies-modal-subtitle">
                  {editingSociety ? 'Update society details and capacity' : 'Create a new society with its properties'}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="societies-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="societies-modal-body">
              {formError && (
                <div className="societies-modal-alert">
                  <X size={16} className="societies-modal-alert-close" onClick={() => setFormError('')} />
                  {formError}
                </div>
              )}
              {/* Basic Information Section */}
              <div className="societies-modal-section">
                <h4 className="societies-modal-section-title">
                  <Building2 size={16} className="societies-modal-section-icon" />
                  Basic Information
                </h4>
                <div className="societies-modal-grid">
                  {isPlatformOwner && !editingSociety && (
                    <div className="societies-modal-full">
                      <label className="form-label">Organization</label>
                      <select
                        name="organizationId"
                        defaultValue=""
                        className="form-input"
                      >
                        <option value="">No organization (optional)</option>
                        {organizations.map((organization) => (
                          <option key={organization.id} value={organization.id}>
                            {organization.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="societies-modal-full">
                    <FormInput
                      label="Society Name"
                      name="name"
                      defaultValue={editingSociety?.name}
                      required
                      placeholder="Enter society name"
                    />
                  </div>
                  <div className="societies-modal-full">
                    <FormTextarea
                      label="Address"
                      name="address"
                      defaultValue={editingSociety?.address}
                      rows={2}
                      required
                      placeholder="Full address"
                    />
                  </div>
                  <div className="societies-modal-full">
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
                <div className="societies-modal-section societies-modal-section--divider">
                  <h4 className="societies-modal-section-title">
                    <Building2 size={16} className="societies-modal-section-icon societies-modal-section-icon--purple" />
                    Society Admin Credentials
                  </h4>
                  <p className="societies-modal-section-text">
                    These credentials will create the initial Society Admin linked to this society.
                  </p>
                  <div className="societies-modal-grid">
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
                    <div className="societies-password-field">
                      <FormInput
                        label="Admin Password"
                        name="adminPassword"
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        className="societies-password-toggle"
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
              <div className="societies-modal-section societies-modal-section--divider">
                <h4 className="societies-modal-section-title">
                  <Layers size={16} className="societies-modal-section-icon societies-modal-section-icon--purple" />
                  Property Capacity
                </h4>
                <div className="societies-modal-grid societies-modal-grid--compact">
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
              <div className="societies-modal-actions">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setShowAdminPassword(false) }}
                  className="societies-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="societies-modal-submit"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="societies-modal-submit-loading">
                      <div className="societies-modal-submit-spinner"></div>
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
