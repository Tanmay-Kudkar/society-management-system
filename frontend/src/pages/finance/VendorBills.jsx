import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { vendorBillApi, vendorApi, exportApi, downloadBlob } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, Receipt, CheckCircle, Clock, AlertCircle, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'
import { InfoTooltip, NeonSweepButton } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-800',
}

const statusIcons = {
  PENDING: Clock,
  PARTIAL: AlertCircle,
  PAID: CheckCircle,
}

export default function VendorBills() {
  const { user, canManageVendorBills } = useAuth()
  const [searchParams] = useSearchParams()
  const confirmDialog = useConfirmDialog()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const societyIdFromUrl = searchParams.get('society')
  const parsedSocietyIdFromUrl = Number(societyIdFromUrl)
  const scopedSocietyId = Number.isInteger(parsedSocietyIdFromUrl) && parsedSocietyIdFromUrl > 0
    ? parsedSocietyIdFromUrl
    : null
  const isPlatformLevel = user?.role === 'MASTER_ADMIN' && !scopedSocietyId
  const effectiveSocietyId = scopedSocietyId || user?.societyId

  const { data: bills = [], isLoading, isError } = useQuery({
    queryKey: ['vendorBills', effectiveSocietyId, isPlatformLevel],
    queryFn: () => {
      if (effectiveSocietyId) {
        return vendorBillApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return vendorBillApi.getAll().then(res => res.data)
    },
  })

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', effectiveSocietyId, isPlatformLevel],
    queryFn: () => {
      if (effectiveSocietyId) {
        return vendorApi.getBySociety(effectiveSocietyId).then(res => res.data)
      }
      return vendorApi.getAll().then(res => res.data)
    },
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
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete vendor bill')
    },
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

  const handleExport = async (format) => {
    if (!effectiveSocietyId) {
      toast.error('Society context is required for export')
      return
    }

    setIsExporting(true)
    try {
      const response = await exportApi.vendorBills(effectiveSocietyId, null, null, format)
      const datePart = new Date().toISOString().split('T')[0]
      downloadBlob(response.data, `vendor_bills_${datePart}.${format}`)
      toast.success('Vendor bills exported successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export vendor bills')
    } finally {
      setIsExporting(false)
    }
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
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vendor Bills</h1>
            <InfoTooltip text="Track vendor invoices and payments" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <NeonSweepButton
            tone="cyan"
            size="md"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </NeonSweepButton>
          <NeonSweepButton
            tone="slate"
            size="md"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet size={20} />
            {isExporting ? 'Exporting...' : 'Export XLSX'}
          </NeonSweepButton>
          {canManageVendorBills() && (
            <NeonSweepButton
              tone="violet"
              size="md"
              onClick={() => { setEditingBill(null); setShowModal(true) }}
              className="w-full sm:w-auto"
            >
              <Plus size={20} />
              Add Bill
            </NeonSweepButton>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl overflow-hidden shadow-sm">
        {(
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Vendor</th>
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Bill #</th>
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Amount</th>
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Paid</th>
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Pending</th>
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Due Date</th>
                  <th className="text-left px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Status</th>
                  <th className="text-right px-6 py-3 text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
                  const StatusIcon = statusIcons[bill.status] || Clock
                  return (
                    <tr key={bill.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[10px] bg-orange-50 inline-flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="font-semibold">{bill.vendorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-tertiary)]">{bill.billNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)] font-semibold">₹{bill.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-tertiary)]">₹{bill.paidAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)]">
                        <span className={clsx(
                          'font-semibold',
                          bill.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'
                        )}>
                          ₹{bill.pendingAmount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-tertiary)]">
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)]">
                        <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', statusColors[bill.status])}>
                          <StatusIcon size={12} />
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {bill.status !== 'PAID' && (
                          <button
                            onClick={() => { setEditingBill(bill); setShowPaymentModal(true) }}
                            className="px-2 py-1 text-xs rounded-lg border border-transparent bg-green-100 text-green-700 mr-2 hover:bg-green-200 transition-colors"
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
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-transparent border-none text-[var(--text-tertiary)] hover:text-red-600 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="w-full max-w-[420px] bg-[var(--bg-card)] rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add Vendor Bill</h3>
              <button onClick={() => setShowModal(false)} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 grid gap-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">Vendor</label>
                <select
                  name="vendorId"
                  required
                  className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-700">Bill Number</label>
                  <input
                    type="text"
                    name="billNumber"
                    required
                    className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-700">Bill Date</label>
                  <input
                    type="date"
                    name="billDate"
                    required
                    className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none min-h-[80px] resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && editingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="w-full max-w-[420px] bg-[var(--bg-card)] rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-4 grid gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]">
                <p className="text-sm text-[var(--text-secondary)]">Bill: <span className="font-semibold text-[var(--text-primary)]">{editingBill.billNumber}</span></p>
                <p className="text-sm text-[var(--text-secondary)]">Total: <span className="font-semibold text-[var(--text-primary)]">₹{editingBill.amount?.toLocaleString()}</span></p>
                <p className="text-sm text-[var(--text-secondary)]">Paid: <span className="font-semibold text-[var(--text-primary)]">₹{editingBill.paidAmount?.toLocaleString() || 0}</span></p>
                <p className="text-sm text-[var(--text-secondary)]">Balance: <span className="font-semibold text-red-600">₹{(editingBill.amount - (editingBill.paidAmount || 0)).toLocaleString()}</span></p>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">Payment Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={editingBill.amount - (editingBill.paidAmount || 0)}
                  required
                  className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">Payment Mode</label>
                <select
                  name="paymentMode"
                  required
                  className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online Transfer</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-slate-700">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  className="w-full px-3 py-2 rounded-[10px] border border-[#cbd5f5] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={paymentMutation.isPending}
                >
                  {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                </NeonSweepButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
