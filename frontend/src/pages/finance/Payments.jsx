import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { paymentApi } from '../../../../api'
import { Search, CreditCard, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusConfig = {
  CREATED: { label: 'Pending', icon: Clock, className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  AUTHORIZED: { label: 'Authorized', icon: CheckCircle, className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  CAPTURED: { label: 'Success', icon: CheckCircle, className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  REFUNDED: { label: 'Refunded', icon: CreditCard, className: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' },
}

export default function Payments() {
  const { user, canManageMaintenanceBills } = useAuth()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

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

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        p.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.razorpayOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || p.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [payments, searchTerm, filterStatus])

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
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Online Payments</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Track all Razorpay transactions</p>
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
            <option value="CREATED">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-[var(--text-secondary)]">
            <CreditCard size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Payment ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]">Date</th>
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
                      <td className="px-4 py-3 text-[0.8rem] text-[var(--text-secondary)]">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
