import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { noticeApi } from '../../../../api'
import { Plus, Search, X, Megaphone, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const priorityClasses = {
  LOW: 'notices-priority notices-priority--low',
  MEDIUM: 'notices-priority notices-priority--medium',
  HIGH: 'notices-priority notices-priority--high',
  URGENT: 'notices-priority notices-priority--urgent',
}

export default function Notices() {
  const { user, canManageNotices } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is MASTER_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: notices = [], isLoading, isError } = useQuery({
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
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete notice')
    },
  })

  const filteredNotices = useMemo(() => notices.filter(n => {
    const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }), [notices, searchTerm])

  const closeModal = () => {
    setShowModal(false)
    setEditingNotice(null)
  }

  const confirmAndDeleteNotice = async (notice) => {
    const confirmed = await confirmDialog({
      title: 'Delete Notice',
      message: 'Are you sure you want to delete this notice? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Title', value: notice.title || '-' },
        { label: 'Priority', value: notice.priority || '-' },
      ],
      caution: 'This action permanently removes the notice.',
    })
    if (confirmed) {
      deleteMutation.mutate(notice.id)
    }
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

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div className="notices-page">
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FiltersSkeleton filterCount={1} />
      <CardGridSkeleton count={6} showAvatar={false} />
    </div>
  )

  return (
    <div className="notices-page">
      {/* Header */}
      <div className="notices-header">
        <div>
          <h1 className="notices-title">Notices</h1>
          <p className="notices-subtitle">Manage society announcements and notices</p>
        </div>
        {canManageNotices() && (
          <button
            onClick={() => setShowModal(true)}
            className="notices-add-button"
          >
            <Plus size={20} />
            Add Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="notices-filters">
        <div className="notices-filters-row">
          <div className="notices-search">
            <Search className="notices-search-icon" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="notices-search-input"
            />
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      {(
        <div className="notices-grid">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="notices-card">
              <div className="notices-card-header">
                <div className="notices-card-info">
                  <div className="notices-card-icon">
                    <Megaphone className="notices-card-icon-svg" />
                  </div>
                  <span className={clsx(priorityClasses[notice.priority] || priorityClasses.LOW)}>
                    {notice.priority}
                  </span>
                </div>
                {canManageNotices() && (
                  <div className="notices-card-actions">
                    <button
                      onClick={() => { setEditingNotice(notice); setShowModal(true) }}
                      className="notices-edit-button"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => confirmAndDeleteNotice(notice)}
                      className="notices-delete-button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="notices-card-title">{notice.title}</h3>
              <p className="notices-card-content">{notice.content}</p>
              
              <div className="notices-card-meta">
                {isPlatformLevel && <span className="notices-card-meta-text">{notice.societyName || 'All Societies'}</span>}
                <span className="notices-card-meta-text">{notice.createdAt && new Date(notice.createdAt).toLocaleDateString()}</span>
              </div>
              
              {notice.expiryDate && (
                <p className="notices-expiry">
                  Expires: {new Date(notice.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="notices-modal">
          <div className="notices-modal-card">
            <div className="notices-modal-header">
              <h3 className="notices-modal-title">{editingNotice ? 'Edit Notice' : 'Add Notice'}</h3>
              <button onClick={closeModal} className="notices-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="notices-modal-body">
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
              <div className="notices-form-row">
                <SmartSelect
                  label="Priority"
                  name="priority"
                  defaultValue={editingNotice?.priority || 'MEDIUM'}
                  required
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'URGENT', label: 'Urgent' },
                  ]}
                />
                <FormInput
                  label="Expiry Date (Optional)"
                  name="expiryDate"
                  type="date"
                  defaultValue={editingNotice?.expiryDate || ''}
                />
              </div>
              <div className="notices-form-actions">
                <button type="button" onClick={closeModal} className="notices-cancel-button">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="notices-submit-button"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  loadingText="Saving..."
                >
                  {editingNotice ? 'Update' : 'Create'}
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
