import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { emergencyContactApi } from '../../../../api'
import { Plus, Search, X, Phone, Edit, Trash2, AlertCircle, CheckCircle, Upload } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, PhoneInput, SmartSelect, BulkImportModal, AsyncButton } from '../../components'
import { HeroSkeleton, GroupedListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const contactTypeClasses = {
  POLICE: 'bg-[#dbeafe] text-[#1d4ed8]',
  FIRE: 'bg-[#fee2e2] text-[#b91c1c]',
  AMBULANCE: 'bg-[#dcfce7] text-[#15803d]',
  HOSPITAL: 'bg-[#ede9fe] text-[#6d28d9]',
  DOCTOR: 'bg-[#fce7f3] text-[#be185d]',
  SECURITY: 'bg-[#ffedd5] text-[#c2410c]',
  ELECTRICIAN: 'bg-[#fef9c3] text-[#a16207]',
  PLUMBER: 'bg-[#cffafe] text-[#0e7490]',
  OTHER: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
}

export default function EmergencyContacts() {
  const { user, isCommitteeLevel, canManageEmergencyContacts } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contactToDelete, setContactToDelete] = useState(null)
  const [editingContact, setEditingContact] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId
  
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

  const { data: contacts = [], isLoading, isError } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: () => emergencyContactApi.getAll().then(res => res.data),
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

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.phone?.includes(searchTerm)
      const matchesCategory = !filterCategory || c.contactType === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [contacts, searchTerm, filterCategory])

  const closeModal = () => {
    setShowModal(false)
    setEditingContact(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      societyId: effectiveSocietyId,
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
  const groupedContacts = useMemo(() => {
    return filteredContacts.reduce((acc, contact) => {
      const contactType = contact.contactType || 'OTHER'
      if (!acc[contactType]) acc[contactType] = []
      acc[contactType].push(contact)
      return acc
    }, {})
  }, [filteredContacts])

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <GroupedListSkeleton groups={3} itemsPerGroup={3} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Emergency Contacts</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Manage emergency contact directory</p>
        </div>
        {canManageEmergencyContacts() && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-[rgba(15,23,42,0.12)] text-[#f8fafc] bg-[#0f172a] transition-all hover:shadow-[0_8px_20px_rgba(15,23,42,0.16)] hover:-translate-y-px dark:border-[rgba(148,163,184,0.26)] dark:bg-[#020617]"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:bg-[var(--bg-tertiary)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] hover:-translate-y-px dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
            >
              <Plus size={20} />
              Add Contact
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_20px_rgba(15,23,42,0.08)] mb-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pr-3 pl-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
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
      {(
        <div className="grid gap-6">
          {Object.entries(groupedContacts).map(([contactType, contactTypeContacts]) => (
            <div key={contactType} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] overflow-hidden shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <div className="px-5 py-3 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
                <div className="inline-flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--text-secondary)]" />
                  <h3 className="font-bold text-[var(--text-primary)]">{contactType}</h3>
                  <span className="text-sm text-[var(--text-tertiary)]">({contactTypeContacts.length})</span>
                </div>
              </div>
              <div className="grid">
                {contactTypeContacts.map((contact) => (
                  <div key={contact.id} className="p-4 border-t border-[var(--border-light)] first:border-t-0 transition-colors hover:bg-[var(--bg-tertiary)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={clsx('w-10 h-10 rounded-xl inline-flex items-center justify-center', contactTypeClasses[contactType] || contactTypeClasses.OTHER)}>
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="grid gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[var(--text-primary)]">{contact.name}</h4>
                            {!contact.isActive && (
                              <span className="px-2 py-[0.1rem] rounded-full text-[0.7rem] bg-[#fee2e2] text-[#b91c1c]">Inactive</span>
                            )}
                          </div>
                          <p className="text-base font-mono text-[#2563eb]">{contact.phone}</p>
                          {contact.alternatePhone && (
                            <p className="text-sm text-[var(--text-tertiary)]">Alt: {contact.alternatePhone}</p>
                          )}
                          {contact.address && (
                            <p className="text-sm text-[var(--text-tertiary)]">{contact.address}</p>
                          )}
                          {contact.notes && (
                            <p className="text-sm italic text-[var(--text-tertiary)]">{contact.notes}</p>
                          )}
                          {isPlatformLevel && contact.societyName && (
                            <p className="text-sm text-[var(--text-tertiary)]">{contact.societyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-2 rounded-xl bg-[#dcfce7] text-[#15803d] transition-colors hover:bg-[#bbf7d0]"
                        >
                          <Phone size={18} />
                        </a>
                        {canEdit(contact) && (
                          <button
                            onClick={() => { setEditingContact(contact); setShowModal(true) }}
                            className="p-2 rounded-xl text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)]"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {canDelete(contact) && (
                          <button
                            onClick={() => handleDeleteClick(contact)}
                            disabled={deleteMutation.isPending}
                            className="p-2 rounded-xl text-[#ef4444] transition-colors hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</h3>
              <button onClick={closeModal} className="p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-4 overflow-y-auto flex-1 min-h-0">
              <FormInput
                label="Name"
                name="name"
                defaultValue={editingContact?.name || ''}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="text-sm font-semibold text-[#334155] mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingContact?.notes || ''}
                  placeholder="Additional notes..."
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all min-h-16 focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2 px-4 rounded-lg font-semibold border border-[var(--border-light)] bg-transparent text-[#334155] hover:bg-[var(--bg-tertiary)]">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:bg-[var(--bg-tertiary)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  loadingText={editingContact ? 'Updating...' : 'Creating...'}
                >
                  {editingContact ? 'Update' : 'Create'}
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fee2e2] inline-flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#dc2626]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Delete Emergency Contact
              </h3>
              <p className="text-[var(--text-tertiary)] mb-6">
                Are you sure you want to delete <span className="font-bold text-[var(--text-primary)]">{contactToDelete.name}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 px-4 rounded-xl font-semibold border border-[var(--border-light)] bg-transparent text-[#334155] hover:bg-[var(--bg-tertiary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 px-4 rounded-xl font-semibold bg-[#dc2626] text-white inline-flex items-center justify-center gap-2 hover:bg-[#b91c1c]"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-[rgba(255,255,255,0.35)] border-t-white animate-spin" />
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
