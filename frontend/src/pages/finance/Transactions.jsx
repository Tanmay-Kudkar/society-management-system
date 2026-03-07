import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useToast } from '../../context'
import { transactionApi, exportApi, downloadBlob, flatApi } from '../../../../api'
import { Plus, Search, X, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, Home } from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied, AsyncButton } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

export default function Transactions() {
  const { user, canManageTransactions } = useAuth()
  const { showToast } = useToast()
  
  // Permission check
  if (!canManageTransactions()) {
    return <PermissionDenied message="You don't have permission to manage transactions" />
  }
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMode, setFilterMode] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  // Form state for conditional flat selector
  const [formType, setFormType] = useState('INCOME')
  const [formCategory, setFormCategory] = useState('MAINTENANCE')
  const [formFlatId, setFormFlatId] = useState('')

  const { data: transactions = [], isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionApi.getAll().then(res => res.data),
  })

  // Fetch flats for the society
  const { data: flats = [] } = useQuery({
    queryKey: ['flats', user?.societyId],
    queryFn: () => user?.societyId 
      ? flatApi.getBySociety(user.societyId).then(res => res.data)
      : [],
    enabled: !!user?.societyId,
  })

  // Check if flat selector should be shown
  const showFlatSelector = formType === 'INCOME' && formCategory === 'MAINTENANCE'



  const createMutation = useMutation({
    mutationFn: (data) => transactionApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions'])
      setShowModal(false)
      // Reset form state
      setFormType('INCOME')
      setFormCategory('MAINTENANCE')
      setFormFlatId('')
      showToast('Transaction created successfully', 'success')
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to create transaction', 'error')
    },
  })

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = !filterType || t.transactionType === filterType
      const matchesMode = !filterMode || t.paymentMode === filterMode
      return matchesSearch && matchesType && matchesMode
    })
  }, [transactions, searchTerm, filterType, filterMode])

  const totalIncome = useMemo(
    () => transactions.filter(t => t.transactionType === 'INCOME').reduce((sum, t) => sum + (t.amount || 0), 0),
    [transactions],
  )
  const totalExpense = useMemo(
    () => transactions.filter(t => t.transactionType === 'EXPENSE').reduce((sum, t) => sum + (t.amount || 0), 0),
    [transactions],
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Validate flat selection for maintenance income
    if (formType === 'INCOME' && formCategory === 'MAINTENANCE' && !formFlatId) {
      showToast('Please select a Unit/Flat for maintenance income', 'error')
      return
    }
    
    const data = {
      societyId: user.societyId,
      transactionType: formType,
      paymentMode: formData.get('paymentMode'),
      amount: parseFloat(formData.get('amount')),
      category: formCategory,
      description: formData.get('description'),
      transactionDate: formData.get('transactionDate'),
      referenceNumber: formData.get('referenceNumber'),
      chequeNumber: formData.get('chequeNumber'),
      bankName: formData.get('bankName'),
      flatId: formFlatId ? parseInt(formFlatId) : null,
    }
    createMutation.mutate(data)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Export last 30 days by default
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const response = await exportApi.transactions(user.societyId, startDate, endDate)
      downloadBlob(response.data, `transactions_${endDate}.xlsx`)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <FinancePageSkeleton summaryCount={2} rows={8} cols={5} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transactions</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Track income and expenses</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 py-[0.55rem] px-4 rounded-xl font-semibold text-white bg-[#16a34a] transition-transform hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(22,163,74,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          {canManageTransactions() && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 py-[0.55rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-transform hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
            >
              <Plus size={20} />
              Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Income</p>
              <p className="mt-1 text-2xl font-bold text-[#16a34a]">₹{totalIncome.toLocaleString()}</p>
            </div>
            <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center bg-[rgba(22,163,74,0.12)] text-[#16a34a]">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.85rem] text-[var(--text-tertiary)]">Total Expense</p>
              <p className="mt-1 text-2xl font-bold text-[#dc2626]">₹{totalExpense.toLocaleString()}</p>
            </div>
            <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center bg-[rgba(220,38,38,0.12)] text-[#dc2626]">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.85rem] text-[var(--text-tertiary)]">Net Balance</p>
              <p className={clsx(
                'mt-1 text-2xl font-bold',
                totalIncome - totalExpense >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
              )}>
                ₹{(totalIncome - totalExpense).toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center bg-[rgba(37,99,235,0.12)] text-[#2563eb]">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-[0.55rem] pr-3 pl-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="w-full sm:w-auto py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
          >
            <option value="">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Date</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Type</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Category</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Unit</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Description</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Mode</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-[var(--bg-tertiary)]">
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">
                      {t.transactionDate && new Date(t.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                      <span className={clsx(
                        'inline-flex items-center gap-[0.35rem] py-1 px-3 rounded-full text-xs font-semibold',
                        t.transactionType === 'INCOME' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
                      )}>
                        {t.transactionType === 'INCOME' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">{t.category}</td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">
                      {t.flatNumber ? (
                        <span className="inline-flex items-center gap-[0.35rem] py-1 px-[0.6rem] rounded-full text-xs font-semibold text-[#1d4ed8] bg-[rgba(37,99,235,0.12)]">
                          <Home size={10} />
                          {t.flatNumber}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">{t.description || '-'}</td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                      <span className="inline-flex items-center py-1 px-[0.65rem] rounded-full text-xs font-semibold text-[var(--text-secondary)] bg-[rgba(255,255,255,0.1)]">{t.paymentMode}</span>
                    </td>
                    <td className={clsx(
                      'py-[0.85rem] px-6 text-[0.9rem] text-right font-semibold',
                      t.transactionType === 'INCOME' ? 'text-[#16a34a]' : 'text-[#dc2626]'
                    )}>
                      {t.transactionType === 'INCOME' ? '+' : '-'}₹{t.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)]">
          <div className="w-full max-w-[40rem] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="sticky top-0 flex items-center justify-between py-4 px-5 bg-[var(--bg-card)] border-b border-[var(--border-light)] z-[1]">
              <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Add Transaction</h3>
              <button onClick={() => setShowModal(false)} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Type</label>
                  <select 
                    name="transactionType" 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    required 
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Payment Mode</label>
                  <select name="paymentMode" required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]">
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Amount</label>
                  <input type="number" name="amount" step="0.01" required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Date</label>
                  <input type="date" name="transactionDate" required className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
              </div>
              <div className="flex flex-col gap-[0.35rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Category</label>
                <select 
                  name="category" 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required 
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                >
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="VENDOR_PAYMENT">Vendor Payment</option>
                  <option value="AMC">AMC</option>
                  <option value="SALARY">Salary</option>
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="WATER">Water</option>
                  <option value="REPAIR">Repair</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              {/* Unit/Flat selector - shown for maintenance income */}
              {showFlatSelector && (
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-[0.4rem]">
                      <Home size={14} />
                      Unit/Flat <span className="text-[#dc2626]">*</span>
                    </span>
                  </label>
                  <select 
                    value={formFlatId}
                    onChange={(e) => setFormFlatId(e.target.value)}
                    required={showFlatSelector}
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  >
                    <option value="">Select Unit/Flat</option>
                    {flats.map(flat => (
                      <option key={flat.id} value={flat.id}>
                        {flat.flatNumber} {flat.ownerName ? `- ${flat.ownerName}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-tertiary)]">Required for maintenance income transactions</p>
                </div>
              )}
              
              <div className="flex flex-col gap-[0.35rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Description</label>
                <textarea name="description" rows={2} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] resize-y transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Reference #</label>
                  <input type="text" name="referenceNumber" className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Cheque #</label>
                  <input type="text" name="chequeNumber" className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
              </div>
              <div className="flex flex-col gap-[0.35rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Bank Name</label>
                <input type="text" name="bankName" className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[#cbd5f5] text-[#334155] bg-[var(--bg-tertiary)] transition-transform hover:-translate-y-px">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-transform hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
                  isLoading={createMutation.isPending}
                  loadingText="Creating..."
                >
                  Create
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
