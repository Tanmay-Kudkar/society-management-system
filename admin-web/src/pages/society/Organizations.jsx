import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { organizationApi } from '../../../../api'
import { useToast } from '../../context'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { parseApiError } from '../../utils'
import { FormInput, PhoneInput, NumberInput, SmartSelect } from '../../components'
import {
  Building2, Plus, Edit, Trash2, Search, X, Crown, Star, Zap, Gift,
  ChevronRight, Eye, EyeOff, Shield, TrendingUp,
  Mail, Phone, User
} from 'lucide-react'
import '../../styles/pages/organizations.css'

const subscriptionOptions = [
  { value: 'FREE', label: 'Free' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'LIFETIME', label: 'Lifetime' },
]

// Default max societies per tier
const tierDefaults = { FREE: 1, BASIC: 3, PREMIUM: 10, LIFETIME: 999999 }

// Subscription tier config for UI
const subscriptionConfig = {
  FREE:     { icon: Gift,  color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Free',     limit: 1  },
  BASIC:    { icon: Zap,   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Basic',    limit: 3  },
  PREMIUM:  { icon: Star,  color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  label: 'Premium',  limit: 10 },
  LIFETIME: { icon: Crown, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Lifetime', limit: '∞' },
}

export default function Organizations() {
  const { user } = useAuth()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const isPlatformOwner = user?.role === 'PLATFORM_OWNER'
  const [showModal, setShowModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Controlled subscription type so we can auto-set maxSocieties
  const [formSubType, setFormSubType] = useState('FREE')
  const [formMaxSocieties, setFormMaxSocieties] = useState('')

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: () => organizationApi.getAll().then(res => res.data).catch(() => []),
    enabled: !!user?.id,
    placeholderData: [],
  })

  const createMutation = useMutation({
    mutationFn: (data) => organizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations'])
      setShowModal(false)
      setFormError('')
      setShowPassword(false)
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
      setShowPassword(false)
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

  const filteredOrganizations = useMemo(() =>
    organizations.filter(org => {
      const q = searchTerm.toLowerCase()
      return org.name?.toLowerCase().includes(q) ||
             org.ownerEmail?.toLowerCase().includes(q) ||
             org.ownerName?.toLowerCase().includes(q)
    }),
    [organizations, searchTerm]
  )

  const handleSubscriptionChange = (e) => {
    const tier = e.target.value || 'FREE'
    setFormSubType(tier)
    const defaultMax = tierDefaults[tier] || 1
    setFormMaxSocieties(tier === 'LIFETIME' ? '' : String(defaultMax))
  }

  const openModal = (org = null) => {
    setEditingOrg(org)
    setFormError('')
    setShowPassword(false)
    const subType = org?.subscriptionType || 'FREE'
    setFormSubType(subType)
    setFormMaxSocieties(org?.maxSocieties != null && org.maxSocieties < 2147483647 ? String(org.maxSocieties) : '')
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const maxRaw = formData.get('maxSocieties')
    const maxSocieties = maxRaw ? parseInt(maxRaw, 10) : null

    const data = {
      name: formData.get('name'),
      ownerName: formData.get('ownerName'),
      ownerEmail: formData.get('ownerEmail'),
      ownerPhone: formData.get('ownerPhone'),
      ...(formData.get('ownerPassword')
        ? { ownerPassword: formData.get('ownerPassword') }
        : {}),
      ...(isPlatformOwner
        ? {
            maxSocieties: Number.isNaN(maxSocieties) ? null : maxSocieties,
            subscriptionType: formSubType || 'FREE',
          }
        : {}),
    }

    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = async (org) => {
    const confirmed = await confirmDialog({
      title: 'Delete Organization',
      message: `Delete organization "${org.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Organization', value: org.name || '-' },
        { label: 'Owner', value: org.ownerName || '-' },
        { label: 'Subscription', value: org.subscriptionType || '-' },
        { label: 'Societies', value: org.societyCount || 0 },
      ],
      impacts: [
        { label: 'Organization Record', count: 1 },
        { label: 'Linked Societies', count: org.societyCount || 0 },
      ],
      caution: 'Deleting an organization may affect all linked societies.',
    })
    if (confirmed) {
      deleteMutation.mutate(org.id)
    }
  }

  const getSocietyProgress = (org) => {
    const count = org.societyCount || 0
    const max = org.maxSocieties || 1
    const isUnlimited = max >= 2147483647 || org.subscriptionType === 'LIFETIME'
    const pct = isUnlimited ? (count > 0 ? 100 : 0) : Math.min((count / max) * 100, 100)
    return { count, max, pct, isUnlimited }
  }

  return (
    <div className="org-page">
      <header className="org-hero">
        <div className="org-hero__grid">
          <div>
            <h1 className="org-hero__title">
              <Building2 size={28} />
              Organizations
            </h1>
            <p className="org-hero__subtitle">Manage organizations, subscriptions &amp; societies</p>
          </div>
          <div className="org-hero__stats">
            <div className="org-hero__stat">
              <span className="org-hero__stat-value">{organizations.length}</span>
              <span className="org-hero__stat-label">Total</span>
            </div>
            <div className="org-hero__stat">
              <span className="org-hero__stat-value">{organizations.filter(o => o.subscriptionStatus === 'ACTIVE').length}</span>
              <span className="org-hero__stat-label">Active</span>
            </div>
            <div className="org-hero__stat">
              <span className="org-hero__stat-value">{organizations.filter(o => o.subscriptionType === 'LIFETIME').length}</span>
              <span className="org-hero__stat-label">Lifetime</span>
            </div>
          </div>
          {isPlatformOwner && (
            <button onClick={() => openModal()} className="org-hero__button">
              <Plus size={18} />
              Add Organization
            </button>
          )}
        </div>
      </header>

      <div className="org-search">
        <div className="org-search__field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, owner, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="org-search__input"
          />
          {searchTerm && (
            <button className="org-search__clear" onClick={() => setSearchTerm('')}><X size={16} /></button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="org-empty">Loading organizations...</div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="org-empty">
          <Building2 size={48} className="org-empty__icon" />
          <h3>No organizations found</h3>
          <p>Create your first organization to get started</p>
          {isPlatformOwner && (
            <button onClick={() => openModal()} className="org-empty__button">
              <Plus size={18} />
              Add Organization
            </button>
          )}
        </div>
      ) : (
        <div className="org-grid">
          {filteredOrganizations.map((org) => {
            const tier = subscriptionConfig[org.subscriptionType] || subscriptionConfig.FREE
            const TierIcon = tier.icon
            const progress = getSocietyProgress(org)

            return (
              <div key={org.id} className="org-card">
                {/* Subscription badge — top-left inline */}
                <div className="org-card__tier-badge" style={{ background: tier.bg, color: tier.color }}>
                  <TierIcon size={13} />
                  {tier.label}
                </div>

                {/* Card header */}
                <div className="org-card__header">
                  <div className="org-card__identity">
                    <div className="org-card__avatar" style={{ background: tier.bg, color: tier.color }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 className="org-card__name">{org.name}</h3>
                    </div>
                  </div>
                  <div className="org-card__actions">
                    <button onClick={() => openModal(org)} className="org-icon-btn org-icon-btn--edit" title="Edit">
                      <Edit size={16} />
                    </button>
                    {isPlatformOwner && (
                      <button onClick={() => handleDelete(org)} className="org-icon-btn org-icon-btn--delete" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Owner info */}
                <div className="org-card__owner">
                  <div className="org-card__owner-row">
                    <User size={14} />
                    <span>{org.ownerName || 'No owner'}</span>
                  </div>
                  <div className="org-card__owner-row">
                    <Mail size={14} />
                    <span>{org.ownerEmail || '—'}</span>
                  </div>
                  {org.ownerPhone && (
                    <div className="org-card__owner-row">
                      <Phone size={14} />
                      <span>{org.ownerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Status chip */}
                <div className="org-card__stats-row">
                  <div className={`org-card__stat-chip org-card__status-chip--${(org.subscriptionStatus || 'ACTIVE').toLowerCase()}`}>
                    <Shield size={13} />
                    {org.subscriptionStatus || 'ACTIVE'}
                  </div>
                </div>

                {/* Society progress */}
                <div className="org-card__progress-section">
                  <div className="org-card__progress-header">
                    <span>Societies</span>
                    <span className="org-card__progress-count">
                      {progress.count} / {progress.isUnlimited ? '∞' : progress.max}
                    </span>
                  </div>
                  <div className="org-card__progress-bar">
                    <div
                      className="org-card__progress-fill"
                      style={{
                        width: `${progress.pct}%`,
                        background: progress.pct >= 90 && !progress.isUnlimited ? '#ef4444' : tier.color,
                      }}
                    />
                  </div>
                </div>

                <button
                  className="org-card__expand-btn"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                >
                  <span>View Organization Page</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="org-modal" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="org-modal__panel">
            <div className="org-modal__header">
              <div>
                <h3>{editingOrg ? 'Edit Organization' : 'Add New Organization'}</h3>
                <p>{editingOrg ? 'Update organization details and subscription' : 'Create a new organization with owner credentials'}</p>
              </div>
              <button onClick={() => { setShowModal(false); setShowPassword(false) }} className="org-modal__close">
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

              {/* Basic Information */}
              <div className="org-form__section">
                <h4><Building2 size={16} /> Organization Details</h4>
                <div className="org-form__grid">
                  <FormInput label="Organization Name" name="name" defaultValue={editingOrg?.name || ''} required />
                </div>
              </div>

              {/* Owner Information */}
              <div className="org-form__section">
                <h4><User size={16} /> Owner Information</h4>
                <div className="org-form__grid">
                  <FormInput label="Owner Name" name="ownerName" defaultValue={editingOrg?.ownerName || ''} required />
                  <FormInput label="Owner Email" name="ownerEmail" type="email" defaultValue={editingOrg?.ownerEmail || ''} required />
                  <PhoneInput label="Owner Phone" name="ownerPhone" defaultValue={editingOrg?.ownerPhone || ''} required />
                  <div className="org-form__password-field">
                    <FormInput
                      label={editingOrg ? 'New Password (optional)' : 'Owner Password'}
                      name="ownerPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingOrg ? 'Leave blank to keep current' : 'Password for owner login'}
                      required={!editingOrg}
                    />
                    <button
                      type="button"
                      className="org-form__toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subscription - Platform Owner only */}
              {isPlatformOwner && (
                <div className="org-form__section">
                  <h4><TrendingUp size={16} /> Subscription &amp; Limits</h4>
                  <div className="org-form__grid">
                    <SmartSelect
                      label="Subscription Type"
                      name="subscriptionType"
                      value={formSubType}
                      onChange={handleSubscriptionChange}
                      options={subscriptionOptions}
                      required
                    />
                    <NumberInput
                      label="Max Societies"
                      name="maxSocieties"
                      min={0}
                      value={formMaxSocieties}
                      onChange={(e) => setFormMaxSocieties(e.target.value)}
                      placeholder={formSubType === 'LIFETIME' ? 'Unlimited' : `Default: ${tierDefaults[formSubType] || 1}`}
                      disabled={formSubType === 'LIFETIME'}
                      required={formSubType !== 'LIFETIME'}
                    />
                  </div>
                  <div className="org-form__tier-info">
                    <p><Gift size={13} /> <strong>Free:</strong> 1 society</p>
                    <p><Zap size={13} /> <strong>Basic:</strong> Up to 3 societies</p>
                    <p><Star size={13} /> <strong>Premium:</strong> Up to 10 societies</p>
                    <p><Crown size={13} /> <strong>Lifetime:</strong> Unlimited societies</p>
                  </div>
                </div>
              )}

              <div className="org-form__footer">
                <button type="button" onClick={() => { setShowModal(false); setShowPassword(false) }} className="org-btn">
                  Cancel
                </button>
                <button type="submit" className="org-btn org-btn--primary">
                  {editingOrg ? 'Update Organization' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
