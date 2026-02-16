import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context'
import { maintenanceBillApi, flatApi } from '../../../../api'
import { Plus, Search, X, CreditCard, CheckCircle, Clock, AlertCircle, Info, Wallet } from 'lucide-react'
import clsx from 'clsx'
import { PermissionDenied } from '../../components'
import { useRazorpay } from '../../hooks/useRazorpay'
import { useToast } from '../../context'

const statusClasses = {
  PENDING: 'maintenance-status maintenance-status--pending',
  PARTIAL: 'maintenance-status maintenance-status--partial',
  PAID: 'maintenance-status maintenance-status--paid',
  OVERDUE: 'maintenance-status maintenance-status--overdue',
}

export default function MaintenanceBills() {
  const { user, canManageMaintenanceBills } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  
  // Permission check
  if (!canManageMaintenanceBills()) {
    return <PermissionDenied message="You don't have permission to manage maintenance bills" />
  }
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // Individual bill state
  const [billMonth, setBillMonth] = useState('')
  
  // Bulk generation state
  const [bulkPropertyType, setBulkPropertyType] = useState('ALL')
  const [bulkBillMonth, setBulkBillMonth] = useState('')
  const [previewCount, setPreviewCount] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // Razorpay integration
  const { initiatePayment, isLoading: isPaymentLoading, error: paymentError } = useRazorpay({
    onSuccess: (paymentData) => {
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
    const balance = bill.amount - (bill.paidAmount || 0)
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

  // Get society filter from URL (for PLATFORM_OWNER viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is PLATFORM_OWNER or ORGANIZATION_OWNER
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isPlatformLevel && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

  const { data: allBills = [], isLoading } = useQuery({
    queryKey: ['maintenanceBills'],
    queryFn: () => maintenanceBillApi.getAll().then(res => res.data),
  })

  // Filter bills by society
  const bills = useMemo(() => {
    if (!effectiveSocietyId) return allBills
    return allBills.filter(b => b.societyId === effectiveSocietyId)
  }, [allBills, effectiveSocietyId])

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', effectiveSocietyId],
    queryFn: () => flatApi.getBySociety(effectiveSocietyId).then(res => res.data),
    enabled: !!effectiveSocietyId,
  })

  const createMutation = useMutation({
    mutationFn: (data) => maintenanceBillApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      setShowModal(false)
      setBillMonth('')
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
    },
  })

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || b.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      flatId: parseInt(formData.get('flatId')),
      billMonth: formData.get('billMonth'),
      amount: parseFloat(formData.get('amount')),
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
      amount: parseFloat(formData.get('amount')),
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
          <p className="maintenance-summary-value">₹{bills.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}</p>
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
        {isLoading ? (
          <div className="maintenance-loading">
            <div className="maintenance-spinner" />
          </div>
        ) : (
          <div className="maintenance-table-scroll">
            <table className="maintenance-table">
              <thead className="maintenance-thead">
                <tr>
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
                  <tr key={bill.id} className="maintenance-row">
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
                    <td className="maintenance-cell maintenance-cell--strong">₹{bill.amount?.toLocaleString()}</td>
                    <td className="maintenance-cell maintenance-cell--muted">₹{bill.paidAmount?.toLocaleString() || 0}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                <div className="maintenance-field">
                  <label className="maintenance-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="maintenance-input"
                  />
                </div>
              </div>
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
                <button type="submit" className="maintenance-submit-button">Create</button>
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
                  <label className="maintenance-label">Amount per Unit</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="maintenance-input"
                  />
                </div>
              </div>
              
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
                <button 
                  type="submit" 
                  disabled={bulkGenerateMutation.isPending || previewCount === 0}
                  className="maintenance-submit-button"
                >
                  {bulkGenerateMutation.isPending ? 'Generating...' : 'Generate'}
                </button>
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
                <p className="maintenance-payment-row">Total: <span className="maintenance-payment-strong">₹{selectedBill.amount?.toLocaleString()}</span></p>
                <p className="maintenance-payment-row">Balance: <span className="maintenance-payment-balance">₹{(selectedBill.amount - (selectedBill.paidAmount || 0)).toLocaleString()}</span></p>
              </div>
              <div className="maintenance-field">
                <label className="maintenance-label">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={selectedBill.amount - (selectedBill.paidAmount || 0)}
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
                <button type="submit" className="maintenance-submit-button maintenance-submit-button--success">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
