import { useState, useMemo, useEffect, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { maintenanceBillApi, flatApi } from '../../../../api'
import { Plus, Search, X, CreditCard, CheckCircle, Clock, AlertCircle, Info, Wallet, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied, AsyncButton } from '../../components'
import { HeroSkeleton, FinancePageSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders'
import { useRazorpay } from '../../hooks/useRazorpay'
import useMinLoadingTime from '../../hooks/useMinLoadingTime'
import { useToast } from '../../context'

const defaultLineItem = () => ({
  chargeType: 'MAINTENANCE',
  description: '',
  rate: '',
  quantity: '1',
  isTaxable: true,
})

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getBillTotal = (bill) => {
  const total = toNumber(bill?.totalAmount)
  return total > 0 ? total : toNumber(bill?.amount)
}
const getBillPaid = (bill) => toNumber(bill?.paidAmount)
const getBillBalance = (bill) => Math.max(0, getBillTotal(bill) - getBillPaid(bill))

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

  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedBillId, setExpandedBillId] = useState(null)
  const [useItemizedMode, setUseItemizedMode] = useState(true)
  const [lineItems, setLineItems] = useState([defaultLineItem()])
  
  // Individual bill state
  const [billMonth, setBillMonth] = useState('')
  
  // Bulk generation state
  const [bulkPropertyType, setBulkPropertyType] = useState('ALL')
  const [bulkBillMonth, setBulkBillMonth] = useState('')
  const [previewCount, setPreviewCount] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const resetCreateModalState = () => {
    setShowModal(false)
    setBillMonth('')
    setUseItemizedMode(true)
    setLineItems([defaultLineItem()])
  }

  // Razorpay integration
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay({
    onSuccess: () => {
      toast.success('Payment successful! Bill has been updated.')
      queryClient.invalidateQueries(['maintenanceBills'])
      setShowPaymentModal(false)
      setSelectedBill(null)
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

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', effectiveSocietyId],
    queryFn: () => flatApi.getBySociety(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId && hasManagePermission,
  })

  const createMutation = useMutation({
    mutationFn: (data) => maintenanceBillApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      resetCreateModalState()
      toast.success('Maintenance bill created successfully')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create maintenance bill')
    },
  })

  const bulkGenerateMutation = useMutation({
    mutationFn: ({ societyId, billMonth, amount, propertyType }) => 
      maintenanceBillApi.generateForSociety(societyId, billMonth, amount, user.id, propertyType),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      setShowBulkModal(false)
      setBulkPropertyType('ALL')
      setBulkBillMonth('')
      setPreviewCount(null)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, paymentMode, referenceNumber }) => 
      maintenanceBillApi.recordPayment(id, amount, paymentMode, referenceNumber, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      setShowPaymentModal(false)
      setSelectedBill(null)
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

  const lineItemsTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (toNumber(item.rate) * toNumber(item.quantity, 1)), 0)
  }, [lineItems])

  const updateLineItem = (index, key, value) => {
    setLineItems(prev => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )))
  }

  const addLineItem = () => {
    setLineItems(prev => [...prev, defaultLineItem()])
  }

  const removeLineItem = (index) => {
    setLineItems(prev => {
      if (prev.length <= 1) return prev
      return prev.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    let amount = toNumber(formData.get('amount'))
    let payloadLineItems = null

    if (useItemizedMode) {
      payloadLineItems = lineItems
        .map(item => ({
          chargeType: item.chargeType,
          description: item.description?.trim() || item.chargeType,
          rate: toNumber(item.rate),
          quantity: toNumber(item.quantity, 1),
          isTaxable: item.isTaxable,
        }))
        .filter(item => item.rate > 0 && item.quantity > 0)

      if (payloadLineItems.length === 0) {
        toast.error('Add at least one valid line item')
        return
      }

      amount = payloadLineItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0)
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    const data = {
      flatId: parseInt(formData.get('flatId')),
      billMonth: formData.get('billMonth'),
      amount,
      ...(payloadLineItems ? { lineItems: payloadLineItems } : {}),
      dueDate: formData.get('dueDate'),
    }
    createMutation.mutate(data)
  }

  const handleBulkGenerate = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    bulkGenerateMutation.mutate({
      societyId: effectiveSocietyId,
      billMonth: formData.get('billMonth'),
      amount: toNumber(formData.get('amount')),
      propertyType: bulkPropertyType !== 'ALL' ? bulkPropertyType : null,
    })
  }
  
  // Fetch preview count when property type or bill month changes
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
          bulkBillMonth,
          bulkPropertyType !== 'ALL' ? bulkPropertyType : null
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
  }, [showBulkModal, effectiveSocietyId, bulkBillMonth, bulkPropertyType])

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

  const showSkeleton = useMinLoadingTime(isLoading || isError)

  if (!hasManagePermission) {
    return <PermissionDenied message="You don't have permission to manage maintenance bills" />
  }

  if (showSkeleton) {
    return (
      <div>
        <WakeUpBanner />
        <HeroSkeleton />
        <FinancePageSkeleton summaryCount={3} rows={8} cols={6} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Maintenance Bills</h1>
          <p className="mt-1 text-[var(--text-secondary)]">Generate and track maintenance bills</p>
        </div>
        {canManageMaintenanceBills() && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-[rgba(15,23,42,0.12)] text-[#f8fafc] bg-[#0f172a] transition-all hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.16)] dark:border-[rgba(148,163,184,0.26)] dark:bg-[#020617]"
            >
              Bulk Generate
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] hover:bg-[var(--bg-tertiary)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
            >
              <Plus size={20} />
              Add Bill
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-sm text-[var(--text-tertiary)]">Total Bills</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{bills.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-sm text-[var(--text-tertiary)]">Paid</p>
          <p className="mt-1 text-2xl font-bold text-[#16a34a]">{bills.filter(b => b.status === 'PAID').length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-sm text-[var(--text-tertiary)]">Pending</p>
          <p className="mt-1 text-2xl font-bold text-[#ca8a04]">{bills.filter(b => b.status === 'PENDING').length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <p className="text-sm text-[var(--text-tertiary)]">Total Amount</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">₹{bills.reduce((sum, b) => sum + getBillTotal(b), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_10px_22px_rgba(15,23,42,0.08)] mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by flat or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-[0.55rem] pr-3 pl-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[720px]">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-light)]">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]" style={{ width: '40px' }}></th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Flat</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Month</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Amount</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Paid</th>
                  <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <Fragment key={bill.id}>
                    <tr className="transition-colors hover:bg-[var(--bg-tertiary)]">
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        {bill.lineItems?.length > 0 && (
                          <button
                            onClick={() => setExpandedBillId(expandedBillId === bill.id ? null : bill.id)}
                            className={clsx(
                              "inline-flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-tertiary)] bg-transparent border-none cursor-pointer transition-all hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                              expandedBillId === bill.id && "rotate-90 text-[#2563eb]"
                            )}
                          >
                            <ChevronRight size={18} />
                          </button>
                        )}
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[rgba(22,163,74,0.12)] flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-[#16a34a]" />
                          </div>
                          <div>
                            <span className="font-semibold">{bill.flatNumber}</span>
                            <p className="text-xs text-[var(--text-tertiary)]">{bill.ownerName || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">{bill.billMonth}</td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)] font-semibold">₹{getBillTotal(bill).toLocaleString()}</td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-tertiary)]">₹{getBillPaid(bill).toLocaleString()}</td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)]">
                        <span className={clsx(statusClasses[bill.status] || statusClasses.PENDING)}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-[0.85rem] px-6 text-[0.9rem] text-[var(--text-primary)] text-right">
                        {bill.status !== 'PAID' && (
                          <div className="flex gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => handleOnlinePayment(bill)}
                              disabled={isPaymentLoading}
                              className="inline-flex items-center gap-[0.35rem] py-[0.4rem] px-3 text-[0.8rem] font-semibold rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white border-none cursor-pointer transition-all hover:enabled:-translate-y-px hover:enabled:shadow-[0_4px_12px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                              title="Pay Online via Razorpay"
                            >
                              <Wallet size={16} />
                              Pay Online
                            </button>
                            <button
                              onClick={() => { setSelectedBill(bill); setShowPaymentModal(true) }}
                              className="py-[0.35rem] px-3 rounded-[0.65rem] text-xs font-semibold text-[#166534] bg-[#dcfce7] transition-all hover:bg-[#bbf7d0] hover:-translate-y-px"
                            >
                              Record Payment
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedBillId === bill.id && bill.lineItems?.length > 0 && (
                      <tr className="bg-[var(--bg-tertiary)] border-b-2 border-[var(--border-light)]">
                        <td colSpan={7}>
                          <div className="py-4 px-6 pl-[4.5rem]">
                            <div className="text-[0.8rem] font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                              <Info size={14} />
                              <span>Bill Breakdown</span>
                            </div>
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="py-2 px-4 text-[0.65rem] uppercase text-[var(--text-tertiary)] text-left border-b border-[var(--border-light)]">Type</th>
                                  <th className="py-2 px-4 text-[0.65rem] uppercase text-[var(--text-tertiary)] text-left border-b border-[var(--border-light)]">Description</th>
                                  <th className="py-2 px-4 text-[0.65rem] uppercase text-[var(--text-tertiary)] text-left border-b border-[var(--border-light)]">Rate</th>
                                  <th className="py-2 px-4 text-[0.65rem] uppercase text-[var(--text-tertiary)] text-left border-b border-[var(--border-light)]">Qty</th>
                                  <th className="py-2 px-4 text-[0.65rem] uppercase text-[var(--text-tertiary)] text-left border-b border-[var(--border-light)]" style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.lineItems.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-3 px-4 text-[0.85rem] text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                                      <span className="text-[0.7rem] py-[0.15rem] px-[0.45rem] rounded-md bg-[var(--border-light)] text-[var(--text-tertiary)] font-medium">{item.chargeType}</span>
                                    </td>
                                    <td className="py-3 px-4 text-[0.85rem] text-[var(--text-secondary)] border-b border-[var(--border-light)]">{item.description}</td>
                                    <td className="py-3 px-4 text-[0.85rem] text-[var(--text-secondary)] border-b border-[var(--border-light)]">₹{toNumber(item.rate).toLocaleString()}</td>
                                    <td className="py-3 px-4 text-[0.85rem] text-[var(--text-secondary)] border-b border-[var(--border-light)]">{item.quantity}</td>
                                    <td className="py-3 px-4 text-[0.85rem] text-[var(--text-secondary)] border-b border-[var(--border-light)]" style={{ textAlign: 'right', fontWeight: '600' }}>
                                      ₹{(toNumber(item.rate) * toNumber(item.quantity, 1)).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr>
                                  <td colSpan={4} className="py-3 px-4 text-[0.85rem] text-[var(--text-secondary)]" style={{ textAlign: 'right', fontWeight: '700' }}>Grand Total:</td>
                                  <td className="py-3 px-4 text-[0.85rem] text-[var(--text-secondary)]" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    ₹{getBillTotal(bill).toLocaleString()}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* Add Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] shrink-0">
              <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Add Maintenance Bill</h3>
              <button onClick={() => {setShowModal(false); setBillMonth('')}} className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Flat</label>
                <select
                  name="flatId"
                  required
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                >
                  <option value="">Select Flat</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>
                      {isPlatformLevel ? `${f.flatNumber} - ${f.societyName}` : f.flatNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[0.4rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Bill Month</label>
                  <input
                    type="month"
                    name="billMonth"
                    required
                    value={billMonth}
                    onChange={(e) => setBillMonth(e.target.value)}
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="inline-flex items-center gap-[0.45rem] text-[0.85rem] text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={useItemizedMode}
                    onChange={(e) => setUseItemizedMode(e.target.checked)}
                  />
                  <span>Use itemized bill</span>
                </label>
                {useItemizedMode && (
                  <p className="text-[0.85rem] font-semibold text-[var(--text-primary)]">Subtotal: ₹{lineItemsTotal.toLocaleString()}</p>
                )}
              </div>
              {useItemizedMode ? (
                <div className="flex flex-col gap-[0.6rem]">
                  {lineItems.map((item, index) => (
                    <div key={`item-${index}`} className="grid grid-cols-[1.1fr_1.5fr_0.8fr_0.7fr_auto_auto] gap-2 items-center max-lg:grid-cols-2">
                      <select
                        value={item.chargeType}
                        onChange={(e) => updateLineItem(index, 'chargeType', e.target.value)}
                        className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                      >
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="SINKING_FUND">Sinking Fund</option>
                        <option value="SERVICE_CHARGE">Service Charge</option>
                        <option value="PARKING">Parking</option>
                        <option value="WATER">Water</option>
                        <option value="ELECTRICITY">Electricity</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                        className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                      />
                      <label className="inline-flex items-center gap-[0.35rem] text-[0.8rem] text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={item.isTaxable}
                          onChange={(e) => updateLineItem(index, 'isTaxable', e.target.checked)}
                        />
                        Taxable
                      </label>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] rounded-[0.55rem] py-2 px-3 text-[0.8rem] font-semibold disabled:opacity-[0.55] disabled:cursor-not-allowed"
                        disabled={lineItems.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] rounded-[0.55rem] py-2 px-3 text-[0.8rem] font-semibold"
                  >
                    + Add Line Item
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-[0.4rem]">
                  <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    required={!useItemizedMode}
                    className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                  />
                </div>
              )}
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => {setShowModal(false); setBillMonth('')}} className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[#cbd5f5] text-[#334155] bg-[var(--bg-tertiary)] transition-all hover:-translate-y-px">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:-translate-y-px hover:bg-[var(--bg-tertiary)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
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

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] shrink-0">
              <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Bulk Generate Bills</h3>
              <button onClick={() => {
                setShowBulkModal(false)
                setBulkPropertyType('ALL')
                setBulkBillMonth('')
                setPreviewCount(null)
              }} className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
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
              
              {/* Property Type Filter */}
              <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.85rem] font-semibold text-[var(--text-secondary)]">Property Type</label>
                <select
                  value={bulkPropertyType}
                  onChange={(e) => setBulkPropertyType(e.target.value)}
                  className="w-full py-[0.55rem] px-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.2)]"
                >
                  <option value="ALL">All Property Types</option>
                  <option value="RESIDENTIAL">Residential Only</option>
                  <option value="COMMERCIAL">Commercial Only</option>
                  <option value="OFFICE">Office Only</option>
                  <option value="PARKING">Parking Only</option>
                </select>
              </div>
              
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
                    <strong>{previewCount}</strong> {previewCount === 1 ? 'unit' : 'units'} will receive bills
                    {bulkPropertyType !== 'ALL' && ` (${bulkPropertyType.toLowerCase()} only)`}
                  </span>
                ) : bulkBillMonth ? (
                  <span className="text-[0.85rem]">Select options to see preview count</span>
                ) : (
                  <span className="text-[0.85rem]">Select a bill month to see how many units will be billed</span>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => {
                  setShowBulkModal(false)
                  setBulkPropertyType('ALL')
                  setBulkBillMonth('')
                  setPreviewCount(null)
                }} className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[#cbd5f5] text-[#334155] bg-[var(--bg-tertiary)] transition-all hover:-translate-y-px">Cancel</button>
                <AsyncButton 
                  type="submit" 
                  className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:-translate-y-px hover:bg-[var(--bg-tertiary)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
                  isLoading={bulkGenerateMutation.isPending}
                  loadingText="Generating..."
                  disabled={previewCount === 0}
                >
                  Generate
                </AsyncButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[32rem] max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] shrink-0">
              <h3 className="text-[1.1rem] font-semibold text-[var(--text-primary)]">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[rgba(148,163,184,0.2)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                <p className="text-[0.85rem]">Flat: <span className="font-semibold text-[var(--text-primary)]">{selectedBill.flatNumber}</span></p>
                <p className="text-[0.85rem]">Month: <span className="font-semibold text-[var(--text-primary)]">{selectedBill.billMonth}</span></p>
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
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[#cbd5f5] text-[#334155] bg-[var(--bg-tertiary)] transition-all hover:-translate-y-px">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="flex-1 py-[0.65rem] px-4 rounded-xl font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:-translate-y-px hover:bg-[var(--bg-tertiary)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-[rgba(148,163,184,0.22)] dark:bg-[#f8fafc] dark:text-[#0f172a] dark:hover:bg-white"
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
