import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
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
  ArrowUpRight,
  Sparkles,
  Activity,
  BarChart3,
  Store,
  Briefcase,
  Bell,
  Sun,
  Cloud,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Sector,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  AreaChart, Area,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";

import {
  societyApi,
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
} from "../../../../api";
import { DashboardSkeleton, WakeUpBanner } from '../../components/SkeletonLoaders';
import useMinLoadingTime from '../../hooks/useMinLoadingTime';
import StatCard from "./dashboard/components/StatCard";
import AlertCard from "./dashboard/components/AlertCard";
import HeroSection from "./dashboard/components/HeroSection";
import useWeather from "./dashboard/hooks/useWeather";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const quickToneClasses = {
  green: {
    card: "border-l-4 border-l-emerald-500",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  orange: {
    card: "border-l-4 border-l-orange-500",
    value: "text-orange-600 dark:text-orange-400",
  },
  blue: {
    card: "border-l-4 border-l-blue-500",
    value: "text-blue-600 dark:text-blue-400",
  },
  teal: {
    card: "border-l-4 border-l-teal-500",
    value: "text-teal-600 dark:text-teal-400",
  },
  accent: {
    card: "border-l-4 border-l-[var(--accent-primary)]",
    value: "text-[var(--accent-primary)]",
  },
};

const sectionShellClass = "mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 shadow-sm";
const insightPanelClass = "relative overflow-hidden rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-5 transition-all duration-300 hover:border-[color-mix(in_srgb,var(--accent-primary)_35%,var(--border-default))] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_8px_22px_rgba(2,6,23,0.32)]";

const CHART_COLORS = ["#3b82f6", "#14b8a6", "#8b5cf6", "#f97316", "#ec4899", "#06b6d4", "#84cc16"];

const renderActiveDonutShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary, #e2e8f0)" fontSize={24} fontWeight={700}>{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-tertiary, #94a3b8)" fontSize={11} fontWeight={600}>{payload.label || payload.name}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 8px ${fill}40)` }} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.25} style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </g>
  );
};

const ChartTooltipContent = ({ active, payload, label, suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[140px] rounded-[10px] border border-white/10 bg-slate-950/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-md">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">{label || payload[0]?.payload?.name || payload[0]?.payload?.label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color || entry.payload?.color || entry.payload?.fill, boxShadow: "0 0 6px currentColor" }} />
          <span className="text-xs font-medium text-slate-400">{entry.name || entry.dataKey}</span>
          <span className="ml-auto text-base font-extrabold tracking-[-0.01em]" style={{ color: entry.color || entry.payload?.color }}>
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
  const isPlatformOwner = hasRole("MASTER_ADMIN");
  const isOrgOwner = hasRole("SOCIETY_ADMIN");
  const isPlatformLevel = isPlatformOwner || isOrgOwner;
  const isMemberOrTenant = user?.role === "MEMBER" || user?.role === "TENANT";
  const isSocietyOpsLevel = !isPlatformLevel && !isMemberOrTenant;
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [activeUnitPieIndex, setActiveUnitPieIndex] = useState(0);
  const [activeVehiclePieIndex, setActiveVehiclePieIndex] = useState(0);
  const [animatePlatformCharts, setAnimatePlatformCharts] = useState(true);
  const [animateSocietyCharts, setAnimateSocietyCharts] = useState(true);
  const hasPlayedPlatformAnimation = useRef(false);
  const hasPlayedSocietyAnimation = useRef(false);

  // One-time chart animation for platform analytics
  useEffect(() => {
    if (!hasPlayedPlatformAnimation.current && isPlatformLevel) {
      hasPlayedPlatformAnimation.current = true;
      const timer = setTimeout(() => setAnimatePlatformCharts(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [isPlatformLevel]);

  useEffect(() => {
    if (!hasPlayedSocietyAnimation.current && isSocietyOpsLevel) {
      hasPlayedSocietyAnimation.current = true;
      const timer = setTimeout(() => setAnimateSocietyCharts(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [isSocietyOpsLevel]);

  const { data: societies = [], isLoading: societiesLoading, isError: societiesError } = useQuery({
    queryKey: ["societies"],
    queryFn: () => societyApi.getAll().then((res) => res.data),
    enabled: isPlatformLevel,
  });

  const { data: platformUsers = [] } = useQuery({
    queryKey: ["dashboard-platform-users"],
    queryFn: () =>
      userApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isPlatformLevel,
    placeholderData: [],
  });

  const { data: flats = [] } = useQuery({
    queryKey: ["flats", user?.id],
    queryFn: () =>
      flatApi
        .getAll(user?.id)
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel && !!user?.id,
    placeholderData: [],
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () =>
      tenantApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () =>
      vehicleApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () =>
      contractApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () =>
      ticketApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    placeholderData: [],
  });

  const openTickets = useMemo(
    () => allTickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS"),
    [allTickets],
  );

  const pendingTickets = useMemo(
    () => allTickets.filter((t) => t.status === "OPEN"),
    [allTickets],
  );

  const { data: maintenanceBills = [] } = useQuery({
    queryKey: ["maintenance-bills", user?.id],
    queryFn: () =>
      maintenanceBillApi
        .getAll()
        .then((res) => res.data)
        .catch(() => []),
    enabled: !!user?.id,
    placeholderData: [],
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints", user?.id],
    queryFn: () =>
      complaintApi
        .getAll(user?.id)
        .then((res) => res.data)
        .catch(() => []),
    enabled: !!user?.id,
    placeholderData: [],
  });

  const expiringContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (!c.endDate) return false;
      const endDate = new Date(c.endDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil(
        (endDate - today) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });
  }, [contracts]);

  const expiringTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (!t.agreementEndDate || !t.isActive) return false;
      const endDate = new Date(t.agreementEndDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil(
        (endDate - today) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });
  }, [tenants]);

  const {
    totalBillAmount,
    paidBills,
    pendingBillsCount,
    overdueBills,
    billTotalCount,
    billCollectionRate,
  } = useMemo(() => {
    const totalAmount = maintenanceBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const paid = maintenanceBills.filter((b) => b.status === "PAID");
    const pending = maintenanceBills.filter((b) => b.status === "PENDING");
    const overdue = maintenanceBills.filter((b) => {
      if (b.status !== "PENDING" || !b.dueDate) return false;
      return new Date(b.dueDate) < new Date();
    });
    const totalCount = paid.length + pending.length + overdue.length;
    const collectionRate = totalCount > 0 ? Math.round((paid.length / totalCount) * 100) : 0;
    return {
      totalBillAmount: totalAmount,
      paidBills: paid,
      pendingBillsCount: pending,
      overdueBills: overdue,
      billTotalCount: totalCount,
      billCollectionRate: collectionRate,
    };
  }, [maintenanceBills]);

  const pendingComplaints = useMemo(
    () => complaints.filter((c) => c.status === "PENDING" || c.status === "IN_PROGRESS"),
    [complaints],
  );

  const { societyAdminsCount, tenantsCount, membersCount } = useMemo(() => {
    return {
      societyAdminsCount: platformUsers.filter((u) => u.role === "SOCIETY_ADMIN").length,
      tenantsCount: platformUsers.filter((u) => u.role === "TENANT").length,
      membersCount: platformUsers.filter((u) => u.role === "MEMBER").length,
    };
  }, [platformUsers]);

  const roleBreakdown = useMemo(() => {
    if (isPlatformOwner) {
      return [
        { label: "Society Admins", value: societyAdminsCount, color: "#3b82f6" },
        { label: "Members", value: membersCount, color: "#8b5cf6" },
        { label: "Tenants", value: tenantsCount, color: "#f97316" },
      ];
    }
    return [
      { label: "Society Admins", value: societyAdminsCount, color: "#3b82f6" },
      { label: "Members", value: membersCount, color: "#8b5cf6" },
      { label: "Tenants", value: tenantsCount, color: "#f97316" },
    ];
  }, [isPlatformOwner, societyAdminsCount, membersCount, tenantsCount]);

  const roleBreakdownTotal = useMemo(
    () => roleBreakdown.reduce((sum, item) => sum + item.value, 0),
    [roleBreakdown],
  );

  const roleBreakdownWithPercent = useMemo(() => {
    return roleBreakdown.map((item) => ({
      ...item,
      percent:
        roleBreakdownTotal > 0
          ? Math.round((item.value / roleBreakdownTotal) * 100)
          : 0,
    }));
  }, [roleBreakdown, roleBreakdownTotal]);

  const usersPerSociety = useMemo(() => {
    return societies
      .map((society) => ({
        name: society.name || `Society ${society.id}`,
        count: platformUsers.filter((userItem) => userItem.societyId === society.id).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [societies, platformUsers]);

  const societyOccupancyStats = useMemo(() => {
    return societies
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
  }, [societies]);

  const {
    platformTotalIssues,
    resolvedIssuesCount,
    issueResolutionRate,
  } = useMemo(() => {
    const totalIssues = allTickets.length + complaints.length;
    const resolvedTickets = allTickets.filter(
      (item) => item.status === "CLOSED" || item.status === "RESOLVED",
    ).length;
    const resolvedComplaints = complaints.filter(
      (item) => item.status === "CLOSED" || item.status === "RESOLVED",
    ).length;
    const totalResolved = resolvedTickets + resolvedComplaints;
    const resolutionRate =
      totalIssues > 0 ? Math.round((totalResolved / totalIssues) * 100) : 0;
    return {
      platformTotalIssues: totalIssues,
      resolvedTicketsCount: resolvedTickets,
      resolvedComplaintsCount: resolvedComplaints,
      resolvedIssuesCount: totalResolved,
      issueResolutionRate: resolutionRate,
    };
  }, [allTickets, complaints]);

  const averageOccupancy = useMemo(() => {
    return societyOccupancyStats.length > 0
      ? Math.round(
          societyOccupancyStats.reduce(
            (sum, societyItem) => sum + societyItem.occupancyPercent,
            0,
          ) / societyOccupancyStats.length,
        )
      : 0;
  }, [societyOccupancyStats]);

  const issueHealthData = useMemo(() => {
    return [
      {
        label: "Open",
        value: allTickets.filter((item) => item.status === "OPEN").length
          + complaints.filter((item) => item.status === "PENDING").length,
        color: "#f97316",
      },
      {
        label: "In Progress",
        value: allTickets.filter((item) => item.status === "IN_PROGRESS").length
          + complaints.filter((item) => item.status === "IN_PROGRESS").length,
        color: "#3b82f6",
      },
      {
        label: "Resolved",
        value: resolvedIssuesCount,
        color: "#22c55e",
      },
    ].filter((item) => item.value > 0);
  }, [allTickets, complaints, resolvedIssuesCount]);

  const billingHealthData = useMemo(() => {
    return [
      { name: "Paid", value: paidBills.length, color: "#22c55e" },
      { name: "Pending", value: pendingBillsCount.length, color: "#f59e0b" },
      { name: "Overdue", value: overdueBills.length, color: "#ef4444" },
    ];
  }, [paidBills.length, pendingBillsCount.length, overdueBills.length]);

  const showPlatformFinancialWidgets = !isPlatformOwner;

  const platformKpiCards = [
    {
      key: "issue-resolution",
      label: "Issue Resolution",
      value: `${issueResolutionRate}%`,
      helper:
        platformTotalIssues > 0
          ? `${resolvedIssuesCount}/${platformTotalIssues} resolved`
          : "No issues recorded yet",
      tone: "green",
    },
    {
      key: "avg-occupancy",
      label: "Avg Occupancy",
      value: `${averageOccupancy}%`,
      helper:
        societyOccupancyStats.length > 0
          ? `${societyOccupancyStats.length} societies tracked`
          : "No unit occupancy data yet",
      tone: "blue",
    },
    ...(showPlatformFinancialWidgets
      ? [
          {
            key: "bill-collection",
            label: "Bill Collection",
            value: `${billCollectionRate}%`,
            helper:
              billTotalCount > 0
                ? `${paidBills.length}/${billTotalCount} paid`
                : "No bills generated yet",
            tone: "teal",
          },
        ]
      : []),
  ];

  const platformAnalyticsLoading = false; // placeholderData eliminates loading flash
  const hasRoleDistributionData = roleBreakdownWithPercent.some((item) => item.value > 0);
  const hasUsersPerSocietyData = usersPerSociety.some((item) => item.count > 0);
  const hasOccupancyData = societyOccupancyStats.length > 0;
  const hasIssueHealthData = issueHealthData.length > 0;
  const hasBillingHealthData = billingHealthData.some((item) => item.value > 0);
  const hasPlatformCharts = hasRoleDistributionData
    || hasUsersPerSocietyData
    || hasOccupancyData
    || hasIssueHealthData
    || (showPlatformFinancialWidgets && hasBillingHealthData);

  // Society Admin chart data
  const unitTypeData = useMemo(() => {
    if (!isSocietyOpsLevel) {
      return [];
    }
    return [
      {
        name: "Flats",
        total: flats.filter((f) => !f.unitType || f.unitType === "FLAT").length,
        occupied: flats.filter((f) => (!f.unitType || f.unitType === "FLAT") && f.ownerName).length,
        color: "#3b82f6",
      },
      {
        name: "Shops",
        total: flats.filter((f) => f.unitType === "SHOP").length,
        occupied: flats.filter((f) => f.unitType === "SHOP" && f.ownerName).length,
        color: "#14b8a6",
      },
      {
        name: "Offices",
        total: flats.filter((f) => f.unitType === "OFFICE").length,
        occupied: flats.filter((f) => f.unitType === "OFFICE" && f.ownerName).length,
        color: "#8b5cf6",
      },
    ].filter((u) => u.total > 0);
  }, [isSocietyOpsLevel, flats]);

  const billsChartData = useMemo(() => {
    if (!isSocietyOpsLevel) {
      return [];
    }
    return [
      { name: "Paid", value: paidBills.length, color: "#22c55e" },
      { name: "Pending", value: pendingBillsCount.length, color: "#f59e0b" },
      { name: "Overdue", value: overdueBills.length, color: "#ef4444" },
    ];
  }, [isSocietyOpsLevel, paidBills.length, pendingBillsCount.length, overdueBills.length]);

  const ticketChartData = useMemo(() => {
    if (!isSocietyOpsLevel) {
      return [];
    }
    return [
      {
        name: "Open",
        tickets: allTickets.filter((t) => t.status === "OPEN").length,
        complaints: complaints.filter((c) => c.status === "PENDING").length,
      },
      {
        name: "In Progress",
        tickets: allTickets.filter((t) => t.status === "IN_PROGRESS").length,
        complaints: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      },
      {
        name: "Resolved",
        tickets: allTickets.filter((t) => t.status === "CLOSED" || t.status === "RESOLVED").length,
        complaints: complaints.filter((c) => c.status === "RESOLVED").length,
      },
    ];
  }, [isSocietyOpsLevel, allTickets, complaints]);

  const vehicleChartData = useMemo(() => {
    if (!isSocietyOpsLevel) {
      return [];
    }
    return [
      { name: "Four Wheeler", value: vehicles.filter((v) => v.vehicleType === "FOUR_WHEELER").length, color: "#3b82f6" },
      { name: "Two Wheeler", value: vehicles.filter((v) => v.vehicleType === "TWO_WHEELER").length, color: "#22c55e" },
    ].filter((v) => v.value > 0);
  }, [isSocietyOpsLevel, vehicles]);

  const tenantChartData = useMemo(() => {
    if (!isSocietyOpsLevel) {
      return [];
    }
    return [
      { name: "Active", value: tenants.filter((t) => t.isActive).length, color: "#22c55e" },
      { name: "Expiring", value: expiringTenants.length, color: "#f59e0b" },
      { name: "Inactive", value: tenants.filter((t) => !t.isActive).length, color: "#6b7280" },
    ].filter((t) => t.value > 0);
  }, [isSocietyOpsLevel, tenants, expiringTenants.length]);

  const memberIssueStats = useMemo(() => {
    const myTickets = allTickets.filter((t) => t.raisedById === user?.id);
    const myOpenTickets = myTickets.filter((t) => t.status === "OPEN");
    const myComplaints = complaints.filter((c) => c.raisedById === user?.id);
    const myPendingComplaints = myComplaints.filter((c) => c.status === "PENDING");
    return {
      myTicketsCount: myTickets.length,
      myOpenTicketsCount: myOpenTickets.length,
      myComplaintsCount: myComplaints.length,
      myPendingComplaintsCount: myPendingComplaints.length,
    };
  }, [allTickets, complaints, user?.id]);

  const {
    fourWheelerCount,
    twoWheelerCount,
    activeTenantsCount,
    activeContractsCount,
    pendingTicketsInProgressCount,
  } = useMemo(() => {
    return {
      fourWheelerCount: vehicles.filter((v) => v.vehicleType === "FOUR_WHEELER").length,
      twoWheelerCount: vehicles.filter((v) => v.vehicleType === "TWO_WHEELER").length,
      activeTenantsCount: tenants.filter((t) => t.isActive).length,
      activeContractsCount: contracts.filter((c) => c.isActive).length,
      pendingTicketsInProgressCount: pendingTickets.filter((t) => t.status === "IN_PROGRESS").length,
    };
  }, [vehicles, tenants, contracts, pendingTickets]);

  const hasSocietyBillsData = billsChartData.some((item) => item.value > 0);
  const hasSocietyTicketData = ticketChartData.some((item) => item.tickets > 0 || item.complaints > 0);
  const hasTenantStatusData = tenantChartData.some((item) => item.value > 0);
  const hasSocietyCharts = unitTypeData.length > 0
    || hasSocietyBillsData
    || hasSocietyTicketData
    || vehicleChartData.length > 0
    || hasTenantStatusData;

  const canSeeFinancialCards = canViewFinancials();
  const canSeeTenantCards = canManageTenants();
  const canSeeContractCards = canManageContracts();

  const adminStatCards = [];

  if (isPlatformOwner) {
    adminStatCards.push(
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

  const { data: weather } = useWeather();

  const getWeatherIcon = (code) => {
    if (code === 0) {
      return (
        <Sun className="h-7 w-7 animate-sun text-[var(--text-secondary)]" />
      );
    }
    if (code >= 1 && code <= 3) {
      return (
        <Cloud className="h-7 w-7 animate-pulse text-[var(--text-secondary)]" />
      );
    }
    if (code >= 51) {
      return (
        <Cloud className="h-7 w-7 text-[var(--text-secondary)]" />
      );
    }
    return (
      <Sun className="h-7 w-7 animate-sun text-[var(--text-secondary)]" />
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
    if (normalized === "ALERT") return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
    if (normalized === "SECURITY") return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (normalized === "MAINTENANCE")
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    return "border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]";
  };

  const showSkeleton = useMinLoadingTime(societiesLoading || societiesError);

  if (showSkeleton) {
    return (
      <>
        <WakeUpBanner show={societiesLoading} />
        <DashboardSkeleton />
      </>
    );
  }

  const timeGreeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="pb-10 animate-fadeIn">
      <HeroSection
        user={user}
        notices={notices}
        isMemberOrTenant={isMemberOrTenant}
        isPlatformLevel={isPlatformLevel}
        isPlatformOwner={isPlatformOwner}
        weather={weather}
        getWeatherDesc={getWeatherDesc}
        getWeatherIcon={getWeatherIcon}
        timeGreeting={timeGreeting}
      />

      {isMemberOrTenant && (
        <div className="mb-8 grid gap-6">
          <div className="mb-4 flex items-center gap-3 border-b border-[var(--border-default)] pb-4 dark:border-[#1e1e1e]">
            <Activity className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">My Summary</h2>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              value={memberIssueStats.myTicketsCount}
              icon={Ticket}
              variant="blue"
              subtext={`${memberIssueStats.myOpenTicketsCount} open`}
              delay={150}
            />
            <StatCard
              title="My Complaints"
              value={memberIssueStats.myComplaintsCount}
              icon={AlertTriangle}
              variant="amber"
              subtext={`${memberIssueStats.myPendingComplaintsCount} pending`}
              delay={200}
            />
          </div>

          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background: `color-mix(in srgb, var(--accent-primary) 15%, transparent)`,
                  color: `var(--accent-primary)`,
                }}
              >
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Notices</h3>
            </div>
            {notices.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No recent notices</p>
            ) : (
              <ul className="space-y-3">
                {notices.slice(0, 5).map((notice, idx) => (
                  <li key={idx} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-3 transition-colors hover:border-[var(--accent-primary)] dark:border-slate-800/80">
                    <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
                      {notice.title || notice.content}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {notice.createdAt &&
                        new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {pendingBillsCount.length > 0 && (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Pending Bills</h3>
              </div>
              <ul className="space-y-3">
                {pendingBillsCount.slice(0, 5).map((bill, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-3 dark:border-slate-800/80">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {bill.billMonth || "Maintenance"}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-orange-500">
                        Due:{" "}
                        {bill.dueDate &&
                          new Date(bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
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
          <div className="mb-4 flex items-center gap-3 border-b border-[var(--border-default)] pb-4 dark:border-[#1e1e1e]">
            <Building2 className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {isPlatformOwner ? 'Platform Summary' : 'Society Summary'}
            </h2>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className={sectionShellClass}>
              <div className="mb-4 flex items-center gap-3 border-b border-[var(--border-default)] pb-4 dark:border-[#1e1e1e]">
                <BarChart3 className="h-5 w-5 text-[var(--accent-primary)]" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {isPlatformOwner ? "Platform Analytics" : "Society Analytics"}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {platformAnalyticsLoading ? (
                  <DashboardSkeleton />
                ) : (
                  <>
                    {!hasPlatformCharts && (
                      <div className="col-span-full rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                        Platform analytics will appear once role and society activity data is available.
                      </div>
                    )}

                    {/* User Role Distribution - Donut */}
                    {hasRoleDistributionData && (
                    <div className={insightPanelClass}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                        User Role Distribution
                      </h3>
                      <div className="flex min-h-[260px] items-center justify-center">
                        <ResponsiveContainer width="100%" height={280} debounce={100}>
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
                              onMouseLeave={() => setActivePieIndex(null)}
                              isAnimationActive={animatePlatformCharts}
                              animationBegin={0}
                              animationDuration={900}
                              strokeWidth={2}
                              stroke="rgba(0,0,0,0.15)"
                            >
                              {roleBreakdownWithPercent.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} style={{ cursor: "pointer", transition: "opacity 0.3s ease" }} />
                              ))}
                            </Pie>
                            <RechartsTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border-light,var(--border-default))] pt-3">
                        {roleBreakdownWithPercent.map((item) => (
                          <div key={item.label} className="flex items-center gap-1.5 text-xs">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                            <span className="font-medium text-[var(--text-secondary)]">{item.label}</span>
                            <span className="ml-auto font-bold text-[var(--text-primary)]">{item.value} ({item.percent}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Users per Society - Area Chart */}
                    {hasUsersPerSocietyData && (
                    <div className={clsx(insightPanelClass, "lg:col-span-2")}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                        Users per Society (Top 7)
                      </h3>
                      <div className="flex min-h-[260px] items-center justify-center">
                          <ResponsiveContainer width="100%" height={300} debounce={100}>
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
                                isAnimationActive={animatePlatformCharts}
                                animationDuration={850}
                                animationBegin={0}
                                name="Users"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                      </div>
                    </div>
                    )}

                    {/* Society Occupancy Rate - Bar Chart */}
                    {hasOccupancyData && (
                    <div className={clsx(insightPanelClass, "lg:col-span-2")}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        Society Occupancy Rate
                      </h3>
                      <p className="mb-2 text-xs text-[var(--text-secondary)]">
                        Average occupancy across tracked societies: {averageOccupancy}%
                      </p>
                      <div className="flex min-h-[260px] items-center justify-center">
                          <ResponsiveContainer width="100%" height={280} debounce={100}>
                            <BarChart data={societyOccupancyStats} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} interval={0} minTickGap={10} />
                              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} unit="%" axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                              <ReferenceLine
                                y={averageOccupancy}
                                stroke="rgba(59,130,246,0.6)"
                                strokeDasharray="4 4"
                                ifOverflow="extendDomain"
                                label={{
                                  value: `Avg ${averageOccupancy}%`,
                                  position: "insideTopRight",
                                  fill: "#93c5fd",
                                  fontSize: 11,
                                }}
                              />
                              <RechartsTooltip content={<ChartTooltipContent suffix="%" />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                              <Bar dataKey="occupancyPercent" radius={[8, 8, 0, 0]} isAnimationActive={animatePlatformCharts} animationDuration={900} animationBegin={0} barSize={42} name="Occupancy">
                                {societyOccupancyStats.map((entry, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={entry.occupancyPercent > 70 ? "#22c55e" : entry.occupancyPercent > 40 ? "#f59e0b" : "#ef4444"}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                      </div>
                    </div>
                    )}

                    {/* Platform KPI Strip */}
                    <div className={clsx(insightPanelClass, "lg:col-span-2")}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                        Platform Health Snapshot
                      </h3>
                      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                        {platformKpiCards.map((kpi) => (
                          <div
                            key={kpi.key}
                            className={clsx(
                              "rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3.5",
                              kpi.tone === "green" && "text-emerald-500",
                              kpi.tone === "blue" && "text-blue-500",
                              kpi.tone === "teal" && "text-teal-500",
                            )}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">{kpi.label}</p>
                            <p className="mt-1 text-2xl font-bold leading-tight">{kpi.value}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">{kpi.helper}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issue Resolution Mix */}
                    {hasIssueHealthData && (
                    <div className={insightPanelClass}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                        Issue Resolution Mix
                      </h3>
                      <div className="flex min-h-[260px] items-center justify-center">
                          <ResponsiveContainer width="100%" height={260} debounce={100}>
                            <PieChart>
                              <Pie
                                data={issueHealthData}
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={86}
                                dataKey="value"
                                nameKey="label"
                                isAnimationActive={animatePlatformCharts}
                                animationDuration={900}
                                animationBegin={0}
                                strokeWidth={2}
                                stroke="rgba(0,0,0,0.15)"
                              >
                                {issueHealthData.map((entry, idx) => (
                                  <Cell key={`issue-${idx}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                      </div>
                    </div>
                    )}

                    {showPlatformFinancialWidgets && hasBillingHealthData && (
                      <div className={insightPanelClass}>
                        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]" />
                          Billing Health
                        </h3>
                        <div className="flex min-h-[260px] items-center justify-center">
                            <ResponsiveContainer width="100%" height={260} debounce={100}>
                              <BarChart data={billingHealthData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                                <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(20,184,166,0.08)" }} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={animatePlatformCharts} animationDuration={900} animationBegin={0} barSize={42} name="Bills">
                                  {billingHealthData.map((entry, idx) => (
                                    <Cell key={`bill-health-${idx}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {dashboardReport && isCommitteeLevel() && (
            <div className="mb-5">
              <div className="mb-4 flex items-center gap-3 border-b border-[var(--border-default)] pb-4 dark:border-[#1e1e1e]">
                <BarChart3 className="h-5 w-5 text-[var(--accent-primary)]" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Financial Overview</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div
                  className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#1a1a1a]"
                  style={{ animationDelay: "500ms" }}
                >
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      MTD Income
                    </p>
                    <p className="text-[22px] font-bold text-[var(--text-primary)]">
                      {formatCurrency(dashboardReport.totalIncome)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                      <Activity className="h-3.5 w-3.5" />
                      This month
                    </p>
                  </div>
                </div>

                <div
                  className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#1a1a1a]"
                  style={{ animationDelay: "600ms" }}
                >
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      MTD Expense
                    </p>
                    <p className="text-[22px] font-bold text-[var(--text-primary)]">
                      {formatCurrency(dashboardReport.totalExpense)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                      <Activity className="h-3.5 w-3.5" />
                      This month
                    </p>
                  </div>
                </div>

                <div
                  className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#1a1a1a]"
                  style={{ animationDelay: "700ms" }}
                >
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      YTD Income
                    </p>
                    <p className="text-[22px] font-bold text-[var(--text-primary)]">
                      {formatCurrency(dashboardReport.previousPeriodIncome)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                      <Activity className="h-3.5 w-3.5" />
                      Year to date
                    </p>
                  </div>
                </div>

                <div
                  className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#1a1a1a]"
                  style={{ animationDelay: "800ms" }}
                >
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      Cash Balance
                    </p>
                    <p className="text-[22px] font-bold text-[var(--text-primary)]">
                      {formatCurrency(dashboardReport.cashBalance)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                      <Sparkles className="h-3.5 w-3.5" />
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
              <div className={clsx(sectionShellClass, "animate-slide-up")} style={{ animationDelay: "850ms" }}>
                <div className="mb-4 flex items-center gap-3 border-b border-[var(--border-default)] pb-4 dark:border-[#1e1e1e]">
                  <BarChart3 className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Society Analytics</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {!hasSocietyCharts && (
                    <div className="col-span-full rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                      Society analytics will appear once operational records are available.
                    </div>
                  )}

                  {/* Unit Type Distribution - Donut */}
                  {unitTypeData.length > 0 && (
                    <div className={clsx(insightPanelClass, "animate-slide-up")} style={{ animationDelay: "900ms" }}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                        Unit Distribution
                      </h3>
                      <div className="flex min-h-[260px] items-center justify-center">
                        <ResponsiveContainer width="100%" height={280} debounce={100}>
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
                              isAnimationActive={animateSocietyCharts}
                              animationDuration={850}
                              animationBegin={0}
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
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border-light,var(--border-default))] pt-3">
                        {unitTypeData.map((item) => (
                          <div key={item.name} className="flex items-center gap-1.5 text-xs">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                            <span className="font-medium text-[var(--text-secondary)]">{item.name}</span>
                            <span className="ml-auto font-bold text-[var(--text-primary)]">{item.occupied}/{item.total} occupied</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bills Status - Bar Chart */}
                  {hasSocietyBillsData && (
                  <div className={clsx(insightPanelClass, "animate-slide-up")} style={{ animationDelay: "1000ms" }}>
                    <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                      Bills Overview
                    </h3>
                    <div className="flex min-h-[260px] items-center justify-center">
                        <ResponsiveContainer width="100%" height={280} debounce={100}>
                          <BarChart data={billsChartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={animateSocietyCharts} animationDuration={850} animationBegin={0} barSize={40} name="Bills">
                              {billsChartData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                  )}

                  {/* Tickets & Complaints - Grouped Bar Chart */}
                  {hasSocietyTicketData && (
                  <div className={clsx(insightPanelClass, "lg:col-span-2 animate-slide-up")} style={{ animationDelay: "1100ms" }}>
                    <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                      Tickets &amp; Complaints by Status
                    </h3>
                    <div className="flex min-h-[260px] items-center justify-center">
                        <ResponsiveContainer width="100%" height={280} debounce={100}>
                          <BarChart data={ticketChartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
                            <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={animateSocietyCharts} animationDuration={850} animationBegin={0} barSize={24} name="Tickets" />
                            <Bar dataKey="complaints" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={animateSocietyCharts} animationDuration={850} animationBegin={0} barSize={24} name="Complaints" />
                          </BarChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                  )}

                  {/* Vehicle Distribution - Donut */}
                  {vehicleChartData.length > 0 && (
                    <div className={clsx(insightPanelClass, "animate-slide-up")} style={{ animationDelay: "1200ms" }}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]" />
                        Vehicle Distribution
                      </h3>
                      <div className="flex min-h-[260px] items-center justify-center">
                        <ResponsiveContainer width="100%" height={260} debounce={100}>
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
                              isAnimationActive={animateSocietyCharts}
                              animationDuration={850}
                              animationBegin={0}
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
                  {hasTenantStatusData && (
                    <div className={clsx(insightPanelClass, "animate-slide-up")} style={{ animationDelay: "1300ms" }}>
                      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-[0.01em] text-[var(--text-primary)]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        Tenant Status
                      </h3>
                      <div className="flex min-h-[260px] items-center justify-center">
                        <ResponsiveContainer width="100%" height={260} debounce={100}>
                          <BarChart data={tenantChartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,184,0.15)" }} allowDecimals={false} />
                            <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(34,197,94,0.06)" }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={animateSocietyCharts} animationDuration={850} animationBegin={0} barSize={40} name="Tenants">
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

              <div className="mb-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
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

              <div className="mb-5 grid grid-cols-1 gap-[14px] lg:grid-cols-2">
                {showPlatformFinancialWidgets && (
                  <div
                    className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 dark:border-[#1a1a1a] dark:bg-[var(--bg-secondary)]"
                    style={{ animationDelay: "1200ms" }}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="h-4.5 w-4.5 animate-pulse-custom" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                          Bills Summary
                        </h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Overview of all transactions
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border border-[var(--border-light,var(--border-default))] bg-[var(--bg-tertiary)] px-3.5 py-3">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                          Total Bills Amount
                        </span>
                        <span className="ml-2 text-xl font-bold text-[var(--text-primary)]">
                          ₹{totalBillAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/8 p-2.5 text-emerald-600 dark:text-emerald-400">
                          <span className="block text-xl font-bold leading-none">
                            {paidBills.length}
                          </span>
                          <span className="text-[11px] font-medium">
                            Paid Bills
                          </span>
                        </div>
                        <div className="rounded-lg border border-orange-500/15 bg-orange-500/8 p-2.5 text-orange-600 dark:text-orange-400">
                          <span className="block text-xl font-bold leading-none">
                            {pendingBillsCount.length}
                          </span>
                          <span className="text-[11px] font-medium">
                            Pending
                          </span>
                        </div>
                        <div className="rounded-lg border border-rose-500/15 bg-rose-500/8 p-2.5 text-rose-600 dark:text-rose-400">
                          <span className="block text-xl font-bold leading-none">
                            {overdueBills.length}
                          </span>
                          <span className="text-[11px] font-medium">
                            Overdue
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 dark:border-[#1a1a1a] dark:bg-[var(--bg-secondary)]"
                  style={{ animationDelay: "1300ms" }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Car className="h-4.5 w-4.5 animate-bounce-custom" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Vehicle Distribution
                      </h3>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Parking lot analytics
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-evenly gap-5 pt-2">
                    <div className="text-center">
                      <div className="mb-2 flex h-[88px] w-[88px] items-center justify-center rounded-full border-[3px] border-blue-500/25">
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-xl font-bold text-blue-500">
                              {fourWheelerCount}
                            </span>
                            <Car className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                        </div>
                      </div>
                      <p className="text-[13px] font-medium text-[var(--text-secondary)]">
                        Four Wheelers
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="mb-2 flex h-[88px] w-[88px] items-center justify-center rounded-full border-[3px] border-emerald-500/25">
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--bg-secondary)]">
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-xl font-bold text-emerald-500">
                              {twoWheelerCount}
                            </span>
                            <Activity className="h-3.5 w-3.5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                      <p className="text-[13px] font-medium text-[var(--text-secondary)]">
                        Two Wheelers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div
                  className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 dark:border-[#1a1a1a] dark:bg-[var(--bg-secondary)]"
                  style={{ animationDelay: "1400ms" }}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Activity className="h-4.5 w-4.5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                          Live Security Feed
                        </h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Real-time gate and system activity
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
                      <span className="relative inline-flex h-2 w-2 items-center justify-center">
                        <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
                        <span className="relative h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                      MONITORING ACTIVE
                    </span>
                  </div>

                  <div className="space-y-2">
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
                      <div key={i} className="flex items-center gap-3 rounded-lg border-l-[3px] border-l-[var(--accent-primary)] bg-[var(--bg-tertiary)] px-3 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--bg-tertiary)_80%,var(--accent-primary)_5%)]">
                        <div className="text-[11px] text-[var(--text-tertiary)]">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="relative flex h-2 w-2 items-center justify-center">
                          <span className="absolute h-2 w-2 rounded-full bg-[var(--accent-primary)]"></span>
                        </div>
                        <div className="flex-1 text-[13px] font-medium text-[var(--text-primary)]">
                          {log.event}
                        </div>
                        <span
                          className={clsx(
                            "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                            getSecurityBadgeClass(log.type),
                          )}
                        >
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="animate-slide-up rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 shadow-sm transition-all duration-200 dark:border-[#1a1a1a] dark:bg-[var(--bg-secondary)]"
                style={{ animationDelay: "1600ms" }}
              >
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                    <Sparkles
                      className="h-[18px] w-[18px] animate-spin text-[var(--accent-primary)]"
                      style={{ animationDuration: "3s" }}
                    />
                    Quick Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
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
                        value: pendingTicketsInProgressCount,
                        tone: "blue",
                      },
                      {
                        label: "Active Tenants",
                        value: activeTenantsCount,
                        tone: "teal",
                      },
                      {
                        label: "Active Contracts",
                        value: activeContractsCount,
                        tone: "accent",
                      },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          "rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-4 transition-colors hover:border-[var(--border-strong)]",
                          quickToneClasses[stat.tone]?.card,
                        )}
                        style={{
                          animationDelay: `${1500 + idx * 100}ms`,
                          transformStyle: "preserve-3d",
                        }}
                      >
                        <div>
                          <p
                            className={clsx(
                              "mb-1 text-[26px] font-bold leading-none",
                              quickToneClasses[stat.tone]?.value,
                            )}
                          >
                            {stat.value}
                          </p>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{stat.label}</p>
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
