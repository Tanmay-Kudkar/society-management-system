import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { documentTemplateApi } from '../../../../api'
import { Plus, Search, X, FileText, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'

const templateTypeClasses = {
  NOC: 'documents-badge documents-badge--noc',
  LETTER: 'documents-badge documents-badge--letter',
  MEETING_AGENDA: 'documents-badge documents-badge--meeting',
  AGREEMENT: 'documents-badge documents-badge--agreement',
  RESOLUTION: 'documents-badge documents-badge--resolution',
  OTHER: 'documents-badge documents-badge--other',
}

export default function Documents() {
  const { user, canManageDocuments } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documentTemplates'],
    queryFn: () => documentTemplateApi.getAll().then(res => res.data),
    placeholderData: [],
  })

  const createMutation = useMutation({
    mutationFn: (data) => documentTemplateApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentTemplates'])
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => documentTemplateApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documentTemplates'])
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => documentTemplateApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['documentTemplates']),
  })

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || d.templateType === filterCategory
    return matchesSearch && matchesCategory
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingDocument(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      title: formData.get('title'),
      templateType: formData.get('templateType'),
      content: formData.get('content'),
    }
    if (editingDocument) {
      updateMutation.mutate({ id: editingDocument.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="documents-page">
      {/* Header */}
      <div className="documents-header">
        <div>
          <h1 className="documents-title">Document Templates</h1>
          <p className="documents-subtitle">Manage document templates for NOC, certificates, etc.</p>
        </div>
        {canManageDocuments() && (
          <button
            onClick={() => setShowModal(true)}
            className="documents-add-button"
          >
            <Plus size={20} />
            Add Template
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="documents-stats">
        <div className="documents-stat-card">
          <p className="documents-stat-label">Total</p>
          <p className="documents-stat-value">{documents.length}</p>
        </div>
        {['NOC', 'LETTER', 'AGREEMENT'].map(cat => (
          <div key={cat} className="documents-stat-card">
            <p className="documents-stat-label">{cat}</p>
            <p className="documents-stat-value">{documents.filter(d => d.templateType === cat).length}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="documents-filters">
        <div className="documents-filters-row">
          <div className="documents-search">
            <Search className="documents-search-icon" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="documents-search-input"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="documents-filter-select"
          >
            <option value="">All Types</option>
            <option value="NOC">NOC</option>
            <option value="LETTER">Letter</option>
            <option value="MEETING_AGENDA">Meeting Agenda</option>
            <option value="AGREEMENT">Agreement</option>
            <option value="RESOLUTION">Resolution</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="documents-loading">
          <div className="documents-spinner" />
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="documents-card">
              <div className="documents-card-header">
                <div className="documents-card-info">
                  <div className="documents-card-icon">
                    <FileText className="documents-card-icon-svg" />
                  </div>
                  <div>
                    <span className={clsx(templateTypeClasses[doc.templateType] || 'documents-badge documents-badge--other')}>
                      {doc.templateType}
                    </span>
                  </div>
                </div>
                <span className={clsx(
                  'documents-status-badge',
                  doc.isActive ? 'is-active' : 'is-inactive'
                )}>
                  {doc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <h3 className="documents-card-title">{doc.title}</h3>
              <p className="documents-card-excerpt">{doc.content?.substring(0, 100)}...</p>
              
              <div className="documents-card-meta">
                <p>Updated: {doc.updatedAt && new Date(doc.updatedAt).toLocaleDateString()}</p>
              </div>

              {canManageDocuments() && (
                <div className="documents-card-actions">
                  <button
                    onClick={() => { setEditingDocument(doc); setShowModal(true) }}
                    className="documents-edit-button"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="documents-delete-button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="documents-modal">
          <div className="documents-modal-card">
            <div className="documents-modal-header">
              <h3 className="documents-modal-title">{editingDocument ? 'Edit Template' : 'Add Document Template'}</h3>
              <button onClick={closeModal} className="documents-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="documents-modal-body">
              <div className="documents-form-grid">
                <div className="documents-field">
                  <label className="documents-label">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingDocument?.title || ''}
                    required
                    className="documents-input"
                  />
                </div>
                <div className="documents-field">
                  <label className="documents-label">Template Type</label>
                  <select
                    name="templateType"
                    defaultValue={editingDocument?.templateType || 'OTHER'}
                    required
                    className="documents-input"
                  >
                    <option value="NOC">NOC</option>
                    <option value="LETTER">Letter</option>
                    <option value="MEETING_AGENDA">Meeting Agenda</option>
                    <option value="AGREEMENT">Agreement</option>
                    <option value="RESOLUTION">Resolution</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="documents-field">
                <label className="documents-label">Template Content</label>
                <p className="documents-help">Use placeholders like {"{{owner_name}}"}, {"{{flat_number}}"}, {"{{society_name}}"}, {"{{date}}"} etc.</p>
                <textarea
                  name="content"
                  rows={10}
                  defaultValue={editingDocument?.content || ''}
                  required
                  placeholder="Enter template content with placeholders..."
                  className="documents-textarea"
                />
              </div>
              <div className="documents-form-actions">
                <button type="button" onClick={closeModal} className="documents-cancel-button">Cancel</button>
                <button type="submit" className="documents-submit-button">
                  {editingDocument ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
