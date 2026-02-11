import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationApi } from '../../../api'
import { useToast } from '../context/ToastContext'
import { parseApiError } from '../utils/validation'
import { FormInput, PhoneInput, NumberInput, SmartSelect } from '../components/FormComponents'
import { Building2, Plus, Edit, Trash2, Search, X } from 'lucide-react'
import '../styles/pages/organizations.css'

const subscriptionOptions = [
  { value: 'FREE', label: 'Free' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LIFETIME', label: 'Lifetime' },
]

const foundingOptions = [
  { value: 'false', label: 'No' },
  { value: 'true', label: 'Yes' },
]

export default function Organizations() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formError, setFormError] = useState('')

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll().then(res => res.data).catch(() => []),
  })

  const createMutation = useMutation({
    mutationFn: (data) => organizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations'])
      setShowModal(false)
      setFormError('')
      toast.success('Organization created successfully')
    },
    onError: (error) => setFormError(parseApiError(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => organizationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations'])
      setShowModal(false)
      setEditingOrg(null)
      setFormError('')
      toast.success('Organization updated successfully')
    },
    onError: (error) => setFormError(parseApiError(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => organizationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations'])
      toast.success('Organization deleted successfully')
    },
    onError: (error) => toast.error(parseApiError(error)),
  })

  const filteredOrganizations = organizations.filter(org => {
    const nameMatch = org.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const ownerMatch = org.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    return nameMatch || ownerMatch
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const maxSocietiesRaw = formData.get('maxSocieties')
    const maxSocieties = maxSocietiesRaw ? parseInt(maxSocietiesRaw, 10) : null

    const data = {
      name: formData.get('name'),
      ownerName: formData.get('ownerName'),
      ownerEmail: formData.get('ownerEmail'),
      ownerPhone: formData.get('ownerPhone'),
      subscriptionType: formData.get('subscriptionType') || 'FREE',
      maxSocieties: Number.isNaN(maxSocieties) ? null : maxSocieties,
      isFoundingMember: formData.get('isFoundingMember') === 'true',
    }

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (org) => {
    setEditingOrg(org)
    setFormError('')
    setShowModal(true)
  }

  const handleDelete = (org) => {
    if (window.confirm(`Delete organization "${org.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(org.id)
    }
  }

  return (
    <div className="org-page">
      <header className="org-hero">
        <div className="org-hero__glow" />
        <div className="org-hero__grid">
          <div>
            <h1 className="org-hero__title">
              <Building2 size={28} />
              Organizations
            </h1>
            <p className="org-hero__subtitle">Manage organizations and subscription limits</p>
          </div>
          <button
            onClick={() => { setEditingOrg(null); setFormError(''); setShowModal(true) }}
            className="org-hero__button"
          >
            <Plus size={18} />
            Add Organization
          </button>
        </div>
      </header>

      <div className="org-search">
        <div className="org-search__field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by organization or owner email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="org-search__input"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="org-empty">Loading organizations...</div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="org-empty">
          <h3>No organizations found</h3>
          <p>Create your first organization to get started</p>
          <button
            onClick={() => { setEditingOrg(null); setFormError(''); setShowModal(true) }}
            className="org-empty__button"
          >
            <Plus size={18} />
            Add Organization
          </button>
        </div>
      ) : (
        <div className="org-grid">
          {filteredOrganizations.map((org) => (
            <div key={org.id} className="org-card">
              <div className="org-card__header">
                <div>
                  <h3 className="org-card__name">{org.name}</h3>
                  <p className="org-card__meta">{org.ownerName || 'No owner assigned'}</p>
                  <p className="org-card__meta org-card__meta--email">{org.ownerEmail || 'No owner email'}</p>
                </div>
                <div className="org-card__actions">
                  <button
                    onClick={() => handleEdit(org)}
                    className="org-icon-btn org-icon-btn--edit"
                    title="Edit organization"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    className="org-icon-btn org-icon-btn--delete"
                    title="Delete organization"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="org-stats">
                <div className="org-stat">
                  <p className="org-stat__label">Subscription</p>
                  <p className="org-stat__value">{org.subscriptionType || 'FREE'}</p>
                </div>
                <div className="org-stat">
                  <p className="org-stat__label">Status</p>
                  <p className="org-stat__value">{org.subscriptionStatus || 'ACTIVE'}</p>
                </div>
                <div className="org-stat">
                  <p className="org-stat__label">Societies</p>
                  <p className="org-stat__value">
                    {org.societyCount || 0} / {org.maxSocieties ?? 'Unlimited'}
                  </p>
                </div>
                <div className="org-stat">
                  <p className="org-stat__label">Founding</p>
                  <p className="org-stat__value">{org.isFoundingMember ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="org-modal">
          <div className="org-modal__panel">
            <div className="org-modal__header">
              <div>
                <h3>{editingOrg ? 'Edit Organization' : 'Add New Organization'}</h3>
                <p>
                  {editingOrg ? 'Update organization details and subscription limits' : 'Create a new organization'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="org-modal__close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="org-form">
              {formError && (
                <div className="org-form__error">
                  <X size={16} className="org-form__close" onClick={() => setFormError('')} />
                  {formError}
                </div>
              )}

              <div>
                <h4>Basic Information</h4>
                <div className="org-form__grid">
                  <div>
                    <FormInput
                      label="Organization Name"
                      name="name"
                      defaultValue={editingOrg?.name || ''}
                      required
                    />
                  </div>
                  <FormInput
                    label="Owner Name"
                    name="ownerName"
                    defaultValue={editingOrg?.ownerName || ''}
                  />
                  <FormInput
                    label="Owner Email"
                    name="ownerEmail"
                    type="email"
                    defaultValue={editingOrg?.ownerEmail || ''}
                  />
                  <PhoneInput
                    label="Owner Phone"
                    name="ownerPhone"
                    defaultValue={editingOrg?.ownerPhone || ''}
                  />
                  <SmartSelect
                    label="Subscription Type"
                    name="subscriptionType"
                    defaultValue={editingOrg?.subscriptionType || 'FREE'}
                    options={subscriptionOptions}
                  />
                  <NumberInput
                    label="Max Societies"
                    name="maxSocieties"
                    min={0}
                    defaultValue={editingOrg?.maxSocieties ?? ''}
                  />
                  <SmartSelect
                    label="Founding Member"
                    name="isFoundingMember"
                    defaultValue={editingOrg?.isFoundingMember ? 'true' : 'false'}
                    options={foundingOptions}
                  />
                </div>
              </div>

              <div className="org-form__footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="org-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="org-btn org-btn--primary"
                >
                  {editingOrg ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
