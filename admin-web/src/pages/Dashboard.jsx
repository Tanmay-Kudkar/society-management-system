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
} from 'lucide-react'
import { societyApi, flatApi, contractApi, ticketApi, maintenanceBillApi } from '../api'

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
)

const AlertCard = ({ title, items, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`w-5 h-5 ${color}`} />
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    {items.length === 0 ? (
      <p className="text-gray-500 text-sm">No items to display</p>
    ) : (
      <ul className="space-y-3">
        {items.slice(0, 5).map((item, index) => (
          <li key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{item.title}</span>
            <span className="text-gray-500">{item.subtitle}</span>
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

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractApi.getAll().then(res => res.data).catch(() => []),
  })

  const { data: pendingTickets = [] } = useQuery({
    queryKey: ['tickets', 'pending'],
    queryFn: () => ticketApi.getByStatus('PENDING').then(res => res.data).catch(() => []),
  })

  const { data: pendingBills = [] } = useQuery({
    queryKey: ['bills', 'pending'],
    queryFn: () => maintenanceBillApi.getPending().then(res => res.data).catch(() => []),
  })

  // Filter expiring contracts (within 30 days)
  const expiringContracts = contracts.filter(c => {
    if (!c.endDate) return false
    const endDate = new Date(c.endDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
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
          title="Pending Bills"
          value={pendingBills.length}
          icon={CreditCard}
          color="bg-orange-500"
        />
        <StatCard
          title="Open Tickets"
          value={pendingTickets.length}
          icon={Ticket}
          color="bg-red-500"
        />
        <StatCard
          title="Expiring Contracts"
          value={expiringContracts.length}
          icon={FileText}
          color="bg-yellow-500"
          subtext="Next 30 days"
        />
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          title="Pending Tickets"
          icon={Clock}
          color="text-red-500"
          items={pendingTickets.map(ticket => ({
            title: ticket.title,
            subtitle: ticket.type,
          }))}
        />
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{pendingBills.filter(b => b.status === 'PAID').length}</p>
            <p className="text-sm text-gray-500">Paid Bills</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{pendingBills.filter(b => b.status === 'PENDING').length}</p>
            <p className="text-sm text-gray-500">Pending Bills</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{pendingTickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{expiringContracts.filter(c => c.isActive).length}</p>
            <p className="text-sm text-gray-500">Active Contracts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
