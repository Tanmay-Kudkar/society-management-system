import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { documentTemplateApi } from '../../../../api'
import { Plus, Search, X, FileText, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { InfoTooltip, NeonSweepButton, AnimatedModal, DEFAULT_ANIMATED_MODAL_DURATION_MS } from '../../components'
import { HeroSkeleton, DocumentsSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDate } from '../../utils/formatUtils'

const MODAL_ANIMATION_MS = DEFAULT_ANIMATED_MODAL_DURATION_MS

const templateTypeClasses = {
  NOC: 'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700',
  LETTER: 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700',
  MEETING_AGENDA: 'inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700',
  AGREEMENT: 'inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700',
  RESOLUTION: 'inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700',
  OTHER: 'inline-flex items-center rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]',
}

export default function Documents() {
  const { user, canManageDocuments } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const { data: documents = [], isLoading, isError } = useQuery({
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
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete document template')
    },
  })

  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      const matchesSearch = d.title?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !filterCategory || d.templateType === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [documents, searchTerm, filterCategory])

  const documentTypeCounts = useMemo(() => {
    return ['NOC', 'LETTER', 'AGREEMENT'].reduce((acc, templateType) => {
      acc[templateType] = documents.filter(d => d.templateType === templateType).length
      return acc
    }, {})
  }, [documents])

  const closeModal = () => {
    setShowModal(false)
    setTimeout(() => setEditingDocument(null), MODAL_ANIMATION_MS)
  }

  const confirmAndDeleteDocument = async (doc) => {
    const confirmed = await confirmDialog({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this document template? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Title', value: doc.title || '-' },
        { label: 'Type', value: doc.templateType || '-' },
      ],
      caution: 'This action permanently removes the template.',
    })
    if (confirmed) {
      deleteMutation.mutate(doc.id)
    }
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

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <DocumentsSkeleton />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Document Templates</h1>
            <InfoTooltip text="Manage document templates for NOC, certificates, etc." />
          </div>
        </div>
        {canManageDocuments() && (
          <NeonSweepButton
            tone="violet"
            size="md"
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Template
          </NeonSweepButton>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
          <p className="text-sm text-[var(--text-tertiary)]">Total</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{documents.length}</p>
        </div>
        {['NOC', 'LETTER', 'AGREEMENT'].map(cat => (
          <div key={cat} className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
            <p className="text-sm text-[var(--text-tertiary)]">{cat}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{documentTypeCounts[cat] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] sm:w-52"
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[0_12px_24px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[var(--bg-tertiary)] p-2">
                  <FileText className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <span className={clsx(templateTypeClasses[doc.templateType] || templateTypeClasses.OTHER)}>
                    {doc.templateType}
                  </span>
                </div>
              </div>
              <span className={clsx(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                doc.isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              )}>
                {doc.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <h3 className="mb-1 font-bold text-[var(--text-primary)]">{doc.title}</h3>
            <p className="mb-3 line-clamp-2 text-sm text-[var(--text-secondary)]">{doc.content?.substring(0, 100)}...</p>

            <div className="mb-3 text-xs text-[var(--text-tertiary)]">
              <p>Updated: {formatDate(doc.updatedAt)}</p>
            </div>

            {canManageDocuments() && (
              <div className="flex gap-2 border-t border-[var(--border-light)] pt-3">
                <button
                  onClick={() => { setEditingDocument(doc); setShowModal(true) }}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,var(--bg-card))]"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => confirmAndDeleteDocument(doc)}
                  className="rounded-xl p-2 text-red-500 transition hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatedModal open={showModal} onRequestClose={closeModal} closeOnBackdrop>
        <div className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-card)] p-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingDocument ? 'Edit Template' : 'Add Document Template'}</h3>
              <button onClick={closeModal} className="rounded-lg p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingDocument?.title || ''}
                    required
                    className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Template Type</label>
                  <select
                    name="templateType"
                    defaultValue={editingDocument?.templateType || 'OTHER'}
                    required
                    className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
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
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">Template Content</label>
                <p className="text-xs text-[var(--text-tertiary)]">Use placeholders like {'{{owner_name}}'}, {'{{flat_number}}'}, {'{{society_name}}'}, {'{{date}}'} etc.</p>
                <textarea
                  name="content"
                  rows={10}
                  defaultValue={editingDocument?.content || ''}
                  required
                  placeholder="Enter template content with placeholders..."
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={closeModal} className="flex-1">Cancel</NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? (editingDocument ? 'Updating...' : 'Creating...')
                    : (editingDocument ? 'Update' : 'Create')}
                </NeonSweepButton>
              </div>
            </form>
        </div>
      </AnimatedModal>
    </div>
  )
}
