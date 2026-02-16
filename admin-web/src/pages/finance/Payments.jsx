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
  CREATED: { label: 'Pending', icon: Clock, className: 'payment-status--pending' },
  AUTHORIZED: { label: 'Authorized', icon: CheckCircle, className: 'payment-status--authorized' },
  CAPTURED: { label: 'Success', icon: CheckCircle, className: 'payment-status--success' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'payment-status--failed' },
  REFUNDED: { label: 'Refunded', icon: CreditCard, className: 'payment-status--refunded' },
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

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
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
      <div className="payments-page">
        <WakeUpBanner />
        <HeroSkeleton />
        <FinancePageSkeleton summaryCount={4} rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div className="payments-page">
      {/* Header */}
      <div className="payments-header">
        <div>
          <h1 className="payments-title">Online Payments</h1>
          <p className="payments-subtitle">Track all Razorpay transactions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payments-summary">
        <div className="payments-summary-card">
          <p className="payments-summary-label">Total Payments</p>
          <p className="payments-summary-value">{stats.total}</p>
        </div>
        <div className="payments-summary-card">
          <p className="payments-summary-label">Successful</p>
          <p className="payments-summary-value payments-summary-value--success">{stats.successful}</p>
        </div>
        <div className="payments-summary-card">
          <p className="payments-summary-label">Failed</p>
          <p className="payments-summary-value payments-summary-value--failed">{stats.failed}</p>
        </div>
        <div className="payments-summary-card">
          <p className="payments-summary-label">Total Collected</p>
          <p className="payments-summary-value">₹{stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="payments-filters">
        <div className="payments-filters-row">
          <div className="payments-search">
            <Search className="payments-search-icon" />
            <input
              type="text"
              placeholder="Search by payment ID, order ID, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="payments-search-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="payments-filter-select"
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
      <div className="payments-table-card">
        {filteredPayments.length === 0 ? (
          <div className="payments-empty">
            <CreditCard size={48} className="payments-empty-icon" />
            <p className="payments-empty-text">No payments found</p>
          </div>
        ) : (
          <div className="payments-table-scroll">
            <table className="payments-table">
              <thead className="payments-thead">
                <tr>
                  <th className="payments-th">Payment ID</th>
                  <th className="payments-th">User</th>
                  <th className="payments-th">Amount</th>
                  <th className="payments-th">Method</th>
                  <th className="payments-th">Status</th>
                  <th className="payments-th">Date</th>
                </tr>
              </thead>
              <tbody className="payments-tbody">
                {filteredPayments.map((payment) => {
                  const status = statusConfig[payment.status] || statusConfig.CREATED
                  const StatusIcon = status.icon
                  return (
                    <tr key={payment.id} className="payments-row">
                      <td className="payments-cell">
                        <div className="payments-id">
                          <span className="payments-id-main">
                            {payment.razorpayPaymentId || payment.razorpayOrderId || `#${payment.id}`}
                          </span>
                          <span className="payments-id-receipt">
                            {payment.receiptNumber}
                          </span>
                        </div>
                      </td>
                      <td className="payments-cell">
                        <div className="payments-user">
                          <span className="payments-user-name">{payment.userName || '-'}</span>
                          {payment.societyName && (
                            <span className="payments-user-society">{payment.societyName}</span>
                          )}
                        </div>
                      </td>
                      <td className="payments-cell payments-cell--amount">
                        ₹{payment.amount?.toLocaleString()}
                      </td>
                      <td className="payments-cell payments-cell--method">
                        {payment.paymentMethod?.toUpperCase() || '-'}
                      </td>
                      <td className="payments-cell">
                        <span className={clsx('payment-status', status.className)}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </td>
                      <td className="payments-cell payments-cell--date">
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
