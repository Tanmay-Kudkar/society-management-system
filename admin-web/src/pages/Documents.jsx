import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { documentTemplateApi } from '../../../api'
import { Plus, Search, X, FileText, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'

const templateTypeColors = {
  NOC: 'bg-blue-100 text-blue-800',
  LETTER: 'bg-green-100 text-green-800',
  MEETING_AGENDA: 'bg-purple-100 text-purple-800',
  AGREEMENT: 'bg-orange-100 text-orange-800',
  RESOLUTION: 'bg-cyan-100 text-cyan-800',
  OTHER: 'bg-gray-100 text-gray-800',
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage document templates for NOC, certificates, etc.</p>
        </div>
        {canManageDocuments() && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Template
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
        </div>
        {['NOC', 'LETTER', 'AGREEMENT'].map(cat => (
          <div key={cat} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{cat}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.filter(d => d.templateType === cat).length}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
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
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', templateTypeColors[doc.templateType] || 'bg-gray-100 text-gray-800')}>
                      {doc.templateType}
                    </span>
                  </div>
                </div>
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  doc.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300'
                )}>
                  {doc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{doc.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{doc.content?.substring(0, 100)}...</p>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                <p>Updated: {doc.updatedAt && new Date(doc.updatedAt).toLocaleDateString()}</p>
              </div>

              {canManageDocuments() && (
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => { setEditingDocument(doc); setShowModal(true) }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
              <h3 className="text-lg font-semibold dark:text-white">{editingDocument ? 'Edit Template' : 'Add Document Template'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingDocument?.title || ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Type</label>
                  <select
                    name="templateType"
                    defaultValue={editingDocument?.templateType || 'OTHER'}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Content</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Use placeholders like {"{{owner_name}}"}, {"{{flat_number}}"}, {"{{society_name}}"}, {"{{date}}"} etc.</p>
                <textarea
                  name="content"
                  rows={10}
                  defaultValue={editingDocument?.content || ''}
                  required
                  placeholder="Enter template content with placeholders..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
