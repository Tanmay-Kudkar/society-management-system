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
  Store,
  Briefcase,
  Layers,
  Bell,
  Sun,
  Cloud,
  Zap
} from "lucide-react";

import axios from "axios";
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
  noticeApi,
  securityLogApi
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
    className={`relative overflow-hidden rounded-2xl shadow-lg border border-white/10 p-6 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl group wave-box animate-slide-up ${gradient || 'bg-white dark:bg-slate-800'}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Water wave background effect - only for gradient cards to simulate liquid */}
    {gradient && (
      <>
        <div className="wave-bg"></div>
        <div className="wave-bg-revert" style={{ opacity: 0.5 }}></div>
      </>
    )}
    
    {/* Animated background glow for non-gradient cards */}
    {!gradient && (
       <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${color?.replace('text-', 'bg-')}`}></div>
    )}
    
    <div className="relative z-10 flex items-center justify-between">
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
      <div className={`p-4 rounded-2xl ${gradient ? 'bg-white/20 backdrop-blur-sm shadow-inner' : color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
        <Icon className={`w-7 h-7 ${gradient ? 'text-white' : 'text-white'}`} />
      </div>
    </div>
    
    {/* Hover shine effect */}
    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
    
    {/* Decorative particles for gradient cards */}
    {gradient && (
       <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 animate-pulse-custom"></div>
    )}
  </div>
);

const AlertCard = ({ title, items, icon: Icon, color, delay = 0 }) => (
  <div 
    className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-slide-up group"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-${color.split('-')[1]}-500/10 rounded-bl-full transition-transform duration-500 group-hover:scale-110`}></div>
    
    <div className="flex items-center gap-3 mb-5 relative z-10">
      <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('500', '100')} dark:${color.replace('text-', 'bg-').replace('500', '900/30')} animate-bounce-custom`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      {items.length > 0 && (
         <span className={`ml-auto text-xs px-2 py-1 rounded-full ${color.replace('text-', 'bg-').replace('500', '100')} dark:${color.replace('text-', 'bg-').replace('500', '900/30')} ${color}`}>
           {items.length} new
         </span>
      )}
    </div>
    
    {items.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="p-4 rounded-full bg-gray-50 dark:bg-slate-700/50 mb-3 animate-pulse-custom">
          <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">All clear!</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">No items to display</p>
      </div>
    ) : (
      <ul className="space-y-3 relative z-10">
        {items.slice(0, 5).map((item, index) => (
          <li 
            key={index} 
            className="flex items-center justify-between text-sm p-3.5 rounded-xl bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all duration-300 group/item cursor-pointer hover:shadow-sm"
            style={{ animationDelay: `${delay + (index * 100)}ms` }}
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
  const { user, isMasterAdmin, isCommitteeLevel } = useAuth();

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

  // MTD/YTD Report data - Only for admin/committee level users
  const { data: dashboardReport } = useQuery({
    queryKey: ["dashboardReport", user?.societyId],
    queryFn: () =>
      user?.societyId && isCommitteeLevel()
        ? reportApi.getDashboard(user.societyId).then((res) => res.data)
        : null,
    enabled: !!user?.societyId && isCommitteeLevel(),
  });

  const { data: notices = [] } = useQuery({
    queryKey: ["notices", user?.societyId],
    queryFn: () => user?.societyId ? noticeApi.getActive(user.societyId).then((res) => res.data) : [],
    enabled: !!user?.societyId,
  });

  const { data: securityLogs = [] } = useQuery({
    queryKey: ["securityLogs", user?.societyId],
    queryFn: () => user?.societyId ? securityLogApi.getRecent(user.societyId).then((res) => res.data) : [],
    enabled: !!user?.societyId,
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: weather } = useQuery({
    queryKey: ["weather"],
    queryFn: async () => {
      // Default to Mumbai coordinates or dynamic based on society
      const lat = 19.0760;
      const long = 72.8777;
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,weather_code,is_day&forecast_days=1`);
      return res.data;
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  const getWeatherIcon = (code) => {
    // Simple mapping for WMO Weather interpretation codes (WW)
    if (code === 0) return <Sun className="w-10 h-10 text-white animate-sun" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-10 h-10 text-white animate-pulse" />;
    if (code >= 51) return <Cloud className="w-10 h-10 text-blue-200" />;
    return <Sun className="w-10 h-10 text-white animate-sun" />; 
  };
  
  const getWeatherDesc = (code) => {
    if (code === 0) return "Clear Sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 51 && code <= 67) return "Rainy";
    if (code >= 95) return "Thunderstorm";
    return "Sunny";
  };

  return (
    <div className="animate-fadeIn pb-10">
      {/* Dynamic Header */}
      <div className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 text-white animate-slide-down">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-purple-600/30 blur-[100px] animate-pulse-custom"></div>
          <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full bg-blue-600/30 blur-[100px] animate-pulse-custom" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-green-300 shadow-[0_0_15px_rgba(74,222,128,0.3)] animate-pulse-custom">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-ping"></span>
                  System Online
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300">
                  v2.5.0
                </span>
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-200 drop-shadow-lg flex items-center gap-3">
                Hello, {user?.name.split(' ')[0]}
                <span className="animate-bounce-custom inline-block">👋</span>
              </h1>
              <p className="text-blue-200 mt-2 flex items-center gap-2 font-medium">
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Here's what's happening in your society today.
              </p>
            </div>

            {/* Weather & Date Widget */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:block text-right">
                <p className="text-3xl font-bold">{weather?.current?.temperature_2m ? `${Math.round(weather.current.temperature_2m)}°C` : '...'}</p>
                <div className="flex items-center justify-end gap-1 text-sm text-blue-200">
                  <span className="font-medium">{weather?.current?.weather_code !== undefined ? getWeatherDesc(weather.current.weather_code) : 'Loading...'}</span>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/30 animate-float">
                {weather?.current?.weather_code !== undefined ? getWeatherIcon(weather.current.weather_code) : <Sun className="w-10 h-10 text-white animate-sun" />}
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[160px]">
                 <div className="flex items-center gap-3 mb-1">
                   <Clock className="w-4 h-4 text-blue-300" />
                   <span className="text-sm font-medium text-blue-100">
                     {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                   </span>
                 </div>
                 <p className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                   {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                 </p>
                 <p className="text-xs text-blue-300 mt-1">
                   {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Ticker */}
        <div className="bg-black/20 backdrop-blur-sm border-t border-white/5 py-2">
          <div className="flex items-center max-w-full overflow-hidden">
            <div className="flex-shrink-0 px-4 flex items-center gap-2 border-r border-white/10 z-20 bg-transparent pr-6">
              <Bell className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Updates</span>
            </div>
            
            <div className="flex-1 overflow-hidden relative h-5 mask-image-linear-gradient-to-r">
               <div className="animate-ticker flex items-center gap-8 whitespace-nowrap absolute">
                  {(notices.length > 0 ? notices.map(n => n.content || n.title) : [
                    "🚀 Welcome to Society Management System",
                    "📢 No new notices at the moment",
                    "👮 Security systems active"
                  ]).map((msg, i) => (
                    <span key={i} className="text-sm text-blue-100 font-medium inline-flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                      {msg}
                    </span>
                  ))}
                   {/* Duplicate for seamless loop */}
                   {(notices.length > 0 ? notices.map(n => n.content || n.title) : [
                     "🚀 Welcome to Society Management System",
                     "📢 No new notices at the moment",
                     "👮 Security systems active"
                   ]).map((msg, i) => (
                    <span key={`dup-${i}`} className="text-sm text-blue-100 font-medium inline-flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                      {msg}
                    </span>
                  ))}
               </div>
            </div>
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
          value={flats.filter(f => !f.unitType || f.unitType === 'FLAT').length}
          icon={Home}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          subtext={`${flats.filter(f => (!f.unitType || f.unitType === 'FLAT') && f.ownerName).length} occupied`}
          delay={150}
        />
        <StatCard
          title="Total Shops"
          value={flats.filter(f => f.unitType === 'SHOP').length}
          icon={Store}
          gradient="bg-gradient-to-br from-green-500 to-green-700"
          subtext={`${flats.filter(f => f.unitType === 'SHOP' && f.ownerName).length} occupied`}
          delay={175}
        />
        <StatCard
          title="Total Offices"
          value={flats.filter(f => f.unitType === 'OFFICE').length}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          subtext={`${flats.filter(f => f.unitType === 'OFFICE' && f.ownerName).length} occupied`}
          delay={190}
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

      {/* MTD/YTD Financial Overview - Only visible to Committee Level and above */}
      {dashboardReport && isCommitteeLevel() && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '500ms' }}>
              <div className="wave-bg"></div>
              <div className="wave-bg-revert" style={{ opacity: 0.3 }}></div>
              <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-emerald-100">MTD Income</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(dashboardReport.totalIncome)}
                </p>
                <p className="text-xs text-emerald-100 mt-2 flex items-center gap-1 bg-white/10 w-fit px-2 py-1 rounded-lg">
                  <Activity className="w-3 h-3" />
                  This month
                </p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '600ms' }}>
              <div className="wave-bg"></div>
              <div className="wave-bg-revert" style={{ opacity: 0.3 }}></div>
               <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-rose-100">MTD Expense</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(dashboardReport.totalExpense)}
                </p>
                <p className="text-xs text-rose-100 mt-2 flex items-center gap-1 bg-white/10 w-fit px-2 py-1 rounded-lg">
                  <Activity className="w-3 h-3" />
                  This month
                </p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '700ms' }}>
              <div className="wave-bg"></div>
              <div className="wave-bg-revert" style={{ opacity: 0.3 }}></div>
              <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-blue-100">YTD Income</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(dashboardReport.previousPeriodIncome)}
                </p>
                <p className="text-xs text-blue-100 mt-2 flex items-center gap-1 bg-white/10 w-fit px-2 py-1 rounded-lg">
                  <Activity className="w-3 h-3" />
                  Year to date
                </p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '800ms' }}>
              <div className="wave-bg"></div>
              <div className="wave-bg-revert" style={{ opacity: 0.3 }}></div>
              <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-violet-100">Cash Balance</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(dashboardReport.cashBalance)}
                </p>
                <p className="text-xs text-violet-100 mt-2 flex items-center gap-1 bg-white/10 w-fit px-2 py-1 rounded-lg">
                  <Sparkles className="w-3 h-3" />
                  All time
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Cards with staggered animation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <AlertCard
          title="Expiring Contracts"
          icon={AlertTriangle}
          color="text-yellow-500"
          delay={900}
          items={expiringContracts.map((contract) => ({
            title: contract.title,
            subtitle: new Date(contract.endDate).toLocaleDateString(),
          }))}
        />
        <AlertCard
          title="Expiring Tenant Agreements"
          icon={UserCheck}
          color="text-teal-500"
          delay={1000}
          items={expiringTenants.map((tenant) => ({
            title: tenant.name,
            subtitle: new Date(tenant.agreementEndDate).toLocaleDateString(),
          }))}
        />
        <AlertCard
          title="Pending Tickets"
          icon={Clock}
          color="text-red-500"
          delay={1100}
          items={pendingTickets.map((ticket) => ({
            title: ticket.title,
            subtitle: ticket.type,
          }))}
        />
      </div>

      {/* Financial Overview & Vehicle Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bills Summary Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6 animate-slide-up hover:shadow-2xl transition-all duration-300 group" style={{ animationDelay: '1200ms' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/10 transition-colors duration-500"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
              <DollarSign className="w-6 h-6 animate-pulse-custom" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Bills Summary</h3>
              <p className="text-xs text-gray-500">Overview of all transactions</p>
            </div>
          </div>
          
          <div className="space-y-5 relative z-10">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl hover:scale-[1.02] transition-transform">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Total Bills Amount</span>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                ₹{totalBillAmount.toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30 hover:-translate-y-1 transition-transform">
                <span className="block text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{paidBills.length}</span>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Paid Bills</span>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30 hover:-translate-y-1 transition-transform">
                <span className="block text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{pendingBillsCount.length}</span>
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Pending</span>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 hover:-translate-y-1 transition-transform">
                <span className="block text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{overdueBills.length}</span>
                <span className="text-xs font-medium text-red-700 dark:text-red-300">Overdue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Stats Card */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6 animate-slide-up hover:shadow-2xl transition-all duration-300 group" style={{ animationDelay: '1300ms' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-500"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <Car className="w-6 h-6 animate-bounce-custom" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Vehicle Distribution</h3>
              <p className="text-xs text-gray-500">Parking lot analytics</p>
            </div>
          </div>

          <div className="flex items-center justify-around py-4 relative z-10">
            <div className="text-center group/vehicle cursor-pointer">
              <div className="relative w-28 h-28 mx-auto mb-3">
                 <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/30 animate-spin" style={{ animationDuration: '3s' }}></div>
                 <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin" style={{ animationDuration: '2s' }}></div>
                 <div className="absolute inset-2 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover/vehicle:scale-110 transition-transform duration-300">
                   <div className="text-center">
                     <span className="block text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {vehicles.filter((v) => v.vehicleType === "FOUR_WHEELER").length}
                     </span>
                     <Car className="w-4 h-4 mx-auto text-blue-400 mt-1" />
                   </div>
                 </div>
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Four Wheelers</p>
            </div>
            
            <div className="text-center group/vehicle cursor-pointer">
              <div className="relative w-28 h-28 mx-auto mb-3">
                 <div className="absolute inset-0 rounded-full border-4 border-green-100 dark:border-green-900/30 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
                 <div className="absolute inset-0 rounded-full border-t-4 border-green-500 animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}></div>
                 <div className="absolute inset-2 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center group-hover/vehicle:scale-110 transition-transform duration-300">
                   <div className="text-center">
                     <span className="block text-3xl font-bold text-green-600 dark:text-green-400">
                      {vehicles.filter((v) => v.vehicleType === "TWO_WHEELER").length}
                     </span>
                     <Activity className="w-4 h-4 mx-auto text-green-400 mt-1" />
                   </div>
                 </div>
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Two Wheelers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Live Security Logs */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6 animate-slide-up group hover:shadow-2xl transition-all duration-300" style={{ animationDelay: '1400ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Live Security Feed</h3>
                <p className="text-xs text-gray-500">Real-time gate and system activity</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/30">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              Monitoring Active
            </span>
          </div>
          
          <div className="space-y-4">
            {(securityLogs.length > 0 ? securityLogs : [
              { createdAt: new Date().toISOString(), event: 'System Initialized', type: 'SYSTEM', status: 'Info' }
            ]).map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-600 group/log">
                <div className="w-20 text-xs text-gray-400 font-mono text-right">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600 group-hover/log:bg-blue-500 transition-colors"></div>
                <div className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{log.event}</div>
                <span className={`text-xs px-2 py-1 rounded-md font-medium border ${
                  (log.type === 'ALERT' || log.type === 'alert') ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30' :
                  (log.type === 'SECURITY' || log.type === 'security') ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30' :
                  (log.type === 'MAINTENANCE' || log.type === 'maintenance') ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-900/30' :
                  'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:border-slate-600'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:to-slate-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-slate-700 p-8 mb-8 animate-slide-up text-gray-900 dark:text-white relative overflow-hidden transition-all duration-300" style={{ animationDelay: '1600ms' }}>
        <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(0deg,transparent,black)] opacity-50 dark:opacity-40"></div>
        <div className="relative z-10">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            Quick Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Paid Bills', value: paidBills.length, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20' },
              { label: 'Pending Bills', value: pendingBillsCount.length, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20' },
              { label: 'In Progress', value: pendingTickets.filter((t) => t.status === "IN_PROGRESS").length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
              { label: 'Active Tenants', value: tenants.filter((t) => t.isActive).length, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20' },
              { label: 'Active Contracts', value: contracts.filter((c) => c.isActive).length, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className={`text-center p-4 rounded-xl ${stat.bg} backdrop-blur-sm border hover:border-gray-300 dark:hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-default hover:shadow-md`}
                style={{ animationDelay: `${1500 + (idx * 100)}ms` }}
              >
                <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
