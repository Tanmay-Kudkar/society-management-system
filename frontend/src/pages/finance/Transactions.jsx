import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth, useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { transactionApi, exportApi, downloadBlob, flatApi } from '../../../../api'
import { Plus, Search, X, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, Home, Pencil, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied, InfoTooltip, NeonSweepButton, EmptyStateSection } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { formatDate } from '../../utils/formatUtils'

export default function Transactions() {
  const { user, canManageTransactions } = useAuth()
  const canAccessTransactions = canManageTransactions()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  const queryClient = useQueryClient()
  const confirmDialog = useConfirmDialog()
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMode, setFilterMode] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  // Form state for conditional flat selector
  const [formType, setFormType] = useState('INCOME')
  const [formCategory, setFormCategory] = useState('MAINTENANCE')
  const [formFlatId, setFormFlatId] = useState('')
  const [formPaymentMode, setFormPaymentMode] = useState('CASH')

  // Payment mode options
  const paymentModes = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'UPI', label: 'UPI' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'NET_BANKING', label: 'Net Banking' },
    { value: 'WALLET', label: 'Wallet' },
    { value: 'OTHER', label: 'Other' },
  ]

  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = user?.role === 'MASTER_ADMIN' && Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
    ? parsedSocietyIdFromUrl
    : null
  const effectiveSocietyId = scopedSocietyId || user?.societyId

  const { data: transactions = [], isLoading, isError } = useQuery({
    queryKey: ['transactions', effectiveSocietyId],
    queryFn: () => {
      if (effectiveSocietyId) {
        return transactionApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return transactionApi.getAll().then(res => res.data)
    },
  })

  // Fetch flats for the society
  const { data: flats = [] } = useQuery({
    queryKey: ['flats', effectiveSocietyId],
    queryFn: () => effectiveSocietyId
      ? flatApi.getBySociety(effectiveSocietyId).then(res => res.data)
      : [],
    enabled: !!effectiveSocietyId,
  })

  // Check if flat selector should be shown
  const showFlatSelector = formType === 'INCOME' && formCategory === 'MAINTENANCE'



  const resetFormState = () => {
    setFormType('INCOME')
    setFormCategory('MAINTENANCE')
    setFormFlatId('')
    setFormPaymentMode('CASH')
    setEditingTransaction(null)
  }

  const openCreateModal = () => {
    resetFormState()
    setShowModal(true)
  }

  const openEditModal = (t) => {
    setEditingTransaction(t)
    setFormType(t.transactionType || 'INCOME')
    setFormCategory(t.category || 'MAINTENANCE')
    setFormFlatId(t.flatId ? String(t.flatId) : '')
    setFormPaymentMode(t.paymentMode || 'CASH')
    setShowModal(true)
  }

  const closeModal = (force = false) => {
    if (!force && (createMutation.isPending || updateMutation.isPending)) return
    setShowModal(false)
    resetFormState()
  }

  const createMutation = useMutation({
    mutationFn: (data) => transactionApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions'])
      closeModal(true)
      showToast('Transaction created successfully', 'success')
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to create transaction', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions'])
      closeModal(true)
      showToast('Transaction updated successfully', 'success')
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to update transaction', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => transactionApi.delete(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions'])
      showToast('Transaction deleted successfully', 'success')
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Failed to delete transaction', 'error')
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

    const referenceNumber = formData.get('referenceNumber')?.trim()
    const chequeNumber = formData.get('chequeNumber')?.trim()
    const bankName = formData.get('bankName')?.trim()
    const upiId = formData.get('upiId')?.trim()
    const utrNumber = formData.get('utrNumber')?.trim()
    const cardLastFourDigits = formData.get('cardLastFourDigits')?.trim()

    // Conditional validation based on payment mode
    if (formPaymentMode === 'CHEQUE') {
      if (!chequeNumber) { showToast('Cheque # is required for cheque payments', 'error'); return }
      if (!bankName) { showToast('Bank Name is required for cheque payments', 'error'); return }
    }
    if (formPaymentMode === 'UPI') {
      if (!upiId) { showToast('UPI ID is required for UPI payments', 'error'); return }
      if (!utrNumber) { showToast('Transaction ID is required for UPI payments', 'error'); return }
    }
    if (formPaymentMode === 'BANK_TRANSFER') {
      if (!bankName) { showToast('Bank Name is required for bank transfers', 'error'); return }
      if (!utrNumber) { showToast('UTR / Transaction ID is required for bank transfers', 'error'); return }
    }
    if (formPaymentMode === 'CREDIT_CARD' || formPaymentMode === 'DEBIT_CARD') {
      if (!cardLastFourDigits) { showToast('Card last 4 digits are required', 'error'); return }
      if (cardLastFourDigits.length !== 4 || !/^\d{4}$/.test(cardLastFourDigits)) {
        showToast('Card last 4 digits must be exactly 4 numbers', 'error'); return
      }
    }
    if (formPaymentMode === 'NET_BANKING') {
      if (!bankName) { showToast('Bank Name is required for net banking', 'error'); return }
    }

    // Validate payment month for maintenance
    const paymentMonth = formData.get('paymentMonth')?.trim()
    if (formCategory === 'MAINTENANCE' && formType === 'INCOME' && !paymentMonth) {
      showToast('Payment month is required for maintenance income', 'error')
      return
    }

    const data = {
      societyId: effectiveSocietyId,
      transactionType: formType,
      paymentMode: formPaymentMode,
      amount: parseFloat(formData.get('amount')),
      category: formCategory,
      description: formData.get('description'),
      transactionDate: formData.get('transactionDate'),
      referenceNumber: referenceNumber || null,
      chequeNumber: chequeNumber || null,
      bankName: bankName || null,
      chequeDate: formData.get('chequeDate') || null,
      upiId: upiId || null,
      utrNumber: utrNumber || null,
      cardType: (formPaymentMode === 'CREDIT_CARD' ? 'CREDIT' : formPaymentMode === 'DEBIT_CARD' ? 'DEBIT' : null),
      cardLastFourDigits: cardLastFourDigits || null,
      paymentMonth: paymentMonth || null,
      lateFee: formData.get('lateFee') ? parseFloat(formData.get('lateFee')) : null,
      discount: formData.get('discount') ? parseFloat(formData.get('discount')) : null,
      taxAmount: formData.get('taxAmount') ? parseFloat(formData.get('taxAmount')) : null,
      receiptNumber: formData.get('receiptNumber')?.trim() || null,
      invoiceNumber: formData.get('invoiceNumber')?.trim() || null,
      flatId: formFlatId ? parseInt(formFlatId) : null,
    }
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleExport = async () => {
    if (!effectiveSocietyId) {
      showToast('Society context is required for export', 'error')
      return
    }
    setIsExporting(true)
    try {
      // Use a wide date range to capture all transactions (past and future-dated)
      const startDate = '1947-01-01'
      const endDate = '3000-12-31'
      const response = await exportApi.transactions(effectiveSocietyId, startDate, endDate)
      const today = new Date().toISOString().split('T')[0]
      downloadBlob(response.data, `transactions_${today}.xlsx`)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const confirmAndDeleteTransaction = async (transaction) => {
    const confirmed = await confirmDialog({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Type', value: transaction.transactionType },
        { label: 'Category', value: transaction.category },
        { label: 'Amount', value: `₹${transaction.amount?.toLocaleString()}` },
        { label: 'Date', value: formatDate(transaction.transactionDate) },
      ],
      caution: 'This will permanently remove this transaction record.',
    })
    if (confirmed) {
      deleteMutation.mutate(transaction.id)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading)

  if (!canAccessTransactions) {
    return <PermissionDenied message="You don't have permission to manage transactions" />
  }

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transactions</h1>
            <InfoTooltip text="Track income and expenses" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <NeonSweepButton
            tone="slate"
            size="md"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export XLSX'}
          </NeonSweepButton>
          {canAccessTransactions && (
            <NeonSweepButton
              tone="violet"
              size="md"
              onClick={openCreateModal}
              className="w-full sm:w-auto"
            >
              <Plus size={20} />
              Add Transaction
            </NeonSweepButton>
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
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="NET_BANKING">Net Banking</option>
            <option value="WALLET">Wallet</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Date</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Type</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Category</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Unit</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Description</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Mode</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Amount</th>
                  {canManageTransactions() && (
                    <th className="py-3 px-6 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-[var(--bg-tertiary)]">
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">
                      {formatDate(t.transactionDate)}
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
                        <span className="inline-flex items-center gap-[0.35rem] whitespace-nowrap py-1 px-[0.6rem] rounded-full text-xs font-semibold text-[#1d4ed8] bg-[rgba(37,99,235,0.12)]">
                          <Home size={10} className="shrink-0" />
                          <span className="leading-none">{t.flatNumber}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">{t.description || '-'}</td>
                    <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                      <span className="inline-flex items-center py-1 px-[0.65rem] rounded-full text-xs font-semibold text-[var(--text-secondary)] bg-[rgba(255,255,255,0.1)]">
                        {paymentModes.find(m => m.value === t.paymentMode)?.label || t.paymentMode}
                      </span>
                    </td>
                    <td className={clsx(
                      'py-[0.85rem] px-6 text-[0.9rem] text-right font-semibold',
                      t.transactionType === 'INCOME' ? 'text-[#16a34a]' : 'text-[#dc2626]'
                    )}>
                      {t.transactionType === 'INCOME' ? '+' : '-'}₹{t.amount?.toLocaleString()}
                    </td>
                    {canManageTransactions() && (
                      <td className="py-[0.85rem] px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(t)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-transparent border-none text-[var(--text-tertiary)] hover:text-[#2563eb] transition-colors mr-1"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            await confirmAndDeleteTransaction(t)
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-transparent border-none text-[var(--text-tertiary)] hover:text-[#dc2626] transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden divide-y divide-[var(--border-light)]">
            {filteredTransactions.length === 0 ? (
              <div className="p-4">
                <EmptyStateSection
                  title="No transactions found"
                  description="No transaction entries match your current search and filters."
                  icon={DollarSign}
                />
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <div key={t.id} className="p-3 sm:p-4">
                  <div className="mb-2 flex items-start justify-between gap-2 sm:gap-3">
                    <div>
                      <p className="text-[13px] sm:text-sm font-semibold text-[var(--text-primary)] break-words">{t.category}</p>
                      <p className="text-[11px] sm:text-xs text-[var(--text-tertiary)]">{formatDate(t.transactionDate)}</p>
                    </div>
                    <p className={clsx('text-[13px] sm:text-sm font-semibold whitespace-nowrap', t.transactionType === 'INCOME' ? 'text-[#16a34a]' : 'text-[#dc2626]')}>
                      {t.transactionType === 'INCOME' ? '+' : '-'}₹{t.amount?.toLocaleString()}
                    </p>
                  </div>

                  <div className="mb-2.5 sm:mb-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className={clsx(
                      'inline-flex items-center gap-[0.35rem] py-0.5 px-2 sm:py-1 sm:px-3 rounded-full text-[11px] sm:text-xs font-semibold',
                      t.transactionType === 'INCOME' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
                    )}>
                      {t.transactionType === 'INCOME' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {t.transactionType}
                    </span>
                    <span className="inline-flex items-center py-0.5 px-2 sm:py-1 sm:px-[0.65rem] rounded-full text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] bg-[rgba(255,255,255,0.1)]">
                      {paymentModes.find(m => m.value === t.paymentMode)?.label || t.paymentMode}
                    </span>
                    {t.flatNumber ? (
                      <span className="inline-flex items-center gap-[0.35rem] whitespace-nowrap py-0.5 px-2 sm:py-1 sm:px-[0.6rem] rounded-full text-[11px] sm:text-xs font-semibold text-[#1d4ed8] bg-[rgba(37,99,235,0.12)]">
                        <Home size={10} className="shrink-0" />
                        <span className="leading-none">{t.flatNumber}</span>
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] break-words">{t.description || '-'}</p>

                  {canManageTransactions() && (
                    <div className="mt-2.5 sm:mt-3 flex justify-end gap-1">
                      <button
                        onClick={() => openEditModal(t)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-transparent border-none text-[var(--text-tertiary)] hover:text-[#2563eb] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          await confirmAndDeleteTransaction(t)
                        }}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-transparent border-none text-[var(--text-tertiary)] hover:text-[#dc2626] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.6)]">
          <div className="w-full max-w-[40rem] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_24px_48px_rgba(15,23,42,0.2)]">
            <div className="sticky top-0 flex items-center justify-between py-4 px-5 bg-[var(--bg-card)] border-b border-[var(--border-light)] z-[1]">
              <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button onClick={() => closeModal()} className="rounded-[0.65rem] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} key={editingTransaction?.id || 'new'} className="p-5 flex flex-col gap-4">
              {/* Row 1: Type & Payment Mode */}
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
                  <select 
                    name="paymentMode" 
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    required 
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  >
                    {paymentModes.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Amount</label>
                  <input type="number" name="amount" step="0.01" required defaultValue={editingTransaction?.amount || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Date</label>
                  <input type="date" name="transactionDate" required defaultValue={editingTransaction?.transactionDate || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
              </div>

              {/* Category */}
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
              
              {/* Maintenance-specific fields */}
              {showFlatSelector && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[rgba(37,99,235,0.03)]">
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
                  </div>
                  <div className="flex flex-col gap-[0.35rem]">
                    <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                      Payment Month <span className="text-[#dc2626]">*</span>
                    </label>
                    <input type="month" name="paymentMonth" required defaultValue={editingTransaction?.paymentMonth || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="flex flex-col gap-[0.35rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Description</label>
                <textarea name="description" rows={2} defaultValue={editingTransaction?.description || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] resize-y transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
              </div>

              {/* Payment Mode Specific Fields */}
              {formPaymentMode === 'CHEQUE' && (
                <div className="flex flex-col gap-4 p-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[rgba(37,99,235,0.03)]">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Cheque Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                        Cheque # <span className="text-[#dc2626]">*</span>
                      </label>
                      <input type="text" name="chequeNumber" required defaultValue={editingTransaction?.chequeNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Cheque Date</label>
                      <input type="date" name="chequeDate" defaultValue={editingTransaction?.chequeDate || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-[0.35rem]">
                    <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                      Bank Name <span className="text-[#dc2626]">*</span>
                    </label>
                    <input type="text" name="bankName" required defaultValue={editingTransaction?.bankName || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                  </div>
                </div>
              )}

              {formPaymentMode === 'UPI' && (
                <div className="flex flex-col gap-4 p-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[rgba(37,99,235,0.03)]">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">UPI Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                        UPI ID <span className="text-[#dc2626]">*</span>
                      </label>
                      <input type="text" name="upiId" placeholder="name@upi" required defaultValue={editingTransaction?.upiId || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                        Transaction ID <span className="text-[#dc2626]">*</span>
                      </label>
                      <input type="text" name="utrNumber" required defaultValue={editingTransaction?.utrNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                  </div>
                </div>
              )}

              {formPaymentMode === 'BANK_TRANSFER' && (
                <div className="flex flex-col gap-4 p-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[rgba(37,99,235,0.03)]">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Bank Transfer Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                        Bank Name <span className="text-[#dc2626]">*</span>
                      </label>
                      <input type="text" name="bankName" required defaultValue={editingTransaction?.bankName || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                        UTR / Transaction ID <span className="text-[#dc2626]">*</span>
                      </label>
                      <input type="text" name="utrNumber" required defaultValue={editingTransaction?.utrNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-[0.35rem]">
                    <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Reference #</label>
                    <input type="text" name="referenceNumber" defaultValue={editingTransaction?.referenceNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                  </div>
                </div>
              )}

              {(formPaymentMode === 'CREDIT_CARD' || formPaymentMode === 'DEBIT_CARD') && (
                <div className="flex flex-col gap-4 p-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[rgba(37,99,235,0.03)]">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    {formPaymentMode === 'CREDIT_CARD' ? 'Credit' : 'Debit'} Card Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                        Last 4 Digits <span className="text-[#dc2626]">*</span>
                      </label>
                      <input type="text" name="cardLastFourDigits" maxLength={4} pattern="\d{4}" placeholder="1234" required defaultValue={editingTransaction?.cardLastFourDigits || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Bank Name</label>
                      <input type="text" name="bankName" defaultValue={editingTransaction?.bankName || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-[0.35rem]">
                    <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Transaction ID</label>
                    <input type="text" name="utrNumber" defaultValue={editingTransaction?.utrNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                  </div>
                </div>
              )}

              {formPaymentMode === 'NET_BANKING' && (
                <div className="flex flex-col gap-4 p-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[rgba(37,99,235,0.03)]">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Net Banking Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">
                        Bank Name <span className="text-[#dc2626]">*</span>
                      </label>
                      <input type="text" name="bankName" required defaultValue={editingTransaction?.bankName || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                    <div className="flex flex-col gap-[0.35rem]">
                      <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Transaction ID</label>
                      <input type="text" name="utrNumber" defaultValue={editingTransaction?.utrNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                    </div>
                  </div>
                </div>
              )}

              {formPaymentMode === 'WALLET' && (
                <div className="flex flex-col gap-4 p-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[rgba(37,99,235,0.03)]">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Wallet Details</p>
                  <div className="flex flex-col gap-[0.35rem]">
                    <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Transaction ID</label>
                    <input type="text" name="utrNumber" defaultValue={editingTransaction?.utrNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                  </div>
                </div>
              )}

              {/* Generic Reference # for Cash/Other modes */}
              {(formPaymentMode === 'CASH' || formPaymentMode === 'OTHER') && (
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Reference #</label>
                  <input type="text" name="referenceNumber" defaultValue={editingTransaction?.referenceNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
              )}

              {/* Accounting Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Late Fee</label>
                  <input type="number" name="lateFee" step="0.01" min="0" placeholder="0.00" defaultValue={editingTransaction?.lateFee || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Discount</label>
                  <input type="number" name="discount" step="0.01" min="0" placeholder="0.00" defaultValue={editingTransaction?.discount || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Tax Amount</label>
                  <input type="number" name="taxAmount" step="0.01" min="0" placeholder="0.00" defaultValue={editingTransaction?.taxAmount || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
              </div>

              {/* Receipt / Invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Receipt #</label>
                  <input type="text" name="receiptNumber" defaultValue={editingTransaction?.receiptNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
                <div className="flex flex-col gap-[0.35rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Invoice #</label>
                  <input type="text" name="invoiceNumber" defaultValue={editingTransaction?.invoiceNumber || ''} className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-[border,box-shadow] focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={() => closeModal()}
                  className="flex-1"
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={editingTransaction ? updateMutation.isPending : createMutation.isPending}
                >
                  {(editingTransaction ? updateMutation.isPending : createMutation.isPending)
                    ? (editingTransaction ? 'Updating...' : 'Creating...')
                    : (editingTransaction ? 'Update' : 'Create')}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
