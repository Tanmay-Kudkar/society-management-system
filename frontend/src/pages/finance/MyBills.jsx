import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { maintenanceBillApi } from '../../../../api'
import { useRazorpay } from '../../hooks/useRazorpay'
import { PermissionDenied, InfoTooltip } from '../../components'
import { HeroSkeleton, SummaryRowSkeleton, ListSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import { CreditCard, CheckCircle, Clock, AlertCircle, Wallet, Receipt, Calendar } from 'lucide-react'
import clsx from 'clsx'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusConfig = {
  PENDING: { label: 'Pending', icon: Clock, className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  UNPAID: { label: 'Unpaid', icon: AlertCircle, className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  PARTIAL: { label: 'Partial', icon: Clock, className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  PAID: { label: 'Paid', icon: CheckCircle, className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  OVERDUE: { label: 'Overdue', icon: AlertCircle, className: 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
}

export default function MyBills() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [selectedBill, setSelectedBill] = useState(null)
  const canAccessMyBills = user?.role === 'MEMBER' || user?.role === 'TENANT'

  if (!canAccessMyBills) {
    return <PermissionDenied message="My Bills is available only for members and tenants." />
  }

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
  const { data: bills = [], isLoading, isError } = useQuery({
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

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  const getBillTotal = (bill) => {
    const total = Number(bill?.totalAmount)
    return Number.isFinite(total) && total > 0 ? total : Number(bill?.amount) || 0
  }

  // Calculate summary
  const summary = useMemo(() => {
    const pending = bills.filter(b => b.status !== 'PAID')
    const totalDue = pending.reduce((sum, b) => sum + Math.max(0, getBillTotal(b) - (b.paidAmount || 0)), 0)
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
    const balance = Math.max(0, getBillTotal(bill) - (bill.paidAmount || 0))
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
      <div className="mx-auto max-w-[800px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Bills</h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] px-8 py-16 text-center">
          <Receipt size={64} className="mb-4 text-[var(--text-secondary)] opacity-40" />
          <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">No Unit Assigned</h3>
          <p className="max-w-[300px] leading-6 text-[var(--text-secondary)]">
            You don't have a flat/unit assigned to your account yet. 
            Please contact your society admin.
          </p>
        </div>
      </div>
    )
  }

  if (showSkeleton) {
    return (
      <div className="mx-auto max-w-[800px]">
        <WakeUpBanner />
        <HeroSkeleton />
        <SummaryRowSkeleton count={4} />
        <ListSkeleton count={4} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[800px]">
      {/* Header */}
      <div className="mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Bills</h1>
            <InfoTooltip text="View and pay your maintenance bills online" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border-0 bg-gradient-to-br from-indigo-500 to-violet-500 p-4 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Wallet size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/80">Total Due</p>
            <p className="text-xl font-bold">₹{summary.totalDue.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
            <Clock size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--text-secondary)]">Pending Bills</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{summary.pendingCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300">
            <AlertCircle size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--text-secondary)]">Overdue</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{summary.overdueCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-300">
            <Receipt size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--text-secondary)]">Total Bills</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{summary.totalBills}</p>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="flex flex-col gap-4">
        {sortedBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-12 text-[var(--text-secondary)]">
            <Receipt size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No bills found</p>
          </div>
        ) : (
          sortedBills.map((bill) => {
            const status = statusConfig[bill.status] || statusConfig.PENDING
            const StatusIcon = status.icon
            const balance = Math.max(0, getBillTotal(bill) - (bill.paidAmount || 0))
            const isPaid = bill.status === 'PAID'

            return (
              <div key={bill.id} className={clsx('overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] transition hover:-translate-y-0.5 hover:shadow-lg', isPaid && 'opacity-85')}>
                <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-tertiary)] px-5 py-4">
                  <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                    <Calendar size={18} />
                    <span>{formatMonth(bill.billMonth)}</span>
                  </div>
                  <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', status.className)}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                <div className="px-5 py-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">Bill Amount</span>
                      <span className="text-base font-semibold text-[var(--text-primary)]">₹{getBillTotal(bill).toLocaleString()}</span>
                    </div>
                    {bill.paidAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Paid</span>
                        <span className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                          ₹{bill.paidAmount?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {!isPaid && (
                      <div className="mt-2 flex items-center justify-between border-t border-dashed border-[var(--border-default)] pt-3">
                        <span className="text-sm text-[var(--text-secondary)]">Balance Due</span>
                        <span className="text-lg font-semibold text-rose-600 dark:text-rose-300">
                          ₹{balance.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {bill.dueDate && (
                    <div className="mt-3 text-xs text-[var(--text-secondary)]">
                      Due: {new Date(bill.dueDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                </div>

                {!isPaid && (
                  <div className="border-t border-[var(--border-default)] bg-[var(--bg-tertiary)] px-5 py-4">
                    <button
                      onClick={() => handlePayOnline(bill)}
                      disabled={isPaymentLoading && selectedBill?.id === bill.id}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 px-4 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(99,102,241,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Wallet size={18} />
                      {isPaymentLoading && selectedBill?.id === bill.id 
                        ? 'Processing...' 
                        : `Pay ₹${balance.toLocaleString()}`}
                    </button>
                  </div>
                )}

                {isPaid && bill.paymentDate && (
                  <div className="flex items-center gap-2 border-t border-[var(--border-default)] bg-[var(--bg-tertiary)] px-5 py-4 text-sm text-emerald-600 dark:text-emerald-300">
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
