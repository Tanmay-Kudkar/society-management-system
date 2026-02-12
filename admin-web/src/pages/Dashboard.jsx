import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Layers,
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
  Zap,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Sector,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  AreaChart, Area,
  ResponsiveContainer,
} from "recharts";

import axios from "axios";
import {
  societyApi,
  organizationApi,
  userApi,
  flatApi,
  contractApi,
  ticketApi,
  maintenanceBillApi,
  tenantApi,
  vehicleApi,
  complaintApi,
  reportApi,
  noticeApi,
  securityLogApi,
} from "../../../api";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const StatCard = ({
  title,
  value,
  icon,
  variant = "neutral",
  subtext,
  delay = 0,
}) => {
  const CardIcon = icon;

  return (
    <div
      className={`stat-card stat-card--${variant} animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-card__content">
        <div>
          <p className="stat-card__label">{title}</p>
          <p className="stat-card__value">{value}</p>
          {subtext && (
            <p className="stat-card__subtext">
              <Activity className="stat-card__subtext-icon" />
              {subtext}
            </p>
          )}
        </div>
        <div className={`stat-card__icon stat-card__icon--${variant}`}>
          <CardIcon className="stat-card__icon-symbol" />
        </div>
      </div>
    </div>
  );
};

const AlertCard = ({ title, items, icon, tone = "yellow", delay = 0 }) => {
  const AlertIcon = icon;

  return (
    <div
      className="alert-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`alert-card__accent alert-card__accent--${tone}`}></div>

      <div className="alert-card__header">
        <div className={`alert-card__icon alert-card__icon--${tone}`}>
          <AlertIcon className="alert-card__icon-symbol" />
        </div>
        <h3 className="alert-card__title">{title}</h3>
        {items.length > 0 && (
          <span className={`alert-card__count alert-card__count--${tone}`}>
            {items.length}
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
};

const CHART_COLORS = ["#3b82f6", "#14b8a6", "#8b5cf6", "#f97316", "#ec4899", "#06b6d4", "#84cc16"];

const renderActiveDonutShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize={24} fontWeight={700}>{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={600}>{payload.label || payload.name}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.25} />
    </g>
  );
};

const ChartTooltipContent = ({ active, payload, label, suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dashboard-recharts-tooltip">
      <p className="dashboard-recharts-tooltip__label">{label || payload[0]?.payload?.name || payload[0]?.payload?.label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="dashboard-recharts-tooltip__row">
          <span className="dashboard-recharts-tooltip__dot" style={{ background: entry.color || entry.payload?.color || entry.payload?.fill }} />
          <span className="dashboard-recharts-tooltip__name">{entry.name || entry.dataKey}</span>
          <span className="dashboard-recharts-tooltip__value" style={{ color: entry.color || entry.payload?.color }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const {
    user,
    hasRole,
    isCommitteeLevel,
    canViewFinancials,
    canManageTenants,
    canManageContracts,
  } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isPlatformOwner = hasRole("PLATFORM_OWNER");
  const isOrgOwner = hasRole("ORGANIZATION_OWNER");
  const isPlatformLevel = isPlatformOwner || isOrgOwner;
  const isMemberOrTenant = user?.role === "MEMBER" || user?.role === "TENANT";
  const isSocietyOpsLevel = !isPlatformLevel && !isMemberOrTenant;
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [activeUnitPieIndex, setActiveUnitPieIndex] = useState(0);
  const [activeVehiclePieIndex, setActiveVehiclePieIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: societies = [], isLoading: societiesLoading } = useQuery({
    queryKey: ["societies"],
    queryFn: () => societyApi.getAll().then((res) => res.data),
    enabled: isPlatformLevel,
  });

  const { data: organizations = [], isLoading: organizationsLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () =>
      organizationApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isPlatformLevel,
  });

  const { data: platformUsers = [], isLoading: platformUsersLoading } = useQuery({
    queryKey: ["dashboard-platform-users"],
    queryFn: () =>
      userApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isPlatformLevel,
  });

  const { data: flats = [] } = useQuery({
    queryKey: ["flats", user?.id],
    queryFn: () =>
      flatApi
        .getAll(user?.id)
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel && !!user?.id,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () =>
      tenantApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () =>
      vehicleApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () =>
      contractApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel,
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

  const societyAdminsCount = platformUsers.filter(
    (u) => u.role === "SOCIETY_ADMIN",
  ).length;
  const tenantsCount = platformUsers.filter((u) => u.role === "TENANT").length;
  const membersCount = platformUsers.filter((u) => u.role === "MEMBER").length;
  const organizationOwnersCount = platformUsers.filter(
    (u) => u.role === "ORGANIZATION_OWNER",
  ).length;

  const roleBreakdown = [
    { label: "Org Owners", value: organizationOwnersCount, color: "#14b8a6" },
    { label: "Society Admins", value: societyAdminsCount, color: "#3b82f6" },
    { label: "Members", value: membersCount, color: "#8b5cf6" },
    { label: "Tenants", value: tenantsCount, color: "#f97316" },
  ];
  const roleBreakdownTotal = roleBreakdown.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const roleBreakdownWithPercent = roleBreakdown.map((item) => ({
    ...item,
    percent:
      roleBreakdownTotal > 0
        ? Math.round((item.value / roleBreakdownTotal) * 100)
        : 0,
  }));

  const orgSocietyStats = organizations
    .map((org) => ({
      name: org.name || `Org ${org.id}`,
      count: societies.filter((s) => s.organizationId === org.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const usersPerSociety = societies
    .map((society) => ({
      name: society.name || `Society ${society.id}`,
      count: platformUsers.filter((userItem) => userItem.societyId === society.id)
        .length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const societyOccupancyStats = societies
    .map((society) => {
      const totalUnits =
        (society.actualFlats ?? society.totalFlats ?? 0)
        + (society.actualShops ?? society.totalShops ?? 0)
        + (society.actualOffices ?? society.totalOffices ?? 0);
      const occupiedUnits =
        (society.occupiedFlats ?? 0)
        + (society.occupiedShops ?? 0)
        + (society.occupiedOffices ?? 0);
      const occupancyPercent =
        totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      return {
        name: society.name || `Society ${society.id}`,
        occupiedUnits,
        totalUnits,
        occupancyPercent,
      };
    })
    .filter((item) => item.totalUnits > 0)
    .sort((a, b) => b.occupancyPercent - a.occupancyPercent)
    .slice(0, 6);

  const platformAnalyticsLoading =
    isPlatformLevel &&
    (societiesLoading || organizationsLoading || platformUsersLoading);

  // Society Admin chart data
  const unitTypeData = isSocietyOpsLevel ? [
    { name: "Flats", total: flats.filter(f => !f.unitType || f.unitType === "FLAT").length, occupied: flats.filter(f => (!f.unitType || f.unitType === "FLAT") && f.ownerName).length, color: "#3b82f6" },
    { name: "Shops", total: flats.filter(f => f.unitType === "SHOP").length, occupied: flats.filter(f => f.unitType === "SHOP" && f.ownerName).length, color: "#14b8a6" },
    { name: "Offices", total: flats.filter(f => f.unitType === "OFFICE").length, occupied: flats.filter(f => f.unitType === "OFFICE" && f.ownerName).length, color: "#8b5cf6" },
  ].filter(u => u.total > 0) : [];

  const billsChartData = isSocietyOpsLevel ? [
    { name: "Paid", value: paidBills.length, color: "#22c55e" },
    { name: "Pending", value: pendingBillsCount.length, color: "#f59e0b" },
    { name: "Overdue", value: overdueBills.length, color: "#ef4444" },
  ] : [];

  const ticketChartData = isSocietyOpsLevel ? [
    { name: "Open", tickets: allTickets.filter(t => t.status === "OPEN").length, complaints: complaints.filter(c => c.status === "PENDING").length },
    { name: "In Progress", tickets: allTickets.filter(t => t.status === "IN_PROGRESS").length, complaints: complaints.filter(c => c.status === "IN_PROGRESS").length },
    { name: "Resolved", tickets: allTickets.filter(t => t.status === "CLOSED" || t.status === "RESOLVED").length, complaints: complaints.filter(c => c.status === "RESOLVED").length },
  ] : [];

  const vehicleChartData = isSocietyOpsLevel ? [
    { name: "Four Wheeler", value: vehicles.filter(v => v.vehicleType === "FOUR_WHEELER").length, color: "#3b82f6" },
    { name: "Two Wheeler", value: vehicles.filter(v => v.vehicleType === "TWO_WHEELER").length, color: "#22c55e" },
  ].filter(v => v.value > 0) : [];

  const tenantChartData = isSocietyOpsLevel ? [
    { name: "Active", value: tenants.filter(t => t.isActive).length, color: "#22c55e" },
    { name: "Expiring", value: expiringTenants.length, color: "#f59e0b" },
    { name: "Inactive", value: tenants.filter(t => !t.isActive).length, color: "#6b7280" },
  ].filter(t => t.value > 0) : [];

  const canSeeFinancialCards = canViewFinancials();
  const canSeeTenantCards = canManageTenants();
  const canSeeContractCards = canManageContracts();

  const adminStatCards = [];

  if (isPlatformOwner) {
    adminStatCards.push(
      {
        key: "total-organizations",
        title: "Total Organizations",
        value: organizations.length,
        icon: Layers,
        variant: "teal",
      },
      {
        key: "total-societies",
        title: "Total Societies",
        value: societies.length,
        icon: Building2,
        variant: "blue",
      },
      {
        key: "society-admins",
        title: "Society Admins",
        value: societyAdminsCount,
        icon: UserCheck,
        variant: "green",
      },
      {
        key: "total-users",
        title: "Manage Users",
        value: platformUsers.length,
        icon: Users,
        variant: "indigo",
      },
    );
  } else if (isOrgOwner) {
    adminStatCards.push(
      {
        key: "org-societies",
        title: "Societies",
        value: societies.length,
        icon: Building2,
        variant: "blue",
      },
      {
        key: "org-society-admins",
        title: "Society Admins",
        value: societyAdminsCount,
        icon: UserCheck,
        variant: "green",
      },
      {
        key: "org-users",
        title: "Manage Users",
        value: platformUsers.length,
        icon: Users,
        variant: "indigo",
      },
    );
  } else {
    adminStatCards.push(
      {
        key: "total-flats",
        title: "Total Flats",
        value: flats.filter((f) => !f.unitType || f.unitType === "FLAT").length,
        icon: Home,
        variant: "blue",
        subtext: `${flats.filter((f) => (!f.unitType || f.unitType === "FLAT") && f.ownerName).length} occupied`,
      },
      {
        key: "total-shops",
        title: "Total Shops",
        value: flats.filter((f) => f.unitType === "SHOP").length,
        icon: Store,
        variant: "green",
        subtext: `${flats.filter((f) => f.unitType === "SHOP" && f.ownerName).length} occupied`,
      },
      {
        key: "total-offices",
        title: "Total Offices",
        value: flats.filter((f) => f.unitType === "OFFICE").length,
        icon: Briefcase,
        variant: "teal",
        subtext: `${flats.filter((f) => f.unitType === "OFFICE" && f.ownerName).length} occupied`,
      },
    );

    if (canSeeTenantCards) {
      adminStatCards.push({
        key: "active-tenants",
        title: "Active Tenants",
        value: tenants.filter((t) => t.isActive).length,
        icon: UserCheck,
        variant: "cyan",
        subtext: `${expiringTenants.length} expiring soon`,
      });
    }

    adminStatCards.push(
      {
        key: "vehicles",
        title: "Vehicles",
        value: vehicles.length,
        icon: Car,
        variant: "indigo",
      },
      {
        key: "open-tickets",
        title: "Open Tickets",
        value: openTickets.length,
        icon: Ticket,
        variant: "sky",
      },
      {
        key: "pending-complaints",
        title: "Pending Complaints",
        value: pendingComplaints.length,
        icon: AlertTriangle,
        variant: "yellow",
      },
    );

    if (canSeeFinancialCards) {
      adminStatCards.push(
        {
          key: "pending-bills",
          title: "Pending Bills",
          value: pendingBillsCount.length,
          icon: CreditCard,
          variant: "orange",
          subtext:
            overdueBills.length > 0
              ? `${overdueBills.length} overdue`
              : undefined,
        },
        {
          key: "overdue-bills",
          title: "Overdue Bills",
          value: overdueBills.length,
          icon: Clock,
          variant: "amber",
          subtext:
            overdueBills.length > 0
              ? `₹${overdueBills
                  .reduce((sum, b) => sum + (b.amount || 0), 0)
                  .toLocaleString()}`
              : "All clear",
        },
      );
    }

    if (canSeeContractCards) {
      adminStatCards.push({
        key: "expiring-contracts",
        title: "Expiring Contracts",
        value: expiringContracts.length,
        icon: FileText,
        variant: "rose",
        subtext: "Next 30 days",
      });
    }
  }

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
    queryFn: () =>
      user?.societyId
        ? noticeApi
            .getBySociety(user.societyId)
            .then((res) => res.data)
            .catch(() => [])
        : [],
    enabled: !!user?.societyId,
  });

  const { data: securityLogs = [] } = useQuery({
    queryKey: ["securityLogs", user?.societyId],
    queryFn: () =>
      user?.societyId
        ? securityLogApi
            .getRecent(user.societyId)
            .then((res) => res.data)
            .catch(() => [])
        : [],
    enabled: !!user?.societyId,
    refetchInterval: 30000,
  });

  const { data: weather } = useQuery({
    queryKey: ["weather"],
    queryFn: async () => {
      const lat = 19.076;
      const long = 72.8777;
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,weather_code,is_day&forecast_days=1`,
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const getWeatherIcon = (code) => {
    if (code === 0) {
      return (
        <Sun className="dashboard-weather-icon dashboard-weather-icon--sun animate-sun" />
      );
    }
    if (code >= 1 && code <= 3) {
      return (
        <Cloud className="dashboard-weather-icon dashboard-weather-icon--cloud animate-pulse" />
      );
    }
    if (code >= 51) {
      return (
        <Cloud className="dashboard-weather-icon dashboard-weather-icon--rain" />
      );
    }
    return (
      <Sun className="dashboard-weather-icon dashboard-weather-icon--sun animate-sun" />
    );
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
    if (normalized === "MAINTENANCE")
      return "dashboard-security__badge--maintenance";
    return "dashboard-security__badge--info";
  };

  return (
    <div className="dashboard animate-fadeIn">
      <div className="dashboard-hero animate-slide-down">
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
                  <span className="dashboard-hero__badge">v2.5.0</span>
                )}
                {isMemberOrTenant && (
                  <span className="dashboard-hero__badge">{user?.role}</span>
                )}
              </div>
              <h1 className="dashboard-hero__title">
                Hello, {user?.name?.split(" ")[0] || "User"}
                <span className="dashboard-hero__wave-emoji animate-bounce-custom">
                  👋
                </span>
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
                  {weather?.current?.temperature_2m
                    ? `${Math.round(weather.current.temperature_2m)}°C`
                    : "..."}
                </p>
                <div className="dashboard-hero__desc">
                  <span>
                    {weather?.current?.weather_code !== undefined
                      ? getWeatherDesc(weather.current.weather_code)
                      : "Loading..."}
                  </span>
                </div>
              </div>
              <div className="dashboard-hero__icon animate-float">
                {weather?.current?.weather_code !== undefined ? (
                  getWeatherIcon(weather.current.weather_code)
                ) : (
                  <Sun className="dashboard-weather-icon dashboard-weather-icon--sun animate-sun" />
                )}
              </div>

              <div className="dashboard-hero__timecard">
                <div className="dashboard-hero__time-overlay"></div>
                <div className="dashboard-hero__time-content">
                  <div className="dashboard-hero__clock">
                    <Clock className="dashboard-hero__clock-icon" />
                    <span className="dashboard-hero__clock-day">
                      {currentTime.toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </span>
                  </div>
                  <p className="dashboard-hero__time">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                  <p className="dashboard-hero__date">
                    {currentTime.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
                {(notices.length > 0
                  ? notices.map((n) => n.content || n.title)
                  : [
                      "🚀 Welcome to Society Management System",
                      "📢 No new notices at the moment",
                      "👮 Security systems active",
                    ]
                ).map((msg, i) => (
                  <span key={i} className="dashboard-ticker__item">
                    <span className="dashboard-ticker__dot"></span>
                    {msg}
                  </span>
                ))}
                {(notices.length > 0
                  ? notices.map((n) => n.content || n.title)
                  : [
                      "🚀 Welcome to Society Management System",
                      "📢 No new notices at the moment",
                      "👮 Security systems active",
                    ]
                ).map((msg, i) => (
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
              subtext={
                overdueBills.length > 0
                  ? `${overdueBills.length} overdue`
                  : "All up to date"
              }
              delay={100}
            />
            <StatCard
              title="My Tickets"
              value={allTickets.filter((t) => t.raisedById === user?.id).length}
              icon={Ticket}
              variant="blue"
              subtext={`${allTickets.filter((t) => t.raisedById === user?.id && t.status === "OPEN").length} open`}
              delay={150}
            />
            <StatCard
              title="My Complaints"
              value={complaints.filter((c) => c.raisedById === user?.id).length}
              icon={AlertTriangle}
              variant="amber"
              subtext={`${complaints.filter((c) => c.raisedById === user?.id && c.status === "PENDING").length} pending`}
              delay={200}
            />
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div
                className="dashboard-panel__icon"
                style={{
                  background: `color-mix(in srgb, var(--accent-primary) 15%, transparent)`,
                  color: `var(--accent-primary)`,
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
                    <p className="dashboard-notices__title">
                      {notice.title || notice.content}
                    </p>
                    <p className="dashboard-notices__date">
                      {notice.createdAt &&
                        new Date(notice.createdAt).toLocaleDateString()}
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
                      <p className="dashboard-bills__name">
                        {bill.billMonth || "Maintenance"}
                      </p>
                      <p className="dashboard-bills__due">
                        Due:{" "}
                        {bill.dueDate &&
                          new Date(bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="dashboard-bills__amount">
                      ₹{bill.amount?.toLocaleString()}
                    </span>
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
            {adminStatCards.map((card, index) => (
              <StatCard
                key={card.key}
                title={card.title}
                value={card.value}
                icon={card.icon}
                variant={card.variant}
                subtext={card.subtext}
                delay={100 + index * 40}
              />
            ))}
          </div>

          {isPlatformLevel && (
            <div
              className="dashboard-platform-analytics animate-slide-up"
              style={{ animationDelay: "850ms" }}
            >
              <div className="dashboard-section">
                <BarChart3 className="dashboard-section__icon" />
                <h2 className="dashboard-section__title">
                  {isPlatformOwner ? "Platform Analytics" : "Organization Analytics"}
                </h2>
              </div>

              <div className="dashboard-charts-grid">
                {platformAnalyticsLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`dashboard-chart-card dashboard-chart-card--loading ${i > 2 ? "dashboard-chart-card--wide" : ""}`}>
                        <div className="dashboard-platform-skeleton dashboard-platform-skeleton--title"></div>
                        <div className="dashboard-platform-skeleton dashboard-platform-skeleton--chart"></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* User Role Distribution - Donut */}
                    <div className="dashboard-chart-card animate-slide-up" style={{ animationDelay: "900ms" }}>
                      <h3 className="dashboard-chart-card__title">
                        <span className="dashboard-chart-card__dot dashboard-chart-card__dot--blue" />
                        User Role Distribution
                      </h3>
                      <div className="dashboard-chart-card__body">
                        {roleBreakdownWithPercent.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie
                                activeIndex={activePieIndex}
                                activeShape={renderActiveDonutShape}
                                data={roleBreakdownWithPercent}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={90}
                                dataKey="value"
                                nameKey="label"
                                onMouseEnter={(_, index) => setActivePieIndex(index)}
                                animationBegin={200}
                                animationDuration={800}
                                animationEasing="ease-out"
                                strokeWidth={2}
                                stroke="rgba(0,0,0,0.15)"
                              >
                                {roleBreakdownWithPercent.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="dashboard-chart-card__empty">No user data available</p>
                        )}
                      </div>
                      {roleBreakdownWithPercent.length > 0 && (
                        <div className="dashboard-chart-card__legend">
                          {roleBreakdownWithPercent.map((item) => (
                            <div key={item.label} className="dashboard-chart-card__legend-item">
                              <span className="dashboard-chart-card__legend-dot" style={{ background: item.color }} />
                              <span className="dashboard-chart-card__legend-text">{item.label}</span>
                              <span className="dashboard-chart-card__legend-value">{item.value} ({item.percent}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Organizations by Societies - Bar Chart */}
                    <div className="dashboard-chart-card animate-slide-up" style={{ animationDelay: "1000ms" }}>
                      <h3 className="dashboard-chart-card__title">
                        <span className="dashboard-chart-card__dot dashboard-chart-card__dot--teal" />
                        Organizations by Societies
                      </h3>
                      <div className="dashboard-chart-card__body">
                        {orgSocietyStats.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={orgSocietyStats} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                              <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.9} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                              <YAxis dataKey="name" type="category" width={130} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                              <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 6, 6, 0]} animationDuration={1000} animationBegin={400} barSize={20} name="Societies" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="dashboard-chart-card__empty">No organization data available</p>
                        )}
                      </div>
                    </div>

                    {/* Users per Society - Area Chart */}
                    <div className="dashboard-chart-card dashboard-chart-card--wide animate-slide-up" style={{ animationDelay: "1100ms" }}>
                      <h3 className="dashboard-chart-card__title">
                        <span className="dashboard-chart-card__dot dashboard-chart-card__dot--violet" />
                        Users per Society (Top 7)
                      </h3>
                      <div className="dashboard-chart-card__body">
                        {usersPerSociety.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={usersPerSociety} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                              <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.12} />
                                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-20} textAnchor="end" height={55} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                              <RechartsTooltip content={<ChartTooltipContent />} cursor={{ stroke: "#8b5cf6", strokeWidth: 1, strokeDasharray: "4 4" }} />
                              <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fill="url(#areaGradient)"
                                dot={{ r: 5, fill: "#8b5cf6", stroke: "#1e1b4b", strokeWidth: 2 }}
                                activeDot={{ r: 8, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2, filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }}
                                animationDuration={1200}
                                animationBegin={500}
                                animationEasing="ease-out"
                                name="Users"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="dashboard-chart-card__empty">No society data available</p>
                        )}
                      </div>
                    </div>

                    {/* Society Occupancy Rate - Bar Chart */}
                    <div className="dashboard-chart-card dashboard-chart-card--wide animate-slide-up" style={{ animationDelay: "1200ms" }}>
                      <h3 className="dashboard-chart-card__title">
                        <span className="dashboard-chart-card__dot dashboard-chart-card__dot--green" />
                        Society Occupancy Rate
                      </h3>
                      <div className="dashboard-chart-card__body">
                        {societyOccupancyStats.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={societyOccupancyStats} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                              <defs>
                                <linearGradient id="occupancyHigh" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.85} />
                                </linearGradient>
                                <linearGradient id="occupancyMid" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.85} />
                                </linearGradient>
                                <linearGradient id="occupancyLow" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.85} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} unit="%" axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                              <RechartsTooltip content={<ChartTooltipContent suffix="%" />} cursor={{ fill: "rgba(34,197,94,0.06)" }} />
                              <Bar dataKey="occupancyPercent" radius={[6, 6, 0, 0]} animationDuration={1000} animationBegin={600} barSize={36} name="Occupancy">
                                {societyOccupancyStats.map((entry, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={entry.occupancyPercent > 70 ? "url(#occupancyHigh)" : entry.occupancyPercent > 40 ? "url(#occupancyMid)" : "url(#occupancyLow)"}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="dashboard-chart-card__empty">No occupancy data available</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {dashboardReport && isCommitteeLevel() && (
            <div className="dashboard-financial">
              <div className="dashboard-section">
                <BarChart3 className="dashboard-section__icon" />
                <h2 className="dashboard-section__title">Financial Overview</h2>
              </div>
              <div className="dashboard-financial__grid">
                <div
                  className="dashboard-financial-card dashboard-financial-card--emerald wave-box animate-slide-up"
                  style={{ animationDelay: "500ms" }}
                >
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <TrendingUp className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">
                      MTD Income
                    </p>
                    <p className="dashboard-financial-card__value">
                      {formatCurrency(dashboardReport.totalIncome)}
                    </p>
                    <p className="dashboard-financial-card__hint">
                      <Activity className="dashboard-financial-card__hint-icon" />
                      This month
                    </p>
                  </div>
                </div>

                <div
                  className="dashboard-financial-card dashboard-financial-card--rose wave-box animate-slide-up"
                  style={{ animationDelay: "600ms" }}
                >
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <TrendingDown className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">
                      MTD Expense
                    </p>
                    <p className="dashboard-financial-card__value">
                      {formatCurrency(dashboardReport.totalExpense)}
                    </p>
                    <p className="dashboard-financial-card__hint">
                      <Activity className="dashboard-financial-card__hint-icon" />
                      This month
                    </p>
                  </div>
                </div>

                <div
                  className="dashboard-financial-card dashboard-financial-card--blue wave-box animate-slide-up"
                  style={{ animationDelay: "700ms" }}
                >
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <BarChart3 className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">
                      YTD Income
                    </p>
                    <p className="dashboard-financial-card__value">
                      {formatCurrency(dashboardReport.previousPeriodIncome)}
                    </p>
                    <p className="dashboard-financial-card__hint">
                      <Activity className="dashboard-financial-card__hint-icon" />
                      Year to date
                    </p>
                  </div>
                </div>

                <div
                  className="dashboard-financial-card dashboard-financial-card--violet wave-box animate-slide-up"
                  style={{ animationDelay: "800ms" }}
                >
                  <div className="dashboard-financial-card__waves">
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--one"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--two"></div>
                    <div className="dashboard-financial-card__wave dashboard-financial-card__wave--three"></div>
                  </div>
                  <div className="dashboard-financial-card__content">
                    <div className="dashboard-financial-card__icon">
                      <DollarSign className="dashboard-financial-card__icon-symbol" />
                    </div>
                    <p className="dashboard-financial-card__label">
                      Cash Balance
                    </p>
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

          {isSocietyOpsLevel && (
            <>
              {/* Society Operations Analytics */}
              <div className="dashboard-platform-analytics animate-slide-up" style={{ animationDelay: "850ms" }}>
                <div className="dashboard-section">
                  <BarChart3 className="dashboard-section__icon" />
                  <h2 className="dashboard-section__title">Society Analytics</h2>
                </div>

                <div className="dashboard-charts-grid">
                  {/* Unit Type Distribution - Donut */}
                  {unitTypeData.length > 0 && (
                    <div className="dashboard-chart-card animate-slide-up" style={{ animationDelay: "900ms" }}>
                      <h3 className="dashboard-chart-card__title">
                        <span className="dashboard-chart-card__dot dashboard-chart-card__dot--blue" />
                        Unit Distribution
                      </h3>
                      <div className="dashboard-chart-card__body">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              activeIndex={activeUnitPieIndex}
                              activeShape={renderActiveDonutShape}
                              data={unitTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={90}
                              dataKey="total"
                              nameKey="name"
                              onMouseEnter={(_, index) => setActiveUnitPieIndex(index)}
                              animationBegin={200}
                              animationDuration={800}
                              animationEasing="ease-out"
                              strokeWidth={2}
                              stroke="rgba(0,0,0,0.15)"
                            >
                              {unitTypeData.map((entry, idx) => (
                                <Cell key={`unit-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="dashboard-chart-card__legend">
                        {unitTypeData.map((item) => (
                          <div key={item.name} className="dashboard-chart-card__legend-item">
                            <span className="dashboard-chart-card__legend-dot" style={{ background: item.color }} />
                            <span className="dashboard-chart-card__legend-text">{item.name}</span>
                            <span className="dashboard-chart-card__legend-value">{item.occupied}/{item.total} occupied</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bills Status - Bar Chart */}
                  <div className="dashboard-chart-card animate-slide-up" style={{ animationDelay: "1000ms" }}>
                    <h3 className="dashboard-chart-card__title">
                      <span className="dashboard-chart-card__dot dashboard-chart-card__dot--green" />
                      Bills Overview
                    </h3>
                    <div className="dashboard-chart-card__body">
                      {billsChartData.some(b => b.value > 0) ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={billsChartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={300} barSize={40} name="Bills">
                              {billsChartData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="dashboard-chart-card__empty">No bills data available</p>
                      )}
                    </div>
                  </div>

                  {/* Tickets & Complaints - Grouped Bar Chart */}
                  <div className="dashboard-chart-card dashboard-chart-card--wide animate-slide-up" style={{ animationDelay: "1100ms" }}>
                    <h3 className="dashboard-chart-card__title">
                      <span className="dashboard-chart-card__dot dashboard-chart-card__dot--violet" />
                      Tickets &amp; Complaints by Status
                    </h3>
                    <div className="dashboard-chart-card__body">
                      {ticketChartData.some(t => t.tickets > 0 || t.complaints > 0) ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={ticketChartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
                            <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={800} animationBegin={400} barSize={24} name="Tickets" />
                            <Bar dataKey="complaints" fill="#f97316" radius={[4, 4, 0, 0]} animationDuration={800} animationBegin={500} barSize={24} name="Complaints" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="dashboard-chart-card__empty">No tickets or complaints data</p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Distribution - Donut */}
                  {vehicleChartData.length > 0 && (
                    <div className="dashboard-chart-card animate-slide-up" style={{ animationDelay: "1200ms" }}>
                      <h3 className="dashboard-chart-card__title">
                        <span className="dashboard-chart-card__dot dashboard-chart-card__dot--teal" />
                        Vehicle Distribution
                      </h3>
                      <div className="dashboard-chart-card__body">
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              activeIndex={activeVehiclePieIndex}
                              activeShape={renderActiveDonutShape}
                              data={vehicleChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              dataKey="value"
                              nameKey="name"
                              onMouseEnter={(_, index) => setActiveVehiclePieIndex(index)}
                              animationBegin={300}
                              animationDuration={800}
                              animationEasing="ease-out"
                              strokeWidth={2}
                              stroke="rgba(0,0,0,0.15)"
                            >
                              {vehicleChartData.map((entry, idx) => (
                                <Cell key={`veh-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Tenant Status - Area or Bar */}
                  {tenantChartData.length > 0 && tenantChartData.some(t => t.value > 0) && (
                    <div className="dashboard-chart-card animate-slide-up" style={{ animationDelay: "1300ms" }}>
                      <h3 className="dashboard-chart-card__title">
                        <span className="dashboard-chart-card__dot dashboard-chart-card__dot--green" />
                        Tenant Status
                      </h3>
                      <div className="dashboard-chart-card__body">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={tenantChartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(34,197,94,0.06)" }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={300} barSize={40} name="Tenants">
                              {tenantChartData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                    subtitle: new Date(
                      tenant.agreementEndDate,
                    ).toLocaleDateString(),
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
                <div
                  className="dashboard-bills-summary animate-slide-up"
                  style={{ animationDelay: "1200ms" }}
                >
                  <div className="dashboard-bills-summary__accent"></div>
                  <div className="dashboard-bills-summary__glow"></div>
                  <div className="dashboard-bills-summary__shine"></div>

                  <div className="dashboard-bills-summary__header">
                    <div className="dashboard-bills-summary__icon">
                      <DollarSign className="dashboard-bills-summary__icon-symbol animate-pulse-custom" />
                    </div>
                    <div>
                      <h3 className="dashboard-bills-summary__title">
                        Bills Summary
                      </h3>
                      <p className="dashboard-bills-summary__subtitle">
                        Overview of all transactions
                      </p>
                    </div>
                  </div>

                  <div className="dashboard-bills-summary__list">
                    <div className="dashboard-bills-summary__row">
                      <span className="dashboard-bills-summary__label">
                        Total Bills Amount
                      </span>
                      <span className="dashboard-bills-summary__value">
                        ₹{totalBillAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="dashboard-bills-summary__stats">
                      <div className="dashboard-bills-summary__stat dashboard-bills-summary__stat--paid">
                        <span className="dashboard-bills-summary__stat-value">
                          {paidBills.length}
                        </span>
                        <span className="dashboard-bills-summary__stat-label">
                          Paid Bills
                        </span>
                      </div>
                      <div className="dashboard-bills-summary__stat dashboard-bills-summary__stat--pending">
                        <span className="dashboard-bills-summary__stat-value">
                          {pendingBillsCount.length}
                        </span>
                        <span className="dashboard-bills-summary__stat-label">
                          Pending
                        </span>
                      </div>
                      <div className="dashboard-bills-summary__stat dashboard-bills-summary__stat--overdue">
                        <span className="dashboard-bills-summary__stat-value">
                          {overdueBills.length}
                        </span>
                        <span className="dashboard-bills-summary__stat-label">
                          Overdue
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="dashboard-vehicle-card animate-slide-up"
                  style={{ animationDelay: "1300ms" }}
                >
                  <div className="dashboard-vehicle-card__accent"></div>
                  <div className="dashboard-vehicle-card__glow"></div>
                  <div className="dashboard-vehicle-card__shine"></div>

                  <div className="dashboard-vehicle-card__header">
                    <div className="dashboard-vehicle-card__icon">
                      <Car className="dashboard-vehicle-card__icon-symbol animate-bounce-custom" />
                    </div>
                    <div>
                      <h3 className="dashboard-vehicle-card__title">
                        Vehicle Distribution
                      </h3>
                      <p className="dashboard-vehicle-card__subtitle">
                        Parking lot analytics
                      </p>
                    </div>
                  </div>

                  <div className="dashboard-vehicle-card__stats">
                    <div className="dashboard-vehicle-card__stat">
                      <div className="dashboard-vehicle-card__ring dashboard-vehicle-card__ring--blue">
                        <div className="dashboard-vehicle-card__ring-inner">
                          <div className="dashboard-vehicle-card__ring-content">
                            <span className="dashboard-vehicle-card__ring-value dashboard-vehicle-card__ring-value--blue">
                              {
                                vehicles.filter(
                                  (v) => v.vehicleType === "FOUR_WHEELER",
                                ).length
                              }
                            </span>
                            <Car className="dashboard-vehicle-card__ring-icon dashboard-vehicle-card__ring-icon--blue" />
                          </div>
                        </div>
                      </div>
                      <p className="dashboard-vehicle-card__label">
                        Four Wheelers
                      </p>
                    </div>

                    <div className="dashboard-vehicle-card__stat">
                      <div className="dashboard-vehicle-card__ring dashboard-vehicle-card__ring--green">
                        <div className="dashboard-vehicle-card__ring-inner">
                          <div className="dashboard-vehicle-card__ring-content">
                            <span className="dashboard-vehicle-card__ring-value dashboard-vehicle-card__ring-value--green">
                              {
                                vehicles.filter(
                                  (v) => v.vehicleType === "TWO_WHEELER",
                                ).length
                              }
                            </span>
                            <Activity className="dashboard-vehicle-card__ring-icon dashboard-vehicle-card__ring-icon--green" />
                          </div>
                        </div>
                      </div>
                      <p className="dashboard-vehicle-card__label">
                        Two Wheelers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-security">
                <div
                  className="dashboard-security__card animate-slide-up"
                  style={{ animationDelay: "1400ms" }}
                >
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
                        <h3 className="dashboard-security__title">
                          Live Security Feed
                        </h3>
                        <p className="dashboard-security__subtitle">
                          Real-time gate and system activity
                        </p>
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
                    {(securityLogs.length > 0
                      ? securityLogs
                      : [
                          {
                            createdAt: new Date().toISOString(),
                            event: "System Initialized",
                            type: "SYSTEM",
                            status: "Info",
                          },
                        ]
                    ).map((log, i) => (
                      <div key={i} className="dashboard-security__item">
                        <div className="dashboard-security__time">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="dashboard-security__dot">
                          <span className="dashboard-security__dot-pulse"></span>
                          <span className="dashboard-security__dot-core"></span>
                        </div>
                        <div className="dashboard-security__event">
                          {log.event}
                        </div>
                        <span
                          className={`dashboard-security__badge ${getSecurityBadgeClass(log.type)}`}
                        >
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="dashboard-quick animate-slide-up"
                style={{ animationDelay: "1600ms" }}
              >
                <div className="dashboard-quick__mesh">
                  <div className="dashboard-quick__mesh-glow"></div>
                  <div className="dashboard-quick__mesh-grid"></div>
                </div>

                <div className="dashboard-quick__content">
                  <h3 className="dashboard-quick__title">
                    <Sparkles
                      className="dashboard-quick__title-icon animate-spin"
                      style={{ animationDuration: "3s" }}
                    />
                    Quick Overview
                  </h3>
                  <div className="dashboard-quick__grid">
                    {[
                      {
                        label: "Paid Bills",
                        value: paidBills.length,
                        tone: "green",
                      },
                      {
                        label: "Pending Bills",
                        value: pendingBillsCount.length,
                        tone: "orange",
                      },
                      {
                        label: "In Progress",
                        value: pendingTickets.filter(
                          (t) => t.status === "IN_PROGRESS",
                        ).length,
                        tone: "blue",
                      },
                      {
                        label: "Active Tenants",
                        value: tenants.filter((t) => t.isActive).length,
                        tone: "teal",
                      },
                      {
                        label: "Active Contracts",
                        value: contracts.filter((c) => c.isActive).length,
                        tone: "accent",
                      },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`dashboard-quick__card dashboard-quick__card--${stat.tone}`}
                        style={{
                          animationDelay: `${1500 + idx * 100}ms`,
                          transformStyle: "preserve-3d",
                        }}
                      >
                        <div className="dashboard-quick__shine"></div>

                        <div className="dashboard-quick__card-content">
                          <p
                            className={`dashboard-quick__value dashboard-quick__value--${stat.tone}`}
                          >
                            {stat.value}
                          </p>
                          <p className="dashboard-quick__label">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
