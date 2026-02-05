import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { maintenanceBillApi, flatApi } from '../api'
import { Plus, Search, X, CreditCard, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
}

export default function MaintenanceBills() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // Bulk generation state
  const [bulkPropertyType, setBulkPropertyType] = useState('ALL')
  const [bulkBillMonth, setBulkBillMonth] = useState('')
  const [previewCount, setPreviewCount] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // Get society filter from URL (for MASTER_ADMIN viewing specific society)
  const societyIdFromUrl = searchParams.get('society')

  // Check if current user is MASTER_ADMIN
  const isMasterAdmin = user?.role === 'MASTER_ADMIN'

  // Determine effective society ID for filtering
  const effectiveSocietyId = isMasterAdmin && societyIdFromUrl ? parseInt(societyIdFromUrl) : user?.societyId

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
    queryKey: ['flats', user?.id],
    queryFn: () => flatApi.getAll(user.id).then(res => res.data),
    enabled: !!user?.id,
  })

  const createMutation = useMutation({
    mutationFn: (data) => maintenanceBillApi.create(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenanceBills'])
      setShowModal(false)
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Bills</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Generate and track maintenance bills</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            Bulk Generate
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Bill
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bills</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{bills.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{bills.filter(b => b.status === 'PAID').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{bills.filter(b => b.status === 'PENDING').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{bills.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by flat or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Flat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{bill.flatNumber}</span>
                          <p className="text-xs text-gray-500">{bill.ownerName || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{bill.billMonth}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">₹{bill.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">₹{bill.paidAmount?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', statusColors[bill.status])}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {bill.status !== 'PAID' && (
                        <button
                          onClick={() => { setSelectedBill(bill); setShowPaymentModal(true) }}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                        >
                          Record Payment
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">Add Maintenance Bill</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Flat</label>
                <select
                  name="flatId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select Flat</option>
                  {flats.map(f => (
                    <option key={f.id} value={f.id}>
                      {isMasterAdmin ? `${f.flatNumber} - ${f.societyName}` : f.flatNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Month</label>
                  <input
                    type="month"
                    name="billMonth"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">Bulk Generate Bills</h3>
              <button onClick={() => {
                setShowBulkModal(false)
                setBulkPropertyType('ALL')
                setBulkBillMonth('')
                setPreviewCount(null)
              }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkGenerate} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bill Month</label>
                  <input
                    type="month"
                    name="billMonth"
                    required
                    value={bulkBillMonth}
                    onChange={(e) => setBulkBillMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount per Unit</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Property Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
                <select
                  value={bulkPropertyType}
                  onChange={(e) => setBulkPropertyType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
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
                'flex items-center gap-2 p-3 rounded-lg text-sm',
                previewCount !== null && previewCount > 0 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : previewCount === 0
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
              )}>
                <Info size={16} />
                {isLoadingPreview ? (
                  <span>Calculating...</span>
                ) : previewCount !== null ? (
                  <span>
                    <strong>{previewCount}</strong> {previewCount === 1 ? 'unit' : 'units'} will receive bills
                    {bulkPropertyType !== 'ALL' && ` (${bulkPropertyType.toLowerCase()} only)`}
                  </span>
                ) : bulkBillMonth ? (
                  <span>Select options to see preview count</span>
                ) : (
                  <span>Select a bill month to see how many units will be billed</span>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => {
                  setShowBulkModal(false)
                  setBulkPropertyType('ALL')
                  setBulkBillMonth('')
                  setPreviewCount(null)
                }} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button 
                  type="submit" 
                  disabled={bulkGenerateMutation.isPending || previewCount === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-4 space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Flat: <span className="font-medium dark:text-white">{selectedBill.flatNumber}</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Month: <span className="font-medium dark:text-white">{selectedBill.billMonth}</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total: <span className="font-medium dark:text-white">₹{selectedBill.amount?.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Balance: <span className="font-medium text-red-600">₹{(selectedBill.amount - (selectedBill.paidAmount || 0)).toLocaleString()}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={selectedBill.amount - (selectedBill.paidAmount || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                <select
                  name="paymentMode"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
