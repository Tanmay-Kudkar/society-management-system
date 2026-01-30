import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import {
  Users,
  Building2,
  Home,
  CreditCard,
  FileText,
  Ticket,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Car,
  UserCheck,
  DollarSign,
  PieChart,
} from 'lucide-react'
import { societyApi, flatApi, contractApi, ticketApi, maintenanceBillApi, tenantApi, vehicleApi, transactionApi, complaintApi, reportApi } from '../api'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
)

const AlertCard = ({ title, items, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`w-5 h-5 ${color}`} />
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {items.length === 0 ? (
      <p className="text-gray-500 dark:text-gray-400 text-sm">No items to display</p>
    ) : (
      <ul className="space-y-3">
        {items.slice(0, 5).map((item, index) => (
          <li key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-200">{item.title}</span>
            <span className="text-gray-500 dark:text-gray-400">{item.subtitle}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default function Dashboard() {
  const { user, isMasterAdmin } = useAuth()

  // MASTER_ADMIN doesn't belong to a society, so some queries won't work
  const hasSociety = user?.societyId != null

  const { data: societies = [] } = useQuery({
    queryKey: ['societies'],
    queryFn: () => societyApi.getAll().then(res => res.data),
    enabled: isMasterAdmin(),
  })

  const { data: flats = [] } = useQuery({
    queryKey: ['flats'],
    queryFn: () => flatApi.getAll().then(res => res.data).catch(() => []),
  })

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll().then(res => res.data).catch(() => []),
  })

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleApi.getAll().then(res => res.data).catch(() => []),
  })

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractApi.getAll().then(res => res.data).catch(() => []),
  })

  const { data: allTickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.getAll().then(res => res.data).catch(() => []),
  })
  
  // Open tickets are those not yet closed or resolved
  const openTickets = allTickets.filter(t => 
    t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  )
  
  // Pending tickets for the alerts section (only OPEN status)
  const pendingTickets = allTickets.filter(t => t.status === 'OPEN')

  const { data: pendingBills = [] } = useQuery({
    queryKey: ['bills', 'pending'],
    queryFn: () => maintenanceBillApi.getPending().then(res => res.data).catch(() => []),
  })

  const { data: complaints = [] } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintApi.getAll(user?.id).then(res => res.data).catch(() => []),
  })

  // Filter expiring contracts (within 30 days)
  const expiringContracts = contracts.filter(c => {
    if (!c.endDate) return false
    const endDate = new Date(c.endDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  })

  // Filter expiring tenant agreements (within 30 days)
  const expiringTenants = tenants.filter(t => {
    if (!t.agreementEndDate || !t.isActive) return false
    const endDate = new Date(t.agreementEndDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  })

  // Calculate bill statistics
  const totalBillAmount = pendingBills.reduce((sum, b) => sum + (b.amount || 0), 0)
  const paidBills = pendingBills.filter(b => b.status === 'PAID')
  const pendingBillsCount = pendingBills.filter(b => b.status === 'PENDING')
  const overdueBills = pendingBills.filter(b => {
    if (b.status !== 'PENDING' || !b.dueDate) return false
    return new Date(b.dueDate) < new Date()
  })

  // Complaint statistics
  const pendingComplaints = complaints.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS')

  // MTD/YTD Report data
  const { data: dashboardReport } = useQuery({
    queryKey: ['dashboardReport', user?.societyId],
    queryFn: () => user?.societyId ? reportApi.getDashboard(user.societyId).then(res => res.data) : null,
    enabled: !!user?.societyId,
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isMasterAdmin() && (
          <StatCard
            title="Total Societies"
            value={societies.length}
            icon={Building2}
            color="bg-purple-500"
          />
        )}
        <StatCard
          title="Total Flats"
          value={flats.length}
          icon={Home}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Tenants"
          value={tenants.filter(t => t.isActive).length}
          icon={UserCheck}
          color="bg-teal-500"
          subtext={`${expiringTenants.length} expiring soon`}
        />
        <StatCard
          title="Vehicles"
          value={vehicles.length}
          icon={Car}
          color="bg-indigo-500"
        />
        <StatCard
          title="Pending Bills"
          value={pendingBillsCount.length}
          icon={CreditCard}
          color="bg-orange-500"
          subtext={overdueBills.length > 0 ? `${overdueBills.length} overdue` : undefined}
        />
        <StatCard
          title="Open Tickets"
          value={openTickets.length}
          icon={Ticket}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Complaints"
          value={pendingComplaints.length}
          icon={AlertTriangle}
          color="bg-amber-500"
        />
        <StatCard
          title="Expiring Contracts"
          value={expiringContracts.length}
          icon={FileText}
          color="bg-yellow-500"
          subtext="Next 30 days"
        />
      </div>

      {/* MTD/YTD Financial Overview */}
      {dashboardReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <p className="text-sm font-medium text-green-100">MTD Income</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(dashboardReport.totalIncome)}</p>
            <p className="text-xs text-green-100 mt-2">This month</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm p-6 text-white">
            <p className="text-sm font-medium text-red-100">MTD Expense</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(dashboardReport.totalExpense)}</p>
            <p className="text-xs text-red-100 mt-2">This month</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <p className="text-sm font-medium text-blue-100">YTD Income</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(dashboardReport.previousPeriodIncome)}</p>
            <p className="text-xs text-blue-100 mt-2">Year to date</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <p className="text-sm font-medium text-purple-100">Cash Balance</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(dashboardReport.cashBalance)}</p>
            <p className="text-xs text-purple-100 mt-2">All time</p>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <AlertCard
          title="Expiring Contracts"
          icon={AlertTriangle}
          color="text-yellow-500"
          items={expiringContracts.map(contract => ({
            title: contract.title,
            subtitle: new Date(contract.endDate).toLocaleDateString(),
          }))}
        />
        <AlertCard
          title="Expiring Tenant Agreements"
          icon={UserCheck}
          color="text-teal-500"
          items={expiringTenants.map(tenant => ({
            title: tenant.name,
            subtitle: new Date(tenant.agreementEndDate).toLocaleDateString(),
          }))}
        />
        <AlertCard
          title="Pending Tickets"
          icon={Clock}
          color="text-red-500"
          items={pendingTickets.map(ticket => ({
            title: ticket.title,
            subtitle: ticket.type,
          }))}
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Bills Summary</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Bills Amount</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{totalBillAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Paid Bills</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{paidBills.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Pending Bills</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">{pendingBillsCount.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Overdue Bills</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{overdueBills.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Vehicle Distribution</h3>
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {vehicles.filter(v => v.vehicleType === 'FOUR_WHEELER').length}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Four Wheelers</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {vehicles.filter(v => v.vehicleType === 'TWO_WHEELER').length}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Two Wheelers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{paidBills.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Paid Bills</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingBillsCount.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Bills</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingTickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{tenants.filter(t => t.isActive).length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Tenants</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{contracts.filter(c => c.isActive).length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Contracts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
