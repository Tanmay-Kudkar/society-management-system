import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { emergencyContactApi } from '../../../api'
import { Plus, Search, X, Phone, Edit, Trash2, AlertCircle, CheckCircle, Upload } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, PhoneInput, SmartSelect } from '../components/FormComponents'
import BulkImportModal from '../components/BulkImportModal'

const contactTypeColors = {
  POLICE: 'bg-blue-100 text-blue-800',
  FIRE: 'bg-red-100 text-red-800',
  AMBULANCE: 'bg-green-100 text-green-800',
  HOSPITAL: 'bg-purple-100 text-purple-800',
  DOCTOR: 'bg-pink-100 text-pink-800',
  SECURITY: 'bg-orange-100 text-orange-800',
  ELECTRICIAN: 'bg-yellow-100 text-yellow-800',
  PLUMBER: 'bg-cyan-100 text-cyan-800',
  OTHER: 'bg-gray-100 text-gray-800',
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Contacts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage emergency contact directory</p>
        </div>
        {canManageEmergencyContacts() && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              <Upload size={20} />
              Bulk Import
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Add Contact
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedContacts).map(([contactType, contactTypeContacts]) => (
            <div key={contactType} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{contactType}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({contactTypeContacts.length})</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {contactTypeContacts.map((contact) => (
                  <div key={contact.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={clsx('p-3 rounded-lg', contactTypeColors[contactType]?.replace('text', 'bg').split(' ')[0] || 'bg-gray-100')}>
                          <Phone className={clsx('w-5 h-5', contactTypeColors[contactType]?.split(' ')[1] || 'text-gray-600')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h4>
                            {!contact.isActive && (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">Inactive</span>
                            )}
                          </div>
                          <p className="text-lg font-mono text-blue-600 dark:text-blue-400 mt-0.5">{contact.phone}</p>
                          {contact.alternatePhone && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Alt: {contact.alternatePhone}</p>
                          )}
                          {contact.address && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{contact.address}</p>
                          )}
                          {contact.notes && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic mt-1">{contact.notes}</p>
                          )}
                          {isPlatformLevel && contact.societyName && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{contact.societyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                        >
                          <Phone size={18} />
                        </a>
                        {canEdit(contact) && (
                          <button
                            onClick={() => { setEditingContact(contact); setShowModal(true) }}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {canDelete(contact) && (
                          <button
                            onClick={() => handleDeleteClick(contact)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FormInput
                label="Name"
                name="name"
                defaultValue={editingContact?.name || ''}
                required
              />
              <div className="grid grid-cols-2 gap-4">
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
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingContact?.notes || ''}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  {editingContact ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                Delete Emergency Contact
              </h3>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{contactToDelete.name}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
