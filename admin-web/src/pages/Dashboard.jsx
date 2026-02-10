import { useState, useEffect } from "react";
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
} from "../../../api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const StatCard = ({ title, value, icon: Icon, color, subtext, gradient, delay = 0 }) => (
  <div 
    className={`relative overflow-hidden rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl group wave-box animate-slide-up ${gradient || 'bg-white dark:bg-slate-800'}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Ultra-visible Liquid Flow Effect - Synced across all cards */}
    {(gradient || color) && (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Unified durations and start times for perfect sync */}
        <div className="wave-bg opacity-25" style={{ background: 'rgba(255, 255, 255, 0.4)', top: '-80%', left: '-30%', animationDuration: '12s' }}></div>
        <div className="wave-bg-revert opacity-20" style={{ background: 'rgba(255, 255, 255, 0.3)', top: '-90%', animationDuration: '15s' }}></div>
        <div className="wave-bg opacity-15" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)', top: '-110%', left: '-40%', animationDuration: '25s' }}></div>
      </div>
    )}
    
    {/* Animated background glow for non-gradient cards */}
    {!gradient && (
       <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 z-0 ${color?.replace('text-', 'bg-')}`}></div>
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
    className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 animate-slide-up group"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Colored top accent bar */}
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-${color.split('-')[1]}-400 to-${color.split('-')[1]}-600 group-hover:h-1.5 transition-all duration-300`}></div>
    
    {/* Animated gradient border overlay */}
    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
      background: `linear-gradient(135deg, ${color.replace('text-', '').replace('-500', '')}15, transparent)`
    }}></div>
    
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-${color.split('-')[1]}-500/10 rounded-bl-full transition-transform duration-500 group-hover:scale-150 blur-2xl`}></div>
    
    <div className="flex items-center gap-3 mb-5 relative z-10">
      <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('500', '100')} dark:${color.replace('text-', 'bg-').replace('500', '900/30')} animate-float shadow-lg group-hover:shadow-xl transition-shadow`}>
        <Icon className={`w-5 h-5 ${color} group-hover:scale-105 transition-transform`} />
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
            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2 flex items-center gap-1 group-hover:text-[var(--accent-primary)] transition-colors">
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
  const { user, isCommitteeLevel, isMember } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isPlatformLevel = user?.role === 'PLATFORM_OWNER' || user?.role === 'ORGANIZATION_OWNER'
  
  // Determine if user is a regular member (MEMBER or TENANT)
  const isMemberOrTenant = user?.role === 'MEMBER' || user?.role === 'TENANT';

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: societies = [] } = useQuery({
    queryKey: ["societies"],
    queryFn: () => societyApi.getAll().then((res) => res.data),
    enabled: isPlatformLevel,
  });

  const { data: flats = [] } = useQuery({
    queryKey: ["flats", user?.id],
    queryFn: () =>
      flatApi
        .getAll(user?.id)
        .then((res) => res.data)
        .catch(() => []),
    enabled: !isMemberOrTenant && !!user?.id,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () =>
      tenantApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: !isMemberOrTenant,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () =>
      vehicleApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: !isMemberOrTenant,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () =>
      contractApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: !isMemberOrTenant,
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
    queryFn: () => user?.societyId ? noticeApi.getBySociety(user.societyId).then((res) => res.data).catch(() => []) : [],
    enabled: !!user?.societyId,
  });

  const { data: securityLogs = [] } = useQuery({
    queryKey: ["securityLogs", user?.societyId],
    queryFn: () => user?.societyId ? securityLogApi.getRecent(user.societyId).then((res) => res.data).catch(() => []) : [],
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
      <div 
        className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl text-white animate-slide-down wave-box border border-white/10"
        style={{ 
          background: `linear-gradient(135deg, 
            color-mix(in srgb, var(--accent-primary) 80%, #000) 0%, 
            color-mix(in srgb, var(--accent-primary) 60%, #1e293b) 50%, 
            color-mix(in srgb, var(--accent-secondary) 70%, #0f172a) 100%)` 
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 z-0 mix-blend-overlay"></div>
          
          {/* Permanent Water Flow Animation - More Vibrant */}
          <div className="wave-bg opacity-40 bg-white/10" style={{ animationDuration: '14s' }}></div>
          <div className="wave-bg-revert opacity-30 bg-white/5" style={{ animationDuration: '22s' }}></div>
          <div className="wave-bg opacity-20" style={{ 
            background: `linear-gradient(to right, var(--accent-primary), transparent)`,
            top: '-110%', 
            left: '-40%', 
            animationDuration: '30s' 
          }}></div>
          
          {/* Glowing Accents */}
          <div 
            className="absolute top-[-30%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-60 animate-pulse-custom"
            style={{ background: `var(--accent-primary)` }}
          ></div>
          <div 
            className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 animate-pulse-custom" 
            style={{ animationDelay: '1.5s', background: `var(--accent-secondary)` }}
          ></div>
        </div>

        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-pulse-custom">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-ping"></span>
                  SYSTEM ONLINE
                </span>
                {!isMemberOrTenant && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-black/20 backdrop-blur-sm border border-white/10 text-white/90">
                    v2.5.0
                  </span>
                )}
                {isMemberOrTenant && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-sm border border-white/10 text-white/90">
                    {user?.role}
                  </span>
                )}
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex items-center gap-3 tracking-tight">
                Hello, {user?.name?.split(' ')[0] || 'User'}
                <span className="animate-bounce-custom inline-block">👋</span>
              </h1>
              <p className="text-white/80 mt-2 flex items-center gap-2 font-semibold text-lg drop-shadow-sm">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                {isMemberOrTenant 
                  ? "Here's your dashboard overview."
                  : "Here's what's happening in your society today."}
              </p>
            </div>

            {/* Weather & Date Widget */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:block text-right">
                <p className="text-3xl font-black text-white drop-shadow-md">{weather?.current?.temperature_2m ? `${Math.round(weather.current.temperature_2m)}°C` : '...'}</p>
                <div className="flex items-center justify-end gap-1 text-sm text-white/90 font-bold uppercase tracking-wide">
                  <span>{weather?.current?.weather_code !== undefined ? getWeatherDesc(weather.current.weather_code) : 'Loading...'}</span>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-300 via-orange-400 to-orange-600 shadow-[0_10px_30px_rgba(249,115,22,0.4)] animate-float border border-white/20">
                {weather?.current?.weather_code !== undefined ? getWeatherIcon(weather.current.weather_code) : <Sun className="w-12 h-12 text-white animate-sun" />}
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 min-w-[180px] shadow-xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-1">
                     <Clock className="w-4 h-4 text-white" />
                     <span className="text-sm font-bold text-white uppercase tracking-wider">
                       {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                     </span>
                   </div>
                   <p className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                     {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </p>
                   <p className="text-xs font-bold text-white/70 mt-1 uppercase tracking-widest">
                     {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                   </p>
                 </div>
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

      {/* Member/Tenant Dashboard - Simplified View */}
      {isMemberOrTenant && (
        <div className="space-y-6 mb-8">
          {/* Member Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="My Pending Bills"
              value={pendingBillsCount.length}
              icon={CreditCard}
              gradient="bg-gradient-to-br from-orange-500 to-orange-700"
              subtext={overdueBills.length > 0 ? `${overdueBills.length} overdue` : 'All up to date'}
              delay={100}
            />
            <StatCard
              title="My Tickets"
              value={allTickets.filter(t => t.raisedById === user?.id).length}
              icon={Ticket}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              subtext={`${allTickets.filter(t => t.raisedById === user?.id && t.status === 'OPEN').length} open`}
              delay={150}
            />
            <StatCard
              title="My Complaints"
              value={complaints.filter(c => c.raisedById === user?.id).length}
              icon={AlertTriangle}
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
              subtext={`${complaints.filter(c => c.raisedById === user?.id && c.status === 'PENDING').length} pending`}
              delay={200}
            />
          </div>

          {/* Recent Notices for Members */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={{ 
                  background: `color-mix(in srgb, var(--accent-primary) 15%, transparent)`,
                  color: `var(--accent-primary)`
                }}
              >
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Recent Notices</h3>
            </div>
            {notices.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">No recent notices</p>
            ) : (
              <ul className="space-y-3">
                {notices.slice(0, 5).map((notice, idx) => (
                  <li key={idx} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white">{notice.title || notice.content}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {notice.createdAt && new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* My Pending Bills List */}
          {pendingBillsCount.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Pending Bills</h3>
              </div>
              <ul className="space-y-3">
                {pendingBillsCount.slice(0, 5).map((bill, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{bill.billMonth || 'Maintenance'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Due: {bill.dueDate && new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-orange-600 dark:text-orange-400">₹{bill.amount?.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Admin/Committee Dashboard - Full View */}
      {!isMemberOrTenant && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isPlatformLevel && (
              <StatCard
                title="Total Societies"
                value={societies.length}
                icon={Building2}
                gradient="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800"
                delay={100}
              />
            )}
            <StatCard
              title="Total Flats"
              value={flats.filter(f => !f.unitType || f.unitType === 'FLAT').length}
              icon={Home}
              gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
              subtext={`${flats.filter(f => (!f.unitType || f.unitType === 'FLAT') && f.ownerName).length} occupied`}
              delay={150}
            />
            <StatCard
              title="Total Shops"
              value={flats.filter(f => f.unitType === 'SHOP').length}
              icon={Store}
              gradient="bg-gradient-to-br from-green-500 via-green-600 to-green-700"
              subtext={`${flats.filter(f => f.unitType === 'SHOP' && f.ownerName).length} occupied`}
              delay={175}
            />
            <StatCard
              title="Total Offices"
              value={flats.filter(f => f.unitType === 'OFFICE').length}
              icon={Briefcase}
              gradient="bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700"
              subtext={`${flats.filter(f => f.unitType === 'OFFICE' && f.ownerName).length} occupied`}
              delay={190}
            />
            <StatCard
              title="Active Tenants"
              value={tenants.filter((t) => t.isActive).length}
              icon={UserCheck}
              gradient="bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700"
              subtext={`${expiringTenants.length} expiring soon`}
              delay={200}
            />
            <StatCard
              title="Vehicles"
              value={vehicles.length}
              icon={Car}
              gradient="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700"
              delay={250}
            />
            <StatCard
              title="Pending Bills"
              value={pendingBillsCount.length}
              icon={CreditCard}
              gradient="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"
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
              gradient="bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700"
              delay={350}
            />
        <StatCard          title="Overdue Tickets"
          value={allTickets.filter(t => t.isOverdue).length}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-red-600 via-red-700 to-red-800"
          subtext={allTickets.filter(t => t.escalationLevel === 2).length > 0 ? `${allTickets.filter(t => t.escalationLevel === 2).length} critical` : undefined}
          delay={375}
        />
        <StatCard
          title="Overdue Bills"
          value={overdueBills.length}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700"
          subtext={overdueBills.length > 0 ? `₹${overdueBills.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}` : 'All clear'}
          delay={390}
        />
        <StatCard          title="Pending Complaints"
          value={pendingComplaints.length}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700"
          delay={400}
        />
        <StatCard
          title="Expiring Contracts"
          value={expiringContracts.length}
          icon={FileText}
          gradient="bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700"
          subtext="Next 30 days"
          delay={450}
        />
      </div>

      {/* MTD/YTD Financial Overview - Only visible to Committee Level and above */}
      {dashboardReport && isCommitteeLevel() && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '500ms' }}>
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="wave-bg opacity-25" style={{ background: 'rgba(255, 255, 255, 0.4)', top: '-80%', left: '-30%', animationDuration: '12s' }}></div>
                <div className="wave-bg-revert opacity-20" style={{ background: 'rgba(255, 255, 255, 0.3)', top: '-90%', animationDuration: '15s' }}></div>
                <div className="wave-bg opacity-15" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)', top: '-110%', left: '-40%', animationDuration: '25s' }}></div>
              </div>
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
            
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '600ms' }}>
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="wave-bg opacity-25" style={{ background: 'rgba(255, 255, 255, 0.4)', top: '-80%', left: '-30%', animationDuration: '12s' }}></div>
                <div className="wave-bg-revert opacity-20" style={{ background: 'rgba(255, 255, 255, 0.3)', top: '-90%', animationDuration: '15s' }}></div>
                <div className="wave-bg opacity-15" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)', top: '-110%', left: '-40%', animationDuration: '25s' }}></div>
              </div>
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
            
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '700ms' }}>
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="wave-bg opacity-25" style={{ background: 'rgba(255, 255, 255, 0.4)', top: '-80%', left: '-30%', animationDuration: '12s' }}></div>
                <div className="wave-bg-revert opacity-20" style={{ background: 'rgba(255, 255, 255, 0.3)', top: '-90%', animationDuration: '15s' }}></div>
                <div className="wave-bg opacity-15" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)', top: '-110%', left: '-40%', animationDuration: '25s' }}></div>
              </div>
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
            
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 rounded-2xl shadow-lg p-6 text-white group hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 wave-box animate-slide-up" style={{ animationDelay: '800ms' }}>
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="wave-bg opacity-25" style={{ background: 'rgba(255, 255, 255, 0.4)', top: '-80%', left: '-30%', animationDuration: '12s' }}></div>
                <div className="wave-bg-revert opacity-20" style={{ background: 'rgba(255, 255, 255, 0.3)', top: '-90%', animationDuration: '15s' }}></div>
                <div className="wave-bg opacity-15" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)', top: '-110%', left: '-40%', animationDuration: '25s' }}></div>
              </div>
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
        <div className="relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 animate-slide-up hover:shadow-2xl transition-all duration-500 group" style={{ animationDelay: '1200ms' }}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 group-hover:h-1.5 transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-500/20 transition-all duration-500 animate-pulse-custom"></div>
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/20 rounded-xl text-green-600 dark:text-green-400 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
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
        <div className="relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 animate-slide-up hover:shadow-2xl transition-all duration-500 group" style={{ animationDelay: '1300ms' }}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 group-hover:h-1.5 transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-500 animate-pulse-custom"></div>

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/20 rounded-xl text-blue-600 dark:text-blue-400 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <Car className="w-6 h-6 animate-bounce-custom" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Vehicle Distribution</h3>
              <p className="text-xs text-gray-500">Parking lot analytics</p>
            </div>
          </div>

          <div className="flex items-center justify-around py-4 relative z-10">
            <div className="text-center group/vehicle cursor-pointer hover:-translate-y-1 transition-transform duration-300">
              <div className="relative w-28 h-28 mx-auto mb-3">
                 <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-500/20 animate-pulse-custom"></div>
                 <div className="absolute inset-0 rounded-full border-4 border-blue-300 dark:border-blue-600 opacity-30 group-hover/vehicle:opacity-50 transition-opacity duration-500"></div>
                 <div className="absolute -inset-1 rounded-full bg-blue-500/30 blur-xl animate-pulse-custom" style={{ animationDuration: '2s' }}></div>
                 <div className="absolute inset-2 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/30 rounded-full flex items-center justify-center group-hover/vehicle:scale-110 transition-all duration-500 shadow-xl shadow-blue-500/30">
                   <div className="text-center relative z-10">
                     <span className="block text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {vehicles.filter((v) => v.vehicleType === "FOUR_WHEELER").length}
                     </span>
                     <Car className="w-4 h-4 mx-auto text-blue-500 dark:text-blue-400 mt-1 group-hover/vehicle:scale-125 transition-transform" />
                   </div>
                 </div>
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">Four Wheelers</p>
            </div>
            
            <div className="text-center group/vehicle cursor-pointer hover:-translate-y-1 transition-transform duration-300">
              <div className="relative w-28 h-28 mx-auto mb-3">
                 <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 animate-pulse-custom" style={{ animationDelay: '0.5s' }}></div>
                 <div className="absolute inset-0 rounded-full border-4 border-green-300 dark:border-green-600 opacity-30 group-hover/vehicle:opacity-50 transition-opacity duration-500"></div>
                 <div className="absolute -inset-1 rounded-full bg-green-500/30 blur-xl animate-pulse-custom" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                 <div className="absolute inset-2 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 rounded-full flex items-center justify-center group-hover/vehicle:scale-110 transition-all duration-500 shadow-xl shadow-green-500/30">
                   <div className="text-center relative z-10">
                     <span className="block text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      {vehicles.filter((v) => v.vehicleType === "TWO_WHEELER").length}
                     </span>
                     <Activity className="w-4 h-4 mx-auto text-green-500 dark:text-green-400 mt-1 group-hover/vehicle:scale-125 transition-transform" />
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
        <div className="lg:col-span-3 relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 animate-slide-up group hover:shadow-2xl transition-all duration-500" style={{ animationDelay: '1400ms' }}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-600 rounded-t-2xl group-hover:h-1.5 transition-all duration-300 z-10"></div>
          
          {/* Animated background lines */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none z-0">
            <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-orange-500 to-transparent"></div>
          </div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-900/20 rounded-lg text-red-600 dark:text-red-400 shadow-lg animate-pulse-custom">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Live Security Feed</h3>
                <p className="text-xs text-gray-500">Real-time gate and system activity</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs font-bold text-green-600 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2 rounded-full border-2 border-green-400 dark:border-green-600 shadow-lg shadow-green-500/30 animate-pulse-custom">
              <span className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping absolute"></span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </span>
              MONITORING ACTIVE
            </span>
          </div>
          
          <div className="space-y-4 relative z-10">
            {(securityLogs.length > 0 ? securityLogs : [
              { createdAt: new Date().toISOString(), event: 'System Initialized', type: 'SYSTEM', status: 'Info' }
            ]).map((log, i) => (
              <div key={i} className="relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-slate-700/30 dark:to-transparent hover:from-gray-100 dark:hover:from-slate-700/60 transition-all duration-300 border-l-4 border-transparent hover:border-l-blue-500 group/log hover:shadow-md">
                {/* Timeline dot with pulse */}
                <div className="relative">
                  <div className="w-20 text-xs text-gray-500 dark:text-gray-400 font-mono text-right font-bold">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-4 h-4 rounded-full bg-blue-500 opacity-25 animate-ping group-hover/log:opacity-50"></div>
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50 group-hover/log:scale-125 transition-transform"></div>
                </div>
                <div className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover/log:text-gray-900 dark:group-hover/log:text-white transition-colors">{log.event}</div>
                <span className={`text-xs px-3 py-1.5 rounded-lg font-bold border-2 shadow-sm transition-all duration-300 group-hover/log:scale-105 ${
                  (log.type === 'ALERT' || log.type === 'alert') ? 'bg-gradient-to-br from-red-50 to-rose-100 text-red-700 border-red-300 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-700' :
                  (log.type === 'SECURITY' || log.type === 'security') ? 'bg-gradient-to-br from-blue-50 to-sky-100 text-blue-700 border-blue-300 dark:from-blue-900/20 dark:to-sky-900/20 dark:border-blue-700' :
                  (log.type === 'MAINTENANCE' || log.type === 'maintenance') ? 'bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 border-green-300 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700' :
                  'bg-gradient-to-br from-gray-50 to-slate-100 text-gray-700 border-gray-300 dark:from-slate-700 dark:to-slate-800 dark:border-slate-600'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-slate-700 p-8 mb-8 animate-slide-up text-gray-900 dark:text-white relative overflow-hidden transition-all duration-500 hover:shadow-3xl" style={{ animationDelay: '1600ms' }}>
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse-custom"></div>
          <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        </div>
        
        <div className="relative z-10">
          <h3 className="font-bold text-2xl mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
            Quick Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Paid Bills', value: paidBills.length, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20' },
              { label: 'Pending Bills', value: pendingBillsCount.length, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20' },
              { label: 'In Progress', value: pendingTickets.filter((t) => t.status === "IN_PROGRESS").length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
              { label: 'Active Tenants', value: tenants.filter((t) => t.isActive).length, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20' },
              { label: 'Active Contracts', value: contracts.filter((c) => c.isActive).length, color: 'text-[var(--accent-primary)]', bg: 'bg-slate-50 dark:bg-slate-800/10 border-[var(--accent-primary)]/10 dark:border-[var(--accent-primary)]/20 shadow-sm' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className={`relative text-center p-5 rounded-xl ${stat.bg} backdrop-blur-sm border-2 hover:border-gray-400 dark:hover:border-white/40 transition-all duration-500 hover:scale-105 hover:-translate-y-1 cursor-pointer hover:shadow-xl group/stat overflow-hidden`}
                style={{ 
                  animationDelay: `${1500 + (idx * 100)}ms`,
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <p className={`text-4xl font-black ${stat.color} mb-2 group-hover/stat:scale-105 transition-transform duration-300`}>{stat.value}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-widest font-bold">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
