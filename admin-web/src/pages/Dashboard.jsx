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
  ArrowUpRight,
  Sparkles,
  Activity,
  BarChart3,
  Store,
  Briefcase,
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

const StatCard = ({ title, value, icon: Icon, variant = "neutral", subtext, delay = 0 }) => {
  const isGradient = variant !== "neutral";

  return (
    <div
      className={`stat-card stat-card--${variant} ${isGradient ? "stat-card--gradient" : "stat-card--neutral"} wave-box animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isGradient && (
        <div className="stat-card__waves">
          <div className="stat-card__wave stat-card__wave--one"></div>
          <div className="stat-card__wave stat-card__wave--two"></div>
          <div className="stat-card__wave stat-card__wave--three"></div>
        </div>
      )}

      {!isGradient && <div className="stat-card__glow"></div>}

      <div className="stat-card__content">
        <div>
          <p className={`stat-card__label ${isGradient ? "stat-card__label--light" : ""}`}>
            {title}
          </p>
          <p className={`stat-card__value ${isGradient ? "stat-card__value--light" : ""}`}>
            {value}
          </p>
          {subtext && (
            <p className={`stat-card__subtext ${isGradient ? "stat-card__subtext--light" : ""}`}>
              <Activity className="stat-card__subtext-icon" />
              {subtext}
            </p>
          )}
        </div>
        <div className={`stat-card__icon ${isGradient ? "stat-card__icon--glass" : `stat-card__icon--${variant}`}`}>
          <Icon className="stat-card__icon-symbol" />
        </div>
      </div>

      <div className="stat-card__shine"></div>
      {isGradient && <div className="stat-card__particle"></div>}
    </div>
  );
};

const AlertCard = ({ title, items, icon: Icon, tone = "yellow", delay = 0 }) => (
  <div className="alert-card animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
    <div className={`alert-card__accent alert-card__accent--${tone}`}></div>
    <div className={`alert-card__glow alert-card__glow--${tone}`}></div>
    <div className={`alert-card__corner alert-card__corner--${tone}`}></div>

    <div className="alert-card__header">
      <div className={`alert-card__icon alert-card__icon--${tone}`}>
        <Icon className="alert-card__icon-symbol" />
      </div>
      <h3 className="alert-card__title">{title}</h3>
      {items.length > 0 && (
        <span className={`alert-card__count alert-card__count--${tone}`}>
          {items.length} new
        </span>
      )}
    </div>

    {items.length === 0 ? (
      <div className="alert-card__empty">
        <div className="alert-card__empty-icon">
          <Sparkles className="alert-card__empty-sparkle" />
        </div>
        <p className="alert-card__empty-title">All clear!</p>
        <p className="alert-card__empty-subtitle">No items to display</p>
      </div>
    ) : (
      <ul className="alert-card__list">
        {items.slice(0, 5).map((item, index) => (
          <li
            key={index}
            className="alert-card__item"
            style={{ animationDelay: `${delay + index * 100}ms` }}
          >
            <span className="alert-card__item-title">{item.title}</span>
            <span className="alert-card__item-subtitle">
              {item.subtitle}
              <ArrowUpRight className="alert-card__item-arrow" />
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default function Dashboard() {
  const { user, isCommitteeLevel } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isPlatformLevel = user?.role === "PLATFORM_OWNER" || user?.role === "ORGANIZATION_OWNER";
  const isMemberOrTenant = user?.role === "MEMBER" || user?.role === "TENANT";

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

  const openTickets = allTickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  );

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

  const expiringContracts = contracts.filter((c) => {
    if (!c.endDate) return false;
    const endDate = new Date(c.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate - today) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  const expiringTenants = tenants.filter((t) => {
    if (!t.agreementEndDate || !t.isActive) return false;
    const endDate = new Date(t.agreementEndDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate - today) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

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

  const pendingComplaints = complaints.filter(
    (c) => c.status === "PENDING" || c.status === "IN_PROGRESS",
  );

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
    refetchInterval: 30000,
  });

  const { data: weather } = useQuery({
    queryKey: ["weather"],
    queryFn: async () => {
      const lat = 19.0760;
      const long = 72.8777;
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,weather_code,is_day&forecast_days=1`);
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const getWeatherIcon = (code) => {
    if (code === 0) {
      return <Sun className="dashboard-weather-icon dashboard-weather-icon--sun animate-sun" />;
    }
    if (code >= 1 && code <= 3) {
      return <Cloud className="dashboard-weather-icon dashboard-weather-icon--cloud animate-pulse" />;
    }
    if (code >= 51) {
      return <Cloud className="dashboard-weather-icon dashboard-weather-icon--rain" />;
    }
    return <Sun className="dashboard-weather-icon dashboard-weather-icon--sun animate-sun" />;
  };

  const getWeatherDesc = (code) => {
    if (code === 0) return "Clear Sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 51 && code <= 67) return "Rainy";
    if (code >= 95) return "Thunderstorm";
    return "Sunny";
  };

  const getSecurityBadgeClass = (type) => {
    const normalized = String(type || "").toUpperCase();
    if (normalized === "ALERT") return "dashboard-security__badge--alert";
    if (normalized === "SECURITY") return "dashboard-security__badge--security";
    if (normalized === "MAINTENANCE") return "dashboard-security__badge--maintenance";
    return "dashboard-security__badge--info";
  };

  return (
    <div className="dashboard animate-fadeIn">
      <div
        className="dashboard-hero wave-box animate-slide-down"
        style={{
          background: `linear-gradient(135deg, 
            color-mix(in srgb, var(--accent-primary) 80%, #000) 0%, 
            color-mix(in srgb, var(--accent-primary) 60%, #1e293b) 50%, 
            color-mix(in srgb, var(--accent-secondary) 70%, #0f172a) 100%)`
        }}
      >
        <div className="dashboard-hero__bg">
          <div className="dashboard-hero__noise"></div>

          <div className="dashboard-hero__wave dashboard-hero__wave--one"></div>
          <div className="dashboard-hero__wave dashboard-hero__wave--two"></div>
          <div className="dashboard-hero__wave dashboard-hero__wave--three"></div>

          <div className="dashboard-hero__glow dashboard-hero__glow--primary"></div>
          <div className="dashboard-hero__glow dashboard-hero__glow--secondary"></div>
        </div>

        <div className="dashboard-hero__content">
          <div className="dashboard-hero__top">
            <div>
              <div className="dashboard-hero__badges">
                <span className="dashboard-hero__status">
                  <span className="dashboard-hero__status-dot"></span>
                  SYSTEM ONLINE
                </span>
                {!isMemberOrTenant && (
                  <span className="dashboard-hero__badge">
                    v2.5.0
                  </span>
                )}
                {isMemberOrTenant && (
                  <span className="dashboard-hero__badge">
                    {user?.role}
                  </span>
                )}
              </div>
              <h1 className="dashboard-hero__title">
                Hello, {user?.name?.split(" ")[0] || "User"}
                <span className="dashboard-hero__wave-emoji animate-bounce-custom">👋</span>
              </h1>
              <p className="dashboard-hero__subtitle">
                <Zap className="dashboard-hero__subtitle-icon" />
                {isMemberOrTenant
                  ? "Here's your dashboard overview."
                  : "Here's what's happening in your society today."}
              </p>
            </div>

            <div className="dashboard-hero__meta">
              <div className="dashboard-hero__weather">
                <p className="dashboard-hero__temp">
                  {weather?.current?.temperature_2m ? `${Math.round(weather.current.temperature_2m)}°C` : "..."}
                </p>
                <div className="dashboard-hero__desc">
                  <span>{weather?.current?.weather_code !== undefined ? getWeatherDesc(weather.current.weather_code) : "Loading..."}</span>
                </div>
              </div>
              <div className="dashboard-hero__icon animate-float">
                {weather?.current?.weather_code !== undefined
                  ? getWeatherIcon(weather.current.weather_code)
                  : <Sun className="dashboard-weather-icon dashboard-weather-icon--sun animate-sun" />}
              </div>

              <div className="dashboard-hero__timecard">
                <div className="dashboard-hero__time-overlay"></div>
                <div className="dashboard-hero__time-content">
                  <div className="dashboard-hero__clock">
                    <Clock className="dashboard-hero__clock-icon" />
                    <span className="dashboard-hero__clock-day">
                      {currentTime.toLocaleDateString("en-US", { weekday: "long" })}
                    </span>
                  </div>
                  <p className="dashboard-hero__time">
                    {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                  <p className="dashboard-hero__date">
                    {currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-ticker">
          <div className="dashboard-ticker__inner">
            <div className="dashboard-ticker__label">
              <Bell className="dashboard-ticker__label-icon" />
              <span className="dashboard-ticker__label-text">Updates</span>
            </div>

            <div className="dashboard-ticker__mask">
              <div className="dashboard-ticker__track animate-ticker">
                {(notices.length > 0 ? notices.map(n => n.content || n.title) : [
                  "🚀 Welcome to Society Management System",
                  "📢 No new notices at the moment",
                  "👮 Security systems active"
                ]).map((msg, i) => (
                  <span key={i} className="dashboard-ticker__item">
                    <span className="dashboard-ticker__dot"></span>
                    {msg}
                  </span>
                ))}
                {(notices.length > 0 ? notices.map(n => n.content || n.title) : [
                  "🚀 Welcome to Society Management System",
                  "📢 No new notices at the moment",
                  "👮 Security systems active"
                ]).map((msg, i) => (
                  <span key={`dup-${i}`} className="dashboard-ticker__item">
                    <span className="dashboard-ticker__dot"></span>
                    {msg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMemberOrTenant && (
        <div className="dashboard-member">
          <div className="dashboard-member__stats">
            <StatCard
              title="My Pending Bills"
              value={pendingBillsCount.length}
              icon={CreditCard}
              variant="orange"
              subtext={overdueBills.length > 0 ? `${overdueBills.length} overdue` : "All up to date"}
              delay={100}
            />
            <StatCard
              title="My Tickets"
              value={allTickets.filter(t => t.raisedById === user?.id).length}
              icon={Ticket}
              variant="blue"
              subtext={`${allTickets.filter(t => t.raisedById === user?.id && t.status === "OPEN").length} open`}
              delay={150}
            />
            <StatCard
              title="My Complaints"
              value={complaints.filter(c => c.raisedById === user?.id).length}
              icon={AlertTriangle}
              variant="amber"
              subtext={`${complaints.filter(c => c.raisedById === user?.id && c.status === "PENDING").length} pending`}
              delay={200}
            />
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div
                className="dashboard-panel__icon"
                style={{
                  background: `color-mix(in srgb, var(--accent-primary) 15%, transparent)`,
                  color: `var(--accent-primary)`
                }}
              >
                <Bell className="dashboard-panel__icon-symbol" />
              </div>
              <h3 className="dashboard-panel__title">Recent Notices</h3>
            </div>
            {notices.length === 0 ? (
              <p className="dashboard-panel__empty">No recent notices</p>
            ) : (
              <ul className="dashboard-notices__list">
                {notices.slice(0, 5).map((notice, idx) => (
                  <li key={idx} className="dashboard-notices__item">
                    <p className="dashboard-notices__title">{notice.title || notice.content}</p>
                    <p className="dashboard-notices__date">
                      {notice.createdAt && new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {pendingBillsCount.length > 0 && (
            <div className="dashboard-panel">
              <div className="dashboard-panel__header">
                <div className="dashboard-panel__icon dashboard-panel__icon--warn">
                  <CreditCard className="dashboard-panel__icon-symbol" />
                </div>
                <h3 className="dashboard-panel__title">Pending Bills</h3>
              </div>
              <ul className="dashboard-bills__list">
                {pendingBillsCount.slice(0, 5).map((bill, idx) => (
                  <li key={idx} className="dashboard-bills__item">
                    <div>
                      <p className="dashboard-bills__name">{bill.billMonth || "Maintenance"}</p>
                      <p className="dashboard-bills__due">Due: {bill.dueDate && new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className="dashboard-bills__amount">₹{bill.amount?.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!isMemberOrTenant && (
        <>
          <div className="dashboard-admin__stats">
            {isPlatformLevel && (
              <StatCard
                title="Total Societies"
                value={societies.length}
                icon={Building2}
                variant="purple"
                delay={100}
              />
            )}
            <StatCard
              title="Total Flats"
              value={flats.filter(f => !f.unitType || f.unitType === "FLAT").length}
              icon={Home}
              variant="blue"
              subtext={`${flats.filter(f => (!f.unitType || f.unitType === "FLAT") && f.ownerName).length} occupied`}
              delay={150}
            />
            <StatCard
              title="Total Shops"
              value={flats.filter(f => f.unitType === "SHOP").length}
              icon={Store}
              variant="green"
              subtext={`${flats.filter(f => f.unitType === "SHOP" && f.ownerName).length} occupied`}
              delay={175}
            />
            <StatCard
              title="Total Offices"
              value={flats.filter(f => f.unitType === "OFFICE").length}
              icon={Briefcase}
              variant="teal"
              subtext={`${flats.filter(f => f.unitType === "OFFICE" && f.ownerName).length} occupied`}
              delay={190}
            />
            <StatCard
              title="Active Tenants"
              value={tenants.filter((t) => t.isActive).length}
              icon={UserCheck}
              variant="cyan"
              subtext={`${expiringTenants.length} expiring soon`}
              delay={200}
            />
            <StatCard
              title="Vehicles"
              value={vehicles.length}
              icon={Car}
              variant="indigo"
              delay={250}
            />
            <StatCard
              title="Pending Bills"
              value={pendingBillsCount.length}
              icon={CreditCard}
              variant="orange"
              subtext={overdueBills.length > 0 ? `${overdueBills.length} overdue` : undefined}
              delay={300}
            />
            <StatCard
              title="Open Tickets"
              value={openTickets.length}
              icon={Ticket}
              variant="sky"
              delay={350}
            />
            <StatCard
              title="Overdue Tickets"
              value={allTickets.filter(t => t.isOverdue).length}
              icon={AlertTriangle}
              variant="red"
              subtext={allTickets.filter(t => t.escalationLevel === 2).length > 0 ? `${allTickets.filter(t => t.escalationLevel === 2).length} critical` : undefined}
              delay={375}
            />
            <StatCard
              title="Overdue Bills"
              value={overdueBills.length}
              icon={Clock}
              variant="amber"
              subtext={overdueBills.length > 0 ? `₹${overdueBills.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}` : "All clear"}
              delay={390}
            />
            <StatCard
              title="Pending Complaints"
              value={pendingComplaints.length}
              icon={AlertTriangle}
              variant="yellow"
              delay={400}
            />
            <StatCard
              title="Expiring Contracts"
              value={expiringContracts.length}
              icon={FileText}
              variant="rose"
              subtext="Next 30 days"
              delay={450}
            />
          </div>

          {dashboardReport && isCommitteeLevel() && (
            <div className="dashboard-financial">
              <div className="dashboard-section">
                <BarChart3 className="dashboard-section__icon" />
                <h2 className="dashboard-section__title">Financial Overview</h2>
              </div>
              <div className="dashboard-financial__grid">
                <div className="dashboard-financial-card dashboard-financial-card--emerald wave-box animate-slide-up" style={{ animationDelay: "500ms" }}>
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <TrendingUp className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">MTD Income</p>
                    <p className="dashboard-financial-card__value">
                      {formatCurrency(dashboardReport.totalIncome)}
                    </p>
                    <p className="dashboard-financial-card__hint">
                      <Activity className="dashboard-financial-card__hint-icon" />
                      This month
                    </p>
                  </div>
                </div>

                <div className="dashboard-financial-card dashboard-financial-card--rose wave-box animate-slide-up" style={{ animationDelay: "600ms" }}>
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <TrendingDown className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">MTD Expense</p>
                    <p className="dashboard-financial-card__value">
                      {formatCurrency(dashboardReport.totalExpense)}
                    </p>
                    <p className="dashboard-financial-card__hint">
                      <Activity className="dashboard-financial-card__hint-icon" />
                      This month
                    </p>
                  </div>
                </div>

                <div className="dashboard-financial-card dashboard-financial-card--blue wave-box animate-slide-up" style={{ animationDelay: "700ms" }}>
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <BarChart3 className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">YTD Income</p>
                    <p className="dashboard-financial-card__value">
                      {formatCurrency(dashboardReport.previousPeriodIncome)}
                    </p>
                    <p className="dashboard-financial-card__hint">
                      <Activity className="dashboard-financial-card__hint-icon" />
                      Year to date
                    </p>
                  </div>
                </div>

                <div className="dashboard-financial-card dashboard-financial-card--violet wave-box animate-slide-up" style={{ animationDelay: "800ms" }}>
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <DollarSign className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">Cash Balance</p>
                    <p className="dashboard-financial-card__value">
                      {formatCurrency(dashboardReport.cashBalance)}
                    </p>
                    <p className="dashboard-financial-card__hint">
                      <Sparkles className="dashboard-financial-card__hint-icon" />
                      All time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-alerts">
            <AlertCard
              title="Expiring Contracts"
              icon={AlertTriangle}
              tone="yellow"
              delay={900}
              items={expiringContracts.map((contract) => ({
                title: contract.title,
                subtitle: new Date(contract.endDate).toLocaleDateString(),
              }))}
            />
            <AlertCard
              title="Expiring Tenant Agreements"
              icon={UserCheck}
              tone="teal"
              delay={1000}
              items={expiringTenants.map((tenant) => ({
                title: tenant.name,
                subtitle: new Date(tenant.agreementEndDate).toLocaleDateString(),
              }))}
            />
            <AlertCard
              title="Pending Tickets"
              icon={Clock}
              tone="red"
              delay={1100}
              items={pendingTickets.map((ticket) => ({
                title: ticket.title,
                subtitle: ticket.type,
              }))}
            />
          </div>

          <div className="dashboard-duo">
            <div className="dashboard-bills-summary animate-slide-up" style={{ animationDelay: "1200ms" }}>
              <div className="dashboard-bills-summary__accent"></div>
              <div className="dashboard-bills-summary__glow"></div>
              <div className="dashboard-bills-summary__shine"></div>

              <div className="dashboard-bills-summary__header">
                <div className="dashboard-bills-summary__icon">
                  <DollarSign className="dashboard-bills-summary__icon-symbol animate-pulse-custom" />
                </div>
                <div>
                  <h3 className="dashboard-bills-summary__title">Bills Summary</h3>
                  <p className="dashboard-bills-summary__subtitle">Overview of all transactions</p>
                </div>
              </div>

              <div className="dashboard-bills-summary__list">
                <div className="dashboard-bills-summary__row">
                  <span className="dashboard-bills-summary__label">Total Bills Amount</span>
                  <span className="dashboard-bills-summary__value">₹{totalBillAmount.toLocaleString()}</span>
                </div>

                <div className="dashboard-bills-summary__stats">
                  <div className="dashboard-bills-summary__stat dashboard-bills-summary__stat--paid">
                    <span className="dashboard-bills-summary__stat-value">{paidBills.length}</span>
                    <span className="dashboard-bills-summary__stat-label">Paid Bills</span>
                  </div>
                  <div className="dashboard-bills-summary__stat dashboard-bills-summary__stat--pending">
                    <span className="dashboard-bills-summary__stat-value">{pendingBillsCount.length}</span>
                    <span className="dashboard-bills-summary__stat-label">Pending</span>
                  </div>
                  <div className="dashboard-bills-summary__stat dashboard-bills-summary__stat--overdue">
                    <span className="dashboard-bills-summary__stat-value">{overdueBills.length}</span>
                    <span className="dashboard-bills-summary__stat-label">Overdue</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-vehicle-card animate-slide-up" style={{ animationDelay: "1300ms" }}>
              <div className="dashboard-vehicle-card__accent"></div>
              <div className="dashboard-vehicle-card__glow"></div>
              <div className="dashboard-vehicle-card__shine"></div>

              <div className="dashboard-vehicle-card__header">
                <div className="dashboard-vehicle-card__icon">
                  <Car className="dashboard-vehicle-card__icon-symbol animate-bounce-custom" />
                </div>
                <div>
                  <h3 className="dashboard-vehicle-card__title">Vehicle Distribution</h3>
                  <p className="dashboard-vehicle-card__subtitle">Parking lot analytics</p>
                </div>
              </div>

              <div className="dashboard-vehicle-card__stats">
                <div className="dashboard-vehicle-card__stat">
                  <div className="dashboard-vehicle-card__ring dashboard-vehicle-card__ring--blue">
                    <div className="dashboard-vehicle-card__ring-inner">
                      <div className="dashboard-vehicle-card__ring-content">
                        <span className="dashboard-vehicle-card__ring-value dashboard-vehicle-card__ring-value--blue">
                          {vehicles.filter((v) => v.vehicleType === "FOUR_WHEELER").length}
                        </span>
                        <Car className="dashboard-vehicle-card__ring-icon dashboard-vehicle-card__ring-icon--blue" />
                      </div>
                    </div>
                  </div>
                  <p className="dashboard-vehicle-card__label">Four Wheelers</p>
                </div>

                <div className="dashboard-vehicle-card__stat">
                  <div className="dashboard-vehicle-card__ring dashboard-vehicle-card__ring--green">
                    <div className="dashboard-vehicle-card__ring-inner">
                      <div className="dashboard-vehicle-card__ring-content">
                        <span className="dashboard-vehicle-card__ring-value dashboard-vehicle-card__ring-value--green">
                          {vehicles.filter((v) => v.vehicleType === "TWO_WHEELER").length}
                        </span>
                        <Activity className="dashboard-vehicle-card__ring-icon dashboard-vehicle-card__ring-icon--green" />
                      </div>
                    </div>
                  </div>
                  <p className="dashboard-vehicle-card__label">Two Wheelers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-security">
            <div className="dashboard-security__card animate-slide-up" style={{ animationDelay: "1400ms" }}>
              <div className="dashboard-security__accent"></div>

              <div className="dashboard-security__lines">
                <div className="dashboard-security__line"></div>
              </div>

              <div className="dashboard-security__header">
                <div className="dashboard-security__title-wrap">
                  <div className="dashboard-security__icon">
                    <Activity className="dashboard-security__icon-symbol animate-pulse" />
                  </div>
                  <div>
                    <h3 className="dashboard-security__title">Live Security Feed</h3>
                    <p className="dashboard-security__subtitle">Real-time gate and system activity</p>
                  </div>
                </div>
                <span className="dashboard-security__status">
                  <span className="dashboard-security__status-dot">
                    <span className="dashboard-security__status-ping"></span>
                    <span className="dashboard-security__status-core"></span>
                  </span>
                  MONITORING ACTIVE
                </span>
              </div>

              <div className="dashboard-security__list">
                {(securityLogs.length > 0 ? securityLogs : [
                  { createdAt: new Date().toISOString(), event: "System Initialized", type: "SYSTEM", status: "Info" }
                ]).map((log, i) => (
                  <div key={i} className="dashboard-security__item">
                    <div className="dashboard-security__time">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="dashboard-security__dot">
                      <span className="dashboard-security__dot-pulse"></span>
                      <span className="dashboard-security__dot-core"></span>
                    </div>
                    <div className="dashboard-security__event">{log.event}</div>
                    <span className={`dashboard-security__badge ${getSecurityBadgeClass(log.type)}`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-quick animate-slide-up" style={{ animationDelay: "1600ms" }}>
            <div className="dashboard-quick__mesh">
              <div className="dashboard-quick__mesh-glow"></div>
              <div className="dashboard-quick__mesh-grid"></div>
            </div>

            <div className="dashboard-quick__content">
              <h3 className="dashboard-quick__title">
                <Sparkles className="dashboard-quick__title-icon animate-spin" style={{ animationDuration: "3s" }} />
                Quick Overview
              </h3>
              <div className="dashboard-quick__grid">
                {[
                  { label: "Paid Bills", value: paidBills.length, tone: "green" },
                  { label: "Pending Bills", value: pendingBillsCount.length, tone: "orange" },
                  { label: "In Progress", value: pendingTickets.filter((t) => t.status === "IN_PROGRESS").length, tone: "blue" },
                  { label: "Active Tenants", value: tenants.filter((t) => t.isActive).length, tone: "teal" },
                  { label: "Active Contracts", value: contracts.filter((c) => c.isActive).length, tone: "accent" }
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className={`dashboard-quick__card dashboard-quick__card--${stat.tone}`}
                    style={{
                      animationDelay: `${1500 + idx * 100}ms`,
                      transformStyle: "preserve-3d"
                    }}
                  >
                    <div className="dashboard-quick__shine"></div>

                    <div className="dashboard-quick__card-content">
                      <p className={`dashboard-quick__value dashboard-quick__value--${stat.tone}`}>{stat.value}</p>
                      <p className="dashboard-quick__label">{stat.label}</p>
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
