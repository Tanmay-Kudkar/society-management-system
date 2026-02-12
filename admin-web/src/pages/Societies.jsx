import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { societyApi } from '../../../api'
import { parseApiError } from '../utils/validation'
import { Plus, Edit, Trash2, Search, X, Building2, Eye, ChevronRight, Home, Store, Briefcase, Layers } from 'lucide-react'
import { FormInput, PhoneInput, PincodeInput, NumberInput, FormTextarea, StateCitySelector } from '../components/FormComponents'

export default function Societies() {
  const { user, canManageSocieties } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingSociety, setEditingSociety] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formError, setFormError] = useState('')

  const { data: societies = [], isLoading } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data).catch(() => []),
  })

  const createMutation = useMutation({
    mutationFn: (data) => societyApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['societies'])
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
    mutationFn: (id) => societyApi.delete(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['societies'])
      toast.success('Society deleted successfully')
    },
    onError: (error) => toast.error(parseApiError(error)),
  })

  const filteredSocieties = societies.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
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

    if (editingSociety) {
      updateMutation.mutate({ id: editingSociety.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

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
              onClick={() => { setEditingSociety(null); setFormError(''); setShowModal(true) }}
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
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="societies-loading">
          <div className="societies-spinner">
            <Building2 className="societies-spinner-icon" />
          </div>
        </div>
      ) : filteredSocieties.length === 0 ? (
        <div className="societies-empty">
          <div className="societies-empty-icon">
            <Building2 className="societies-empty-icon-svg" />
          </div>
          <h3 className="societies-empty-title">No societies found</h3>
          <p className="societies-empty-text">Get started by creating your first society</p>
          <button
            onClick={() => { setEditingSociety(null); setFormError(''); setShowModal(true) }}
            className="societies-primary-button"
          >
            <Plus size={20} />
            Add Society
          </button>
        </div>
      ) : (
        <div className="societies-grid">
          {filteredSocieties.map((society, index) => (
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
                    onClick={() => { setEditingSociety(society); setFormError(''); setShowModal(true) }}
                    className="societies-icon-button societies-icon-button--warn"
                    title="Edit society"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this society?')) {
                        deleteMutation.mutate(society.id)
                      }
                    }}
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
          ))}
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
                      cityRequired={true}
                    />
                  </div>
                  <PincodeInput
                    name="pincode"
                    defaultValue={editingSociety?.pincode}
                  />
                  <FormInput
                    label="Registration Number"
                    name="registrationNumber"
                    defaultValue={editingSociety?.registrationNumber}
                    placeholder="Registration number"
                  />
                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={editingSociety?.email}
                    placeholder="Society email"
                  />
                  <PhoneInput
                    label="Telephone"
                    name="telephone"
                    defaultValue={editingSociety?.telephone}
                  />
                </div>
              </div>

              {/* Property Capacity Section */}
              <div className="societies-modal-section societies-modal-section--divider">
                <h4 className="societies-modal-section-title">
                  <Layers size={16} className="societies-modal-section-icon societies-modal-section-icon--purple" />
                  Property Capacity (Optional)
                </h4>
                <p className="societies-modal-section-text">
                  Set the total capacity for planning purposes. Actual counts are calculated automatically.
                </p>
                <div className="societies-modal-grid societies-modal-grid--compact">
                  <NumberInput
                    label="Total Flats"
                    name="totalFlats"
                    min={0}
                    defaultValue={editingSociety?.totalFlats || 0}
                    icon={Home}
                  />
                  <NumberInput
                    label="Total Shops"
                    name="totalShops"
                    min={0}
                    defaultValue={editingSociety?.totalShops || 0}
                    icon={Store}
                  />
                  <NumberInput
                    label="Total Offices"
                    name="totalOffices"
                    min={0}
                    defaultValue={editingSociety?.totalOffices || 0}
                    icon={Briefcase}
                  />
                  <NumberInput
                    label="Total Wings"
                    name="totalWings"
                    min={0}
                    defaultValue={editingSociety?.totalWings || 0}
                    icon={Layers}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="societies-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
