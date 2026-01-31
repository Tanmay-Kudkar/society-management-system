import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

import {
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
  ArrowUpRight,
  Sparkles,
  Activity,
  BarChart3,
} from "lucide-react";

import {
  societyApi,
  flatApi,
  contractApi,
  ticketApi,
  maintenanceBillApi,
  tenantApi,
  vehicleApi,
  complaintApi,
  reportApi,
} from "../api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const StatCard = ({ title, value, icon: Icon, color, subtext, gradient, delay = 0 }) => (
  <div 
    className={`relative overflow-hidden rounded-2xl shadow-lg border border-white/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${gradient || 'bg-white dark:bg-slate-800'}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Animated background glow */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient ? 'bg-white/10' : ''}`}></div>
    
    <div className="relative flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${gradient ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
          {title}
        </p>
        <p className={`text-3xl font-bold mt-2 ${gradient ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {value}
        </p>
        {subtext && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${gradient ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
            <Activity className="w-3 h-3" />
            {subtext}
          </p>
        )}
      </div>
      <div className={`p-4 rounded-2xl ${gradient ? 'bg-white/20 backdrop-blur-sm' : color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
        <Icon className={`w-7 h-7 ${gradient ? 'text-white' : 'text-white'}`} />
      </div>
    </div>
    
    {/* Hover shine effect */}
    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
  </div>
);

const AlertCard = ({ title, items, icon: Icon, color, delay = 0 }) => (
  <div 
    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-xl"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2 rounded-xl ${color.replace('text-', 'bg-').replace('500', '100')} dark:${color.replace('text-', 'bg-').replace('500', '900/30')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {items.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="p-3 rounded-full bg-gray-100 dark:bg-slate-700 mb-3">
          <Sparkles className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">All clear!</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No items to display</p>
      </div>
    ) : (
      <ul className="space-y-3">
        {items.slice(0, 5).map((item, index) => (
          <li 
            key={index} 
            className="flex items-center justify-between text-sm p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group cursor-pointer"
          >
            <span className="text-gray-700 dark:text-gray-200 font-medium truncate flex-1">
              {item.title}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2 flex items-center gap-1 group-hover:text-purple-500 transition-colors">
              {item.subtitle}
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default function Dashboard() {
  const { user, isMasterAdmin } = useAuth();

  const { data: societies = [] } = useQuery({
    queryKey: ["societies"],
    queryFn: () => societyApi.getAll().then((res) => res.data),
    enabled: isMasterAdmin(),
  });

  const { data: flats = [] } = useQuery({
    queryKey: ["flats"],
    queryFn: () =>
      flatApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () =>
      tenantApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () =>
      vehicleApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () =>
      contractApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () =>
      ticketApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
  });

  // Open tickets are those not yet closed or resolved
  const openTickets = allTickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  );

  // Pending tickets for the alerts section (only OPEN status)
  const pendingTickets = allTickets.filter((t) => t.status === "OPEN");

  const { data: pendingBills = [] } = useQuery({
    queryKey: ["bills", "pending"],
    queryFn: () =>
      maintenanceBillApi
        .getPending()
        .then((res) => res.data)
        .catch(() => []),
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints"],
    queryFn: () =>
      complaintApi
        .getAll(user?.id)
        .then((res) => res.data)
        .catch(() => []),
  });

  // Filter expiring contracts (within 30 days)
  const expiringContracts = contracts.filter((c) => {
    if (!c.endDate) return false;
    const endDate = new Date(c.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate - today) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  // Filter expiring tenant agreements (within 30 days)
  const expiringTenants = tenants.filter((t) => {
    if (!t.agreementEndDate || !t.isActive) return false;
    const endDate = new Date(t.agreementEndDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate - today) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  // Calculate bill statistics
  const totalBillAmount = pendingBills.reduce(
    (sum, b) => sum + (b.amount || 0),
    0,
  );
  const paidBills = pendingBills.filter((b) => b.status === "PAID");
  const pendingBillsCount = pendingBills.filter((b) => b.status === "PENDING");
  const overdueBills = pendingBills.filter((b) => {
    if (b.status !== "PENDING" || !b.dueDate) return false;
    return new Date(b.dueDate) < new Date();
  });

  // Complaint statistics
  const pendingComplaints = complaints.filter(
    (c) => c.status === "PENDING" || c.status === "IN_PROGRESS",
  );

  // MTD/YTD Report data
  const { data: dashboardReport } = useQuery({
    queryKey: ["dashboardReport", user?.societyId],
    queryFn: () =>
      user?.societyId
        ? reportApi.getDashboard(user.societyId).then((res) => res.data)
        : null,
    enabled: !!user?.societyId,
  });

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Dashboard
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Welcome back, <span className="font-semibold text-gray-900 dark:text-white">{user?.name}</span>!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isMasterAdmin() && (
          <StatCard
            title="Total Societies"
            value={societies.length}
            icon={Building2}
            gradient="bg-gradient-to-br from-purple-500 to-purple-700"
            delay={100}
          />
        )}
        <StatCard
          title="Total Flats"
          value={flats.length}
          icon={Home}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          delay={150}
        />
        <StatCard
          title="Active Tenants"
          value={tenants.filter((t) => t.isActive).length}
          icon={UserCheck}
          gradient="bg-gradient-to-br from-teal-500 to-teal-700"
          subtext={`${expiringTenants.length} expiring soon`}
          delay={200}
        />
        <StatCard
          title="Vehicles"
          value={vehicles.length}
          icon={Car}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          delay={250}
        />
        <StatCard
          title="Pending Bills"
          value={pendingBillsCount.length}
          icon={CreditCard}
          color="bg-orange-500"
          subtext={
            overdueBills.length > 0
              ? `${overdueBills.length} overdue`
              : undefined
          }
          delay={300}
        />
        <StatCard
          title="Open Tickets"
          value={openTickets.length}
          icon={Ticket}
          color="bg-red-500"
          delay={350}
        />
        <StatCard
          title="Pending Complaints"
          value={pendingComplaints.length}
          icon={AlertTriangle}
          color="bg-amber-500"
          delay={400}
        />
        <StatCard
          title="Expiring Contracts"
          value={expiringContracts.length}
          icon={FileText}
          color="bg-yellow-500"
          subtext="Next 30 days"
          delay={450}
        />
      </div>

      {/* MTD/YTD Financial Overview */}
      {dashboardReport && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm font-medium text-emerald-100">MTD Income</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(dashboardReport.totalIncome)}
              </p>
              <p className="text-xs text-emerald-100 mt-3 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                This month
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <TrendingDown className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm font-medium text-rose-100">MTD Expense</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(dashboardReport.totalExpense)}
              </p>
              <p className="text-xs text-rose-100 mt-3 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                This month
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <BarChart3 className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm font-medium text-blue-100">YTD Income</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(dashboardReport.previousPeriodIncome)}
              </p>
              <p className="text-xs text-blue-100 mt-3 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Year to date
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <DollarSign className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm font-medium text-violet-100">Cash Balance</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(dashboardReport.cashBalance)}
              </p>
              <p className="text-xs text-violet-100 mt-3 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                All time
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <AlertCard
          title="Expiring Contracts"
          icon={AlertTriangle}
          color="text-yellow-500"
          items={expiringContracts.map((contract) => ({
            title: contract.title,
            subtitle: new Date(contract.endDate).toLocaleDateString(),
          }))}
        />
        <AlertCard
          title="Expiring Tenant Agreements"
          icon={UserCheck}
          color="text-teal-500"
          items={expiringTenants.map((tenant) => ({
            title: tenant.name,
            subtitle: new Date(tenant.agreementEndDate).toLocaleDateString(),
          }))}
        />
        <AlertCard
          title="Pending Tickets"
          icon={Clock}
          color="text-red-500"
          items={pendingTickets.map((ticket) => ({
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
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Bills Summary
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Total Bills Amount
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹{totalBillAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Paid Bills
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {paidBills.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Pending Bills
              </span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {pendingBillsCount.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Overdue Bills
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {overdueBills.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Vehicle Distribution
            </h3>
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {
                    vehicles.filter((v) => v.vehicleType === "FOUR_WHEELER")
                      .length
                  }
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Four Wheelers
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {
                    vehicles.filter((v) => v.vehicleType === "TWO_WHEELER")
                      .length
                  }
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Two Wheelers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Quick Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {paidBills.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Paid Bills
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {pendingBillsCount.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pending Bills
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {pendingTickets.filter((t) => t.status === "IN_PROGRESS").length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              In Progress
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {tenants.filter((t) => t.isActive).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Active Tenants
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {contracts.filter((c) => c.isActive).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Active Contracts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
