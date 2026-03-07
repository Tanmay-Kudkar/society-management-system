import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  Car,
  Clock,
  Cloud,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  ShieldCheck,
  Store,
  Sun,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import clsx from "clsx";

import { useAuth } from "../../../context/AuthContext";
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
} from "../../../../../api";
import { DashboardSkeleton, WakeUpBanner } from "../../../components/SkeletonLoaders";
import useMinLoadingTime from "../../../hooks/useMinLoadingTime";
import StatCard from "./components/StatCard";
import AlertCard from "./components/AlertCard";
import HeroSection from "./components/HeroSection";
import useWeather from "./hooks/useWeather";

const sectionShellClass = "rounded-[28px] border border-[color-mix(in_srgb,var(--border-default)_88%,white_12%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-secondary)_96%,white_4%),color-mix(in_srgb,var(--bg-secondary)_100%,black_0%))] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.08)]";
const panelClass = "rounded-[24px] border border-[color-mix(in_srgb,var(--border-default)_90%,white_10%)] bg-[color-mix(in_srgb,var(--bg-tertiary)_88%,white_12%)] p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]";

const toneClasses = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
  cyan: "bg-cyan-500",
};

const badgeClasses = {
  info: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  neutral: "border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent-primary)]">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
            {description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPanel({ title, value, helper, icon: Icon, tone = "blue" }) {
  return (
    <article className={clsx(panelClass, "overflow-hidden")}> 
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{title}</p>
          <p className="mt-3 text-[28px] font-black leading-none tracking-tight text-[var(--text-primary)]">{value}</p>
          {helper && <p className="mt-2 text-sm text-[var(--text-secondary)]">{helper}</p>}
        </div>
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-[var(--text-primary)] shadow-inner dark:bg-white/5">
            <Icon className={clsx("h-5 w-5", tone === "emerald" && "text-emerald-500", tone === "amber" && "text-amber-500", tone === "rose" && "text-rose-500", tone === "violet" && "text-violet-500", tone === "blue" && "text-blue-500")} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-black/5 dark:bg-white/5">
        <div className={clsx("h-full rounded-full", toneClasses[tone] || toneClasses.blue)} style={{ width: "58%" }} />
      </div>
    </article>
  );
}

function ProgressBoard({ title, caption, items, emptyText = "No data available yet." }) {
  return (
    <section className={panelClass}>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        {caption && <p className="mt-1 text-sm text-[var(--text-secondary)]">{caption}</p>}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                  {item.helper && <p className="text-xs text-[var(--text-tertiary)]">{item.helper}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{item.value}</p>
                  {item.meta && <p className="text-xs text-[var(--text-tertiary)]">{item.meta}</p>}
                </div>
              </div>
              <div className="h-2 rounded-full bg-black/5 dark:bg-white/5">
                <div
                  className={clsx("h-full rounded-full", toneClasses[item.tone] || toneClasses.blue)}
                  style={{ width: `${clampPercent(item.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeedPanel({ title, icon, items, emptyText, badgeLabel }) {
  const IconComponent = icon;

  return (
    <section className={sectionShellClass}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]">
            <IconComponent className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">Latest high-signal updates only.</p>
          </div>
        </div>
        {badgeLabel && (
          <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
            {badgeLabel}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  {item.meta && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{item.meta}</p>}
                </div>
                {item.badge && (
                  <span className={clsx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", badgeClasses[item.badgeTone || "neutral"])}>
                    {item.badge}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const {
    user,
    hasRole,
    isCommitteeLevel,
    canViewFinancials,
    canManageTenants,
  } = useAuth();

  const isPlatformOwner = hasRole("MASTER_ADMIN");
  const isOrgOwner = hasRole("SOCIETY_ADMIN");
  const isPlatformLevel = isPlatformOwner || isOrgOwner;
  const isMemberOrTenant = user?.role === "MEMBER" || user?.role === "TENANT";
  const isSocietyOpsLevel = !isPlatformLevel && !isMemberOrTenant;

  const { data: societies = [], isLoading: societiesLoading, isError: societiesError } = useQuery({
    queryKey: ["societies"],
    queryFn: () => societyApi.getAll().then((res) => res.data),
    enabled: isPlatformLevel,
  });

  const { data: platformUsers = [] } = useQuery({
    queryKey: ["dashboard-platform-users"],
    queryFn: () => userApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isPlatformLevel,
    placeholderData: [],
  });

  const { data: flats = [] } = useQuery({
    queryKey: ["flats", user?.id],
    queryFn: () => flatApi.getAll(user?.id).then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel && !!user?.id,
    placeholderData: [],
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => vehicleApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => contractApi.getAll().then((res) => res.data).catch(() => []),
    enabled: isSocietyOpsLevel,
    placeholderData: [],
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => ticketApi.getAll().then((res) => res.data).catch(() => []),
    placeholderData: [],
  });

  const { data: maintenanceBills = [] } = useQuery({
    queryKey: ["maintenance-bills", user?.id],
    queryFn: () => maintenanceBillApi.getAll().then((res) => res.data).catch(() => []),
    enabled: !!user?.id,
    placeholderData: [],
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints", user?.id],
    queryFn: () => complaintApi.getAll(user?.id).then((res) => res.data).catch(() => []),
    enabled: !!user?.id,
    placeholderData: [],
  });

  const { data: dashboardReport } = useQuery({
    queryKey: ["dashboardReport", user?.societyId],
    queryFn: () => user?.societyId && isCommitteeLevel() ? reportApi.getDashboard(user.societyId).then((res) => res.data) : null,
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

  const { data: weather } = useWeather();

  const openTickets = allTickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS");
  const pendingTickets = allTickets.filter((ticket) => ticket.status === "OPEN");
  const pendingComplaints = complaints.filter((complaint) => complaint.status === "PENDING" || complaint.status === "IN_PROGRESS");

  const expiringContracts = contracts.filter((contract) => {
    if (!contract.endDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  const expiringTenants = tenants.filter((tenant) => {
    if (!tenant.agreementEndDate || !tenant.isActive) return false;
    const daysUntilExpiry = Math.ceil((new Date(tenant.agreementEndDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  const paidBills = maintenanceBills.filter((bill) => bill.status === "PAID");
  const pendingBillsCount = maintenanceBills.filter((bill) => bill.status === "PENDING");
  const overdueBills = maintenanceBills.filter((bill) => bill.status === "PENDING" && bill.dueDate && new Date(bill.dueDate) < new Date());
  const totalBillAmount = maintenanceBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const billTotalCount = paidBills.length + pendingBillsCount.length + overdueBills.length;
  const billCollectionRate = billTotalCount > 0 ? Math.round((paidBills.length / billTotalCount) * 100) : 0;

  const societyAdminsCount = platformUsers.filter((entry) => entry.role === "SOCIETY_ADMIN").length;
  const tenantsCount = platformUsers.filter((entry) => entry.role === "TENANT").length;
  const membersCount = platformUsers.filter((entry) => entry.role === "MEMBER").length;

  const roleMix = useMemo(() => {
    const total = societyAdminsCount + membersCount + tenantsCount;
    return [
      { label: "Society Admins", count: societyAdminsCount, tone: "blue" },
      { label: "Members", count: membersCount, tone: "violet" },
      { label: "Tenants", count: tenantsCount, tone: "amber" },
    ]
      .filter((item) => item.count > 0)
      .map((item) => ({
        label: item.label,
        value: item.count,
        helper: `${total > 0 ? Math.round((item.count / total) * 100) : 0}% of all users`,
        meta: `${item.count} users`,
        percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
        tone: item.tone,
      }));
  }, [membersCount, societyAdminsCount, tenantsCount]);

  const societySpotlight = useMemo(() => {
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
        const percent = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
        return {
          label: society.name || `Society ${society.id}`,
          value: `${percent}%`,
          helper: `${occupiedUnits}/${totalUnits} occupied units`,
          meta: `${occupiedUnits} occupied`,
          percent,
          tone: percent >= 75 ? "emerald" : percent >= 45 ? "amber" : "rose",
        };
      })
      .filter((item) => item.percent > 0)
      .sort((left, right) => right.percent - left.percent)
      .slice(0, 4);
  }, [societies]);

  const totalUnits = flats.length;
  const occupiedUnits = flats.filter((flat) => flat.ownerName).length;

  const unitBreakdown = useMemo(() => {
    const items = [
      {
        label: "Flats",
        total: flats.filter((flat) => !flat.unitType || flat.unitType === "FLAT").length,
        occupied: flats.filter((flat) => (!flat.unitType || flat.unitType === "FLAT") && flat.ownerName).length,
        tone: "blue",
      },
      {
        label: "Shops",
        total: flats.filter((flat) => flat.unitType === "SHOP").length,
        occupied: flats.filter((flat) => flat.unitType === "SHOP" && flat.ownerName).length,
        tone: "emerald",
      },
      {
        label: "Offices",
        total: flats.filter((flat) => flat.unitType === "OFFICE").length,
        occupied: flats.filter((flat) => flat.unitType === "OFFICE" && flat.ownerName).length,
        tone: "violet",
      },
    ];

    return items
      .filter((item) => item.total > 0)
      .map((item) => ({
        label: item.label,
        value: `${item.occupied}/${item.total}`,
        helper: `${item.occupied} occupied`,
        meta: `${item.total} total`,
        percent: item.total > 0 ? Math.round((item.occupied / item.total) * 100) : 0,
        tone: item.tone,
      }));
  }, [flats]);

  const issueBreakdown = useMemo(() => {
    const rows = [
      {
        label: "Open",
        count: allTickets.filter((item) => item.status === "OPEN").length + complaints.filter((item) => item.status === "PENDING").length,
        tone: "amber",
      },
      {
        label: "In Progress",
        count: allTickets.filter((item) => item.status === "IN_PROGRESS").length + complaints.filter((item) => item.status === "IN_PROGRESS").length,
        tone: "blue",
      },
      {
        label: "Resolved",
        count: allTickets.filter((item) => item.status === "CLOSED" || item.status === "RESOLVED").length + complaints.filter((item) => item.status === "CLOSED" || item.status === "RESOLVED").length,
        tone: "emerald",
      },
    ];

    const total = rows.reduce((sum, item) => sum + item.count, 0);
    return rows
      .filter((item) => item.count > 0)
      .map((item) => ({
        label: item.label,
        value: item.count,
        helper: total > 0 ? `${Math.round((item.count / total) * 100)}% of all cases` : "No active cases",
        percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
        tone: item.tone,
      }));
  }, [allTickets, complaints]);

  const billingBreakdown = useMemo(() => {
    const rows = [
      { label: "Paid", count: paidBills.length, tone: "emerald" },
      { label: "Pending", count: pendingBillsCount.length, tone: "amber" },
      { label: "Overdue", count: overdueBills.length, tone: "rose" },
    ];
    return rows
      .filter((item) => item.count > 0)
      .map((item) => ({
        label: item.label,
        value: item.count,
        helper: billTotalCount > 0 ? `${Math.round((item.count / billTotalCount) * 100)}% of billed items` : "No bills yet",
        percent: billTotalCount > 0 ? Math.round((item.count / billTotalCount) * 100) : 0,
        tone: item.tone,
      }));
  }, [billTotalCount, overdueBills.length, paidBills.length, pendingBillsCount.length]);

  const memberIssueStats = useMemo(() => {
    const myTickets = allTickets.filter((ticket) => ticket.raisedById === user?.id);
    const myComplaints = complaints.filter((complaint) => complaint.raisedById === user?.id);
    return {
      myTicketsCount: myTickets.length,
      myOpenTicketsCount: myTickets.filter((ticket) => ticket.status === "OPEN").length,
      myComplaintsCount: myComplaints.length,
      myPendingComplaintsCount: myComplaints.filter((complaint) => complaint.status === "PENDING").length,
    };
  }, [allTickets, complaints, user?.id]);

  const activeTenantsCount = tenants.filter((tenant) => tenant.isActive).length;
  const activeContractsCount = contracts.filter((contract) => contract.isActive).length;
  const fourWheelerCount = vehicles.filter((vehicle) => vehicle.vehicleType === "FOUR_WHEELER").length;
  const twoWheelerCount = vehicles.filter((vehicle) => vehicle.vehicleType === "TWO_WHEELER").length;

  const primaryStats = useMemo(() => {
    if (isMemberOrTenant) {
      return [
        {
          key: "member-bills",
          title: "My Pending Bills",
          value: pendingBillsCount.length,
          icon: CreditCard,
          variant: "orange",
          subtext: overdueBills.length > 0 ? `${overdueBills.length} overdue` : "All up to date",
        },
        {
          key: "member-tickets",
          title: "My Tickets",
          value: memberIssueStats.myTicketsCount,
          icon: Ticket,
          variant: "blue",
          subtext: `${memberIssueStats.myOpenTicketsCount} open`,
        },
        {
          key: "member-complaints",
          title: "My Complaints",
          value: memberIssueStats.myComplaintsCount,
          icon: AlertTriangle,
          variant: "amber",
          subtext: `${memberIssueStats.myPendingComplaintsCount} pending`,
        },
      ];
    }

    if (isPlatformLevel) {
      return [
        {
          key: "platform-societies",
          title: isPlatformOwner ? "Total Societies" : "Managed Societies",
          value: societies.length,
          icon: Building2,
          variant: "blue",
          subtext: `${platformUsers.length} registered users`,
        },
        {
          key: "platform-admins",
          title: "Society Admins",
          value: societyAdminsCount,
          icon: UserCheck,
          variant: "green",
          subtext: `${membersCount + tenantsCount} residents onboarded`,
        },
        {
          key: "platform-issues",
          title: "Open Issues",
          value: openTickets.length + pendingComplaints.length,
          icon: AlertTriangle,
          variant: "yellow",
          subtext: `${allTickets.length + complaints.length} total tracked`,
        },
        {
          key: "platform-collections",
          title: "Collection Rate",
          value: `${billCollectionRate}%`,
          icon: DollarSign,
          variant: "teal",
          subtext: billTotalCount > 0 ? `${paidBills.length}/${billTotalCount} cleared` : "No bills generated yet",
        },
      ];
    }

    return [
      {
        key: "society-units",
        title: "Occupied Units",
        value: occupiedUnits,
        icon: Home,
        variant: "blue",
        subtext: `${totalUnits} total units`,
      },
      ...(canManageTenants()
        ? [{
            key: "society-tenants",
            title: "Active Tenants",
            value: activeTenantsCount,
            icon: UserCheck,
            variant: "cyan",
            subtext: `${expiringTenants.length} expiring soon`,
          }]
        : []),
      {
        key: "society-issues",
        title: "Open Issues",
        value: openTickets.length + pendingComplaints.length,
        icon: Ticket,
        variant: "sky",
        subtext: `${pendingTickets.length} awaiting action`,
      },
      ...(canViewFinancials()
        ? [{
            key: "society-bills",
            title: "Pending Bills",
            value: pendingBillsCount.length,
            icon: CreditCard,
            variant: "orange",
            subtext: overdueBills.length > 0 ? `${overdueBills.length} overdue` : "Stable collections",
          }]
        : []),
    ];
  }, [
    activeTenantsCount,
    allTickets.length,
    billCollectionRate,
    billTotalCount,
    complaints.length,
    expiringTenants.length,
    isMemberOrTenant,
    isPlatformLevel,
    isPlatformOwner,
    memberIssueStats.myComplaintsCount,
    memberIssueStats.myOpenTicketsCount,
    memberIssueStats.myPendingComplaintsCount,
    memberIssueStats.myTicketsCount,
    membersCount,
    occupiedUnits,
    openTickets.length,
    overdueBills.length,
    paidBills.length,
    pendingBillsCount.length,
    pendingComplaints.length,
    pendingTickets.length,
    platformUsers.length,
    societies.length,
    societyAdminsCount,
    tenantsCount,
    totalUnits,
    canManageTenants,
    canViewFinancials,
  ]);

  const noticeItems = notices.slice(0, 5).map((notice) => ({
    title: notice.title || notice.content,
    meta: notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : "Recently posted",
    badge: "Notice",
    badgeTone: "info",
  }));

  const securityFeedItems = (securityLogs.length > 0 ? securityLogs : [{
    createdAt: new Date().toISOString(),
    event: "System initialized",
    type: "SYSTEM",
    status: "Info",
  }]).slice(0, 6).map((log) => ({
    title: log.event,
    meta: new Date(log.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    badge: log.status || log.type,
    badgeTone: String(log.type || "").toUpperCase() === "ALERT"
      ? "danger"
      : String(log.type || "").toUpperCase() === "MAINTENANCE"
        ? "success"
        : String(log.type || "").toUpperCase() === "SECURITY"
          ? "info"
          : "neutral",
  }));

  const pendingBillItems = pendingBillsCount.slice(0, 5).map((bill) => ({
    title: bill.billMonth || "Maintenance",
    meta: bill.dueDate ? `Due ${new Date(bill.dueDate).toLocaleDateString()}` : "Due date unavailable",
    badge: bill.amount ? `₹${bill.amount.toLocaleString()}` : "Pending",
    badgeTone: overdueBills.some((entry) => entry.id === bill.id) ? "danger" : "warning",
  }));

  const operationsCards = useMemo(() => {
    const items = [];

    if (dashboardReport && isCommitteeLevel()) {
      items.push(
        {
          key: "income",
          title: "MTD Income",
          value: formatCurrency(dashboardReport.totalIncome),
          helper: "Collected during the current month",
          icon: TrendingUp,
          tone: "emerald",
        },
        {
          key: "expense",
          title: "MTD Expense",
          value: formatCurrency(dashboardReport.totalExpense),
          helper: "Operational spend for the current month",
          icon: TrendingDown,
          tone: "rose",
        },
        {
          key: "cash-balance",
          title: "Cash Balance",
          value: formatCurrency(dashboardReport.cashBalance),
          helper: "Available balance across the society account",
          icon: DollarSign,
          tone: "blue",
        },
      );
    } else if (billTotalCount > 0) {
      items.push(
        {
          key: "collections",
          title: "Collected So Far",
          value: `${billCollectionRate}%`,
          helper: `${paidBills.length} bills settled`,
          icon: CreditCard,
          tone: "emerald",
        },
        {
          key: "outstanding",
          title: "Outstanding Value",
          value: formatCurrency(pendingBillsCount.reduce((sum, bill) => sum + (bill.amount || 0), 0)),
          helper: `${pendingBillsCount.length} pending bills`,
          icon: Clock,
          tone: "amber",
        },
        {
          key: "total-billed",
          title: "Total Billed",
          value: formatCurrency(totalBillAmount),
          helper: `${billTotalCount} bill records in system`,
          icon: DollarSign,
          tone: "blue",
        },
      );
    }

    if (isSocietyOpsLevel) {
      items.push({
        key: "vehicles",
        title: "Parking Mix",
        value: `${fourWheelerCount + twoWheelerCount}`,
        helper: `${fourWheelerCount} four-wheelers and ${twoWheelerCount} two-wheelers`,
        icon: Car,
        tone: "violet",
      });
      items.push({
        key: "contracts",
        title: "Active Contracts",
        value: activeContractsCount,
        helper: `${expiringContracts.length} ending in 30 days`,
        icon: FileText,
        tone: "amber",
      });
    }

    return items.slice(0, 4);
  }, [
    activeContractsCount,
    billCollectionRate,
    billTotalCount,
    dashboardReport,
    expiringContracts.length,
    fourWheelerCount,
    isCommitteeLevel,
    isSocietyOpsLevel,
    paidBills.length,
    pendingBillsCount,
    totalBillAmount,
    twoWheelerCount,
  ]);

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
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="h-7 w-7 animate-sun text-[var(--text-secondary)]" />;
    if (code >= 1 && code <= 3) return <Cloud className="h-7 w-7 animate-pulse text-[var(--text-secondary)]" />;
    if (code >= 51) return <Cloud className="h-7 w-7 text-[var(--text-secondary)]" />;
    return <Sun className="h-7 w-7 animate-sun text-[var(--text-secondary)]" />;
  };

  const getWeatherDesc = (code) => {
    if (code === 0) return "Clear Sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 51 && code <= 67) return "Rainy";
    if (code >= 95) return "Thunderstorm";
    return "Sunny";
  };

  return (
    <div className="space-y-8 pb-10 animate-fadeIn">
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

      <section className={sectionShellClass}>
        <SectionHeader
          icon={Activity}
          eyebrow={isMemberOrTenant ? "RESIDENT VIEW" : isPlatformLevel ? "EXECUTIVE VIEW" : "OPERATIONS VIEW"}
          title={isMemberOrTenant ? "Your essentials" : isPlatformLevel ? "Command summary" : "Society snapshot"}
          description={isMemberOrTenant
            ? "Only the signals that need your attention right now."
            : "A simplified dashboard with core metrics, live updates, and action items."}
        />
        <div className={clsx("grid gap-4", primaryStats.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
          {primaryStats.map((card, index) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={card.value}
              icon={card.icon}
              variant={card.variant}
              subtext={card.subtext}
              delay={index * 40}
            />
          ))}
        </div>
      </section>

      {isMemberOrTenant ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className={sectionShellClass}>
            <SectionHeader
              icon={ShieldCheck}
              eyebrow="RESIDENT DIGEST"
              title="Home pulse"
              description="Notices, bills, and support requests without the clutter."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <MetricPanel
                title="Outstanding amount"
                value={formatCurrency(pendingBillsCount.reduce((sum, bill) => sum + (bill.amount || 0), 0))}
                helper={pendingBillsCount.length > 0 ? `${pendingBillsCount.length} unpaid bills in queue` : "No outstanding bills"}
                icon={CreditCard}
                tone="amber"
              />
              <MetricPanel
                title="Support load"
                value={memberIssueStats.myOpenTicketsCount + memberIssueStats.myPendingComplaintsCount}
                helper="Open tickets and pending complaints still being handled"
                icon={Ticket}
                tone="blue"
              />
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <FeedPanel title="Recent notices" icon={Bell} items={noticeItems} emptyText="No recent notices." badgeLabel={`${noticeItems.length} updates`} />
              <FeedPanel title="Pending bills" icon={Clock} items={pendingBillItems} emptyText="No pending bills." badgeLabel={`${pendingBillsCount.length} pending`} />
            </div>
          </section>

          <FeedPanel
            title="Building activity"
            icon={ShieldCheck}
            items={securityFeedItems}
            emptyText="No building activity has been recorded yet."
            badgeLabel="Live"
          />
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className={sectionShellClass}>
              <SectionHeader
                icon={Building2}
                eyebrow={isPlatformLevel ? "OVERVIEW" : "OPERATIONS"}
                title={isPlatformLevel ? "Portfolio health" : "Operations board"}
                description={isPlatformLevel ? "High-value operational signals across the network." : "Simplified operational health without the chart overload."}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <ProgressBoard
                  title={isPlatformLevel ? "User mix" : "Unit occupancy"}
                  caption={isPlatformLevel ? "Distribution across key user groups." : "How each unit category is performing."}
                  items={isPlatformLevel ? roleMix : unitBreakdown}
                  emptyText="No occupancy data available yet."
                />
                <ProgressBoard
                  title={isPlatformLevel ? "Society spotlight" : "Issue flow"}
                  caption={isPlatformLevel ? "Top societies ranked by occupancy." : "Open, active, and resolved issue balance."}
                  items={isPlatformLevel ? societySpotlight : issueBreakdown}
                  emptyText="No ranked societies available yet."
                />
                <ProgressBoard
                  title="Collections"
                  caption="Current recovery status across billing records."
                  items={billingBreakdown}
                  emptyText="No billing activity yet."
                />
                <div className={panelClass}>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Critical reminders</h3>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Open issues</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{openTickets.length + pendingComplaints.length} items need attention right now.</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Expiring agreements</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{expiringTenants.length + expiringContracts.length} contracts or tenant agreements expire in 30 days.</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Parking footprint</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{fourWheelerCount + twoWheelerCount} registered vehicles currently mapped to units.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5">
              <FeedPanel title="Recent notices" icon={Bell} items={noticeItems} emptyText="No recent notices." badgeLabel={`${noticeItems.length} items`} />
              <FeedPanel title="Security feed" icon={ShieldCheck} items={securityFeedItems} emptyText="No security events yet." badgeLabel="Live" />
            </div>
          </div>

          {operationsCards.length > 0 && (
            <section className={sectionShellClass}>
              <SectionHeader
                icon={DollarSign}
                eyebrow="FINANCE"
                title="Financial snapshot"
                description="A cleaner financial view with four concise signals instead of extra graphs."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {operationsCards.map((item) => (
                  <MetricPanel
                    key={item.key}
                    title={item.title}
                    value={item.value}
                    helper={item.helper}
                    icon={item.icon}
                    tone={item.tone}
                  />
                ))}
              </div>
            </section>
          )}

          {isSocietyOpsLevel && (
            <div className="grid gap-5 lg:grid-cols-3">
              <AlertCard
                title="Expiring Contracts"
                icon={AlertTriangle}
                tone="yellow"
                items={expiringContracts.map((contract) => ({
                  title: contract.title,
                  subtitle: new Date(contract.endDate).toLocaleDateString(),
                }))}
              />
              <AlertCard
                title="Expiring Tenant Agreements"
                icon={UserCheck}
                tone="teal"
                items={expiringTenants.map((tenant) => ({
                  title: tenant.name,
                  subtitle: new Date(tenant.agreementEndDate).toLocaleDateString(),
                }))}
              />
              <AlertCard
                title="Pending Tickets"
                icon={Clock}
                tone="red"
                items={pendingTickets.map((ticket) => ({
                  title: ticket.title,
                  subtitle: ticket.type,
                }))}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
