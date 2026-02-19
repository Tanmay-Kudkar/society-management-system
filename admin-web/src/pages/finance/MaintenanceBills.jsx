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
  PENDING: 'maintenance-status maintenance-status--pending',
  PARTIAL: 'maintenance-status maintenance-status--partial',
  PAID: 'maintenance-status maintenance-status--paid',
  OVERDUE: 'maintenance-status maintenance-status--overdue',
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
      <div className="maintenance-page">
        <WakeUpBanner />
        <HeroSkeleton />
        <FinancePageSkeleton summaryCount={3} rows={8} cols={6} />
      </div>
    )
  }

  return (
    <div className="maintenance-page">
      {/* Header */}
      <div className="maintenance-header">
        <div>
          <h1 className="maintenance-title">Maintenance Bills</h1>
          <p className="maintenance-subtitle">Generate and track maintenance bills</p>
        </div>
        {canManageMaintenanceBills() && (
          <div className="maintenance-header-actions">
            <button
              onClick={() => setShowBulkModal(true)}
              className="maintenance-bulk-button"
            >
              Bulk Generate
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="maintenance-add-button"
            >
              <Plus size={20} />
              Add Bill
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="maintenance-summary">
        <div className="maintenance-summary-card">
          <p className="maintenance-summary-label">Total Bills</p>
          <p className="maintenance-summary-value">{bills.length}</p>
        </div>
        <div className="maintenance-summary-card">
          <p className="maintenance-summary-label">Paid</p>
          <p className="maintenance-summary-value maintenance-summary-value--paid">{bills.filter(b => b.status === 'PAID').length}</p>
        </div>
        <div className="maintenance-summary-card">
          <p className="maintenance-summary-label">Pending</p>
          <p className="maintenance-summary-value maintenance-summary-value--pending">{bills.filter(b => b.status === 'PENDING').length}</p>
        </div>
        <div className="maintenance-summary-card">
          <p className="maintenance-summary-label">Total Amount</p>
          <p className="maintenance-summary-value">₹{bills.reduce((sum, b) => sum + getBillTotal(b), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="maintenance-filters">
        <div className="maintenance-filters-row">
          <div className="maintenance-search">
            <Search className="maintenance-search-icon" />
            <input
              type="text"
              placeholder="Search by flat or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="maintenance-search-input"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="maintenance-filter-select"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="maintenance-table-card">
          <div className="maintenance-table-scroll">
            <table className="maintenance-table">
              <thead className="maintenance-thead">
                <tr>
                  <th className="maintenance-th" style={{ width: '40px' }}></th>
                  <th className="maintenance-th">Flat</th>
                  <th className="maintenance-th">Month</th>
                  <th className="maintenance-th">Amount</th>
                  <th className="maintenance-th">Paid</th>
                  <th className="maintenance-th">Status</th>
                  <th className="maintenance-th maintenance-th--right">Actions</th>
                </tr>
              </thead>
              <tbody className="maintenance-tbody">
                {filteredBills.map((bill) => (
                  <Fragment key={bill.id}>
                    <tr className={clsx("maintenance-row", expandedBillId === bill.id && "maintenance-row--expanded")}>
                      <td className="maintenance-cell">
                        {bill.lineItems?.length > 0 && (
                          <button
                            onClick={() => setExpandedBillId(expandedBillId === bill.id ? null : bill.id)}
                            className={clsx("maintenance-expand-button", expandedBillId === bill.id && "maintenance-expand-button--active")}
                          >
                            <ChevronRight size={18} />
                          </button>
                        )}
                      </td>
                      <td className="maintenance-cell">
                        <div className="maintenance-unit">
                          <div className="maintenance-unit-icon">
                            <CreditCard className="maintenance-unit-icon-svg" />
                          </div>
                          <div className="maintenance-unit-meta">
                            <span className="maintenance-unit-number">{bill.flatNumber}</span>
                            <p className="maintenance-unit-owner">{bill.ownerName || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="maintenance-cell maintenance-cell--muted">{bill.billMonth}</td>
                      <td className="maintenance-cell maintenance-cell--strong">₹{getBillTotal(bill).toLocaleString()}</td>
                      <td className="maintenance-cell maintenance-cell--muted">₹{getBillPaid(bill).toLocaleString()}</td>
                      <td className="maintenance-cell">
                        <span className={clsx(statusClasses[bill.status] || statusClasses.PENDING)}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="maintenance-cell maintenance-cell--right">
                        {bill.status !== 'PAID' && (
                          <div className="maintenance-actions">
                            <button
                              onClick={() => handleOnlinePayment(bill)}
                              disabled={isPaymentLoading}
                              className="maintenance-pay-online-button"
                              title="Pay Online via Razorpay"
                            >
                              <Wallet size={16} />
                              Pay Online
                            </button>
                            <button
                              onClick={() => { setSelectedBill(bill); setShowPaymentModal(true) }}
                              className="maintenance-pay-button"
                            >
                              Record Payment
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedBillId === bill.id && bill.lineItems?.length > 0 && (
                      <tr className="maintenance-expanded-content">
                        <td colSpan={7}>
                          <div className="maintenance-details-wrapper">
                            <div className="maintenance-details-title">
                              <Info size={14} />
                              <span>Bill Breakdown</span>
                            </div>
                            <table className="maintenance-item-details-table">
                              <thead>
                                <tr>
                                  <th className="maintenance-item-details-th">Type</th>
                                  <th className="maintenance-item-details-th">Description</th>
                                  <th className="maintenance-item-details-th">Rate</th>
                                  <th className="maintenance-item-details-th">Qty</th>
                                  <th className="maintenance-item-details-th" style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.lineItems.map((item, idx) => (
                                  <tr key={idx} className="maintenance-item-details-tr">
                                    <td className="maintenance-item-details-td">
                                      <span className="maintenance-item-type-tag">{item.chargeType}</span>
                                    </td>
                                    <td className="maintenance-item-details-td">{item.description}</td>
                                    <td className="maintenance-item-details-td">₹{toNumber(item.rate).toLocaleString()}</td>
                                    <td className="maintenance-item-details-td">{item.quantity}</td>
                                    <td className="maintenance-item-details-td" style={{ textAlign: 'right', fontWeight: '600' }}>
                                      ₹{(toNumber(item.rate) * toNumber(item.quantity, 1)).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="maintenance-item-details-tr">
                                  <td colSpan={4} className="maintenance-item-details-td" style={{ textAlign: 'right', fontWeight: '700' }}>Grand Total:</td>
                                  <td className="maintenance-item-details-td" style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
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
        <div className="maintenance-modal">
          <div className="maintenance-modal-card">
            <div className="maintenance-modal-header">
              <h3 className="maintenance-modal-title">Add Maintenance Bill</h3>
              <button onClick={() => {setShowModal(false); setBillMonth('')}} className="maintenance-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="maintenance-modal-body">
              <div className="maintenance-field">
                <label className="maintenance-label">Flat</label>
                <select
                  name="flatId"
                  required
                  className="maintenance-input"
                >
                  <option value="">Select Flat</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>
                      {isPlatformLevel ? `${f.flatNumber} - ${f.societyName}` : f.flatNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="maintenance-form-grid">
                <div className="maintenance-field">
                  <label className="maintenance-label">Bill Month</label>
                  <input
                    type="month"
                    name="billMonth"
                    required
                    value={billMonth}
                    onChange={(e) => setBillMonth(e.target.value)}
                    className="maintenance-input"
                  />
                </div>
              </div>
              <div className="maintenance-itemized-toggle-row">
                <label className="maintenance-itemized-toggle-label">
                  <input
                    type="checkbox"
                    checked={useItemizedMode}
                    onChange={(e) => setUseItemizedMode(e.target.checked)}
                  />
                  <span>Use itemized bill</span>
                </label>
                {useItemizedMode && (
                  <p className="maintenance-itemized-total">Subtotal: ₹{lineItemsTotal.toLocaleString()}</p>
                )}
              </div>
              {useItemizedMode ? (
                <div className="maintenance-line-items">
                  {lineItems.map((item, index) => (
                    <div key={`item-${index}`} className="maintenance-line-item-row">
                      <select
                        value={item.chargeType}
                        onChange={(e) => updateLineItem(index, 'chargeType', e.target.value)}
                        className="maintenance-input"
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
                        className="maintenance-input"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                        className="maintenance-input"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="maintenance-input"
                      />
                      <label className="maintenance-line-item-taxable">
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
                        className="maintenance-line-item-remove"
                        disabled={lineItems.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="maintenance-line-item-add"
                  >
                    + Add Line Item
                  </button>
                </div>
              ) : (
                <div className="maintenance-field">
                  <label className="maintenance-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    required={!useItemizedMode}
                    className="maintenance-input"
                  />
                </div>
              )}
              <div className="maintenance-field">
                <label className="maintenance-label">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  className="maintenance-input"
                />
              </div>
              <div className="maintenance-form-actions">
                <button type="button" onClick={() => {setShowModal(false); setBillMonth('')}} className="maintenance-cancel-button">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="maintenance-submit-button"
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
        <div className="maintenance-modal">
          <div className="maintenance-modal-card">
            <div className="maintenance-modal-header">
              <h3 className="maintenance-modal-title">Bulk Generate Bills</h3>
              <button onClick={() => {
                setShowBulkModal(false)
                setBulkPropertyType('ALL')
                setBulkBillMonth('')
                setPreviewCount(null)
              }} className="maintenance-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkGenerate} className="maintenance-modal-body">
              <div className="maintenance-form-grid">
                <div className="maintenance-field">
                  <label className="maintenance-label">Bill Month</label>
                  <input
                    type="month"
                    name="billMonth"
                    required
                    value={bulkBillMonth}
                    onChange={(e) => setBulkBillMonth(e.target.value)}
                    className="maintenance-input"
                  />
                </div>
                <div className="maintenance-field">
                  <label className="maintenance-label">Amount per Unit (fallback)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    className="maintenance-input"
                  />
                </div>
              </div>
              <p className="maintenance-bulk-help-text">
                Used only when society line-item settings are not configured.
              </p>
              
              {/* Property Type Filter */}
              <div className="maintenance-field">
                <label className="maintenance-label">Property Type</label>
                <select
                  value={bulkPropertyType}
                  onChange={(e) => setBulkPropertyType(e.target.value)}
                  className="maintenance-input"
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
                'maintenance-preview',
                previewCount !== null && previewCount > 0 
                  ? 'is-ready'
                  : previewCount === 0
                    ? 'is-empty'
                    : 'is-idle'
              )}>
                <Info className="maintenance-preview-icon" />
                {isLoadingPreview ? (
                  <span className="maintenance-preview-text">Calculating...</span>
                ) : previewCount !== null ? (
                  <span className="maintenance-preview-text">
                    <strong>{previewCount}</strong> {previewCount === 1 ? 'unit' : 'units'} will receive bills
                    {bulkPropertyType !== 'ALL' && ` (${bulkPropertyType.toLowerCase()} only)`}
                  </span>
                ) : bulkBillMonth ? (
                  <span className="maintenance-preview-text">Select options to see preview count</span>
                ) : (
                  <span className="maintenance-preview-text">Select a bill month to see how many units will be billed</span>
                )}
              </div>
              
              <div className="maintenance-form-actions">
                <button type="button" onClick={() => {
                  setShowBulkModal(false)
                  setBulkPropertyType('ALL')
                  setBulkBillMonth('')
                  setPreviewCount(null)
                }} className="maintenance-cancel-button">Cancel</button>
                <AsyncButton 
                  type="submit" 
                  className="maintenance-submit-button"
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
        <div className="maintenance-modal">
          <div className="maintenance-modal-card">
            <div className="maintenance-modal-header">
              <h3 className="maintenance-modal-title">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="maintenance-modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="maintenance-modal-body">
              <div className="maintenance-payment-summary">
                <p className="maintenance-payment-row">Flat: <span className="maintenance-payment-strong">{selectedBill.flatNumber}</span></p>
                <p className="maintenance-payment-row">Month: <span className="maintenance-payment-strong">{selectedBill.billMonth}</span></p>
                <p className="maintenance-payment-row">Total: <span className="maintenance-payment-strong">₹{getBillTotal(selectedBill).toLocaleString()}</span></p>
                <p className="maintenance-payment-row">Balance: <span className="maintenance-payment-balance">₹{getBillBalance(selectedBill).toLocaleString()}</span></p>
              </div>
              <div className="maintenance-field">
                <label className="maintenance-label">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={getBillBalance(selectedBill)}
                  required
                  className="maintenance-input"
                />
              </div>
              <div className="maintenance-field">
                <label className="maintenance-label">Payment Mode</label>
                <select
                  name="paymentMode"
                  required
                  className="maintenance-input"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div className="maintenance-field">
                <label className="maintenance-label">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  className="maintenance-input"
                />
              </div>
              <div className="maintenance-form-actions">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="maintenance-cancel-button">Cancel</button>
                <AsyncButton
                  type="submit"
                  className="maintenance-submit-button maintenance-submit-button--success"
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
