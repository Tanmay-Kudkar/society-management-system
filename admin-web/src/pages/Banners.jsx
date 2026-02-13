import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { bannerApi } from '../../../api'
import { Plus, Search, X, Image, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, NumberInput } from '../components/FormComponents'

export default function Banners() {
  const { user, canManageBanners } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerApi.getAll().then(res => res.data),
    placeholderData: [],
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
  })

  const toggleMutation = useMutation({
    mutationFn: (banner) => bannerApi.update(banner.id, { ...banner, isActive: !banner.isActive }, user.id),
    onSuccess: () => queryClient.invalidateQueries(['banners']),
  })

  const filteredBanners = banners.filter(b => {
    const matchesSearch = b.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === '' || 
      (filterStatus === 'active' && b.isActive) || 
      (filterStatus === 'inactive' && !b.isActive)
    return matchesSearch && matchesStatus
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingBanner(null)
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

  return (
    <div>
      {/* Header */}
      <div className="banners-header">
        <div>
          <h1 className="banners-title">Banners</h1>
          <p className="banners-subtitle">Manage promotional banners for mobile app</p>
        </div>
        {canManageBanners() && (
          <button
            onClick={() => setShowModal(true)}
            className="banners-action-button"
          >
            <Plus size={20} />
            Add Banner
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="banners-filters">
        <div className="banners-filters-row">
          <div className="banners-search">
            <Search className="banners-search-icon" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="banners-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="banners-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Banners Grid */}
      {isLoading ? (
        <div className="banners-loading">
          <div className="banners-spinner"></div>
        </div>
      ) : (
        <div className="banners-grid">
          {filteredBanners.map((banner) => (
            <div key={banner.id} className="banners-card">
              {/* Banner Image */}
              <div className="banners-card-media">
                {banner.imageUrl ? (
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title}
                    className="banners-card-image"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="banners-card-empty">
                    <Image className="banners-card-empty-icon" />
                  </div>
                )}
                <div className={clsx(
                  'banners-status',
                  banner.isActive ? 'banners-status--active' : 'banners-status--inactive'
                )}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Banner Details */}
              <div className="banners-card-body">
                <h3 className="banners-card-title">{banner.title}</h3>
                {isPlatformLevel && <p className="banners-card-society">{banner.societyName || 'All Societies'}</p>}
                
                <div className="banners-card-meta">
                  <p>Start: {banner.startDate && new Date(banner.startDate).toLocaleDateString()}</p>
                  <p>End: {banner.endDate && new Date(banner.endDate).toLocaleDateString()}</p>
                  <p>Order: {banner.displayOrder}</p>
                </div>

                <div className="banners-card-actions">
                  <button
                    onClick={() => toggleMutation.mutate(banner)}
                    className={clsx(
                      'banners-toggle',
                      banner.isActive 
                        ? 'banners-toggle--deactivate'
                        : 'banners-toggle--activate'
                    )}
                  >
                    {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {banner.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { setEditingBanner(banner); setShowModal(true) }}
                    className="banners-icon-button banners-icon-button--edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(banner.id)}
                    className="banners-icon-button banners-icon-button--delete"
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
        <div className="banners-modal">
          <div className="banners-modal-card">
            <div className="banners-modal-header">
              <h3 className="banners-modal-title">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h3>
              <button onClick={closeModal} className="banners-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="banners-form">
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
              <div className="banners-form-grid">
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
              <div className="banners-form-grid">
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
              <div className="banners-form-actions">
                <button type="button" onClick={closeModal} className="banners-btn banners-btn--ghost">Cancel</button>
                <button type="submit" className="banners-btn banners-btn--primary">
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
