import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { maintenanceBillApi } from '../../../api'
import { useRazorpay } from '../hooks/useRazorpay'
import { CreditCard, CheckCircle, Clock, AlertCircle, Wallet, Receipt, Calendar } from 'lucide-react'
import clsx from 'clsx'

const statusConfig = {
  PENDING: { label: 'Pending', icon: Clock, className: 'mybills-status--pending' },
  UNPAID: { label: 'Unpaid', icon: AlertCircle, className: 'mybills-status--pending' },
  PARTIAL: { label: 'Partial', icon: Clock, className: 'mybills-status--partial' },
  PAID: { label: 'Paid', icon: CheckCircle, className: 'mybills-status--paid' },
  OVERDUE: { label: 'Overdue', icon: AlertCircle, className: 'mybills-status--overdue' },
}

export default function MyBills() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [selectedBill, setSelectedBill] = useState(null)

  // Razorpay integration
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay({
    onSuccess: (paymentData) => {
      toast.success('Payment successful! Your bill has been updated.')
      queryClient.invalidateQueries(['myBills'])
      setSelectedBill(null)
    },
    onError: (error) => {
      toast.error(error?.description || error?.message || 'Payment failed. Please try again.')
    },
  })

  // Fetch bills for the user's flat
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['myBills', user?.flatId],
    queryFn: async () => {
      if (!user?.flatId) return []
      const res = await maintenanceBillApi.getByFlat(user.flatId)
      return res.data
    },
    enabled: !!user?.flatId,
  })

  // Sort bills by month (newest first)
  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => b.billMonth?.localeCompare(a.billMonth))
  }, [bills])

  // Calculate summary
  const summary = useMemo(() => {
    const pending = bills.filter(b => b.status !== 'PAID')
    const totalDue = pending.reduce((sum, b) => sum + (b.amount - (b.paidAmount || 0)), 0)
    const overdue = pending.filter(b => b.isOverdue || b.status === 'OVERDUE')
    return {
      totalBills: bills.length,
      pendingCount: pending.length,
      totalDue,
      overdueCount: overdue.length,
    }
  }, [bills])

  // Handle online payment
  const handlePayOnline = (bill) => {
    const balance = bill.amount - (bill.paidAmount || 0)
    setSelectedBill(bill)
    initiatePayment({
      amount: balance,
      maintenanceBillId: bill.id,
      userId: user.id,
      description: `Maintenance Bill - ${bill.billMonth}`,
      paymentType: 'MAINTENANCE',
      prefill: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  }

  const formatMonth = (monthStr) => {
    if (!monthStr) return '-'
    const [year, month] = monthStr.split('-')
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }

  // If user doesn't have a flat assigned
  if (!user?.flatId) {
    return (
      <div className="mybills-page">
        <div className="mybills-header">
          <h1 className="mybills-title">My Bills</h1>
        </div>
        <div className="mybills-empty-state">
          <Receipt size={64} className="mybills-empty-icon" />
          <h3 className="mybills-empty-title">No Unit Assigned</h3>
          <p className="mybills-empty-text">
            You don't have a flat/unit assigned to your account yet. 
            Please contact your society admin.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mybills-page">
      {/* Header */}
      <div className="mybills-header">
        <div>
          <h1 className="mybills-title">My Bills</h1>
          <p className="mybills-subtitle">View and pay your maintenance bills online</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mybills-summary">
        <div className="mybills-summary-card mybills-summary-card--due">
          <div className="mybills-summary-icon">
            <Wallet size={24} />
          </div>
          <div className="mybills-summary-content">
            <p className="mybills-summary-label">Total Due</p>
            <p className="mybills-summary-value">₹{summary.totalDue.toLocaleString()}</p>
          </div>
        </div>
        <div className="mybills-summary-card">
          <div className="mybills-summary-icon mybills-summary-icon--pending">
            <Clock size={24} />
          </div>
          <div className="mybills-summary-content">
            <p className="mybills-summary-label">Pending Bills</p>
            <p className="mybills-summary-value">{summary.pendingCount}</p>
          </div>
        </div>
        <div className="mybills-summary-card">
          <div className="mybills-summary-icon mybills-summary-icon--overdue">
            <AlertCircle size={24} />
          </div>
          <div className="mybills-summary-content">
            <p className="mybills-summary-label">Overdue</p>
            <p className="mybills-summary-value">{summary.overdueCount}</p>
          </div>
        </div>
        <div className="mybills-summary-card">
          <div className="mybills-summary-icon mybills-summary-icon--total">
            <Receipt size={24} />
          </div>
          <div className="mybills-summary-content">
            <p className="mybills-summary-label">Total Bills</p>
            <p className="mybills-summary-value">{summary.totalBills}</p>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="mybills-list">
        {isLoading ? (
          <div className="mybills-loading">
            <div className="mybills-spinner" />
          </div>
        ) : sortedBills.length === 0 ? (
          <div className="mybills-empty">
            <Receipt size={48} className="mybills-empty-icon" />
            <p className="mybills-empty-text">No bills found</p>
          </div>
        ) : (
          sortedBills.map((bill) => {
            const status = statusConfig[bill.status] || statusConfig.PENDING
            const StatusIcon = status.icon
            const balance = bill.amount - (bill.paidAmount || 0)
            const isPaid = bill.status === 'PAID'

            return (
              <div key={bill.id} className={clsx('mybills-card', isPaid && 'mybills-card--paid')}>
                <div className="mybills-card-header">
                  <div className="mybills-card-month">
                    <Calendar size={18} />
                    <span>{formatMonth(bill.billMonth)}</span>
                  </div>
                  <span className={clsx('mybills-status', status.className)}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                <div className="mybills-card-body">
                  <div className="mybills-card-amounts">
                    <div className="mybills-amount-row">
                      <span className="mybills-amount-label">Bill Amount</span>
                      <span className="mybills-amount-value">₹{bill.amount?.toLocaleString()}</span>
                    </div>
                    {bill.paidAmount > 0 && (
                      <div className="mybills-amount-row">
                        <span className="mybills-amount-label">Paid</span>
                        <span className="mybills-amount-value mybills-amount-value--paid">
                          ₹{bill.paidAmount?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {!isPaid && (
                      <div className="mybills-amount-row mybills-amount-row--balance">
                        <span className="mybills-amount-label">Balance Due</span>
                        <span className="mybills-amount-value mybills-amount-value--due">
                          ₹{balance.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {bill.dueDate && (
                    <div className="mybills-due-date">
                      Due: {new Date(bill.dueDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                </div>

                {!isPaid && (
                  <div className="mybills-card-footer">
                    <button
                      onClick={() => handlePayOnline(bill)}
                      disabled={isPaymentLoading && selectedBill?.id === bill.id}
                      className="mybills-pay-button"
                    >
                      <Wallet size={18} />
                      {isPaymentLoading && selectedBill?.id === bill.id 
                        ? 'Processing...' 
                        : `Pay ₹${balance.toLocaleString()}`}
                    </button>
                  </div>
                )}

                {isPaid && bill.paymentDate && (
                  <div className="mybills-card-footer mybills-card-footer--paid">
                    <CheckCircle size={16} />
                    <span>
                      Paid on {new Date(bill.paymentDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
