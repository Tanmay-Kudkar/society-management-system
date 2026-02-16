import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { vendorBillApi, vendorApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, Receipt, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { AsyncButton } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusColors = {
  PENDING: 'vendor-bills-status--pending',
  PARTIAL: 'vendor-bills-status--partial',
  PAID: 'vendor-bills-status--paid',
}

const statusIcons = {
  PENDING: Clock,
  PARTIAL: AlertCircle,
  PAID: CheckCircle,
}

export default function VendorBills() {
  const { user, canManageVendorBills } = useAuth()
  const confirmDialog = useConfirmDialog()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { data: bills = [], isLoading, isError } = useQuery({
    queryKey: ['vendorBills'],
    queryFn: () => vendorBillApi.getAll().then(res => res.data),
  })

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorApi.getAll().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => vendorBillApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorBills'])
      setShowModal(false)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, paymentMode, referenceNumber }) => 
      vendorBillApi.recordPayment(id, amount, paymentMode, referenceNumber, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorBills'])
      setShowPaymentModal(false)
      setEditingBill(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => vendorBillApi.delete(id, user.id),
    onSuccess: () => queryClient.invalidateQueries(['vendorBills']),
  })

  const filteredBills = useMemo(() => bills.filter(b => {
    const matchesSearch = b.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || b.status === filterStatus
    return matchesSearch && matchesStatus
  }), [bills, searchTerm, filterStatus])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const vendorId = parseInt(formData.get('vendorId'))
    const selectedVendor = vendors.find(v => v.id === vendorId)
    const data = {
      vendorId: vendorId,
      societyId: selectedVendor?.societyId,
      billNumber: formData.get('billNumber'),
      billDate: formData.get('billDate'),
      dueDate: formData.get('dueDate'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
    }
    createMutation.mutate(data)
  }

  const handlePayment = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    paymentMutation.mutate({
      id: editingBill.id,
      amount: parseFloat(formData.get('amount')),
      paymentMode: formData.get('paymentMode'),
      referenceNumber: formData.get('referenceNumber'),
    })
  }

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (showSkeleton) return (
    <div>
      <WakeUpBanner />
      <HeroSkeleton statCount={0} />
      <FinancePageSkeleton summaryCount={0} rows={8} cols={6} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="vendor-bills-header">
        <div>
          <h1 className="vendor-bills-title">Vendor Bills</h1>
          <p className="vendor-bills-subtitle">Track vendor invoices and payments</p>
        </div>
        {canManageVendorBills() && (
          <button
            onClick={() => { setEditingBill(null); setShowModal(true) }}
            className="vendor-bills-action-button"
          >
            <Plus size={20} />
            Add Bill
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="vendor-bills-filters">
        <div className="vendor-bills-filters-row">
          <div className="vendor-bills-search">
            <Search className="vendor-bills-search-icon" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="vendor-bills-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="vendor-bills-select"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="vendor-bills-table-card">
        {(
          <div className="vendor-bills-table-scroll">
            <table className="vendor-bills-table">
              <thead className="vendor-bills-thead">
                <tr>
                  <th className="vendor-bills-th">Vendor</th>
                  <th className="vendor-bills-th">Bill #</th>
                  <th className="vendor-bills-th">Amount</th>
                  <th className="vendor-bills-th">Paid</th>
                  <th className="vendor-bills-th">Pending</th>
                  <th className="vendor-bills-th">Due Date</th>
                  <th className="vendor-bills-th">Status</th>
                  <th className="vendor-bills-th vendor-bills-th--right">Actions</th>
                </tr>
              </thead>
              <tbody className="vendor-bills-tbody">
                {filteredBills.map((bill) => {
                  const StatusIcon = statusIcons[bill.status] || Clock
                  return (
                    <tr key={bill.id} className="vendor-bills-row">
                      <td className="vendor-bills-cell">
                        <div className="vendor-bills-vendor">
                          <div className="vendor-bills-icon">
                            <Receipt className="vendor-bills-icon-symbol" />
                          </div>
                          <span className="vendor-bills-vendor-name">{bill.vendorName}</span>
                        </div>
                      </td>
                      <td className="vendor-bills-cell vendor-bills-cell-muted">{bill.billNumber}</td>
                      <td className="vendor-bills-cell vendor-bills-cell-strong">₹{bill.amount?.toLocaleString()}</td>
                      <td className="vendor-bills-cell vendor-bills-cell-muted">₹{bill.paidAmount?.toLocaleString() || 0}</td>
                      <td className="vendor-bills-cell">
                        <span className={clsx(
                          'vendor-bills-pending-amount',
                          bill.pendingAmount > 0 ? 'vendor-bills-pending-amount--due' : 'vendor-bills-pending-amount--clear'
                        )}>
                          ₹{bill.pendingAmount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="vendor-bills-cell vendor-bills-cell-muted">
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="vendor-bills-cell">
                        <span className={clsx('vendor-bills-status', statusColors[bill.status])}>
                          <StatusIcon size={12} />
                          {bill.status}
                        </span>
                      </td>
                      <td className="vendor-bills-cell vendor-bills-cell--right">
                        {bill.status !== 'PAID' && (
                          <button
                            onClick={() => { setEditingBill(bill); setShowPaymentModal(true) }}
                            className="vendor-bills-pay-button"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const confirmed = await confirmDialog({
                              title: 'Delete Vendor Bill',
                              message: 'Are you sure you want to delete this bill? This action cannot be undone.',
                              confirmText: 'Delete',
                              tone: 'danger',
                              details: [
                                { label: 'Bill', value: bill.billNumber || bill.invoiceNumber || '-' },
                                { label: 'Vendor', value: bill.vendorName || '-' },
                                { label: 'Amount', value: `₹${bill.amount?.toLocaleString() || 0}` },
                                { label: 'Status', value: bill.status || '-' },
                              ],
                              caution: 'This action permanently removes bill history.',
                            })
                            if (confirmed) {
                              deleteMutation.mutate(bill.id)
                            }
                          }}
                          className="vendor-bills-icon-button vendor-bills-icon-button--delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bill Modal */}
      {showModal && (
        <div className="vendor-bills-modal">
          <div className="vendor-bills-modal-card">
            <div className="vendor-bills-modal-header">
              <h3 className="vendor-bills-modal-title">Add Vendor Bill</h3>
              <button onClick={() => setShowModal(false)} className="vendor-bills-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="vendor-bills-form">
              <div>
                <label className="vendor-bills-label">Vendor</label>
                <select
                  name="vendorId"
                  required
                  className="vendor-bills-select-input"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="vendor-bills-form-grid">
                <div>
                  <label className="vendor-bills-label">Bill Number</label>
                  <input
                    type="text"
                    name="billNumber"
                    required
                    className="vendor-bills-text-input"
                  />
                </div>
                <div>
                  <label className="vendor-bills-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="vendor-bills-text-input"
                  />
                </div>
              </div>
              <div className="vendor-bills-form-grid">
                <div>
                  <label className="vendor-bills-label">Bill Date</label>
                  <input
                    type="date"
                    name="billDate"
                    required
                    className="vendor-bills-text-input"
                  />
                </div>
                <div>
                  <label className="vendor-bills-label">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    className="vendor-bills-text-input"
                  />
                </div>
              </div>
              <div>
                <label className="vendor-bills-label">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="vendor-bills-textarea"
                />
              </div>
              <div className="vendor-bills-form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="vendor-bills-btn vendor-bills-btn--ghost"
                >
                  Cancel
                </button>
                <AsyncButton
                  type="submit"
                  className="vendor-bills-btn vendor-bills-btn--primary"
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

      {/* Payment Modal */}
      {showPaymentModal && editingBill && (
        <div className="vendor-bills-modal">
          <div className="vendor-bills-modal-card">
            <div className="vendor-bills-modal-header">
              <h3 className="vendor-bills-modal-title">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="vendor-bills-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="vendor-bills-form">
              <div className="vendor-bills-summary">
                <p className="vendor-bills-summary-row">Bill: <span className="vendor-bills-summary-strong">{editingBill.billNumber}</span></p>
                <p className="vendor-bills-summary-row">Total: <span className="vendor-bills-summary-strong">₹{editingBill.amount?.toLocaleString()}</span></p>
                <p className="vendor-bills-summary-row">Paid: <span className="vendor-bills-summary-strong">₹{editingBill.paidAmount?.toLocaleString() || 0}</span></p>
                <p className="vendor-bills-summary-row">Balance: <span className="vendor-bills-summary-balance">₹{(editingBill.amount - (editingBill.paidAmount || 0)).toLocaleString()}</span></p>
              </div>
              <div>
                <label className="vendor-bills-label">Payment Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={editingBill.amount - (editingBill.paidAmount || 0)}
                  required
                  className="vendor-bills-text-input"
                />
              </div>
              <div>
                <label className="vendor-bills-label">Payment Mode</label>
                <select
                  name="paymentMode"
                  required
                  className="vendor-bills-select-input"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online Transfer</option>
                </select>
              </div>
              <div>
                <label className="vendor-bills-label">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  className="vendor-bills-text-input"
                />
              </div>
              <div className="vendor-bills-form-actions">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="vendor-bills-btn vendor-bills-btn--ghost"
                >
                  Cancel
                </button>
                <AsyncButton
                  type="submit"
                  className="vendor-bills-btn vendor-bills-btn--success"
                  isLoading={paymentMutation.isPending}
                  loadingText="Recording..."
                >
                  Record Payment
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
