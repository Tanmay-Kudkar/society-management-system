import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { useConfirmDialog } from '../../context'
import { maintenanceBillApi, exportApi, downloadBlob } from '../../../../api'
import { Search, X, CreditCard, CheckCircle, Clock, AlertCircle, Wallet, Printer, Pencil, Trash2, AlertTriangle, Info, FileSpreadsheet } from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied, InfoTooltip, NeonSweepButton, AnimatedModal } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import { useRazorpay } from '../../hooks/useRazorpay'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { useToast } from '../../context'

const MODAL_ANIMATION_DURATION = 220

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toMonthLabel = (billMonth) => {
  if (!billMonth) return 'Bill'
  const [year, month] = billMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  if (Number.isNaN(date.getTime())) return billMonth
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const toFileSafePart = (value) => String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ')

const getInvoiceFileName = (bill) => {
  const monthLabel = toMonthLabel(bill?.billMonth)
  const unitLabel = toFileSafePart(bill?.flatNumber || bill?.unitNumber || bill?.flatNo)
  if (!unitLabel) {
    return `Maintenance Bill of ${monthLabel}`
  }
  return `Maintenance Bill of ${monthLabel} - Unit ${unitLabel}`
}

const getBillTotal = (bill) => {
  const total = toNumber(bill?.totalAmount)
  return total > 0 ? total : toNumber(bill?.amount)
}
const getBillPaid = (bill) => toNumber(bill?.paidAmount)
const getBillBalance = (bill) => Math.max(0, getBillTotal(bill) - getBillPaid(bill))

const formatBillMonth = (billMonth) => toMonthLabel(billMonth)

const formatMoney = (value) => `₹${toNumber(value).toLocaleString()}`

const getResidentLabel = (bill) => {
  const label = bill?.ownerName?.trim()
  return label || 'Resident details unavailable'
}

const getResidentLabelClass = (label) => {
  if (!label) return 'text-[var(--text-tertiary)]'
  const normalized = label.toLowerCase()
  if (normalized.includes('vacant') || normalized.includes('no tenant')) {
    return 'text-[#b45309]'
  }
  return 'text-[var(--text-tertiary)]'
}

const statusClasses = {
  PENDING: 'inline-flex items-center py-1 px-3 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#92400e]',
  PARTIAL: 'inline-flex items-center py-1 px-3 rounded-full text-xs font-semibold bg-[#dbeafe] text-[#1e40af]',
  PAID: 'inline-flex items-center py-1 px-3 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#166534]',
  OVERDUE: 'inline-flex items-center py-1 px-3 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#991b1b]',
}

export default function MaintenanceBills() {
  const { user, canManageMaintenanceBills } = useAuth()
  const hasManagePermission = canManageMaintenanceBills()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirmDialog = useConfirmDialog()

  const [searchParams] = useSearchParams()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showDeleteMonthModal, setShowDeleteMonthModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [editingBill, setEditingBill] = useState(null)
  const [editForm, setEditForm] = useState({ billMonth: '', amount: '', dueDate: '' })
  const [deleteMonth, setDeleteMonth] = useState('')
  const [deleteMonthConfirmText, setDeleteMonthConfirmText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null)
  
  // Bulk generation state
  const [bulkBillMonth, setBulkBillMonth] = useState('')
  const [previewCount, setPreviewCount] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  function closeEditModal() {
    setShowEditModal(false)
    window.setTimeout(() => {
      setEditingBill(null)
    }, MODAL_ANIMATION_DURATION)
  }

  function closeDeleteMonthModal() {
    setShowDeleteMonthModal(false)
    window.setTimeout(() => {
      setDeleteMonth('')
      setDeleteMonthConfirmText('')
    }, MODAL_ANIMATION_DURATION)
  }

  function closeBulkModal() {
    setShowBulkModal(false)
    window.setTimeout(() => {
      setBulkBillMonth('')
      setPreviewCount(null)
    }, MODAL_ANIMATION_DURATION)
  }

  function closePaymentModal() {
    setShowPaymentModal(false)
    window.setTimeout(() => {
      setSelectedBill(null)
    }, MODAL_ANIMATION_DURATION)
  }

  // Razorpay integration
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay({
    onSuccess: () => {
      toast.success('Payment successful! Bill has been updated.')
      queryClient.invalidateQueries(['maintenanceBills'])
      closePaymentModal()
    },
    onError: (error) => {
      toast.error(error?.description || error?.message || 'Payment failed. Please try again.')
    },
    onDismiss: () => {
      // User closed the payment modal without completing
    },
  })

  // Handle online payment via Razorpay
  const handleOnlinePayment = (bill) => {
    const balance = getBillBalance(bill)
    if (balance <= 0) {
      toast.info('No outstanding balance for this bill')
      return
    }
    initiatePayment({
      amount: balance,
      maintenanceBillId: bill.id,
      userId: user.id,
      description: `Maintenance Bill - ${bill.billMonth} - Flat ${bill.flatNumber}`,
      paymentType: 'MAINTENANCE',
      prefill: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  }

  const handleDownloadInvoicePdf = async (bill) => {
    try {
      setDownloadingInvoiceId(bill.id)
      const response = await maintenanceBillApi.downloadInvoicePdf(bill.id, user.id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const fileId = getInvoiceFileName(bill)
      anchor.href = objectUrl
      anchor.download = `${fileId}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(objectUrl)
      toast.success('Invoice downloaded successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to download invoice PDF')
    } finally {
      setDownloadingInvoiceId(null)
    }
  }

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is MASTER_ADMIN or SOCIETY_ADMIN
  const isPlatformLevel = user?.role === 'MASTER_ADMIN'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: allBills = [], isLoading, isError } = useQuery({
    queryKey: ['maintenanceBills'],
    queryFn: () => maintenanceBillApi.getAll().then(res => res.data),
    enabled: hasManagePermission,
  })

  // Filter bills by society
  const bills = useMemo(() => {
    if (!effectiveSocietyId) return allBills
    return allBills.filter(b => b.societyId === effectiveSocietyId)
  }, [allBills, effectiveSocietyId])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => maintenanceBillApi.update(id, data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      closeEditModal()
      toast.success('Maintenance bill updated successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update maintenance bill')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => maintenanceBillApi.delete(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      toast.success('Maintenance bill deleted successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete maintenance bill')
    },
  })

  const deleteMonthMutation = useMutation({
    mutationFn: async (month) => {
      const monthBillsResponse = await maintenanceBillApi.getByMonth(month)
      const scopedBills = (monthBillsResponse?.data || []).filter((bill) =>
        effectiveSocietyId ? bill.societyId === effectiveSocietyId : true,
      )

      for (const bill of scopedBills) {
        // eslint-disable-next-line no-await-in-loop
        await maintenanceBillApi.delete(bill.id, user.id)
      }

      return scopedBills.length
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries(['maintenanceBills'])
      closeDeleteMonthModal()
      toast.success(`Deleted ${deletedCount} bill${deletedCount === 1 ? '' : 's'} for selected month`)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete bills for selected month')
    },
  })

  const bulkGenerateMutation = useMutation({
    mutationFn: ({ societyId, billMonth, amount }) => 
      maintenanceBillApi.generateForSociety(societyId, billMonth, amount, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      closeBulkModal()
      toast.success('Bills generated for eligible units')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'No new eligible units found for this month')
    },
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, paymentMode, referenceNumber }) => 
      maintenanceBillApi.recordPayment(id, amount, paymentMode, referenceNumber, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      closePaymentModal()
      toast.success('Payment recorded successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to record payment')
    },
  })

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchesSearch = b.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           b.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || b.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [bills, searchTerm, filterStatus])

  const handleEditBill = (bill) => {
    setEditingBill(bill)
    setEditForm({
      billMonth: bill.billMonth || '',
      amount: String(getBillTotal(bill) || ''),
      dueDate: bill.dueDate || '',
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editingBill) return

    const amount = toNumber(editForm.amount)
    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    updateMutation.mutate({
      id: editingBill.id,
      data: {
        flatId: editingBill.flatId,
        amount,
        billMonth: editForm.billMonth,
        dueDate: editForm.dueDate || null,
      },
    })
  }

  const handleDeleteBill = async (bill) => {
    const isRiskyDelete = bill.status === 'PAID' || bill.status === 'PARTIAL'
    const warning = isRiskyDelete
      ? 'This bill is paid/partially paid. Deleting it can affect finance totals and linked records.'
      : 'This bill appears unpaid. It is usually safe to delete if it was created by mistake.'

    const confirmed = await confirmDialog({
      title: 'Delete Maintenance Bill',
      message: `Delete bill for Flat ${bill.flatNumber}, Month ${bill.billMonth}?`,
      confirmText: 'Delete',
      tone: 'danger',
      details: [
        { label: 'Flat', value: bill.flatNumber || '-' },
        { label: 'Month', value: bill.billMonth || '-' },
        { label: 'Status', value: bill.status || '-' },
        { label: 'Amount', value: formatMoney(getBillTotal(bill)) },
        { label: 'Paid', value: formatMoney(getBillPaid(bill)) },
      ],
      caution: warning,
    })

    if (!confirmed) return

    deleteMutation.mutate(bill.id)
  }

  const handleDeleteMonthSubmit = (e) => {
    e.preventDefault()
    if (!deleteMonth) {
      toast.error('Please select a month first')
      return
    }

    const monthBills = bills.filter((bill) => bill.billMonth === deleteMonth)
    if (monthBills.length === 0) {
      toast.info('No bills found for selected month in this society')
      return
    }

    if (deleteMonthConfirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm month-wise deletion')
      return
    }

    const paidOrPartialCount = monthBills.filter((bill) => bill.status === 'PAID' || bill.status === 'PARTIAL').length
    const warning = paidOrPartialCount > 0
      ? `Warning: ${paidOrPartialCount} bill(s) in this month are paid/partially paid. Deleting may impact society finance totals.\n\nProceed only if these were generated by mistake.`
      : 'These bills are unpaid. Deletion is usually safe if generated by mistake.'

    const ok = window.confirm(
      `${warning}\n\nDelete ALL ${monthBills.length} bill(s) for ${deleteMonth}?`,
    )
    if (!ok) return

    deleteMonthMutation.mutate(deleteMonth)
  }

  const handleBulkGenerate = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    bulkGenerateMutation.mutate({
      societyId: effectiveSocietyId,
      billMonth: formData.get('billMonth'),
      amount: toNumber(formData.get('amount')),
    })
  }
  
  // Fetch preview count for all eligible units for the selected month
  useEffect(() => {
    const fetchPreview = async () => {
      if (!showBulkModal || !effectiveSocietyId || !bulkBillMonth) {
        setPreviewCount(null)
        return
      }
      
      setIsLoadingPreview(true)
      try {
        const response = await maintenanceBillApi.getGenerationPreview(
          effectiveSocietyId,
          bulkBillMonth
        )
        setPreviewCount(response.data)
      } catch (error) {
        console.error('Failed to fetch preview count:', error)
        setPreviewCount(null)
      } finally {
        setIsLoadingPreview(false)
      }
    }
    
    fetchPreview()
  }, [showBulkModal, effectiveSocietyId, bulkBillMonth])

  const handlePayment = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    paymentMutation.mutate({
      id: selectedBill.id,
      amount: parseFloat(formData.get('amount')),
      paymentMode: formData.get('paymentMode'),
      referenceNumber: formData.get('referenceNumber'),
    })
  }

  const handleExport = async () => {
    if (!effectiveSocietyId) {
      toast.error('Society context is required for export')
      return
    }

    setIsExporting(true)
    try {
      const response = await exportApi.maintenanceBills(effectiveSocietyId, null)
      const datePart = new Date().toISOString().split('T')[0]
      downloadBlob(response.data, `maintenance_bills_${datePart}.xlsx`)
      toast.success('Maintenance bills exported successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export maintenance bills')
    } finally {
      setIsExporting(false)
    }
  }

  const showSkeleton = useMinLoadingTime(isLoading)

  if (!hasManagePermission) {
    return <PermissionDenied message="You don't have permission to manage maintenance bills" />
  }

  if (showSkeleton) {
    return (
      <div>
        <HeroSkeleton />
        <FinancePageSkeleton />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-[var(--border-light)] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_48%),var(--bg-card)] p-5 shadow-[0_14px_28px_rgba(15,23,42,0.14)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-[1.85rem]">Maintenance Bills</h1>
              <InfoTooltip text="Generate, search, and track monthly maintenance bills" />
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Responsive billing control center for desktop, tablet, and mobile.
            </p>
          </div>
          {canManageMaintenanceBills() && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <NeonSweepButton
                tone="slate"
                size="md"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full sm:w-auto"
              >
                <FileSpreadsheet size={18} />
                {isExporting ? 'Exporting...' : 'Export XLSX'}
              </NeonSweepButton>
              <NeonSweepButton
                tone="cyan"
                size="md"
                onClick={() => setShowBulkModal(true)}
                className="w-full sm:w-auto"
              >
                <Wallet size={18} />
                Generate Bills
              </NeonSweepButton>
              <NeonSweepButton
                tone="danger"
                size="md"
                onClick={() => setShowDeleteMonthModal(true)}
                className="w-full sm:w-auto"
              >
                <AlertTriangle size={18} />
                Delete Month Bills
              </NeonSweepButton>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Total Bills</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{bills.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Paid</p>
          <p className="mt-1 text-2xl font-bold text-[#16a34a]">{bills.filter((b) => b.status === 'PAID').length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Pending</p>
          <p className="mt-1 text-2xl font-bold text-[#ca8a04]">{bills.filter((b) => b.status === 'PENDING' || b.status === 'PARTIAL').length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Total Amount</p>
          <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{formatMoney(bills.reduce((sum, b) => sum + getBillTotal(b), 0))}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by flat or owner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] py-[0.6rem] pl-10 pr-3 text-[var(--text-primary)] transition-all focus:border-[#2563eb] focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-[0.6rem] text-[var(--text-primary)] transition-all focus:border-[#2563eb] focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)] md:w-[12rem]"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_12px_24px_rgba(15,23,42,0.1)] md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full border-collapse">
            <thead className="border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">PDF</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Flat / Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Month</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="border-b border-[var(--border-light)] transition-colors last:border-b-0 hover:bg-[var(--bg-tertiary)]/60">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownloadInvoicePdf(bill)}
                      disabled={downloadingInvoiceId === bill.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)] transition-all hover:border-[var(--border-default)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                      title="Download Invoice PDF"
                    >
                      <Printer size={15} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(22,163,74,0.13)]">
                        <CreditCard className="h-4 w-4 text-[#16a34a]" />
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{bill.flatNumber}</div>
                        <div className={clsx('text-xs', getResidentLabelClass(getResidentLabel(bill)))}>{getResidentLabel(bill)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatBillMonth(bill.billMonth)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">{formatMoney(getBillTotal(bill))}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatMoney(getBillPaid(bill))}</td>
                  <td className="px-4 py-3">
                    <span className={clsx(statusClasses[bill.status] || statusClasses.PENDING)}>{bill.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <NeonSweepButton
                        tone="slate"
                        size="sm"
                        onClick={() => handleEditBill(bill)}
                      >
                        <Pencil size={14} />
                        Edit
                      </NeonSweepButton>
                      <NeonSweepButton
                        tone="danger"
                        size="sm"
                        onClick={() => handleDeleteBill(bill)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={14} />
                        Delete
                      </NeonSweepButton>
                      {bill.status !== 'PAID' && (
                        <>
                          <NeonSweepButton
                            tone="cyan"
                            size="sm"
                            onClick={() => handleOnlinePayment(bill)}
                            disabled={isPaymentLoading}
                          >
                            <Wallet size={15} />
                            Pay Online
                          </NeonSweepButton>
                          <NeonSweepButton
                            tone="slate"
                            size="sm"
                            onClick={() => {
                              setSelectedBill(bill)
                              setShowPaymentModal(true)
                            }}
                          >
                            Record Payment
                          </NeonSweepButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filteredBills.map((bill) => (
          <div
            key={bill.id}
            className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[linear-gradient(140deg,color-mix(in_srgb,var(--bg-card)_88%,var(--accent-primary)_12%),var(--bg-card))] p-4 shadow-[0_10px_20px_rgba(15,23,42,0.1)]"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-bold text-[var(--text-primary)]">{bill.flatNumber}</p>
                <p className={clsx('text-xs', getResidentLabelClass(getResidentLabel(bill)))}>{getResidentLabel(bill)}</p>
              </div>
              <span className={clsx(statusClasses[bill.status] || statusClasses.PENDING)}>{bill.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-[var(--bg-tertiary)] p-2">
                <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Month</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">{formatBillMonth(bill.billMonth)}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-tertiary)] p-2">
                <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Amount</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">{formatMoney(getBillTotal(bill))}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-tertiary)] p-2">
                <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Paid</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">{formatMoney(getBillPaid(bill))}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-tertiary)] p-2">
                <p className="text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">Balance</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">{formatMoney(getBillBalance(bill))}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--border-light)] pt-3">
              <div className="grid grid-cols-2 gap-2">
                <NeonSweepButton
                  tone="slate"
                  size="sm"
                  onClick={() => handleDownloadInvoicePdf(bill)}
                  disabled={downloadingInvoiceId === bill.id}
                  className="w-full"
                >
                  <Printer size={14} />
                  Invoice
                </NeonSweepButton>

                <NeonSweepButton
                  tone="cyan"
                  size="sm"
                  onClick={() => handleEditBill(bill)}
                  className="w-full"
                >
                  <Pencil size={14} />
                  Edit
                </NeonSweepButton>

                <NeonSweepButton
                  tone="danger"
                  size="sm"
                  onClick={() => handleDeleteBill(bill)}
                  disabled={deleteMutation.isPending}
                  className="w-full"
                >
                  <Trash2 size={14} />
                  Delete
                </NeonSweepButton>

                {bill.status !== 'PAID' ? (
                  <NeonSweepButton
                    tone="violet"
                    size="sm"
                    onClick={() => handleOnlinePayment(bill)}
                    disabled={isPaymentLoading}
                    className="w-full"
                  >
                    <Wallet size={14} />
                    {isPaymentLoading ? 'Paying...' : 'Pay Online'}
                  </NeonSweepButton>
                ) : (
                  <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-tertiary)] px-3 py-2 text-center text-xs font-semibold text-[var(--text-secondary)]">
                    Paid Bill
                  </div>
                )}
              </div>

              {bill.status !== 'PAID' && (
                <NeonSweepButton
                  tone="cyan"
                  size="sm"
                  onClick={() => {
                    setSelectedBill(bill)
                    setShowPaymentModal(true)
                  }}
                  className="mt-2 w-full"
                >
                  <CheckCircle size={14} />
                  Record Payment
                </NeonSweepButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBills.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] p-7 text-center">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No bills match your filters</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Try changing status filter or search keyword.</p>
        </div>
      )}

      {/* Edit Bill Modal */}
      <AnimatedModal
        open={showEditModal && !!editingBill}
        onRequestClose={closeEditModal}
        className="flex max-h-[calc(100vh-3rem)] w-full max-w-[28rem] flex-col rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        durationMs={MODAL_ANIMATION_DURATION}
      >
            <div className="shrink-0 border-b border-[var(--border-light)] px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Edit Maintenance Bill</h3>
                <button onClick={closeEditModal} className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                  <X size={20} />
                </button>
              </div>
            </div>
            <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-[var(--text-secondary)]">
                <p className="text-[0.85rem]">Flat: <span className="font-semibold text-[var(--text-primary)]">{editingBill?.flatNumber || '-'}</span></p>
                <p className="text-[0.85rem]">Current Status: <span className="font-semibold text-[var(--text-primary)]">{editingBill?.status || '-'}</span></p>
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Bill Month</label>
                <input
                  type="month"
                  value={editForm.billMonth}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, billMonth: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-[0.55rem] text-[var(--text-primary)] transition-all focus:border-[#2563eb] focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.amount}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-[0.55rem] text-[var(--text-primary)] transition-all focus:border-[#2563eb] focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Due Date</label>
                <input
                  type="date"
                  value={editForm.dueDate || ''}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-[0.55rem] text-[var(--text-primary)] transition-all focus:border-[#2563eb] focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <NeonSweepButton type="button" tone="slate" size="md" className="flex-1" onClick={closeEditModal}>
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </NeonSweepButton>
              </div>
            </form>
      </AnimatedModal>

      {/* Delete Month Bills Modal */}
      <AnimatedModal
        open={showDeleteMonthModal}
        onRequestClose={closeDeleteMonthModal}
        className="w-full max-w-[28rem] rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        durationMs={MODAL_ANIMATION_DURATION}
      >
            <div className="border-b border-[var(--border-light)] px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Delete Bills By Month</h3>
                <button onClick={closeDeleteMonthModal} className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                  <X size={20} />
                </button>
              </div>
            </div>
            <form onSubmit={handleDeleteMonthSubmit} className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-2 rounded-xl border border-[#fca5a5] bg-[#fff1f2] p-3 text-[#991b1b]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p className="text-xs font-semibold leading-5">
                  Paid or partially paid bills may be linked to finance totals. Delete only if bills were generated by mistake.
                </p>
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Select Month</label>
                <input
                  type="month"
                  value={deleteMonth}
                  onChange={(e) => setDeleteMonth(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-[0.55rem] text-[var(--text-primary)] transition-all focus:border-[#2563eb] focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Type DELETE to confirm</label>
                <input
                  type="text"
                  value={deleteMonthConfirmText}
                  onChange={(e) => setDeleteMonthConfirmText(e.target.value)}
                  placeholder="DELETE"
                  required
                  className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-[0.55rem] text-[var(--text-primary)] transition-all focus:border-[#2563eb] focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  onClick={closeDeleteMonthModal}
                  className="w-full"
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="danger"
                  size="md"
                  className="w-full"
                  disabled={deleteMonthMutation.isPending || deleteMonthConfirmText.trim().toUpperCase() !== 'DELETE'}
                >
                  {deleteMonthMutation.isPending ? 'Deleting...' : 'Delete Month Bills'}
                </NeonSweepButton>
              </div>
            </form>
      </AnimatedModal>

      {/* Bulk Generate Modal */}
      <AnimatedModal
        open={showBulkModal}
        onRequestClose={closeBulkModal}
        className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        durationMs={MODAL_ANIMATION_DURATION}
      >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] shrink-0">
              <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Bulk Generate Bills</h3>
              <button onClick={closeBulkModal} className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkGenerate} className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.4rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Bill Month</label>
                  <input
                    type="month"
                    name="billMonth"
                    required
                    value={bulkBillMonth}
                    onChange={(e) => setBulkBillMonth(e.target.value)}
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  />
                </div>
                <div className="flex flex-col gap-[0.4rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Amount per Unit (fallback)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  />
                </div>
              </div>
              <p className="text-[0.8rem] text-[var(--text-tertiary)]">
                Used only when society line-item settings are not configured.
              </p>
              
              {/* Preview Count */}
              <div className={clsx(
                'flex items-center gap-2 p-3 rounded-xl text-[var(--text-secondary)]',
                previewCount !== null && previewCount > 0 
                  ? 'bg-[rgba(59,130,246,0.1)] text-[#1d4ed8]'
                  : previewCount === 0
                    ? 'bg-[#fef9c3] text-[#92400e]'
                    : 'bg-[var(--bg-tertiary)]'
              )}>
                <Info className="w-4 h-4" />
                {isLoadingPreview ? (
                  <span className="text-[0.85rem]">Calculating...</span>
                ) : previewCount !== null ? (
                  <span className="text-[0.85rem]">
                    <strong>{previewCount}</strong> eligible {previewCount === 1 ? 'unit' : 'units'} will receive bills
                  </span>
                ) : bulkBillMonth ? (
                  <span className="text-[0.85rem]">Preview updates automatically for all units</span>
                ) : (
                  <span className="text-[0.85rem]">Select a bill month to see how many units will be billed</span>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <NeonSweepButton
                  type="button"
                  tone="slate"
                  size="md"
                  className="flex-1"
                  onClick={closeBulkModal}
                >
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton
                  type="submit"
                  tone="cyan"
                  size="md"
                  className="flex-1"
                  disabled={bulkGenerateMutation.isPending || previewCount === 0}
                >
                  {bulkGenerateMutation.isPending ? 'Generating...' : 'Generate'}
                </NeonSweepButton>
              </div>
            </form>
      </AnimatedModal>

      {/* Payment Modal */}
      <AnimatedModal
        open={showPaymentModal && !!selectedBill}
        onRequestClose={closePaymentModal}
        className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        durationMs={MODAL_ANIMATION_DURATION}
      >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] shrink-0">
              <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Record Payment</h3>
              <button onClick={closePaymentModal} className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                <p className="text-[0.85rem]">Flat: <span className="font-semibold text-[var(--text-primary)]">{selectedBill?.flatNumber || '-'}</span></p>
                <p className="text-[0.85rem]">Month: <span className="font-semibold text-[var(--text-primary)]">{selectedBill?.billMonth || '-'}</span></p>
                <p className="text-[0.85rem]">Total: <span className="font-semibold text-[var(--text-primary)]">₹{getBillTotal(selectedBill).toLocaleString()}</span></p>
                <p className="text-[0.85rem]">Balance: <span className="font-semibold text-[#dc2626]">₹{getBillBalance(selectedBill).toLocaleString()}</span></p>
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={getBillBalance(selectedBill)}
                  required
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Payment Mode</label>
                <select
                  name="paymentMode"
                  required
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <NeonSweepButton type="button" tone="slate" size="md" className="flex-1" onClick={closePaymentModal}>
                  Cancel
                </NeonSweepButton>
                <NeonSweepButton type="submit" tone="cyan" size="md" className="flex-1" disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                </NeonSweepButton>
              </div>
            </form>
      </AnimatedModal>
    </div>
  )
}
