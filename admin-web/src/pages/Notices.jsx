import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { noticeApi } from '../../../api'
import { Plus, Search, X, Megaphone, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea } from '../components/FormComponents'

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export default function Notices() {
  const { user, canManageNotices } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is PLATFORM_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices', effectiveSocietyId],
    queryFn: () => effectiveSocietyId
      ? noticeApi.getBySociety(effectiveSocietyId).then(res => res.data)
      : noticeApi.getAll().then(res => res.data),
  })



  const createMutation = useMutation({
    mutationFn: (data) => noticeApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notices'])
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => noticeApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notices'])
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => noticeApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['notices']),
  })

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const closeModal = () => {
    setShowModal(false)
    setEditingNotice(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      societyId: user.societyId,
      title: formData.get('title'),
      content: formData.get('content'),
      priority: formData.get('priority'),
      expiryDate: formData.get('expiryDate') || null,
    }
    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notices</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage society announcements and notices</p>
        </div>
        {canManageNotices() && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', priorityColors[notice.priority])}>
                    {notice.priority}
                  </span>
                </div>
                {canManageNotices() && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingNotice(notice); setShowModal(true) }}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(notice.id)}
                      className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{notice.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">{notice.content}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-slate-700">
                {isPlatformLevel && <span>{notice.societyName || 'All Societies'}</span>}
                <span>{notice.createdAt && new Date(notice.createdAt).toLocaleDateString()}</span>
              </div>
              
              {notice.expiryDate && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  Expires: {new Date(notice.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">{editingNotice ? 'Edit Notice' : 'Add Notice'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FormInput
                label="Title"
                name="title"
                defaultValue={editingNotice?.title || ''}
                required
              />
              <FormTextarea
                label="Content"
                name="content"
                rows={4}
                defaultValue={editingNotice?.content || ''}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <SmartSelect
                  label="Priority"
                  name="priority"
                  defaultValue={editingNotice?.priority || 'MEDIUM'}
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'URGENT', label: 'Urgent' },
                  ]}
                />
                <FormInput
                  label="Expiry Date"
                  name="expiryDate"
                  type="date"
                  defaultValue={editingNotice?.expiryDate || ''}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  {editingNotice ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
