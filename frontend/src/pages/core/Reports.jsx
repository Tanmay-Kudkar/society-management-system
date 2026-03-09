import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { reportApi, societyApi, exportApi, downloadBlob } from '../../../../api'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  Clock,
  FileText,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied } from '../../components'
import { ReportsSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

const formatPercent = (value) => {
  if (value === null || value === undefined) return '0%'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export default function Reports() {
  const { user, canViewReports } = useAuth()
  const [searchParams] = useSearchParams()
  
  // All hooks must be called unconditionally at the top
  const [reportType, setReportType] = useState('MTD')
  const [selectedSocietyId, setSelectedSocietyId] = useState(user?.societyId || '')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const hasValidSocietyIdInUrl = Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
  const isScopedMode = isPlatformLevel && !!societyIdFromUrl

  const hasPermission = canViewReports()

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel && !isScopedMode && hasPermission,
  })

  const {
    isLoading: isScopedSocietyLoading,
    isError: isScopedSocietyMissing,
  } = useQuery({
    queryKey: ['reports-society-exists', parsedSocietyIdFromUrl],
    queryFn: () => societyApi.getById(parsedSocietyIdFromUrl).then(res => res.data),
    enabled: isScopedMode && hasValidSocietyIdInUrl && hasPermission,
    retry: false,
  })

  const invalidUrlSociety = isScopedMode && (!hasValidSocietyIdInUrl || isScopedSocietyMissing)

  const societyId = isPlatformLevel
    ? (isScopedMode ? (invalidUrlSociety ? '' : parsedSocietyIdFromUrl) : selectedSocietyId)
    : user?.societyId

  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ['report', reportType, societyId, customStartDate, customEndDate],
    queryFn: async () => {
      if (!societyId) return null
      
      if (reportType === 'MTD') {
        return reportApi.getMTD(societyId).then(res => res.data)
      } else if (reportType === 'YTD') {
        return reportApi.getYTD(societyId).then(res => res.data)
      } else if (reportType === 'CUSTOM' && customStartDate && customEndDate) {
        return reportApi.getCustom(societyId, customStartDate, customEndDate).then(res => res.data)
      } else if (reportType === 'COMPARISON') {
        return reportApi.getComparison(societyId, 'MONTH').then(res => res.data)
      }
      return null
    },
    enabled: !!societyId && !invalidUrlSociety && hasPermission,
  })

  const { data: _dashboardReport } = useQuery({
    queryKey: ['dashboardReport', societyId],
    queryFn: () => societyId ? reportApi.getDashboard(societyId).then(res => res.data) : null,
    enabled: !!societyId && !invalidUrlSociety && hasPermission,
  })

  const showSkeleton = useMinLoadingTime(isLoading || isError || isScopedSocietyLoading)

  // Permission check
  if (!hasPermission) {
    return <PermissionDenied message="You don't have permission to view financial reports" />
  }

  const handleExport = async () => {
    if (!societyId) return
    setIsExporting(true)
    try {
      const response = await exportApi.financialReport(
        societyId, 
        reportType, 
        customStartDate || null, 
        customEndDate || null
      )
      const filename = `${reportType.toLowerCase()}_financial_report_${new Date().toISOString().split('T')[0]}.xlsx`
      downloadBlob(response.data, filename)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (showSkeleton) return (
    <div className="flex flex-col gap-6">
      <WakeUpBanner />
      <ReportsSkeleton />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financial Reports</h1>
          <p className="mt-1 text-[var(--text-secondary)]">MTD, YTD and custom period financial analysis</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!societyId || isExporting}
          className="inline-flex items-center gap-2 py-[0.55rem] px-4 rounded-xl bg-[#16a34a] text-white font-semibold transition-transform hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(22,163,74,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <FileSpreadsheet size={20} />
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {!invalidUrlSociety && (
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start gap-4 max-md:flex-col max-md:items-stretch">
            {isPlatformLevel && !isScopedMode && (
              <select
                value={selectedSocietyId}
                onChange={(e) => setSelectedSocietyId(e.target.value)}
                className="min-w-[190px] py-2 px-[0.85rem] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] min-h-[2.5rem] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] max-md:w-full"
              >
                <option value="">Select Society</option>
                {societies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <div className="flex items-center flex-wrap gap-[0.4rem] p-[0.35rem] rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-light)] max-md:w-full">
              {['MTD', 'YTD', 'COMPARISON', 'CUSTOM'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReportType(type)}
                  className={clsx(
                    'border border-transparent py-[0.45rem] px-[0.9rem] rounded-[0.6rem] text-[0.85rem] font-semibold text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] max-md:flex-1 max-md:text-center',
                    reportType === type && 'bg-[var(--bg-card)] !border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border-default))] text-[var(--accent-primary)] shadow-[0_6px_16px_rgba(15,23,42,0.1)]'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {reportType === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-3 max-md:w-full">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="py-2 px-[0.85rem] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] min-h-[2.5rem] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] max-md:w-full"
                />
                <span className="text-[var(--text-tertiary)] max-md:hidden">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="py-2 px-[0.85rem] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] min-h-[2.5rem] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] max-md:w-full"
                />
                <button
                  onClick={() => refetch()}
                  className="border border-transparent py-2 px-4 rounded-xl bg-[#2563eb] text-white font-semibold min-h-[2.5rem] transition-transform hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(37,99,235,0.25)] max-md:w-full"
                >
                  Generate
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {invalidUrlSociety && (
        <div className="p-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
          <p className="m-0 font-semibold text-[var(--text-primary)]">No society exists for this URL</p>
          <p className="mt-1 text-sm">Please select a valid society from app navigation. Do not use random values in the URL.</p>
        </div>
      )}

      {!invalidUrlSociety && !societyId && (
        <div className="p-4 rounded-xl bg-[#fef3c7] border border-[#fde68a] text-[#92400e]">
          {isPlatformLevel
            ? 'Please open reports from a selected society context to view data.'
            : 'Please select a society to view reports.'}
        </div>
      )}


      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Income</p>
                  <p className="mt-[0.35rem] text-[1.6rem] font-bold text-[#16a34a]">
                    {formatCurrency(report.totalIncome)}
                  </p>
                  {report.incomeGrowthPercent !== null && (
                    <p className={clsx(
                      'mt-[0.3rem] inline-flex items-center gap-[0.35rem] text-[0.8rem] font-semibold',
                      report.incomeGrowthPercent >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
                    )}>
                      {report.incomeGrowthPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatPercent(report.incomeGrowthPercent)} vs previous
                    </p>
                  )}
                </div>
                <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center bg-[rgba(22,163,74,0.12)] text-[#16a34a]">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Expense</p>
                  <p className="mt-[0.35rem] text-[1.6rem] font-bold text-[#dc2626]">
                    {formatCurrency(report.totalExpense)}
                  </p>
                  {report.expenseGrowthPercent !== null && (
                    <p className={clsx(
                      'mt-[0.3rem] inline-flex items-center gap-[0.35rem] text-[0.8rem] font-semibold',
                      report.expenseGrowthPercent <= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
                    )}>
                      {report.expenseGrowthPercent <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {formatPercent(report.expenseGrowthPercent)} vs previous
                    </p>
                  )}
                </div>
                <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center bg-[rgba(220,38,38,0.12)] text-[#dc2626]">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Net Balance */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.85rem] text-[var(--text-tertiary)]">Net Balance</p>
                  <p className={clsx(
                    'mt-[0.35rem] text-[1.6rem] font-bold',
                    report.netBalance >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
                  )}>
                    {formatCurrency(report.netBalance)}
                  </p>
                  <p className="mt-[0.3rem] text-[0.8rem] text-[var(--text-tertiary)]">
                    {report.startDate} to {report.endDate}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center bg-[rgba(37,99,235,0.12)] text-[#2563eb]">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Cash Balance */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.85rem] text-[var(--text-tertiary)]">Cash Balance</p>
                  <p className={clsx(
                    'mt-[0.35rem] text-[1.6rem] font-bold',
                    report.cashBalance >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
                  )}>
                    {formatCurrency(report.cashBalance)}
                  </p>
                  <p className="mt-[0.3rem] text-[0.8rem] text-[var(--text-tertiary)]">All-time balance</p>
                </div>
                <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center bg-[rgba(139,92,246,0.12)] text-[#7c3aed]">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income by Category */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <PieChart size={20} className="text-[#16a34a]" />
                Income by Category
              </h3>
              {report.incomeByCategory && Object.keys(report.incomeByCategory).length > 0 ? (
                <div className="flex flex-col gap-3">
                  {Object.entries(report.incomeByCategory).map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between gap-3">
                      <span className="text-[var(--text-tertiary)]">{category}</span>
                      <span className="font-semibold text-[#16a34a]">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-[var(--text-tertiary)]">No income data</p>
              )}
            </div>

            {/* Expense by Category */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <PieChart size={20} className="text-[#dc2626]" />
                Expense by Category
              </h3>
              {report.expenseByCategory && Object.keys(report.expenseByCategory).length > 0 ? (
                <div className="flex flex-col gap-3">
                  {Object.entries(report.expenseByCategory).map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between gap-3">
                      <span className="text-[var(--text-tertiary)]">{category}</span>
                      <span className="font-semibold text-[#dc2626]">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-[var(--text-tertiary)]">No expense data</p>
              )}
            </div>
          </div>

          {/* Payment Mode Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income by Payment Mode */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <BarChart3 size={20} className="text-[#2563eb]" />
                Income by Payment Mode
              </h3>
              {report.incomeByPaymentMode && Object.keys(report.incomeByPaymentMode).length > 0 ? (
                <div className="flex flex-col gap-4">
                  {Object.entries(report.incomeByPaymentMode).map(([mode, amount]) => {
                    const total = Object.values(report.incomeByPaymentMode).reduce((a, b) => a + b, 0)
                    const percent = total > 0 ? (amount / total) * 100 : 0
                    return (
                      <div key={mode}>
                        <div className="flex items-center justify-between gap-3 mb-[0.4rem]">
                          <span className="text-[var(--text-tertiary)]">{mode}</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)]">
                          <div
                            className="h-full rounded-full bg-[#16a34a]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center py-6 text-[var(--text-tertiary)]">No data</p>
              )}
            </div>

            {/* Expense by Payment Mode */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <BarChart3 size={20} className="text-[#f97316]" />
                Expense by Payment Mode
              </h3>
              {report.expenseByPaymentMode && Object.keys(report.expenseByPaymentMode).length > 0 ? (
                <div className="flex flex-col gap-4">
                  {Object.entries(report.expenseByPaymentMode).map(([mode, amount]) => {
                    const total = Object.values(report.expenseByPaymentMode).reduce((a, b) => a + b, 0)
                    const percent = total > 0 ? (amount / total) * 100 : 0
                    return (
                      <div key={mode}>
                        <div className="flex items-center justify-between gap-3 mb-[0.4rem]">
                          <span className="text-[var(--text-tertiary)]">{mode}</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)]">
                          <div
                            className="h-full rounded-full bg-[#dc2626]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center py-6 text-[var(--text-tertiary)]">No data</p>
              )}
            </div>
          </div>

          {/* Bills Summary */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
              <Receipt size={20} className="text-[#6366f1]" />
              Bills Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-[0.9rem] bg-[var(--bg-tertiary)] text-center">
                <p className="text-[1.4rem] font-bold text-[var(--text-primary)]">{report.totalBillsGenerated || 0}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Bills</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(22,163,74,0.12)] text-center">
                <p className="text-[1.4rem] font-bold text-[#16a34a]">{report.billsPaid || 0}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Paid</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(234,179,8,0.12)] text-center">
                <p className="text-[1.4rem] font-bold text-[#ca8a04]">{report.billsPending || 0}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Pending</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(37,99,235,0.12)] text-center">
                <p className="text-[1.4rem] font-bold text-[#2563eb]">
                  {formatCurrency(report.billsCollectedAmount)}
                </p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Collected</p>
              </div>
            </div>
          </div>

          {/* Upcoming Payments */}
          {report.upcomingPayments && report.upcomingPayments.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center flex-wrap justify-between gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <Clock size={20} className="text-[#f97316]" />
                Upcoming Payments
                <span className="ml-auto text-[0.85rem] font-normal text-[var(--text-tertiary)]">
                  Total: {formatCurrency(report.upcomingExpenses)}
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-tertiary)] text-[0.85rem]">
                      <th className="py-[0.65rem] text-left font-semibold">Description</th>
                      <th className="py-[0.65rem] text-left font-semibold">Type</th>
                      <th className="py-[0.65rem] text-left font-semibold">Due Date</th>
                      <th className="py-[0.65rem] text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.upcomingPayments.map((payment, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-light)]">
                        <td className="py-[0.65rem] text-[var(--text-primary)] font-semibold">{payment.description}</td>
                        <td className="py-[0.65rem] text-[var(--text-primary)]">
                          <span className="inline-flex items-center py-[0.2rem] px-[0.6rem] rounded-[0.6rem] text-xs font-semibold bg-[rgba(37,99,235,0.12)] text-[#1d4ed8]">
                            {payment.type}
                          </span>
                        </td>
                        <td className="py-[0.65rem] text-[var(--text-tertiary)]">{payment.dueDate}</td>
                        <td className="py-[0.65rem] text-right text-[var(--text-primary)] font-semibold">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Trends */}
          {report.monthlyTrends && report.monthlyTrends.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <BarChart3 size={20} className="text-[#7c3aed]" />
                Monthly Trends
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-tertiary)] text-[0.85rem]">
                      <th className="py-[0.65rem] text-left font-semibold">Month</th>
                      <th className="py-[0.65rem] text-right font-semibold">Income</th>
                      <th className="py-[0.65rem] text-right font-semibold">Expense</th>
                      <th className="py-[0.65rem] text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.monthlyTrends.map((trend, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-light)]">
                        <td className="py-[0.65rem] text-[var(--text-primary)] font-semibold">{trend.month}</td>
                        <td className="py-[0.65rem] text-right text-[#16a34a]">
                          {formatCurrency(trend.income)}
                        </td>
                        <td className="py-[0.65rem] text-right text-[#dc2626]">
                          {formatCurrency(trend.expense)}
                        </td>
                        <td className={clsx(
                          'py-[0.65rem] text-right font-semibold',
                          trend.balance >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
                        )}>
                          {formatCurrency(trend.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
