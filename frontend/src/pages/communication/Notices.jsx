import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { noticeApi } from '../../../../api'
import { Plus, Search, X, Megaphone, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, AsyncButton, InfoTooltip } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const priorityClasses = {
  LOW: 'inline-flex items-center rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]',
  MEDIUM: 'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700',
  HIGH: 'inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700',
  URGENT: 'inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700',
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
      societyId: effectiveSocietyId,
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
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FiltersSkeleton filterCount={1} />
      <CardGridSkeleton count={6} showAvatar={false} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notices</h1>
            <InfoTooltip text="Manage society announcements and notices" />
          </div>
        </div>
        {canManageNotices() && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 font-semibold text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus size={20} />
            Add Notice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      {(
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-blue-500/15 p-2">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className={clsx(priorityClasses[notice.priority] || priorityClasses.LOW)}>
                    {notice.priority}
                  </span>
                </div>
                {canManageNotices() && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingNotice(notice); setShowModal(true) }}
                      className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)]"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => confirmAndDeleteNotice(notice)}
                      className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="mb-2 font-bold text-[var(--text-primary)]">{notice.title}</h3>
              <p className="mb-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{notice.content}</p>
              
              <div className="flex items-center justify-between border-t border-[var(--border-light)] pt-3 text-xs text-[var(--text-tertiary)]">
                {isPlatformLevel && <span>{notice.societyName || 'All Societies'}</span>}
                <span>{notice.createdAt && new Date(notice.createdAt).toLocaleDateString()}</span>
              </div>
              
              {notice.expiryDate && (
                <p className="mt-2 text-xs text-orange-600">
                  Expires: {new Date(notice.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] p-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingNotice ? 'Edit Notice' : 'Add Notice'}</h3>
              <button onClick={closeModal} className="rounded-lg p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-4">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-[var(--border-light)] bg-transparent px-4 py-2 font-semibold text-slate-700 transition hover:bg-[var(--bg-tertiary)]">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 font-semibold text-[var(--text-primary)] transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-400/25 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white"
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
