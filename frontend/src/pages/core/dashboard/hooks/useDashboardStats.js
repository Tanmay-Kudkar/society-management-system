import { useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  Car,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  ShieldCheck,
  Ticket,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { formatCurrency } from "../utils/dashboardUtils";
import { formatDate, formatDateTime } from "../../../../utils/formatUtils";

export default function useDashboardStats(input) {
  const {
    allTickets,
    canManageTenants,
    canSeeFinanceSection,
    canViewFinancials,
    complaints,
    contracts,
    dashboardReport,
    flats,
    isCommitteeLevel,
    isEmployeeRole,
    isManagerRole,
    isMemberOrTenant,
    isPlatformLevel,
    isSocietyOpsLevel,
    maintenanceBills,
    navigate,
    notices,
    platformUsers,
    role,
    societies,
    tenants,
    user,
    vehicles,
    securityLogs,
  } = input;

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

  const activeTenantsCount = tenants.filter((tenant) => tenant.isActive).length;
  const activeContractsCount = contracts.filter((contract) => contract.isActive).length;
  const fourWheelerCount = vehicles.filter((vehicle) => vehicle.vehicleType === "FOUR_WHEELER").length;
  const twoWheelerCount = vehicles.filter((vehicle) => vehicle.vehicleType === "TWO_WHEELER").length;
  const securityAlertCount = securityLogs.filter((log) => String(log.type || "").toUpperCase() === "ALERT").length;

  const totalUnits = flats.length;
  const isUnitOccupied = (flat) => flat.isOccupied || !!flat.ownerUserId || !!flat.ownerName;
  const occupiedUnits = flats.filter(isUnitOccupied).length;

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
        const units =
          (society.actualFlats ?? society.totalFlats ?? 0)
          + (society.actualShops ?? society.totalShops ?? 0)
          + (society.actualOffices ?? society.totalOffices ?? 0);
        const occupied =
          (society.occupiedFlats ?? 0)
          + (society.occupiedShops ?? 0)
          + (society.occupiedOffices ?? 0);
        const percent = units > 0 ? Math.round((occupied / units) * 100) : 0;
        return {
          label: society.name || `Society ${society.id}`,
          value: `${percent}%`,
          helper: `${occupied}/${units} occupied units`,
          meta: `${occupied} occupied`,
          percent,
          tone: percent >= 75 ? "emerald" : percent >= 45 ? "amber" : "rose",
        };
      })
      .filter((item) => item.percent > 0)
      .sort((left, right) => right.percent - left.percent)
      .slice(0, 4);
  }, [societies]);

  const priorityTicketBreakdown = useMemo(() => {
    const rows = [
      { label: "Urgent", count: allTickets.filter((t) => t.priority === "URGENT" && (t.status === "OPEN" || t.status === "IN_PROGRESS")).length, tone: "rose" },
      { label: "High", count: allTickets.filter((t) => t.priority === "HIGH" && (t.status === "OPEN" || t.status === "IN_PROGRESS")).length, tone: "amber" },
      { label: "Medium", count: allTickets.filter((t) => t.priority === "MEDIUM" && (t.status === "OPEN" || t.status === "IN_PROGRESS")).length, tone: "blue" },
      { label: "Low", count: allTickets.filter((t) => t.priority === "LOW" && (t.status === "OPEN" || t.status === "IN_PROGRESS")).length, tone: "emerald" },
    ];
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    return rows
      .filter((row) => row.count > 0)
      .map((row) => ({
        label: row.label,
        value: row.count,
        helper: total > 0 ? `${Math.round((row.count / total) * 100)}% of open tickets` : "No open tickets",
        percent: total > 0 ? Math.round((row.count / total) * 100) : 0,
        tone: row.tone,
      }));
  }, [allTickets]);

  const ticketsBySociety = useMemo(() => {
    const map = {};
    allTickets
      .filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS")
      .forEach((ticket) => {
        const name = ticket.societyName || "Unknown";
        if (!map[name]) map[name] = { name, count: 0, urgent: 0 };
        map[name].count += 1;
        if (ticket.priority === "URGENT" || ticket.priority === "HIGH") map[name].urgent += 1;
      });
    return Object.values(map).sort((left, right) => right.count - left.count).slice(0, 5);
  }, [allTickets]);

  const unitBreakdown = useMemo(() => {
    const items = [
      {
        label: "Flats",
        total: flats.filter((flat) => !flat.unitType || flat.unitType === "FLAT").length,
        occupied: flats.filter((flat) => (!flat.unitType || flat.unitType === "FLAT") && isUnitOccupied(flat)).length,
        tone: "blue",
      },
      {
        label: "Shops",
        total: flats.filter((flat) => flat.unitType === "SHOP").length,
        occupied: flats.filter((flat) => flat.unitType === "SHOP" && isUnitOccupied(flat)).length,
        tone: "emerald",
      },
      {
        label: "Offices",
        total: flats.filter((flat) => flat.unitType === "OFFICE").length,
        occupied: flats.filter((flat) => flat.unitType === "OFFICE" && isUnitOccupied(flat)).length,
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
          title: "Total Societies",
          value: societies.length,
          icon: Building2,
          variant: "blue",
          subtext: `${platformUsers.length} registered users`,
          onClick: () => navigate("/society-admins"),
        },
        {
          key: "platform-admins",
          title: "Society Admins",
          value: societyAdminsCount,
          icon: UserCheck,
          variant: "green",
          subtext: `${membersCount + tenantsCount} residents onboarded`,
          onClick: () => navigate("/society-admins"),
        },
        {
          key: "platform-tickets",
          title: "Open Tickets",
          value: openTickets.length,
          icon: Ticket,
          variant: "yellow",
          subtext: `${allTickets.filter((t) => t.priority === "HIGH" || t.priority === "URGENT").length} high/urgent priority`,
          onClick: () => navigate("/tickets"),
        },
        {
          key: "platform-complaints",
          title: "Pending Complaints",
          value: pendingComplaints.length,
          icon: AlertTriangle,
          variant: "red",
          subtext: `${complaints.length} total tracked`,
          onClick: () => navigate("/complaints"),
        },
      ];
    }

    if (role === "TREASURER") {
      return [
        {
          key: "treasurer-pending",
          title: "Pending Bills",
          value: pendingBillsCount.length,
          icon: CreditCard,
          variant: "orange",
          subtext: overdueBills.length > 0 ? `${overdueBills.length} overdue` : "No overdue bills",
        },
        {
          key: "treasurer-recovery",
          title: "Collection Rate",
          value: `${billCollectionRate}%`,
          icon: TrendingUp,
          variant: "green",
          subtext: `${paidBills.length}/${billTotalCount} paid bills`,
        },
        {
          key: "treasurer-billed",
          title: "Total Billed",
          value: formatCurrency(totalBillAmount),
          icon: DollarSign,
          variant: "teal",
          subtext: "Across all maintenance records",
        },
        {
          key: "treasurer-finance-issues",
          title: "Finance Escalations",
          value: pendingTickets.length,
          icon: AlertTriangle,
          variant: "yellow",
          subtext: "Tickets requiring payment follow-up",
        },
      ];
    }

    if (role === "SECRETARY") {
      return [
        { key: "secretary-notices", title: "Recent Notices", value: notices.length, icon: Bell, variant: "blue", subtext: "Latest communication items" },
        { key: "secretary-pending-tickets", title: "Pending Tickets", value: pendingTickets.length, icon: Ticket, variant: "sky", subtext: "Requests waiting for coordination" },
        { key: "secretary-expiring", title: "Expiring Agreements", value: expiringTenants.length + expiringContracts.length, icon: FileText, variant: "orange", subtext: "Renewals due within 30 days" },
        { key: "secretary-complaints", title: "Pending Complaints", value: pendingComplaints.length, icon: AlertTriangle, variant: "amber", subtext: "Cases still in progress" },
      ];
    }

    if (role === "CHAIRMAN") {
      return [
        { key: "chairman-open-issues", title: "Open Issues", value: openTickets.length + pendingComplaints.length, icon: AlertTriangle, variant: "yellow", subtext: "High-priority items awaiting closure" },
        { key: "chairman-security", title: "Security Alerts", value: securityAlertCount, icon: ShieldCheck, variant: "red", subtext: "Alert-level events in recent feed" },
        { key: "chairman-collection", title: "Collection Rate", value: `${billCollectionRate}%`, icon: DollarSign, variant: "teal", subtext: billTotalCount > 0 ? `${paidBills.length}/${billTotalCount} cleared` : "No bills generated yet" },
        { key: "chairman-expiring", title: "Expiring Agreements", value: expiringTenants.length + expiringContracts.length, icon: Clock, variant: "orange", subtext: "Contracts and tenancy nearing expiry" },
      ];
    }

    if (role === "COMMITTEE") {
      return [
        { key: "committee-queue", title: "Issue Queue", value: pendingTickets.length + pendingComplaints.length, icon: Ticket, variant: "amber", subtext: "Items pending committee review" },
        { key: "committee-notices", title: "Recent Notices", value: notices.length, icon: Bell, variant: "blue", subtext: "Communication stream" },
        { key: "committee-occupancy", title: "Occupied Units", value: occupiedUnits, icon: Home, variant: "cyan", subtext: `${totalUnits} total units` },
        { key: "committee-vehicles", title: "Registered Vehicles", value: fourWheelerCount + twoWheelerCount, icon: Car, variant: "violet", subtext: `${fourWheelerCount} four-wheelers and ${twoWheelerCount} two-wheelers` },
      ];
    }

    if (role === "MANAGER") {
      return [
        { key: "manager-pending-tickets", title: "Pending Tickets", value: pendingTickets.length, icon: Ticket, variant: "sky", subtext: "Operational requests awaiting resolution" },
        { key: "manager-pending-complaints", title: "Pending Complaints", value: pendingComplaints.length, icon: AlertTriangle, variant: "amber", subtext: "Resident concerns in progress" },
        { key: "manager-expiring-agreements", title: "Expiring Agreements", value: expiringTenants.length + expiringContracts.length, icon: FileText, variant: "orange", subtext: "Need renewal action in next 30 days" },
        { key: "manager-occupancy", title: "Occupied Units", value: occupiedUnits, icon: Home, variant: "blue", subtext: `${totalUnits} total units` },
      ];
    }

    if (role === "EMPLOYEE") {
      return [
        { key: "employee-tickets", title: "Open Tickets", value: openTickets.length, icon: Ticket, variant: "sky", subtext: "Support requests currently active" },
        { key: "employee-complaints", title: "In-Progress Complaints", value: pendingComplaints.length, icon: AlertTriangle, variant: "amber", subtext: "Complaints requiring field updates" },
        { key: "employee-notices", title: "Recent Notices", value: notices.length, icon: Bell, variant: "blue", subtext: "Operational announcements" },
        { key: "employee-vehicles", title: "Vehicle Footprint", value: fourWheelerCount + twoWheelerCount, icon: Car, variant: "violet", subtext: `${fourWheelerCount} four-wheelers and ${twoWheelerCount} two-wheelers` },
      ];
    }

    return [
      { key: "society-units", title: "Occupied Units", value: occupiedUnits, icon: Home, variant: "blue", subtext: `${totalUnits} total units` },
      ...(canManageTenants() ? [{ key: "society-tenants", title: "Active Tenants", value: activeTenantsCount, icon: UserCheck, variant: "cyan", subtext: `${expiringTenants.length} expiring soon` }] : []),
      { key: "society-issues", title: "Open Issues", value: openTickets.length + pendingComplaints.length, icon: Ticket, variant: "sky", subtext: `${pendingTickets.length} awaiting action` },
      ...(canViewFinancials() ? [{ key: "society-bills", title: "Pending Bills", value: pendingBillsCount.length, icon: CreditCard, variant: "orange", subtext: overdueBills.length > 0 ? `${overdueBills.length} overdue` : "Stable collections" }] : []),
    ];
  }, [
    activeTenantsCount,
    allTickets,
    billCollectionRate,
    billTotalCount,
    canManageTenants,
    canViewFinancials,
    complaints,
    expiringContracts.length,
    expiringTenants.length,
    fourWheelerCount,
    isMemberOrTenant,
    isPlatformLevel,
    memberIssueStats,
    membersCount,
    navigate,
    notices.length,
    occupiedUnits,
    openTickets.length,
    overdueBills.length,
    paidBills.length,
    pendingBillsCount.length,
    pendingComplaints.length,
    pendingTickets.length,
    platformUsers.length,
    role,
    securityAlertCount,
    societies.length,
    societyAdminsCount,
    tenantsCount,
    totalBillAmount,
    totalUnits,
    twoWheelerCount,
  ]);

  const noticeItems = notices.slice(0, 5).map((notice) => ({
    title: notice.title || notice.content,
    meta: notice.createdAt ? formatDate(notice.createdAt) : "Recently posted",
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
    meta: formatDateTime(log.createdAt),
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
    meta: bill.dueDate ? `Due ${formatDate(bill.dueDate)}` : "Due date unavailable",
    badge: bill.amount ? `Rs ${bill.amount.toLocaleString()}` : "Pending",
    badgeTone: overdueBills.some((entry) => entry.id === bill.id) ? "danger" : "warning",
  }));

  const roleActionItems = useMemo(() => {
    if (isPlatformLevel) {
      return [
        { title: "Society onboarding", value: societies.length, helper: "Active societies in network", tone: "blue" },
        { title: "Admin coverage", value: societyAdminsCount, helper: "Society admins currently mapped", tone: "emerald" },
        { title: "Open tickets", value: openTickets.length, helper: "Tickets awaiting resolution", tone: "amber" },
        { title: "Pending complaints", value: pendingComplaints.length, helper: "Complaints from residents", tone: "rose" },
      ];
    }

    if (role === "SOCIETY_ADMIN") {
      return [
        { title: "Resident occupancy", value: `${occupiedUnits}/${totalUnits || 0}`, helper: "Occupied units against inventory", tone: "blue" },
        { title: "Collections", value: `${billCollectionRate}%`, helper: "Current maintenance recovery", tone: "emerald" },
        { title: "Pending escalations", value: pendingTickets.length + pendingComplaints.length, helper: "Requests awaiting closure", tone: "amber" },
      ];
    }

    if (role === "TREASURER") {
      return [
        { title: "Outstanding dues", value: formatCurrency(pendingBillsCount.reduce((sum, bill) => sum + (bill.amount || 0), 0)), helper: `${pendingBillsCount.length} pending bills`, tone: "amber" },
        { title: "Overdue cases", value: overdueBills.length, helper: "Bills past due date", tone: "rose" },
        { title: "Total billed", value: formatCurrency(totalBillAmount), helper: `${billTotalCount} billing records`, tone: "blue" },
      ];
    }

    if (role === "SECRETARY") {
      return [
        { title: "Notice stream", value: notices.length, helper: "Recent communication updates", tone: "blue" },
        { title: "Ticket queue", value: pendingTickets.length, helper: "Requests waiting for dispatch", tone: "amber" },
        { title: "Renewal watch", value: expiringTenants.length + expiringContracts.length, helper: "Agreements expiring in 30 days", tone: "violet" },
      ];
    }

    if (role === "CHAIRMAN") {
      return [
        { title: "Critical issues", value: openTickets.length + pendingComplaints.length, helper: "High-priority operational concerns", tone: "amber" },
        { title: "Security alerts", value: securityAlertCount, helper: "Alert-level security events", tone: "rose" },
        { title: "Collection health", value: `${billCollectionRate}%`, helper: "Recovery trend for society dues", tone: "emerald" },
      ];
    }

    if (role === "COMMITTEE") {
      return [
        { title: "Issue queue", value: pendingTickets.length + pendingComplaints.length, helper: "Items awaiting committee review", tone: "amber" },
        { title: "Resident load", value: activeTenantsCount, helper: "Active tenant occupancy", tone: "blue" },
        { title: "Parking footprint", value: fourWheelerCount + twoWheelerCount, helper: "Vehicles mapped to units", tone: "violet" },
      ];
    }

    if (role === "MANAGER") {
      return [
        { title: "Operations queue", value: pendingTickets.length + pendingComplaints.length, helper: "Tickets and complaints pending action", tone: "amber" },
        { title: "Renewal watch", value: expiringTenants.length + expiringContracts.length, helper: "Agreements nearing expiry", tone: "violet" },
        { title: "Security feed", value: securityFeedItems.length, helper: "Recent activity items to monitor", tone: "blue" },
      ];
    }

    if (role === "EMPLOYEE") {
      return [
        { title: "Daily support load", value: openTickets.length, helper: "Open tickets in the system", tone: "blue" },
        { title: "Complaint follow-up", value: pendingComplaints.length, helper: "Complaints still in progress", tone: "amber" },
        { title: "Broadcast updates", value: notices.length, helper: "Recent notices affecting operations", tone: "violet" },
      ];
    }

    return [
      { title: "My pending bills", value: pendingBillsCount.length, helper: "Bills requiring your attention", tone: "amber" },
      { title: "My open tickets", value: memberIssueStats.myOpenTicketsCount, helper: "Support tickets still open", tone: "blue" },
      { title: "My pending complaints", value: memberIssueStats.myPendingComplaintsCount, helper: "Complaints in processing", tone: "rose" },
    ];
  }, [
    activeTenantsCount,
    billCollectionRate,
    billTotalCount,
    expiringContracts.length,
    expiringTenants.length,
    fourWheelerCount,
    memberIssueStats.myOpenTicketsCount,
    memberIssueStats.myPendingComplaintsCount,
    notices.length,
    occupiedUnits,
    openTickets.length,
    overdueBills.length,
    pendingBillsCount,
    pendingComplaints.length,
    pendingTickets.length,
    role,
    securityAlertCount,
    securityFeedItems.length,
    societies.length,
    societyAdminsCount,
    totalBillAmount,
    totalUnits,
    twoWheelerCount,
  ]);

  const operationsCards = useMemo(() => {
    const items = [];

    if (dashboardReport && isCommitteeLevel() && canSeeFinanceSection) {
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
        }
      );
    } else if (billTotalCount > 0 && canSeeFinanceSection) {
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
        }
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

      if (!isEmployeeRole) {
        items.push({
          key: "contracts",
          title: "Active Contracts",
          value: activeContractsCount,
          helper: `${expiringContracts.length} ending in 30 days`,
          icon: FileText,
          tone: "amber",
        });
      }

      if (isManagerRole) {
        items.push({
          key: "manager-open-issues",
          title: "Open Issues",
          value: openTickets.length + pendingComplaints.length,
          helper: "Combined ticket and complaint pressure",
          icon: AlertTriangle,
          tone: "blue",
        });
      }
    }

    return items.slice(0, 4);
  }, [
    activeContractsCount,
    billCollectionRate,
    billTotalCount,
    canSeeFinanceSection,
    dashboardReport,
    expiringContracts.length,
    fourWheelerCount,
    isCommitteeLevel,
    isEmployeeRole,
    isManagerRole,
    isSocietyOpsLevel,
    openTickets.length,
    paidBills.length,
    pendingBillsCount,
    pendingComplaints.length,
    totalBillAmount,
    twoWheelerCount,
  ]);

  const overviewConfig = isPlatformLevel
    ? {
        eyebrow: "NETWORK OVERVIEW",
        title: "Platform health",
        description: "Society operations, ticket pressure, and user distribution across the network.",
        boardA: {
          title: "Ticket priority",
          caption: "Open tickets grouped by priority level.",
          items: priorityTicketBreakdown,
          emptyText: "No open tickets across societies.",
        },
        boardB: {
          title: "Society spotlight",
          caption: "Top societies ranked by occupancy.",
          items: societySpotlight,
          emptyText: "No ranked societies available yet.",
        },
        boardC: {
          title: "User mix",
          caption: "Distribution across key user groups.",
          items: roleMix,
          emptyText: "No user-distribution data available yet.",
        },
      }
    : role === "TREASURER"
      ? {
          eyebrow: "TREASURY",
          title: "Treasury performance",
          description: "Cashflow pressure, recoveries, and follow-up priorities.",
          boardA: {
            title: "Collections",
            caption: "Paid, pending, and overdue bill mix.",
            items: billingBreakdown,
            emptyText: "No billing activity yet.",
          },
          boardB: {
            title: "Issue flow",
            caption: "Financial issues requiring closure.",
            items: issueBreakdown,
            emptyText: "No issue trends available yet.",
          },
          boardC: {
            title: "Unit occupancy",
            caption: "Occupancy baseline for billing context.",
            items: unitBreakdown,
            emptyText: "No occupancy data available yet.",
          },
        }
      : role === "SECRETARY"
        ? {
            eyebrow: "COORDINATION",
            title: "Secretary operations",
            description: "Communication and issue execution status.",
            boardA: {
              title: "Issue flow",
              caption: "Open, active, and resolved case balance.",
              items: issueBreakdown,
              emptyText: "No issue trends available yet.",
            },
            boardB: {
              title: "Unit occupancy",
              caption: "Current occupancy distribution across unit types.",
              items: unitBreakdown,
              emptyText: "No occupancy data available yet.",
            },
            boardC: {
              title: "Collections",
              caption: "Billing pressure indicators for committee follow-up.",
              items: billingBreakdown,
              emptyText: "No billing activity yet.",
            },
          }
        : role === "CHAIRMAN"
          ? {
              eyebrow: "GOVERNANCE",
              title: "Chairman oversight",
              description: "Governance-level risk, billing, and occupancy indicators.",
              boardA: {
                title: "Issue flow",
                caption: "Status of pending and resolved concerns.",
                items: issueBreakdown,
                emptyText: "No issue trends available yet.",
              },
              boardB: {
                title: "Collections",
                caption: "Recovery health across billed records.",
                items: billingBreakdown,
                emptyText: "No billing activity yet.",
              },
              boardC: {
                title: "Unit occupancy",
                caption: "Occupancy by property category.",
                items: unitBreakdown,
                emptyText: "No occupancy data available yet.",
              },
            }
          : role === "MANAGER"
            ? {
                eyebrow: "EXECUTION",
                title: "Manager operations",
                description: "Day-to-day closures, escalations, and occupancy health.",
                boardA: {
                  title: "Issue flow",
                  caption: "Open, active, and resolved issue balance.",
                  items: issueBreakdown,
                  emptyText: "No issue trends available yet.",
                },
                boardB: {
                  title: "Unit occupancy",
                  caption: "Occupancy movement across unit categories.",
                  items: unitBreakdown,
                  emptyText: "No occupancy data available yet.",
                },
                boardC: {
                  title: "Collections",
                  caption: "Billing status useful for follow-up execution.",
                  items: billingBreakdown,
                  emptyText: "No billing activity yet.",
                },
              }
            : role === "EMPLOYEE"
              ? {
                  eyebrow: "FIELD OPS",
                  title: "Employee activity board",
                  description: "Ground-level request status and occupancy context.",
                  boardA: {
                    title: "Issue flow",
                    caption: "Open and in-progress work items.",
                    items: issueBreakdown,
                    emptyText: "No issue trends available yet.",
                  },
                  boardB: {
                    title: "Unit occupancy",
                    caption: "Current occupancy map for field coordination.",
                    items: unitBreakdown,
                    emptyText: "No occupancy data available yet.",
                  },
                  boardC: {
                    title: "Vehicle mix",
                    caption: "Parking load indicators by type.",
                    items: [
                      {
                        label: "Four-wheelers",
                        value: fourWheelerCount,
                        helper: "Registered inside society",
                        percent: fourWheelerCount + twoWheelerCount > 0 ? Math.round((fourWheelerCount / (fourWheelerCount + twoWheelerCount)) * 100) : 0,
                        tone: "blue",
                      },
                      {
                        label: "Two-wheelers",
                        value: twoWheelerCount,
                        helper: "Registered inside society",
                        percent: fourWheelerCount + twoWheelerCount > 0 ? Math.round((twoWheelerCount / (fourWheelerCount + twoWheelerCount)) * 100) : 0,
                        tone: "violet",
                      },
                    ].filter((item) => item.value > 0),
                    emptyText: "No vehicle records available yet.",
                  },
                }
              : {
                  eyebrow: "OPERATIONS",
                  title: "Operations board",
                  description: "Simplified operational health without the chart overload.",
                  boardA: {
                    title: "Unit occupancy",
                    caption: "How each unit category is performing.",
                    items: unitBreakdown,
                    emptyText: "No occupancy data available yet.",
                  },
                  boardB: {
                    title: "Issue flow",
                    caption: "Open, active, and resolved issue balance.",
                    items: issueBreakdown,
                    emptyText: "No issue trends available yet.",
                  },
                  boardC: {
                    title: "Collections",
                    caption: "Current recovery status across billing records.",
                    items: billingBreakdown,
                    emptyText: "No billing activity yet.",
                  },
                };

  return {
    activeTenantsCount,
    billCollectionRate,
    billTotalCount,
    expiringContracts,
    expiringTenants,
    fourWheelerCount,
    memberIssueStats,
    noticeItems,
    openTickets,
    operationsCards,
    overviewConfig,
    overdueBills,
    pendingBillItems,
    pendingBillsCount,
    pendingComplaints,
    pendingTickets,
    primaryStats,
    roleActionItems,
    securityAlertCount,
    securityFeedItems,
    ticketsBySociety,
    totalBillAmount,
    totalUnits,
    twoWheelerCount,
    occupiedUnits,
  };
}
