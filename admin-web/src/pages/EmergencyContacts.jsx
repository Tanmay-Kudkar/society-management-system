import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { emergencyContactApi } from '../../../api'
import { Plus, Search, X, Phone, Edit, Trash2, AlertCircle, CheckCircle, Upload } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, PhoneInput, SmartSelect } from '../components/FormComponents'
import BulkImportModal from '../components/BulkImportModal'

const contactTypeClasses = {
  POLICE: 'emergency-type--police',
  FIRE: 'emergency-type--fire',
  AMBULANCE: 'emergency-type--ambulance',
  HOSPITAL: 'emergency-type--hospital',
  DOCTOR: 'emergency-type--doctor',
  SECURITY: 'emergency-type--security',
  ELECTRICIAN: 'emergency-type--electrician',
  PLUMBER: 'emergency-type--plumber',
  OTHER: 'emergency-type--other',
}

export default function EmergencyContacts() {
  const { user, isCommitteeLevel, canManageEmergencyContacts } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contactToDelete, setContactToDelete] = useState(null)
  const [editingContact, setEditingContact] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
  
  // Check if user can delete a specific contact
  const canDelete = (contact) => {
    // Admin/Committee can delete any contact
    if (isCommitteeLevel && isCommitteeLevel()) return true
    // Users can delete contacts they created
    return contact.createdById && contact.createdById === user?.id
  }
  
  // Check if user can edit a specific contact
  const canEdit = (contact) => {
    // Only admin/committee can edit contacts
    return isCommitteeLevel && isCommitteeLevel()
  }

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: () => emergencyContactApi.getAll().then(res => res.data),
    placeholderData: [],
  })



  const createMutation = useMutation({
    mutationFn: (data) => emergencyContactApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emergencyContacts'])
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => emergencyContactApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emergencyContacts'])
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => emergencyContactApi.delete(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['emergencyContacts'])
      toast.success('Emergency contact deleted successfully')
      setShowDeleteModal(false)
      setContactToDelete(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete contact')
      setShowDeleteModal(false)
      setContactToDelete(null)
    },
  })

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (contactToDelete) {
      deleteMutation.mutate(contactToDelete.id)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setContactToDelete(null)
  }

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone?.includes(searchTerm)
    const matchesCategory = !filterCategory || c.contactType === filterCategory
    return matchesSearch && matchesCategory
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingContact(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      societyId: user.societyId,
      name: formData.get('name'),
      phone: formData.get('phone'),
      alternatePhone: formData.get('alternatePhone') || null,
      contactType: formData.get('contactType'),
      address: formData.get('address') || null,
      notes: formData.get('notes') || null,
    }
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Group contacts by contactType
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const contactType = contact.contactType || 'OTHER'
    if (!acc[contactType]) acc[contactType] = []
    acc[contactType].push(contact)
    return acc
  }, {})

  return (
    <div className="emergency-page">
      {/* Header */}
      <div className="emergency-header">
        <div>
          <h1 className="emergency-title">Emergency Contacts</h1>
          <p className="emergency-subtitle">Manage emergency contact directory</p>
        </div>
        {canManageEmergencyContacts() && (
          <div className="emergency-actions">
            <button
              onClick={() => setShowBulkImport(true)}
              className="emergency-bulk-button"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="emergency-add-button"
            >
              <Plus size={20} />
              Add Contact
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="emergency-filters">
        <div className="emergency-filters-row">
          <div className="emergency-search">
            <Search className="emergency-search-icon" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="emergency-search-input"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="emergency-filter-select"
          >
            <option value="">All Categories</option>
            <option value="POLICE">Police</option>
            <option value="FIRE">Fire</option>
            <option value="AMBULANCE">Ambulance</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="SECURITY">Security</option>
            <option value="ELECTRICIAN">Electrician</option>
            <option value="PLUMBER">Plumber</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Contacts by Category */}
      {isLoading ? (
        <div className="emergency-loading">
          <div className="emergency-spinner" />
        </div>
      ) : (
        <div className="emergency-groups">
          {Object.entries(groupedContacts).map(([contactType, contactTypeContacts]) => (
            <div key={contactType} className="emergency-group">
              <div className="emergency-group-header">
                <div className="emergency-group-title">
                  <AlertCircle className="emergency-group-icon" />
                  <h3 className="emergency-group-name">{contactType}</h3>
                  <span className="emergency-group-count">({contactTypeContacts.length})</span>
                </div>
              </div>
              <div className="emergency-list">
                {contactTypeContacts.map((contact) => (
                  <div key={contact.id} className="emergency-item">
                    <div className="emergency-item-row">
                      <div className="emergency-item-main">
                        <div className={clsx('emergency-type-icon', contactTypeClasses[contactType] || 'emergency-type--other')}>
                          <Phone className={clsx('emergency-type-icon-svg', contactTypeClasses[contactType] || 'emergency-type--other')} />
                        </div>
                        <div className="emergency-item-info">
                          <div className="emergency-item-title">
                            <h4 className="emergency-item-name">{contact.name}</h4>
                            {!contact.isActive && (
                              <span className="emergency-status-badge">Inactive</span>
                            )}
                          </div>
                          <p className="emergency-item-phone">{contact.phone}</p>
                          {contact.alternatePhone && (
                            <p className="emergency-item-alt">Alt: {contact.alternatePhone}</p>
                          )}
                          {contact.address && (
                            <p className="emergency-item-address">{contact.address}</p>
                          )}
                          {contact.notes && (
                            <p className="emergency-item-notes">{contact.notes}</p>
                          )}
                          {isPlatformLevel && contact.societyName && (
                            <p className="emergency-item-society">{contact.societyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="emergency-item-actions">
                        <a
                          href={`tel:${contact.phone}`}
                          className="emergency-call-link"
                        >
                          <Phone size={18} />
                        </a>
                        {canEdit(contact) && (
                          <button
                            onClick={() => { setEditingContact(contact); setShowModal(true) }}
                            className="emergency-edit-button"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {canDelete(contact) && (
                          <button
                            onClick={() => handleDeleteClick(contact)}
                            disabled={deleteMutation.isPending}
                            className="emergency-delete-button"
                            title={contact.createdById === user?.id ? 'Delete your contact' : 'Delete contact'}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="emergency-modal">
          <div className="emergency-modal-card">
            <div className="emergency-modal-header">
              <h3 className="emergency-modal-title">{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</h3>
              <button onClick={closeModal} className="emergency-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="emergency-modal-body">
              <FormInput
                label="Name"
                name="name"
                defaultValue={editingContact?.name || ''}
                required
              />
              <div className="emergency-form-row">
                <PhoneInput
                  label="Phone"
                  name="phone"
                  defaultValue={editingContact?.phone || ''}
                  required
                />
                <PhoneInput
                  label="Alternate Phone"
                  name="alternatePhone"
                  defaultValue={editingContact?.alternatePhone || ''}
                  required
                />
              </div>
              <SmartSelect
                label="Contact Type"
                name="contactType"
                defaultValue={editingContact?.contactType || 'OTHER'}
                required
                options={[
                  { value: 'POLICE', label: 'Police' },
                  { value: 'FIRE', label: 'Fire' },
                  { value: 'AMBULANCE', label: 'Ambulance' },
                  { value: 'HOSPITAL', label: 'Hospital' },
                  { value: 'DOCTOR', label: 'Doctor' },
                  { value: 'SECURITY', label: 'Security' },
                  { value: 'ELECTRICIAN', label: 'Electrician' },
                  { value: 'PLUMBER', label: 'Plumber' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                placeholder="Select Contact Type"
              />
              <FormInput
                label="Address"
                name="address"
                defaultValue={editingContact?.address || ''}
                required
              />
              <div>
                <label className="emergency-label">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingContact?.notes || ''}
                  placeholder="Additional notes..."
                  className="emergency-textarea"
                />
              </div>
              <div className="emergency-form-actions">
                <button type="button" onClick={closeModal} className="emergency-cancel-button">Cancel</button>
                <button type="submit" className="emergency-submit-button">
                  {editingContact ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="emergency-confirm">
          <div className="emergency-confirm-card">
            <div className="emergency-confirm-body">
              <div className="emergency-confirm-icon">
                <AlertCircle className="emergency-confirm-icon-svg" />
              </div>
              <h3 className="emergency-confirm-title">
                Delete Emergency Contact
              </h3>
              <p className="emergency-confirm-text">
                Are you sure you want to delete <span className="emergency-confirm-name">{contactToDelete.name}</span>? 
                This action cannot be undone.
              </p>
              <div className="emergency-confirm-actions">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleteMutation.isPending}
                  className="emergency-confirm-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="emergency-confirm-delete"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="emergency-confirm-spinner" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          title="Bulk Import Emergency Contacts"
          entityName="Contacts"
          templateFilename="emergency_contact_import_template.xlsx"
          columns={[
            { letter: 'A', label: 'Contact Type', required: true, description: 'POLICE, FIRE, AMBULANCE, HOSPITAL, DOCTOR, SECURITY, ELECTRICIAN, PLUMBER, GAS, WATER, or OTHER' },
            { letter: 'B', label: 'Name', required: true, description: 'Contact name or organization' },
            { letter: 'C', label: 'Phone', required: true, description: 'Primary phone number' },
            { letter: 'D', label: 'Alternate Phone', required: false, description: 'Secondary phone number' },
            { letter: 'E', label: 'Address', required: false, description: 'Contact address' },
            { letter: 'F', label: 'Notes', required: false, description: 'Additional information' },
          ]}
          tableColumns={[
            { key: 'name', label: 'Name' },
            { key: 'contactType', label: 'Type' },
          ]}
          apiValidate={emergencyContactApi.validateBulkImport}
          apiProcess={(file, societyId) => emergencyContactApi.processBulkImport(file, societyId, user?.id)}
          apiTemplate={emergencyContactApi.downloadImportTemplate}
          societyId={user?.societyId}
          userId={user?.id}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => queryClient.invalidateQueries(['emergencyContacts'])}
        />
      )}
    </div>
  )
}
