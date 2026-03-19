import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth, useConfirmDialog, useToast } from '../../context'
import { paymentApi, exportApi, downloadBlob } from '../../../../api'
import { Search, CreditCard, CheckCircle, XCircle, Clock, Trash2, RotateCcw, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied, InfoTooltip, NeonSweepButton } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusConfig = {
  CREATED: { label: 'Pending', icon: Clock, className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  AUTHORIZED: { label: 'Authorized', icon: CheckCircle, className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  CAPTURED: { label: 'Success', icon: CheckCircle, className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, className: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' },
  REFUNDED: { label: 'Refunded', icon: CreditCard, className: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' },
}

const isPendingStatus = (status) => ['CREATED', 'AUTHORIZED', 'PENDING'].includes(status)

// Backend currently returns zone-less date-time strings.
// On Render those values are UTC, so treat missing-zone timestamps as UTC before formatting.
const parseServerDateTime = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const text = String(value).trim()
  if (!text) return null

  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(text)
  const normalized = hasTimezone ? text : `${text}Z`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function Payments() {
  const { user, canManageMaintenanceBills } = useAuth()
  const queryClient = useQueryClient()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [refundFilter, setRefundFilter] = useState('ALL')
  const [settlementFilter, setSettlementFilter] = useState('ALL')
  const [isExporting, setIsExporting] = useState(false)

  // Permission check - same as maintenance bills
  if (!canManageMaintenanceBills()) {
    return <PermissionDenied message="You don't have permission to view payments" />
  }

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  // Fetch payments based on user role
  const { data: payments = [], isLoading, isError } = useQuery({
    queryKey: ['payments', effectiveSocietyId],
    queryFn: async () => {
      if (effectiveSocietyId) {
        const res = await paymentApi.getBySociety(effectiveSocietyId)
        return res.data
      }
      // For platform level without specific society, show user's payments
      const res = await paymentApi.getByUser(user.id)
      return res.data
    },
    enabled: !!user,
  })

  const { data: deletedPayments = [] } = useQuery({
    queryKey: ['payments-deleted', effectiveSocietyId],
    queryFn: async () => {
      if (!effectiveSocietyId) return []
      const res = await paymentApi.getDeletedBySociety(effectiveSocietyId)
      return res.data
    },
    enabled: !!effectiveSocietyId,
    refetchInterval: 30000,
  })

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId) => paymentApi.delete(paymentId, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments'])
      queryClient.invalidateQueries(['payments-deleted'])
      toast.warning('Payment moved to Recently Deleted. You can undo for 30 minutes.')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete payment record')
    },
  })

  const undoDeleteMutation = useMutation({
    mutationFn: (paymentId) => paymentApi.undoDelete(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments'])
      queryClient.invalidateQueries(['payments-deleted'])
      toast.success('Payment restore successful')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to restore payment')
    },
  })

  const refundRequestMutation = useMutation({
    mutationFn: ({ paymentId, amount, reason }) => paymentApi.requestRefund(paymentId, user.id, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments'])
      toast.success('Refund request sent to Razorpay')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to request refund')
    },
  })

  const handleDeletePayment = async (payment) => {
    const paymentLabel = payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id}`
    const confirmed = await confirmDialog({
      title: 'Delete Payment Record',
      message: `Delete payment ${paymentLabel}? It will be hidden from reports immediately.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
      caution: 'You can undo only within 30 minutes from deletion.',
    })

    if (!confirmed) {
      return
    }

    deletePaymentMutation.mutate(payment.id)
  }

  const handleRequestRefund = async (payment) => {
    const paymentLabel = payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id}`
    const confirmed = await confirmDialog({
      title: 'Request Refund',
      message: `Request full refund for payment ${paymentLabel}?`,
      confirmText: 'Request Refund',
      cancelText: 'Cancel',
      tone: 'warning',
      caution: 'This will create a refund request in Razorpay for this payment.',
    })

    if (!confirmed) {
      return
    }

    refundRequestMutation.mutate({
      paymentId: payment.id,
      amount: payment.amount,
      reason: 'Refund requested from SocietyHub',
    })
  }

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        p.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.razorpayOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || (filterStatus === 'PENDING' ? isPendingStatus(p.status) : p.status === filterStatus)
      const matchesRefund = refundFilter === 'ALL' || (p.refundStatus || 'NONE') === refundFilter
      const matchesSettlement = settlementFilter === 'ALL' || (p.settlementStatus || 'NONE') === settlementFilter
      return matchesSearch && matchesStatus && matchesRefund && matchesSettlement
    })
  }, [payments, searchTerm, filterStatus, refundFilter, settlementFilter])

  // Calculate summary stats
  const stats = useMemo(() => ({
    total: payments.length,
    successful: payments.filter(p => p.status === 'CAPTURED').length,
    failed: payments.filter(p => p.status === 'FAILED').length,
    totalAmount: payments
      .filter(p => p.status === 'CAPTURED')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  }), [payments])

  const formatDate = (dateString) => {
    const parsed = parseServerDateTime(dateString)
    if (!parsed) return '-'
    return parsed.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getLifecycleSummary = (payment) => {
    const parts = []
    if (payment.refundStatus) {
      const refundText = payment.refundId
        ? `Refund: ${payment.refundStatus} (${payment.refundId})`
        : `Refund: ${payment.refundStatus}`
      parts.push(refundText)
    }
    if (payment.settlementStatus) {
      const settlementText = payment.settlementUtr
        ? `Settlement: ${payment.settlementStatus} (UTR ${payment.settlementUtr})`
        : `Settlement: ${payment.settlementStatus}`
      parts.push(settlementText)
    }
    return parts
  }

  const getUndoTimeLeft = (undoExpiresAt) => {
    const expiry = parseServerDateTime(undoExpiresAt)
    if (!expiry) return 'Expired'
    const msLeft = expiry.getTime() - Date.now()
    if (msLeft <= 0) return 'Expired'
    const minutes = Math.floor(msLeft / 60000)
    const seconds = Math.floor((msLeft % 60000) / 1000)
    return `${minutes}m ${String(seconds).padStart(2, '0')}s left`
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  const handleExport = async (format) => {
    setIsExporting(true)
    try {
      const response = effectiveSocietyId
        ? await exportApi.paymentsBySociety(effectiveSocietyId, format)
        : await exportApi.paymentsByUser(user.id, format)

      const datePart = new Date().toISOString().split('T')[0]
      downloadBlob(response.data, `online_payments_${datePart}.${format}`)
      toast.success('Payments exported successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export payments')
    } finally {
      setIsExporting(false)
    }
  }

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <FinancePageSkeleton summaryCount={4} rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Online Payments</h1>
            <InfoTooltip text="Track all Razorpay transactions" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <NeonSweepButton
            tone="cyan"
            size="md"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </NeonSweepButton>
          <NeonSweepButton
            tone="slate"
            size="md"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export XLSX'}
          </NeonSweepButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-secondary)]">Total Payments</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-secondary)]">Successful</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.successful}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-secondary)]">Failed</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{stats.failed}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm">
          <p className="text-sm text-[var(--text-secondary)]">Total Collected</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">₹{stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search by payment ID, order ID, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="min-w-[140px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
          >
            <option value="">All Status</option>
            <option value="CAPTURED">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Refund</span>
          {['ALL', 'NONE', 'INITIATED', 'PROCESSED', 'FAILED'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRefundFilter(value)}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                refundFilter === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Settlement</span>
          {['ALL', 'NONE', 'PENDING', 'PROCESSED', 'FAILED'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSettlementFilter(value)}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                settlementFilter === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {deletedPayments.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recently Deleted Payments</h2>
          </div>
          <div className="space-y-2">
            {deletedPayments.map((payment) => (
              <div key={payment.id} className="flex flex-col gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id}`}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{payment.userName || '-'} | ₹{payment.amount?.toLocaleString()} | {getUndoTimeLeft(payment.undoExpiresAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => undoDeleteMutation.mutate(payment.id)}
                  disabled={undoDeleteMutation.isPending || !payment.undoAvailable}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-500 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  Undo Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[var(--text-secondary)]">
            <CreditCard size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No payments found</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[var(--bg-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Payment ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Refund</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Settlement</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const status = statusConfig[payment.status] || statusConfig.CREATED
                    const StatusIcon = status.icon
                    return (
                      <tr key={payment.id} className="border-b border-[var(--border-default)] transition hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[0.85rem] font-medium">
                              {payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id}`}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                              {payment.receiptNumber}
                            </span>
                            {getLifecycleSummary(payment).map((line) => (
                              <span key={line} className="text-[11px] text-[var(--text-secondary)]">
                                {line}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{payment.userName || '-'}</span>
                            {payment.societyName && (
                              <span className="text-xs text-[var(--text-secondary)]">{payment.societyName}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                          ₹{payment.amount?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                          {payment.paymentMethod?.toUpperCase() || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                          <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', status.className)}>
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[var(--text-primary)]">
                          {payment.refundStatus || 'NONE'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[var(--text-primary)]">
                          {payment.settlementStatus || 'NONE'}
                        </td>
                        <td className="px-4 py-3 text-[0.8rem] text-[var(--text-secondary)]">
                          {formatDate(payment.paidAt || payment.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRequestRefund(payment)}
                              disabled={refundRequestMutation.isPending || payment.status !== 'CAPTURED' || !!payment.refundStatus}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 px-2.5 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Request refund from Razorpay"
                            >
                              Refund
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(payment)}
                              disabled={deletePaymentMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete payment record"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-[var(--border-default)]">
              {filteredPayments.map((payment) => {
                const status = statusConfig[payment.status] || statusConfig.CREATED
                const StatusIcon = status.icon
                return (
                  <div key={payment.id} className="p-3 sm:p-4">
                    <div className="mb-2 flex items-start justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="text-[13px] sm:text-sm font-semibold text-[var(--text-primary)] leading-tight break-all">
                          {payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id}`}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] break-all">{payment.receiptNumber || '-'}</p>
                        {getLifecycleSummary(payment).map((line) => (
                          <p key={line} className="text-[11px] sm:text-xs text-[var(--text-secondary)] break-all">{line}</p>
                        ))}
                      </div>
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold', status.className)}>
                        <StatusIcon size={13} />
                        {status.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                      <p className="text-[var(--text-secondary)]">User</p>
                      <p className="text-right font-medium text-[var(--text-primary)] break-words">{payment.userName || '-'}</p>
                      <p className="text-[var(--text-secondary)]">Amount</p>
                      <p className="text-right font-semibold text-[var(--text-primary)]">₹{payment.amount?.toLocaleString()}</p>
                      <p className="text-[var(--text-secondary)]">Method</p>
                      <p className="text-right text-[var(--text-primary)]">{payment.paymentMethod?.toUpperCase() || '-'}</p>
                      <p className="text-[var(--text-secondary)]">Date</p>
                      <p className="text-right text-[var(--text-primary)]">{formatDate(payment.paidAt || payment.createdAt)}</p>
                      <p className="text-[var(--text-secondary)]">Refund</p>
                      <p className="text-right text-[var(--text-primary)]">{payment.refundStatus || 'NONE'}</p>
                      <p className="text-[var(--text-secondary)]">Settlement</p>
                      <p className="text-right text-[var(--text-primary)]">{payment.settlementStatus || 'NONE'}</p>
                    </div>
                    <div className="mt-2.5 sm:mt-3 flex justify-end">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRequestRefund(payment)}
                          disabled={refundRequestMutation.isPending || payment.status !== 'CAPTURED' || !!payment.refundStatus}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-amber-600 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Request refund from Razorpay"
                        >
                          Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(payment)}
                          disabled={deletePaymentMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete payment record"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
