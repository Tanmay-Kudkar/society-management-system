import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { transactionApi, exportApi, downloadBlob, flatApi } from '../../../api'
import { Plus, Search, X, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, Home } from 'lucide-react'
import clsx from 'clsx'
import PermissionDenied from '../components/PermissionDenied'

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

  const { data: transactions = [], isLoading } = useQuery({
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

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || t.transactionType === filterType
    const matchesMode = !filterMode || t.paymentMode === filterMode
    return matchesSearch && matchesType && matchesMode
  })

  const totalIncome = transactions.filter(t => t.transactionType === 'INCOME').reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.transactionType === 'EXPENSE').reduce((sum, t) => sum + (t.amount || 0), 0)

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

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="transactions-header">
        <div>
          <h1 className="transactions-title">Transactions</h1>
          <p className="transactions-subtitle">Track income and expenses</p>
        </div>
        <div className="transactions-header-actions">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="transactions-export-button"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          {canManageTransactions() && (
            <button
              onClick={() => setShowModal(true)}
              className="transactions-add-button"
            >
              <Plus size={20} />
              Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="transactions-summary">
        <div className="transactions-summary-card">
          <div className="transactions-summary-row">
            <div>
              <p className="transactions-summary-label">Total Income</p>
              <p className="transactions-summary-value transactions-summary-value--income">₹{totalIncome.toLocaleString()}</p>
            </div>
            <div className="transactions-summary-icon transactions-summary-icon--income">
              <TrendingUp className="transactions-summary-icon-svg" />
            </div>
          </div>
        </div>
        <div className="transactions-summary-card">
          <div className="transactions-summary-row">
            <div>
              <p className="transactions-summary-label">Total Expense</p>
              <p className="transactions-summary-value transactions-summary-value--expense">₹{totalExpense.toLocaleString()}</p>
            </div>
            <div className="transactions-summary-icon transactions-summary-icon--expense">
              <TrendingDown className="transactions-summary-icon-svg" />
            </div>
          </div>
        </div>
        <div className="transactions-summary-card">
          <div className="transactions-summary-row">
            <div>
              <p className="transactions-summary-label">Net Balance</p>
              <p className={clsx(
                'transactions-summary-value',
                totalIncome - totalExpense >= 0
                  ? 'transactions-summary-value--positive'
                  : 'transactions-summary-value--negative'
              )}>
                ₹{(totalIncome - totalExpense).toLocaleString()}
              </p>
            </div>
            <div className="transactions-summary-icon transactions-summary-icon--balance">
              <DollarSign className="transactions-summary-icon-svg" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="transactions-filters">
        <div className="transactions-filters-row">
          <div className="transactions-search">
            <Search className="transactions-search-icon" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="transactions-search-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="transactions-filter-select"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="transactions-filter-select"
          >
            <option value="">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="transactions-table-card">
        {isLoading ? (
          <div className="transactions-loading">
            <div className="transactions-spinner" />
          </div>
        ) : (
          <div className="transactions-table-scroll">
            <table className="transactions-table">
              <thead className="transactions-thead">
                <tr>
                  <th className="transactions-th">Date</th>
                  <th className="transactions-th">Type</th>
                  <th className="transactions-th">Category</th>
                  <th className="transactions-th">Unit</th>
                  <th className="transactions-th">Description</th>
                  <th className="transactions-th">Mode</th>
                  <th className="transactions-th transactions-th--right">Amount</th>
                </tr>
              </thead>
              <tbody className="transactions-tbody">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="transactions-row">
                    <td className="transactions-cell transactions-cell--muted">
                      {t.transactionDate && new Date(t.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="transactions-cell">
                      <span className={clsx(
                        'transactions-badge',
                        t.transactionType === 'INCOME' ? 'transactions-badge--income' : 'transactions-badge--expense'
                      )}>
                        {t.transactionType === 'INCOME' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="transactions-cell transactions-cell--muted">{t.category}</td>
                    <td className="transactions-cell transactions-cell--muted">
                      {t.flatNumber ? (
                        <span className="transactions-unit-badge">
                          <Home size={10} />
                          {t.flatNumber}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="transactions-cell transactions-cell--muted">{t.description || '-'}</td>
                    <td className="transactions-cell">
                      <span className="transactions-mode-badge">{t.paymentMode}</span>
                    </td>
                    <td className={clsx(
                      'transactions-cell transactions-cell--right transactions-cell--strong',
                      t.transactionType === 'INCOME'
                        ? 'transactions-cell--income'
                        : 'transactions-cell--expense'
                    )}>
                      {t.transactionType === 'INCOME' ? '+' : '-'}₹{t.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="transactions-modal">
          <div className="transactions-modal-card">
            <div className="transactions-modal-header">
              <h3 className="transactions-modal-title">Add Transaction</h3>
              <button onClick={() => setShowModal(false)} className="transactions-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="transactions-modal-body">
              <div className="transactions-form-grid">
                <div className="transactions-field">
                  <label className="transactions-label">Type</label>
                  <select 
                    name="transactionType" 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    required 
                    className="transactions-input"
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div className="transactions-field">
                  <label className="transactions-label">Payment Mode</label>
                  <select name="paymentMode" required className="transactions-input">
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
              </div>
              <div className="transactions-form-grid">
                <div className="transactions-field">
                  <label className="transactions-label">Amount</label>
                  <input type="number" name="amount" step="0.01" required className="transactions-input" />
                </div>
                <div className="transactions-field">
                  <label className="transactions-label">Date</label>
                  <input type="date" name="transactionDate" required className="transactions-input" />
                </div>
              </div>
              <div className="transactions-field">
                <label className="transactions-label">Category</label>
                <select 
                  name="category" 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required 
                  className="transactions-input"
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
                <div className="transactions-field">
                  <label className="transactions-label">
                    <span className="transactions-required">
                      <Home size={14} />
                      Unit/Flat <span>*</span>
                    </span>
                  </label>
                  <select 
                    value={formFlatId}
                    onChange={(e) => setFormFlatId(e.target.value)}
                    required={showFlatSelector}
                    className="transactions-input"
                  >
                    <option value="">Select Unit/Flat</option>
                    {flats.map(flat => (
                      <option key={flat.id} value={flat.id}>
                        {flat.flatNumber} {flat.ownerName ? `- ${flat.ownerName}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="transactions-help">Required for maintenance income transactions</p>
                </div>
              )}
              
              <div className="transactions-field">
                <label className="transactions-label">Description</label>
                <textarea name="description" rows={2} className="transactions-textarea" />
              </div>
              <div className="transactions-form-grid">
                <div className="transactions-field">
                  <label className="transactions-label">Reference #</label>
                  <input type="text" name="referenceNumber" className="transactions-input" />
                </div>
                <div className="transactions-field">
                  <label className="transactions-label">Cheque #</label>
                  <input type="text" name="chequeNumber" className="transactions-input" />
                </div>
              </div>
              <div className="transactions-field">
                <label className="transactions-label">Bank Name</label>
                <input type="text" name="bankName" className="transactions-input" />
              </div>
              <div className="transactions-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="transactions-cancel-button">Cancel</button>
                <button type="submit" className="transactions-submit-button">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
