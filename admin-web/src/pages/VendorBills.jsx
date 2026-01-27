import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { vendorBillApi, vendorApi } from '../api'
import { Plus, Edit, Trash2, Search, X, Receipt, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
}

const statusIcons = {
  PENDING: Clock,
  PARTIAL: AlertCircle,
  PAID: CheckCircle,
}

export default function VendorBills() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { data: bills = [], isLoading } = useQuery({
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

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || b.status === filterStatus
    return matchesSearch && matchesStatus
  })

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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Bills</h1>
          <p className="text-gray-600 mt-1">Track vendor invoices and payments</p>
        </div>
        <button
          onClick={() => { setEditingBill(null); setShowModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Bill
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map((bill) => {
                  const StatusIcon = statusIcons[bill.status] || Clock
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-900">{bill.vendorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{bill.billNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">₹{bill.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">₹{bill.paidAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', statusColors[bill.status])}>
                          <StatusIcon size={12} />
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {bill.status !== 'PAID' && (
                          <button
                            onClick={() => { setEditingBill(bill); setShowPaymentModal(true) }}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition mr-2"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this bill?')) {
                              deleteMutation.mutate(bill.id)
                            }
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Add Vendor Bill</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select
                  name="vendorId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                  <input
                    type="text"
                    name="billNumber"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    name="billDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && editingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Bill: <span className="font-medium">{editingBill.billNumber}</span></p>
                <p className="text-sm text-gray-600">Total: <span className="font-medium">₹{editingBill.amount?.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600">Paid: <span className="font-medium">₹{editingBill.paidAmount?.toLocaleString() || 0}</span></p>
                <p className="text-sm text-gray-600">Balance: <span className="font-medium text-red-600">₹{(editingBill.amount - (editingBill.paidAmount || 0)).toLocaleString()}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  max={editingBill.amount - (editingBill.paidAmount || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  name="paymentMode"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  name="referenceNumber"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
