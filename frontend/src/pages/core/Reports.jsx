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
import { PermissionDenied, InfoTooltip, NeonSweepButton } from '../../components'
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

const formatCategory = (cat) => {
  const map = {
    MAINTENANCE: 'Maintenance', VENDOR_PAYMENT: 'Vendor Payment', SALARY: 'Salary',
    UTILITIES: 'Utilities', ELECTRICITY: 'Electricity', WATER: 'Water',
    AMC: 'AMC / Service', SECURITY: 'Security', INSURANCE: 'Insurance',
    REPAIR: 'Repair & Maintenance', CLEANING: 'Cleaning', INTERNET: 'Internet',
    PARKING: 'Parking', MISCELLANEOUS: 'Miscellaneous', OTHER: 'Other',
  }
  return map[cat] || (cat ? cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : cat)
}

const formatPaymentMode = (mode) => {
  const map = {
    CASH: 'Cash', CHEQUE: 'Cheque', UPI: 'UPI', BANK_TRANSFER: 'Bank Transfer',
    CREDIT_CARD: 'Credit Card', DEBIT_CARD: 'Debit Card', NET_BANKING: 'Net Banking',
    WALLET: 'Wallet', OTHER: 'Other',
  }
  return map[mode] || (mode ? mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : mode)
}

const TAB_LABELS = {
  MTD:        { short: 'MTD',        full: 'Month-to-Date'    },
  YTD:        { short: 'YTD',        full: 'Year-to-Date'     },
  COMPARISON: { short: 'Comparison', full: 'Month-over-Month' },
  CUSTOM:     { short: 'Custom',     full: 'Custom Range'     },
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
  const [exportFormat, setExportFormat] = useState('csv')

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

  const { data: report, isLoading, isError } = useQuery({
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
        customEndDate || null,
        exportFormat
      )
      const filename = `${reportType.toLowerCase()}_financial_report_${new Date().toISOString().split('T')[0]}.${exportFormat}`
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financial Reports</h1>
            <InfoTooltip text="MTD, YTD and custom period financial analysis" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] md:w-auto"
            aria-label="Export format"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
          </select>
          <NeonSweepButton
            tone="cyan"
            size="md"
            onClick={handleExport}
            disabled={!societyId || isExporting}
            className="w-full md:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : `Export to ${exportFormat.toUpperCase()}`}
          </NeonSweepButton>
        </div>
      </div>

      {!invalidUrlSociety && (
        <div className="px-5 py-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
          <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
            {isPlatformLevel && !isScopedMode && (
              <select
                value={selectedSocietyId}
                onChange={(e) => setSelectedSocietyId(e.target.value)}
                className="min-w-[200px] py-[0.55rem] px-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-[0.875rem] font-semibold focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-100)] max-md:w-full"
              >
                <option value="">Select Society</option>
                {societies.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] max-md:w-full">
              {['MTD', 'YTD', 'COMPARISON', 'CUSTOM'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReportType(type)}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-[0.12rem] px-4 py-[0.6rem] rounded-[0.55rem] min-w-[4.4rem] transition-all duration-200 max-md:flex-1',
                    reportType === type
                      ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-[var(--border-strong)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                  )}
                >
                  <span className="text-[0.875rem] font-bold leading-none">{TAB_LABELS[type].short}</span>
                  <span className="text-[0.635rem] font-medium leading-none mt-[0.2rem] opacity-70">{TAB_LABELS[type].full}</span>
                </button>
              ))}
            </div>

            {reportType === 'CUSTOM' && (
              <div className="flex items-center gap-2 max-md:w-full">
                <div className="flex items-center gap-3 py-[0.55rem] px-3 rounded-[0.6rem] border border-[var(--border-default)] bg-[var(--bg-card)] focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_3px_var(--color-primary-100)] transition-all max-md:flex-1">
                  <span className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-wider select-none">From</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent border-0 outline-none text-[0.875rem] font-semibold text-[var(--text-primary)] min-w-[7.5rem] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 p-0 m-0 w-full"
                  />
                </div>
                <span className="text-[var(--border-strong)] font-thin text-lg mx-1 max-md:hidden">/</span>
                <div className="flex items-center gap-3 py-[0.55rem] px-3 rounded-[0.6rem] border border-[var(--border-default)] bg-[var(--bg-card)] focus-within:border-[var(--accent-primary)] focus-within:shadow-[0_0_0_3px_var(--color-primary-100)] transition-all max-md:flex-1">
                  <span className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase tracking-wider select-none">To</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent border-0 outline-none text-[0.875rem] font-semibold text-[var(--text-primary)] min-w-[7.5rem] cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 p-0 m-0 w-full"
                  />
                </div>
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

          {/* Comparison Panel */}
          {reportType === 'COMPARISON' && report.previousPeriodIncome != null && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <BarChart3 size={20} className="text-[#7c3aed]" />
                Month-over-Month Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[0.8rem] font-semibold text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">Current Period</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-light)]">
                      <span className="text-[var(--text-secondary)]">Income</span>
                      <span className="font-bold text-[#16a34a]">{formatCurrency(report.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-light)]">
                      <span className="text-[var(--text-secondary)]">Expense</span>
                      <span className="font-bold text-[#dc2626]">{formatCurrency(report.totalExpense)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[var(--text-secondary)]">Net Balance</span>
                      <span className={clsx('font-bold', report.netBalance >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]')}>
                        {formatCurrency(report.netBalance)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[0.8rem] font-semibold text-[var(--text-tertiary)] mb-3 uppercase tracking-wide">Previous Period</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-light)]">
                      <span className="text-[var(--text-secondary)]">Income</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#16a34a]">{formatCurrency(report.previousPeriodIncome)}</span>
                        {report.incomeGrowthPercent != null && (
                          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full',
                            report.incomeGrowthPercent >= 0 ? 'bg-[rgba(22,163,74,0.12)] text-[#16a34a]' : 'bg-[rgba(220,38,38,0.12)] text-[#dc2626]')}>
                            {formatPercent(report.incomeGrowthPercent)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-light)]">
                      <span className="text-[var(--text-secondary)]">Expense</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#dc2626]">{formatCurrency(report.previousPeriodExpense)}</span>
                        {report.expenseGrowthPercent != null && (
                          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full',
                            report.expenseGrowthPercent <= 0 ? 'bg-[rgba(22,163,74,0.12)] text-[#16a34a]' : 'bg-[rgba(220,38,38,0.12)] text-[#dc2626]')}>
                            {formatPercent(report.expenseGrowthPercent)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[var(--text-secondary)]">Net Balance</span>
                      <span className={clsx('font-bold',
                        (report.previousPeriodIncome - report.previousPeriodExpense) >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]')}>
                        {formatCurrency(report.previousPeriodIncome - report.previousPeriodExpense)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <span className="text-[var(--text-tertiary)]">{formatCategory(category)}</span>
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
                      <span className="text-[var(--text-tertiary)]">{formatCategory(category)}</span>
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
                          <span className="text-[var(--text-tertiary)]">{formatPaymentMode(mode)}</span>
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
                          <span className="text-[var(--text-tertiary)]">{formatPaymentMode(mode)}</span>
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
          {reportType !== 'COMPARISON' && (
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
              <Receipt size={20} className="text-[#6366f1]" />
              Bills Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-[0.9rem] bg-[var(--bg-tertiary)] text-center">
                <p className="text-[1.4rem] font-bold text-[var(--text-primary)]">{report.totalBillsGenerated || 0}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Bills</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(22,163,74,0.12)] text-center">
                <p className="text-[1.4rem] font-bold text-[#16a34a]">{report.billsPaid || 0}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Paid</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(234,179,8,0.12)] text-center">
                <p className="text-[1.4rem] font-bold text-[var(--color-accent-amber)]">{report.billsPending || 0}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Pending</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(37,99,235,0.12)] text-center">
                <p className="text-[1.4rem] font-bold text-[#2563eb]">
                  {formatCurrency(report.billsCollectedAmount)}
                </p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Collected</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(239,68,68,0.12)] text-center">
                <p className="text-[1.4rem] font-bold text-[#dc2626]">
                  {formatCurrency(report.billsPendingAmount)}
                </p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Pending Amount</p>
              </div>
            </div>
          </div>
          )}

          {/* Period Statistics */}
          {reportType !== 'COMPARISON' && (
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
            <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
              <FileText size={20} className="text-[#0ea5e9]" />
              Period Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-[0.9rem] bg-[var(--bg-tertiary)] text-center">
                <p className="text-[1.4rem] font-bold text-[var(--text-primary)]">{report.transactionCount || 0}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Transactions</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(234,179,8,0.12)] text-center">
                <p className="text-[1.2rem] font-bold text-[var(--color-accent-amber)]">{formatCurrency(report.lateFeeCollected)}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Late Fees Collected</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(168,85,247,0.12)] text-center">
                <p className="text-[1.2rem] font-bold text-[#9333ea]">{formatCurrency(report.discountGiven)}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Discounts Given</p>
              </div>
              <div className="p-4 rounded-[0.9rem] bg-[rgba(20,184,166,0.12)] text-center">
                <p className="text-[1.2rem] font-bold text-[#0d9488]">{formatCurrency(report.taxCollected)}</p>
                <p className="text-[0.85rem] text-[var(--text-tertiary)]">Tax Collected</p>
              </div>
            </div>
          </div>
          )}

          {/* Outstanding Dues */}
          {reportType !== 'COMPARISON' && (
            <div className={clsx(
              'p-6 rounded-2xl shadow-[0_12px_24px_rgba(15,23,42,0.08)]',
              report.outstandingDuesCount > 0
                ? 'bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.3)]'
                : 'bg-[rgba(22,163,74,0.05)] border border-[rgba(22,163,74,0.3)]'
            )}>
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <Clock size={20} className={report.outstandingDuesCount > 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'} />
                Outstanding Dues
                <span className="ml-1 text-[0.8rem] font-normal text-[var(--text-tertiary)]">(all-time unpaid &amp; partial maintenance bills)</span>
              </h3>
              {report.outstandingDuesCount > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-[0.9rem] bg-[rgba(239,68,68,0.1)] text-center">
                    <p className="text-[1.4rem] font-bold text-[#dc2626]">{report.outstandingDuesCount}</p>
                    <p className="text-[0.85rem] text-[var(--text-tertiary)]">Unpaid / Partial Bills</p>
                  </div>
                  <div className="p-4 rounded-[0.9rem] bg-[rgba(239,68,68,0.1)] text-center">
                    <p className="text-[1.2rem] font-bold text-[#dc2626]">{formatCurrency(report.outstandingDuesAmount)}</p>
                    <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Dues Outstanding</p>
                  </div>
                </div>
              ) : (
                <p className="text-[#16a34a] font-semibold text-[0.95rem]">All maintenance bills are paid — no outstanding dues.</p>
              )}
            </div>
          )}

          {/* Upcoming Payments */}
          {reportType !== 'COMPARISON' && report.upcomingPayments && report.upcomingPayments.length > 0 && (
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
          {['YTD', 'CUSTOM'].includes(reportType) && report.monthlyTrends && report.monthlyTrends.length > 0 && (
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

          {/* Daily Trends */}
          {['MTD', 'CUSTOM'].includes(reportType) && report.dailyTrends && report.dailyTrends.length > 0 && report.dailyTrends.length <= 31 && (
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-[1.05rem] font-semibold text-[var(--text-primary)] mb-4">
                <Calendar size={20} className="text-[#0ea5e9]" />
                Daily Trends
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-tertiary)] text-[0.85rem]">
                      <th className="py-[0.65rem] text-left font-semibold">Date</th>
                      <th className="py-[0.65rem] text-right font-semibold">Income</th>
                      <th className="py-[0.65rem] text-right font-semibold">Expense</th>
                      <th className="py-[0.65rem] text-right font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailyTrends.map((trend, idx) => {
                      const net = (trend.income || 0) - (trend.expense || 0)
                      return (
                        <tr key={idx} className="border-b border-[var(--border-light)]">
                          <td className="py-[0.65rem] text-[var(--text-primary)] font-semibold">{trend.date}</td>
                          <td className="py-[0.65rem] text-right text-[#16a34a]">{formatCurrency(trend.income)}</td>
                          <td className="py-[0.65rem] text-right text-[#dc2626]">{formatCurrency(trend.expense)}</td>
                          <td className={clsx('py-[0.65rem] text-right font-semibold', net >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]')}>
                            {formatCurrency(net)}
                          </td>
                        </tr>
                      )
                    })}
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
