import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { reportApi, societyApi, exportApi, downloadBlob } from '../../../api'
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
import PermissionDenied from '../components/PermissionDenied'

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
  
  // Permission check
  if (!canViewReports()) {
    return <PermissionDenied message="You don't have permission to view financial reports" />
  }
  const [reportType, setReportType] = useState('MTD')
  const [selectedSocietyId, setSelectedSocietyId] = useState(user?.societyId || '')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isPlatformLevel,
  })

  const societyId = isPlatformLevel ? selectedSocietyId : user?.societyId

  const { data: report, isLoading, refetch } = useQuery({
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
    enabled: !!societyId,
  })

  const { data: dashboardReport } = useQuery({
    queryKey: ['dashboardReport', societyId],
    queryFn: () => societyId ? reportApi.getDashboard(societyId).then(res => res.data) : null,
    enabled: !!societyId,
  })

  const [isExporting, setIsExporting] = useState(false)

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

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Financial Reports</h1>
          <p className="reports-subtitle">MTD, YTD and custom period financial analysis</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!societyId || isExporting}
          className="reports-export-button"
        >
          <FileSpreadsheet size={20} />
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="reports-filters-row">
          {isPlatformLevel && (
            <select
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
              className="reports-select"
            >
              <option value="">Select Society</option>
              {societies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <div className="reports-type-toggle">
            {['MTD', 'YTD', 'COMPARISON', 'CUSTOM'].map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={clsx(
                  'reports-type-button',
                  reportType === type && 'is-active'
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {reportType === 'CUSTOM' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="reports-date-input"
              />
              <span className="reports-date-separator">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="reports-date-input"
              />
              <button
                onClick={() => refetch()}
                className="reports-generate-button"
              >
                Generate
              </button>
            </>
          )}
        </div>
      </div>

      {!societyId && (
        <div className="reports-empty-state">
          Please select a society to view reports.
        </div>
      )}

      {isLoading && (
        <div className="reports-loading">
          <div className="reports-spinner" />
        </div>
      )}

      {report && (
        <>
          {/* Summary Cards */}
          <div className="reports-summary-grid">
            {/* Total Income */}
            <div className="reports-summary-card">
              <div className="reports-summary-row">
                <div>
                  <p className="reports-summary-label">Total Income</p>
                  <p className="reports-summary-value reports-summary-value--income">
                    {formatCurrency(report.totalIncome)}
                  </p>
                  {report.incomeGrowthPercent !== null && (
                    <p className={clsx(
                      'reports-growth',
                      report.incomeGrowthPercent >= 0
                        ? 'reports-growth--positive'
                        : 'reports-growth--negative'
                    )}>
                      {report.incomeGrowthPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatPercent(report.incomeGrowthPercent)} vs previous
                    </p>
                  )}
                </div>
                <div className="reports-summary-icon reports-summary-icon--income">
                  <TrendingUp className="reports-summary-icon-svg" />
                </div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="reports-summary-card">
              <div className="reports-summary-row">
                <div>
                  <p className="reports-summary-label">Total Expense</p>
                  <p className="reports-summary-value reports-summary-value--expense">
                    {formatCurrency(report.totalExpense)}
                  </p>
                  {report.expenseGrowthPercent !== null && (
                    <p className={clsx(
                      'reports-growth',
                      report.expenseGrowthPercent <= 0
                        ? 'reports-growth--positive'
                        : 'reports-growth--negative'
                    )}>
                      {report.expenseGrowthPercent <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {formatPercent(report.expenseGrowthPercent)} vs previous
                    </p>
                  )}
                </div>
                <div className="reports-summary-icon reports-summary-icon--expense">
                  <TrendingDown className="reports-summary-icon-svg" />
                </div>
              </div>
            </div>

            {/* Net Balance */}
            <div className="reports-summary-card">
              <div className="reports-summary-row">
                <div>
                  <p className="reports-summary-label">Net Balance</p>
                  <p className={clsx(
                    'reports-summary-value',
                    report.netBalance >= 0
                      ? 'reports-summary-value--income'
                      : 'reports-summary-value--expense'
                  )}>
                    {formatCurrency(report.netBalance)}
                  </p>
                  <p className="reports-summary-meta">
                    {report.startDate} to {report.endDate}
                  </p>
                </div>
                <div className="reports-summary-icon reports-summary-icon--balance">
                  <DollarSign className="reports-summary-icon-svg" />
                </div>
              </div>
            </div>

            {/* Cash Balance */}
            <div className="reports-summary-card">
              <div className="reports-summary-row">
                <div>
                  <p className="reports-summary-label">Cash Balance</p>
                  <p className={clsx(
                    'reports-summary-value',
                    report.cashBalance >= 0
                      ? 'reports-summary-value--income'
                      : 'reports-summary-value--expense'
                  )}>
                    {formatCurrency(report.cashBalance)}
                  </p>
                  <p className="reports-summary-meta">All-time balance</p>
                </div>
                <div className="reports-summary-icon reports-summary-icon--cash">
                  <Wallet className="reports-summary-icon-svg" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="reports-grid">
            {/* Income by Category */}
            <div className="reports-card">
              <h3 className="reports-card-title">
                <PieChart size={20} className="reports-card-icon reports-card-icon--income" />
                Income by Category
              </h3>
              {report.incomeByCategory && Object.keys(report.incomeByCategory).length > 0 ? (
                <div className="reports-list">
                  {Object.entries(report.incomeByCategory).map(([category, amount]) => (
                    <div key={category} className="reports-list-row">
                      <span className="reports-list-label">{category}</span>
                      <span className="reports-list-value reports-list-value--income">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="reports-empty">No income data</p>
              )}
            </div>

            {/* Expense by Category */}
            <div className="reports-card">
              <h3 className="reports-card-title">
                <PieChart size={20} className="reports-card-icon reports-card-icon--expense" />
                Expense by Category
              </h3>
              {report.expenseByCategory && Object.keys(report.expenseByCategory).length > 0 ? (
                <div className="reports-list">
                  {Object.entries(report.expenseByCategory).map(([category, amount]) => (
                    <div key={category} className="reports-list-row">
                      <span className="reports-list-label">{category}</span>
                      <span className="reports-list-value reports-list-value--expense">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="reports-empty">No expense data</p>
              )}
            </div>
          </div>

          {/* Payment Mode Breakdown */}
          <div className="reports-grid">
            {/* Income by Payment Mode */}
            <div className="reports-card">
              <h3 className="reports-card-title">
                <BarChart3 size={20} className="reports-card-icon reports-card-icon--primary" />
                Income by Payment Mode
              </h3>
              {report.incomeByPaymentMode && Object.keys(report.incomeByPaymentMode).length > 0 ? (
                <div className="reports-progress-list">
                  {Object.entries(report.incomeByPaymentMode).map(([mode, amount]) => {
                    const total = Object.values(report.incomeByPaymentMode).reduce((a, b) => a + b, 0)
                    const percent = total > 0 ? (amount / total) * 100 : 0
                    return (
                      <div key={mode}>
                        <div className="reports-progress-row">
                          <span className="reports-list-label">{mode}</span>
                          <span className="reports-progress-value">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="reports-progress-track">
                          <div
                            className="reports-progress-bar reports-progress-bar--income"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="reports-empty">No data</p>
              )}
            </div>

            {/* Expense by Payment Mode */}
            <div className="reports-card">
              <h3 className="reports-card-title">
                <BarChart3 size={20} className="reports-card-icon reports-card-icon--warning" />
                Expense by Payment Mode
              </h3>
              {report.expenseByPaymentMode && Object.keys(report.expenseByPaymentMode).length > 0 ? (
                <div className="reports-progress-list">
                  {Object.entries(report.expenseByPaymentMode).map(([mode, amount]) => {
                    const total = Object.values(report.expenseByPaymentMode).reduce((a, b) => a + b, 0)
                    const percent = total > 0 ? (amount / total) * 100 : 0
                    return (
                      <div key={mode}>
                        <div className="reports-progress-row">
                          <span className="reports-list-label">{mode}</span>
                          <span className="reports-progress-value">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="reports-progress-track">
                          <div
                            className="reports-progress-bar reports-progress-bar--expense"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="reports-empty">No data</p>
              )}
            </div>
          </div>

          {/* Bills Summary */}
          <div className="reports-card">
            <h3 className="reports-card-title">
              <Receipt size={20} className="reports-card-icon reports-card-icon--indigo" />
              Bills Summary
            </h3>
            <div className="reports-bills-grid">
              <div className="reports-bills-card">
                <p className="reports-bills-value">{report.totalBillsGenerated || 0}</p>
                <p className="reports-bills-label">Total Bills</p>
              </div>
              <div className="reports-bills-card reports-bills-card--paid">
                <p className="reports-bills-value reports-bills-value--paid">{report.billsPaid || 0}</p>
                <p className="reports-bills-label">Paid</p>
              </div>
              <div className="reports-bills-card reports-bills-card--pending">
                <p className="reports-bills-value reports-bills-value--pending">{report.billsPending || 0}</p>
                <p className="reports-bills-label">Pending</p>
              </div>
              <div className="reports-bills-card reports-bills-card--collected">
                <p className="reports-bills-value reports-bills-value--collected">
                  {formatCurrency(report.billsCollectedAmount)}
                </p>
                <p className="reports-bills-label">Collected</p>
              </div>
            </div>
          </div>

          {/* Upcoming Payments */}
          {report.upcomingPayments && report.upcomingPayments.length > 0 && (
            <div className="reports-card">
              <h3 className="reports-card-title reports-card-title--split">
                <Clock size={20} className="reports-card-icon reports-card-icon--warning" />
                Upcoming Payments
                <span className="reports-card-meta">
                  Total: {formatCurrency(report.upcomingExpenses)}
                </span>
              </h3>
              <div className="reports-table-scroll">
                <table className="reports-table">
                  <thead>
                    <tr className="reports-table-head">
                      <th className="reports-th">Description</th>
                      <th className="reports-th">Type</th>
                      <th className="reports-th">Due Date</th>
                      <th className="reports-th reports-th--right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="reports-tbody">
                    {report.upcomingPayments.map((payment, idx) => (
                      <tr key={idx} className="reports-row">
                        <td className="reports-cell reports-cell--strong">{payment.description}</td>
                        <td className="reports-cell">
                          <span className="reports-type-badge">
                            {payment.type}
                          </span>
                        </td>
                        <td className="reports-cell reports-cell--muted">{payment.dueDate}</td>
                        <td className="reports-cell reports-cell--right reports-cell--strong">
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
            <div className="reports-card">
              <h3 className="reports-card-title">
                <BarChart3 size={20} className="reports-card-icon reports-card-icon--cash" />
                Monthly Trends
              </h3>
              <div className="reports-table-scroll">
                <table className="reports-table">
                  <thead>
                    <tr className="reports-table-head">
                      <th className="reports-th">Month</th>
                      <th className="reports-th reports-th--right">Income</th>
                      <th className="reports-th reports-th--right">Expense</th>
                      <th className="reports-th reports-th--right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="reports-tbody">
                    {report.monthlyTrends.map((trend, idx) => (
                      <tr key={idx} className="reports-row">
                        <td className="reports-cell reports-cell--strong">{trend.month}</td>
                        <td className="reports-cell reports-cell--right reports-cell--income">
                          {formatCurrency(trend.income)}
                        </td>
                        <td className="reports-cell reports-cell--right reports-cell--expense">
                          {formatCurrency(trend.expense)}
                        </td>
                        <td className={clsx(
                          'reports-cell reports-cell--right reports-cell--strong',
                          trend.balance >= 0
                            ? 'reports-cell--income'
                            : 'reports-cell--expense'
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
