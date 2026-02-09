import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { reportApi, societyApi, exportApi, downloadBlob } from '../api'
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
  const { user } = useAuth()
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">MTD, YTD and custom period financial analysis</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!societyId || isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={20} />
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {isPlatformLevel && (
            <select
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Society</option>
              {societies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            {['MTD', 'YTD', 'COMPARISON', 'CUSTOM'].map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition',
                  reportType === type
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Generate
              </button>
            </>
          )}
        </div>
      </div>

      {!societyId && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-800 dark:text-yellow-200">
          Please select a society to view reports.
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(report.totalIncome)}
                  </p>
                  {report.incomeGrowthPercent !== null && (
                    <p className={clsx(
                      'text-sm mt-1 flex items-center gap-1',
                      report.incomeGrowthPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {report.incomeGrowthPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatPercent(report.incomeGrowthPercent)} vs previous
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expense</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(report.totalExpense)}
                  </p>
                  {report.expenseGrowthPercent !== null && (
                    <p className={clsx(
                      'text-sm mt-1 flex items-center gap-1',
                      report.expenseGrowthPercent <= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {report.expenseGrowthPercent <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {formatPercent(report.expenseGrowthPercent)} vs previous
                    </p>
                  )}
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Net Balance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Balance</p>
                  <p className={clsx(
                    'text-2xl font-bold mt-1',
                    report.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {formatCurrency(report.netBalance)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {report.startDate} to {report.endDate}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Cash Balance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cash Balance</p>
                  <p className={clsx(
                    'text-2xl font-bold mt-1',
                    report.cashBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {formatCurrency(report.cashBalance)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All-time balance</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income by Category */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-green-600" />
                Income by Category
              </h3>
              {report.incomeByCategory && Object.keys(report.incomeByCategory).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(report.incomeByCategory).map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{category}</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No income data</p>
              )}
            </div>

            {/* Expense by Category */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-red-600" />
                Expense by Category
              </h3>
              {report.expenseByCategory && Object.keys(report.expenseByCategory).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(report.expenseByCategory).map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{category}</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expense data</p>
              )}
            </div>
          </div>

          {/* Payment Mode Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income by Payment Mode */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                Income by Payment Mode
              </h3>
              {report.incomeByPaymentMode && Object.keys(report.incomeByPaymentMode).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(report.incomeByPaymentMode).map(([mode, amount]) => {
                    const total = Object.values(report.incomeByPaymentMode).reduce((a, b) => a + b, 0)
                    const percent = total > 0 ? (amount / total) * 100 : 0
                    return (
                      <div key={mode}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{mode}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data</p>
              )}
            </div>

            {/* Expense by Payment Mode */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-orange-600" />
                Expense by Payment Mode
              </h3>
              {report.expenseByPaymentMode && Object.keys(report.expenseByPaymentMode).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(report.expenseByPaymentMode).map(([mode, amount]) => {
                    const total = Object.values(report.expenseByPaymentMode).reduce((a, b) => a + b, 0)
                    const percent = total > 0 ? (amount / total) * 100 : 0
                    return (
                      <div key={mode}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600 dark:text-gray-400">{mode}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data</p>
              )}
            </div>
          </div>

          {/* Bills Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Receipt size={20} className="text-indigo-600" />
              Bills Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.totalBillsGenerated || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Bills</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{report.billsPaid || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{report.billsPending || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(report.billsCollectedAmount)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
              </div>
            </div>
          </div>

          {/* Upcoming Payments */}
          {report.upcomingPayments && report.upcomingPayments.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-orange-600" />
                Upcoming Payments
                <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
                  Total: {formatCurrency(report.upcomingExpenses)}
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Due Date</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {report.upcomingPayments.map((payment, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-3 text-gray-900 dark:text-white">{payment.description}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                            {payment.type}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">{payment.dueDate}</td>
                        <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-600" />
                Monthly Trends
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                      <th className="pb-3 font-medium">Month</th>
                      <th className="pb-3 font-medium text-right">Income</th>
                      <th className="pb-3 font-medium text-right">Expense</th>
                      <th className="pb-3 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {report.monthlyTrends.map((trend, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-3 font-medium text-gray-900 dark:text-white">{trend.month}</td>
                        <td className="py-3 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(trend.income)}
                        </td>
                        <td className="py-3 text-right text-red-600 dark:text-red-400">
                          {formatCurrency(trend.expense)}
                        </td>
                        <td className={clsx(
                          'py-3 text-right font-semibold',
                          trend.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
