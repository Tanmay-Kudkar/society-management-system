import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { noticeApi, downloadBlob } from '../../../../api'
import { Plus, Search, X, Megaphone, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { FormInput, SmartSelect, FormTextarea, InfoTooltip, NeonSweepButton, AnimatedModal, DEFAULT_ANIMATED_MODAL_DURATION_MS } from '../../components'
import { HeroSkeleton, FiltersSkeleton, CardGridSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDate } from '../../utils/formatUtils'

const priorityClasses = {
  LOW: 'inline-flex items-center rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]',
  MEDIUM: 'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700',
  HIGH: 'inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700',
  URGENT: 'inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700',
}

const MODAL_ANIMATION_MS = DEFAULT_ANIMATED_MODAL_DURATION_MS

export default function Notices() {
  const { user, canManageNotices } = useAuth()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [attendanceByNotice, setAttendanceByNotice] = useState({})
  const [attendanceSummaryByNotice, setAttendanceSummaryByNotice] = useState({})
  const [markingNoticeId, setMarkingNoticeId] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceModalNotice, setAttendanceModalNotice] = useState(null)
  const [attendanceList, setAttendanceList] = useState([])
  const [attendanceListLoading, setAttendanceListLoading] = useState(false)
  const [attendanceListFilter, setAttendanceListFilter] = useState('ALL')

  const noticeTypeLabel = {
    GENERAL: 'General',
    CIRCULAR: 'Circular',
    MEETING: 'Meeting',
  }

  const canRecordMeetingAttendance = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'].includes(user?.role)
  const canViewMeetingAttendance = ['MASTER_ADMIN', 'SOCIETY_ADMIN', 'CHAIRMAN', 'SECRETARY', 'TREASURER'].includes(user?.role)

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

  const attendanceMutation = useMutation({
    mutationFn: ({ noticeId, status }) => noticeApi.markAttendance(noticeId, user.id, { status }),
    onMutate: ({ noticeId }) => {
      setMarkingNoticeId(noticeId)
    },
    onSuccess: (response, variables) => {
      const payload = response?.data
      setAttendanceByNotice((prev) => ({ ...prev, [variables.noticeId]: payload }))
      if (canViewMeetingAttendance) {
        noticeApi.getAttendanceByNotice(variables.noticeId, user.id)
          .then((res) => {
            const records = res?.data || []
            const present = records.filter((r) => (r?.status || '').toUpperCase() === 'PRESENT').length
            const absent = records.filter((r) => (r?.status || '').toUpperCase() === 'ABSENT').length
            setAttendanceSummaryByNotice((prev) => ({
              ...prev,
              [variables.noticeId]: { present, absent, total: records.length },
            }))
          })
          .catch(() => {})
      }
      toast.success('Attendance recorded')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to record attendance')
    },
    onSettled: () => {
      setMarkingNoticeId(null)
    },
  })

  const filteredNotices = useMemo(() => notices.filter(n => {
    const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const noticeType = (n.noticeType || 'GENERAL').toUpperCase()
    const matchesType = !filterType || noticeType === filterType
    return matchesSearch && matchesType
  }), [notices, searchTerm, filterType])

  useEffect(() => {
    let cancelled = false

    const loadMeetingAttendance = async () => {
      if (!user?.id || !canRecordMeetingAttendance) return

      const meetingNotices = notices.filter((n) => (n.noticeType || 'GENERAL').toUpperCase() === 'MEETING')
      if (meetingNotices.length === 0) return

      const next = {}
      for (const notice of meetingNotices) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const res = await noticeApi.getMyAttendance(notice.id, user.id)
          next[notice.id] = res.data
        } catch (error) {
          if (error?.response?.status !== 404) {
            // Ignore transient issues and keep page usable.
          }
        }
      }

      if (!cancelled) {
        setAttendanceByNotice((prev) => ({ ...prev, ...next }))
      }
    }

    loadMeetingAttendance()
    return () => {
      cancelled = true
    }
  }, [notices, user?.id, canRecordMeetingAttendance])

  useEffect(() => {
    let cancelled = false

    const loadMeetingAttendanceSummary = async () => {
      if (!user?.id || !canViewMeetingAttendance) return

      const meetingNotices = notices.filter((n) => (n.noticeType || 'GENERAL').toUpperCase() === 'MEETING')
      if (meetingNotices.length === 0) return

      const nextSummary = {}
      await Promise.all(meetingNotices.map(async (notice) => {
        try {
          const res = await noticeApi.getAttendanceByNotice(notice.id, user.id)
          const records = res?.data || []
          const present = records.filter((r) => (r?.status || '').toUpperCase() === 'PRESENT').length
          const absent = records.filter((r) => (r?.status || '').toUpperCase() === 'ABSENT').length
          nextSummary[notice.id] = { present, absent, total: records.length }
        } catch {
          nextSummary[notice.id] = { present: 0, absent: 0, total: 0 }
        }
      }))

      if (!cancelled) {
        setAttendanceSummaryByNotice((prev) => ({ ...prev, ...nextSummary }))
      }
    }

    loadMeetingAttendanceSummary()
    return () => {
      cancelled = true
    }
  }, [notices, user?.id, canViewMeetingAttendance])

  const closeModal = () => {
    setShowModal(false)
    setTimeout(() => setEditingNotice(null), MODAL_ANIMATION_MS)
  }

  const closeAttendanceModal = () => {
    setShowAttendanceModal(false)
    setTimeout(() => {
      setAttendanceModalNotice(null)
      setAttendanceList([])
      setAttendanceListLoading(false)
      setAttendanceListFilter('ALL')
    }, MODAL_ANIMATION_MS)
  }

  const openAttendanceModal = async (notice) => {
    if (!notice?.id || !user?.id) return
    setAttendanceModalNotice(notice)
    setAttendanceListLoading(true)
    setShowAttendanceModal(true)

    try {
      const res = await noticeApi.getAttendanceByNotice(notice.id, user.id)
      setAttendanceList(res?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load attendance list')
      setAttendanceList([])
    } finally {
      setAttendanceListLoading(false)
    }
  }

  const downloadAttendance = async (status = 'ALL') => {
    if (!attendanceModalNotice?.id || !user?.id) return

    try {
      const response = await noticeApi.exportAttendance(attendanceModalNotice.id, user.id, status)
      const statusLabel = String(status || 'ALL').toLowerCase()
      const noticeSlug = (attendanceModalNotice?.title || 'meeting-attendance')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'meeting-attendance'
      const datePart = new Date().toISOString().split('T')[0]
      downloadBlob(response.data, `${noticeSlug}-${statusLabel}-${datePart}.xlsx`)
      toast.success('Attendance exported successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export attendance')
    }
  }

  const filteredAttendanceList = useMemo(() => {
    if (attendanceListFilter === 'ALL') return attendanceList
    return attendanceList.filter((row) => (row?.status || '').toUpperCase() === attendanceListFilter)
  }, [attendanceList, attendanceListFilter])

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

    if (!effectiveSocietyId) {
      toast.error('Society ID is required')
      return
    }

    const data = {
      societyId: Number(effectiveSocietyId),
      title: formData.get('title'),
      content: formData.get('content'),
      priority: formData.get('priority'),
      noticeType: formData.get('noticeType') || 'GENERAL',
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
          <NeonSweepButton
            tone="violet"
            size="md"
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Notice
          </NeonSweepButton>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] sm:w-auto sm:min-w-[220px]"
          >
            <option value="">All Notice Types</option>
            <option value="GENERAL">General</option>
            <option value="CIRCULAR">Circular</option>
            <option value="MEETING">Meeting</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {(
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/80 via-cyan-400/70 to-violet-500/70" />
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-blue-500/15 p-2">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className={clsx(priorityClasses[notice.priority] || priorityClasses.LOW)}>
                    {notice.priority}
                  </span>
                </div>
                {canManageNotices() && (
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
                    <NeonSweepButton
                      onClick={() => { setEditingNotice(notice); setShowModal(true) }}
                      tone="slate"
                      size="sm"
                      className="w-full justify-center"
                    >
                      <Edit size={16} />
                      Edit
                    </NeonSweepButton>
                    <NeonSweepButton
                      onClick={() => confirmAndDeleteNotice(notice)}
                      tone="danger"
                      size="sm"
                      className="w-full justify-center"
                    >
                      <Trash2 size={16} />
                      Delete
                    </NeonSweepButton>
                  </div>
                )}
              </div>
              
              <h3 className="mb-2 font-bold text-[var(--text-primary)]">{notice.title}</h3>
              <p className="mb-1 text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                {noticeTypeLabel[(notice.noticeType || 'GENERAL').toUpperCase()] || 'General'}
              </p>
              <p className="mb-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{notice.content}</p>
              
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-light)] pt-3 text-xs text-[var(--text-tertiary)]">
                {isPlatformLevel && <span>{notice.societyName || 'All Societies'}</span>}
                <span>{formatDate(notice.createdAt)}</span>
              </div>
              
              {notice.expiryDate && (
                <p className="mt-2 text-xs text-orange-600">
                  Expires: {formatDate(notice.expiryDate)}
                </p>
              )}

              {(notice.noticeType || 'GENERAL').toUpperCase() === 'MEETING' && canRecordMeetingAttendance && (
                <div className="mt-3 border-t border-[var(--border-light)] pt-3">
                  <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">
                    Your attendance: {attendanceByNotice[notice.id]?.status || 'Not marked'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <NeonSweepButton
                      tone={attendanceByNotice[notice.id]?.status === 'PRESENT' ? 'cyan' : 'slate'}
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => attendanceMutation.mutate({ noticeId: notice.id, status: 'PRESENT' })}
                      disabled={attendanceMutation.isPending && markingNoticeId === notice.id}
                    >
                      {attendanceMutation.isPending && markingNoticeId === notice.id ? 'Saving...' : 'Mark Present'}
                    </NeonSweepButton>
                    <NeonSweepButton
                      tone={attendanceByNotice[notice.id]?.status === 'ABSENT' ? 'danger' : 'slate'}
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => attendanceMutation.mutate({ noticeId: notice.id, status: 'ABSENT' })}
                      disabled={attendanceMutation.isPending && markingNoticeId === notice.id}
                    >
                      {attendanceMutation.isPending && markingNoticeId === notice.id ? 'Saving...' : 'Mark Absent'}
                    </NeonSweepButton>
                  </div>
                </div>
              )}

              {(notice.noticeType || 'GENERAL').toUpperCase() === 'MEETING' && canViewMeetingAttendance && (
                <div className="mt-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)]/50 px-3 py-2 text-xs text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">Attendance Summary</p>
                  <p className="mt-1">
                    Present: {attendanceSummaryByNotice[notice.id]?.present ?? 0} | Absent: {attendanceSummaryByNotice[notice.id]?.absent ?? 0}
                  </p>
                  <NeonSweepButton
                    tone="slate"
                    size="sm"
                    className="mt-2 w-full justify-center"
                    onClick={() => openAttendanceModal(notice)}
                  >
                    View Attendance
                  </NeonSweepButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatedModal open={showAttendanceModal} onRequestClose={closeAttendanceModal} closeOnBackdrop>
        <div className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between border-b border-[var(--border-light)] p-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Meeting Attendance</h3>
              {attendanceModalNotice?.title && (
                <p className="text-xs text-[var(--text-tertiary)]">{attendanceModalNotice.title}</p>
              )}
            </div>
            <button onClick={closeAttendanceModal} className="rounded-lg p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-tertiary)]">
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            {attendanceListLoading ? (
              <p className="text-sm text-[var(--text-tertiary)]">Loading attendance...</p>
            ) : attendanceList.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No attendance records yet.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <NeonSweepButton
                    tone={attendanceListFilter === 'ALL' ? 'cyan' : 'slate'}
                    size="sm"
                    onClick={() => setAttendanceListFilter('ALL')}
                    className="justify-center"
                  >
                    All ({attendanceList.length})
                  </NeonSweepButton>
                  <NeonSweepButton
                    tone={attendanceListFilter === 'PRESENT' ? 'cyan' : 'slate'}
                    size="sm"
                    onClick={() => setAttendanceListFilter('PRESENT')}
                    className="justify-center"
                  >
                    Present ({attendanceList.filter((r) => (r?.status || '').toUpperCase() === 'PRESENT').length})
                  </NeonSweepButton>
                  <NeonSweepButton
                    tone={attendanceListFilter === 'ABSENT' ? 'danger' : 'slate'}
                    size="sm"
                    onClick={() => setAttendanceListFilter('ABSENT')}
                    className="justify-center"
                  >
                    Absent ({attendanceList.filter((r) => (r?.status || '').toUpperCase() === 'ABSENT').length})
                  </NeonSweepButton>
                  <NeonSweepButton
                    tone="slate"
                    size="sm"
                    onClick={() => downloadAttendance(attendanceListFilter === 'ALL' ? 'ALL' : attendanceListFilter)}
                    className="justify-center sm:ml-auto"
                  >
                    Export Filtered
                  </NeonSweepButton>
                  <NeonSweepButton
                    tone="slate"
                    size="sm"
                    onClick={() => downloadAttendance('ALL')}
                    className="justify-center"
                  >
                    Export All
                  </NeonSweepButton>
                </div>

                {filteredAttendanceList.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)]">No records for selected filter.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[var(--border-light)]">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[var(--bg-tertiary)] text-left text-[0.78rem] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                    <tr>
                      <th className="px-3 py-2">Member</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Marked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceList.map((row) => (
                      <tr key={row.id} className="border-t border-[var(--border-light)]">
                        <td className="px-3 py-2 text-[var(--text-primary)]">{row.userName || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={clsx(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                            row.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                          )}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">{formatDate(row.markedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                )}
              </>
            )}
          </div>
        </div>
      </AnimatedModal>

      {/* Modal */}
      <AnimatedModal open={showModal} onRequestClose={closeModal} closeOnBackdrop>
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
              <SmartSelect
                label="Notice Type"
                name="noticeType"
                defaultValue={(editingNotice?.noticeType || 'GENERAL').toUpperCase()}
                required
                options={[
                  { value: 'GENERAL', label: 'General' },
                  { value: 'CIRCULAR', label: 'Circular' },
                  { value: 'MEETING', label: 'Meeting' },
                ]}
              />
              <div className="flex gap-3 pt-2">
                <NeonSweepButton type="button" tone="slate" size="md" onClick={closeModal} className="flex-1">Cancel</NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingNotice ? 'Update' : 'Create')}
                </NeonSweepButton>
              </div>
            </form>
        </div>
      </AnimatedModal>
    </div>
  )
}
