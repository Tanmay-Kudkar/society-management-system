import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { useToast } from '../../context'
import { vendorBillApi, vendorApi, exportApi, downloadBlob, userApi, societySettingApi } from '../../../../api'
import { Plus, Edit, Trash2, Search, X, Receipt, CheckCircle, Clock, AlertCircle, FileSpreadsheet, Download } from 'lucide-react'
import clsx from 'clsx'
import { InfoTooltip, NeonSweepButton } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { useRazorpay } from '../../hooks/useRazorpay'
import { formatRole } from '../../utils/formatUtils'

const statusColors = {
  PENDING: 'border border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-100',
  PARTIAL: 'border border-blue-300/70 bg-blue-50 text-blue-800 dark:border-blue-500/35 dark:bg-blue-500/15 dark:text-blue-100',
  PAID: 'border border-emerald-300/70 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-100',
}

const statusIcons = {
  PENDING: Clock,
  PARTIAL: AlertCircle,
  PAID: CheckCircle,
}

const paymentModeOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'IMPS', label: 'IMPS' },
  { value: 'CARD', label: 'Card' },
  { value: 'ONLINE', label: 'Online Transfer' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
]

const paymentReferenceLabel = {
  CHEQUE: 'Cheque Number',
  UPI: 'UPI Transaction / UTR',
  NEFT: 'NEFT UTR Number',
  IMPS: 'IMPS Reference',
  CARD: 'Card Transaction ID',
  ONLINE: 'Online Reference',
  BANK_TRANSFER: 'Bank Transfer Reference',
  OTHER: 'Reference Details',
  CASH: 'Receipt / Acknowledgement (Optional)',
}

const receiverRoleOptions = [
  'SOCIETY_ADMIN',
  'CHAIRMAN',
  'SECRETARY',
  'TREASURER',
  'COMMITTEE',
  'MANAGER',
  'OTHER',
]

const electionSensitiveRoles = new Set(['CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE'])

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
  const [isDownloadingReceiptId, setIsDownloadingReceiptId] = useState(null)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('CASH')
  const [selectedReceiverRole, setSelectedReceiverRole] = useState(user?.role || 'SECRETARY')
  const [manualReceivedByName, setManualReceivedByName] = useState('')
  const [paymentError, setPaymentError] = useState('')

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

  const { data: societyUsers = [] } = useQuery({
    queryKey: ['users-by-society', effectiveSocietyId],
    queryFn: () => userApi.getBySociety(effectiveSocietyId).then((res) => res.data || []),
    enabled: !!effectiveSocietyId,
  })

  const { data: societySettings } = useQuery({
    queryKey: ['society-settings', effectiveSocietyId, user?.id],
    queryFn: () => societySettingApi.getBySocietyId(effectiveSocietyId, user.id).then((res) => res.data),
    enabled: !!effectiveSocietyId && !!user?.id,
  })

  const roleMatchedUsers = useMemo(() => {
    if (selectedReceiverRole === 'OTHER') return []
    return societyUsers.filter((societyUser) => {
      if (!societyUser) return false
      if (societyUser.deletedAt) return false
      return societyUser.role === selectedReceiverRole
    })
  }, [selectedReceiverRole, societyUsers])

  const autoResolvedReceivedByName = useMemo(() => {
    if (selectedReceiverRole === 'OTHER') return manualReceivedByName.trim()
    const names = [...new Set(roleMatchedUsers.map((societyUser) => (societyUser.name || '').trim()).filter(Boolean))]
    return names.join(', ')
  }, [manualReceivedByName, roleMatchedUsers, selectedReceiverRole])

  const electionWindowStatus = useMemo(() => {
    const startRaw = societySettings?.committeeElectionStartDate
    const endRaw = societySettings?.committeeElectionEndDate
    if (!startRaw || !endRaw) {
      return { active: false, startLabel: '', endLabel: '' }
    }

    const start = new Date(startRaw)
    const end = new Date(endRaw)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { active: false, startLabel: '', endLabel: '' }
    }

    const normalizedEnd = new Date(end)
    normalizedEnd.setHours(23, 59, 59, 999)
    const now = new Date()

    return {
      active: now >= start && now <= normalizedEnd,
      startLabel: start.toLocaleDateString(),
      endLabel: normalizedEnd.toLocaleDateString(),
    }
  }, [societySettings])

  const isSelectedRoleUnderElection = useMemo(
    () => electionWindowStatus.active && electionSensitiveRoles.has(selectedReceiverRole),
    [electionWindowStatus.active, selectedReceiverRole]
  )

  const closeCreateModal = (force = false) => {
    if (!force && createMutation.isPending) return
    setShowModal(false)
  }

  const closePaymentModal = (force = false) => {
    if (!force && paymentMutation.isPending) return
    setShowPaymentModal(false)
    setEditingBill(null)
    setSelectedPaymentMode('CASH')
    setSelectedReceiverRole(receiverRoleOptions.includes(user?.role) ? user.role : 'SECRETARY')
    setManualReceivedByName('')
    setPaymentError('')
  }

  const openPaymentModal = (bill) => {
    setEditingBill(bill)
    setSelectedPaymentMode('CASH')
    setSelectedReceiverRole(receiverRoleOptions.includes(user?.role) ? user.role : 'SECRETARY')
    setManualReceivedByName('')
    setPaymentError('')
    setShowPaymentModal(true)
  }

  const createMutation = useMutation({
    mutationFn: (data) => vendorBillApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorBills'])
      closeCreateModal(true)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, paymentMode, referenceNumber, receivedByRole, receivedByName, paymentNotes }) => 
      vendorBillApi.recordPayment(
        id,
        amount,
        paymentMode,
        referenceNumber,
        receivedByRole,
        receivedByName,
        paymentNotes,
        user.id,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorBills'])
      toast.success('Vendor payment recorded successfully')
      closePaymentModal(true)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to record vendor payment')
    },
  })

  const { initiatePayment, isLoading: isRazorpayLoading } = useRazorpay({
    onSuccess: () => {
      queryClient.invalidateQueries(['vendorBills'])
      closePaymentModal(true)
      toast.success('Online payment completed successfully')
    },
    onError: (error) => {
      toast.error(error?.description || error?.message || 'Online payment failed')
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
    const amount = Number(formData.get('amount'))
    const balance = Number(editingBill?.amount || 0) - Number(editingBill?.paidAmount || 0)
    const paymentMode = formData.get('paymentMode')
    const referenceNumber = (formData.get('referenceNumber') || '').toString().trim()
    const receivedByRole = (formData.get('receivedByRole') || '').toString().trim()
    const receivedByName = (formData.get('receivedByName') || '').toString().trim()
    const paymentNotes = (formData.get('paymentNotes') || '').toString().trim()

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Enter a valid payment amount greater than 0.')
      return
    }
    if (amount > balance) {
      setPaymentError('Payment amount cannot exceed the pending amount.')
      return
    }
    if (paymentMode !== 'CASH' && !referenceNumber) {
      setPaymentError('Reference details are required for non-cash payment modes.')
      return
    }
    if (receivedByRole === 'OTHER' && !receivedByName) {
      setPaymentError('Please enter the receiver name when role is set to OTHER.')
      return
    }
    if (receivedByRole !== 'OTHER' && !receivedByName) {
      setPaymentError('No user is assigned to the selected role. Select OTHER and enter the receiver name manually.')
      return
    }

    setPaymentError('')
    paymentMutation.mutate({
      id: editingBill.id,
      amount,
      paymentMode,
      referenceNumber,
      receivedByRole,
      receivedByName,
      paymentNotes,
    })
  }

  const handleOnlinePayment = (bill) => {
    const balance = Number(bill.pendingAmount || (bill.amount - (bill.paidAmount || 0)) || 0)
    if (balance <= 0) {
      toast.info('This bill is already fully paid')
      return
    }
    initiatePayment({
      amount: balance,
      vendorBillId: bill.id,
      userId: user.id,
      description: `Vendor Bill - ${bill.billNumber || `#${bill.id}`} - ${bill.vendorName || 'Vendor'}`,
      paymentType: 'VENDOR_BILL',
      prefill: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  }

  const handleDownloadReceipt = async (bill) => {
    try {
      setIsDownloadingReceiptId(bill.id)
      const response = await vendorBillApi.downloadReceiptPdf(bill.id, user.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `vendor-receipt-${bill.billNumber || bill.id}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(objectUrl)
      toast.success('Receipt downloaded successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to download receipt PDF')
    } finally {
      setIsDownloadingReceiptId(null)
    }
  }

  const handleExport = async () => {
    if (!effectiveSocietyId) {
      toast.error('Society context is required for export')
      return
    }

    setIsExporting(true)
    try {
      const response = await exportApi.vendorBills(effectiveSocietyId, null, null)
      const datePart = new Date().toISOString().split('T')[0]
      downloadBlob(response.data, `vendor_bills_${datePart}.xlsx`)
      toast.success('Vendor bills exported successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export vendor bills')
    } finally {
      setIsExporting(false)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading)

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
            tone="slate"
            size="md"
            onClick={handleExport}
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
              className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-[210px]"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[18px] border border-[color-mix(in_srgb,var(--border-default)_82%,#94a3b8_18%)] bg-[var(--bg-card)] shadow-[0_14px_34px_rgba(15,23,42,0.08)] overflow-hidden">
        {(
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-tertiary)_88%,#dbeafe_12%),color-mix(in_srgb,var(--bg-card)_94%,#e2e8f0_6%))] border-b border-[var(--border-light)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Vendor</th>
                  <th className="text-left px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Bill #</th>
                  <th className="text-left px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Paid</th>
                  <th className="text-left px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Pending</th>
                  <th className="text-left px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Due Date</th>
                  <th className="text-left px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--text-primary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
                  const StatusIcon = statusIcons[bill.status] || Clock
                  return (
                    <tr key={bill.id} className="border-b border-[color-mix(in_srgb,var(--border-light)_80%,transparent)] last:border-b-0 hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,#e2e8f0_30%)] transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap text-[var(--text-primary)] sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[10px] border border-orange-300/60 bg-orange-50 inline-flex items-center justify-center dark:border-orange-500/35 dark:bg-orange-500/15">
                            <Receipt className="w-4 h-4 text-orange-600 dark:text-orange-200" />
                          </div>
                          <span className="font-semibold">{bill.vendorName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-[var(--text-primary)] sm:px-6">{bill.billNumber}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-[var(--text-primary)] font-semibold sm:px-6">₹{bill.amount?.toLocaleString()}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-[var(--text-tertiary)] sm:px-6">₹{bill.paidAmount?.toLocaleString() || 0}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-[var(--text-primary)] sm:px-6">
                        <span className={clsx(
                          'font-semibold',
                          bill.pendingAmount > 0 ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'
                        )}>
                          ₹{bill.pendingAmount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-[var(--text-tertiary)] sm:px-6">
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-[var(--text-primary)] sm:px-6">
                        <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', statusColors[bill.status])}>
                          <StatusIcon size={12} />
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right sm:px-6">
                        {canManageVendorBills() && bill.status !== 'PAID' && (
                          <>
                            <button
                              onClick={() => openPaymentModal(bill)}
                              className="mr-2 rounded-lg border border-blue-300/70 bg-blue-50 px-2 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/35 dark:bg-blue-500/15 dark:text-blue-100 dark:hover:bg-blue-500/25"
                            >
                              Record
                            </button>
                            <button
                              onClick={() => handleOnlinePayment(bill)}
                              disabled={isRazorpayLoading}
                              className="mr-2 rounded-lg border border-emerald-300/70 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
                            >
                              {isRazorpayLoading ? 'Paying...' : 'Pay Online'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownloadReceipt(bill)}
                          disabled={isDownloadingReceiptId === bill.id || (!bill.paidAmount || Number(bill.paidAmount) <= 0)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-transparent border-none text-[var(--text-tertiary)] hover:text-blue-600 disabled:opacity-40 transition-colors"
                          title="Download receipt PDF"
                        >
                          <Download size={18} />
                        </button>
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
          <div className="w-full max-w-[420px] max-h-[calc(100svh-2rem)] overflow-y-auto rounded-2xl bg-[var(--bg-card)] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add Vendor Bill</h3>
              <button onClick={() => closeCreateModal()} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 grid gap-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Vendor</label>
                <select
                  name="vendorId"
                  required
                  className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Bill Number</label>
                  <input
                    type="text"
                    name="billNumber"
                    required
                    className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Bill Date</label>
                  <input
                    type="date"
                    name="billDate"
                    required
                    className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="min-h-[80px] w-full resize-y rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={() => closeCreateModal()}
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="my-4 flex w-full max-w-[420px] max-h-[calc(100svh-2rem)] flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] shadow-[0_24px_60px_rgba(15,23,42,0.2)] sm:my-0">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] p-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Record Payment</h3>
              <button onClick={() => closePaymentModal()} className="border-none bg-transparent text-[var(--text-tertiary)] p-1 rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-4">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]">
                <p className="text-sm text-[var(--text-secondary)]">Bill: <span className="font-semibold text-[var(--text-primary)]">{editingBill.billNumber}</span></p>
                <p className="text-sm text-[var(--text-secondary)]">Total: <span className="font-semibold text-[var(--text-primary)]">₹{editingBill.amount?.toLocaleString()}</span></p>
                <p className="text-sm text-[var(--text-secondary)]">Paid: <span className="font-semibold text-[var(--text-primary)]">₹{editingBill.paidAmount?.toLocaleString() || 0}</span></p>
                <p className="text-sm text-[var(--text-secondary)]">Balance: <span className="font-semibold text-red-600 dark:text-red-300">₹{(editingBill.amount - (editingBill.paidAmount || 0)).toLocaleString()}</span></p>
              </div>
              {paymentError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-100">
                  {paymentError}
                </div>
              )}
              <div>
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Payment Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={editingBill.amount - (editingBill.paidAmount || 0)}
                  required
                  className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={selectedPaymentMode}
                  onChange={(e) => setSelectedPaymentMode(e.target.value)}
                  required
                  className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {paymentModeOptions.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">{paymentReferenceLabel[selectedPaymentMode] || 'Reference Number'}</label>
                <input
                  type="text"
                  name="referenceNumber"
                  placeholder={selectedPaymentMode === 'CASH' ? 'Optional' : 'Required'}
                  className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Received By (Role)</label>
                <select
                  name="receivedByRole"
                  value={selectedReceiverRole}
                  onChange={(e) => setSelectedReceiverRole(e.target.value)}
                  className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {receiverRoleOptions.map((role) => (
                    <option key={role} value={role}>{formatRole(role)}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Received By (Auto)</div>
                <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {selectedReceiverRole === 'OTHER' ? 'Manual entry required' : (autoResolvedReceivedByName || `${formatRole(selectedReceiverRole)} not assigned`)}
                </div>
                {selectedReceiverRole !== 'OTHER' && isSelectedRoleUnderElection && (
                  <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    {formatRole(selectedReceiverRole)} is under election window ({electionWindowStatus.startLabel} - {electionWindowStatus.endLabel}).
                  </p>
                )}
                {selectedReceiverRole !== 'OTHER' && !autoResolvedReceivedByName && !isSelectedRoleUnderElection && (
                  <p className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-300">
                    No active assignee found for this role. Choose OTHER and fill name manually.
                  </p>
                )}
                {selectedReceiverRole !== 'OTHER' && (
                  <input type="hidden" name="receivedByName" value={autoResolvedReceivedByName} />
                )}
              </div>
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-300 ease-out',
                  selectedReceiverRole === 'OTHER' ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                )}
                aria-hidden={selectedReceiverRole !== 'OTHER'}
              >
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Received By (Name)</label>
                <input
                  type="text"
                  name="receivedByName"
                  value={manualReceivedByName}
                  onChange={(e) => setManualReceivedByName(e.target.value)}
                  placeholder="e.g. Full Name"
                  className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[var(--text-secondary)]">Notes (Optional)</label>
                <textarea
                  name="paymentNotes"
                  rows={2}
                  placeholder="Example: Vendor collected by UPI to secretary due to gateway issue"
                  className="min-h-[70px] w-full resize-y rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text-primary)] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="sticky bottom-0 flex gap-3 border-t border-[var(--border-light)] bg-[var(--bg-card)] pt-3">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={() => closePaymentModal()}
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
