import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, Clock, Cloud, CreditCard, DollarSign, MapPin, ShieldCheck, Sun, Ticket } from "lucide-react";

import { DashboardSkeleton, WakeUpBanner } from "../../../components/SkeletonLoaders";
import { NeonSweepButton } from "../../../components";
import MetricPanel from "./components/MetricPanel";
import SectionHeader from "./components/SectionHeader";
import AlertsSection from "./sections/AlertsSection";
import FeedSection from "./sections/FeedSection";
import HeroSection from "./sections/HeroSection";
import OverviewSection from "./sections/OverviewSection";
import PrimaryStatsSection from "./sections/PrimaryStatsSection";
import RolePrioritySection from "./sections/RolePrioritySection";
import useDashboardData from "./hooks/useDashboardData";
import useDashboardStats from "./hooks/useDashboardStats";
import { formatCurrency, getTimeGreeting, sectionShellClass } from "./utils/dashboardUtils";

const MISSING_LOCATION_DISMISS_KEY = "dashboard.missingSocietyLocationDismissed.v1";

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

export default function Dashboard() {
  const dashboardData = useDashboardData();
  const dashboardStats = useDashboardStats(dashboardData);

  const {
    user,
    role,
    roleUi,
    navigate,
    dashboardSocietyId,
    isPlatformLevel,
    isPlatformOwner,
    isMemberOrTenant,
    isSocietyOpsLevel,
    currentSocietyName,
    canSeeFinanceSection,
    canSeeContractAlerts,
    showSkeleton,
    weather,
    locationName,
    notices,
    societies,
  } = dashboardData;

  const missingLocationSocieties = useMemo(
    () => societies.filter((society) => society?.exactLatitude == null || society?.exactLongitude == null),
    [societies],
  );

  const missingLocationSignature = useMemo(
    () => missingLocationSocieties.map((society) => society.id).sort((a, b) => a - b).join(","),
    [missingLocationSocieties],
  );

  const [isMissingLocationBannerDismissed, setIsMissingLocationBannerDismissed] = useState(false);

  useEffect(() => {
    if (!isPlatformOwner || !missingLocationSignature) {
      setIsMissingLocationBannerDismissed(false);
      return;
    }

    const storedSignature = localStorage.getItem(MISSING_LOCATION_DISMISS_KEY) || "";
    setIsMissingLocationBannerDismissed(storedSignature === missingLocationSignature);
  }, [isPlatformOwner, missingLocationSignature]);

  const dismissMissingLocationBanner = () => {
    localStorage.setItem(MISSING_LOCATION_DISMISS_KEY, missingLocationSignature);
    setIsMissingLocationBannerDismissed(true);
  };

  const navigateToScoped = (path) => {
    if (user?.role === 'MASTER_ADMIN' && dashboardSocietyId) {
      const [pathname, search = ""] = String(path).split("?")
      const params = new URLSearchParams(search)
      if (!params.get("society")) {
        params.set("society", String(dashboardSocietyId))
      }
      const query = params.toString()
      navigate(query ? `${pathname}?${query}` : pathname)
      return
    }
    navigate(path)
  }

  const {
    primaryStats,
    moduleActionCards,
    roleActionItems,
    overviewConfig,
    noticeItems,
    pendingComplaintItems,
    securityFeedItems,
    pendingBillItems,
    pendingTicketItems,
    pendingBillsCount,
    memberIssueStats,
    operationsCards,
    openTickets,
    pendingComplaints,
    expiringTenants,
    expiringContracts,
    fourWheelerCount,
    twoWheelerCount,
    ticketsBySociety,
  } = dashboardStats;

  if (showSkeleton) {
    return (
      <>
        <WakeUpBanner show={showSkeleton} />
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8 pb-10">
      <HeroSection
        user={user}
        notices={notices}
        isMemberOrTenant={isMemberOrTenant}
        isPlatformLevel={isPlatformLevel}
        isPlatformOwner={isPlatformOwner}
        weather={weather}
        locationName={locationName}
        getWeatherDesc={getWeatherDesc}
        getWeatherIcon={getWeatherIcon}
        timeGreeting={getTimeGreeting()}
        currentSocietyName={currentSocietyName}
        currentSocietyId={dashboardSocietyId}
      />

      {isPlatformOwner && missingLocationSocieties.length > 0 && !isMissingLocationBannerDismissed && (
        <section className={sectionShellClass}>
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3 sm:gap-3.5">
                <div className="mt-0.5 shrink-0 rounded-lg bg-amber-500/15 p-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-extrabold leading-tight tracking-tight text-[var(--text-primary)] sm:text-base">
                    Society Location Setup Pending
                  </h3>
                  <p className="mt-1.5 max-w-[44ch] text-[13px] leading-[1.45] text-[var(--text-secondary)] sm:text-sm sm:leading-relaxed">
                    <span className="sm:hidden">
                      {missingLocationSocieties.length} societies need exact location. Admin login is blocked until setup.
                    </span>
                    <span className="hidden sm:inline">
                      {missingLocationSocieties.length} societies are missing exact location. Society Admin login for those societies will be blocked until location is configured.
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {missingLocationSocieties.slice(0, 6).map((society) => (
                  <span
                    key={society.id}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{society.name || `Society ${society.id}`}</span>
                  </span>
                ))}
                {missingLocationSocieties.length > 6 && (
                  <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    +{missingLocationSocieties.length - 6} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <NeonSweepButton
                type="button"
                tone="cyan"
                size="sm"
                onClick={() => navigate("/society-admins")}
                className="w-full sm:w-auto"
              >
                Review Societies
              </NeonSweepButton>
              <NeonSweepButton
                type="button"
                tone="slate"
                size="sm"
                onClick={dismissMissingLocationBanner}
                className="w-full sm:w-auto"
              >
                Dismiss
              </NeonSweepButton>
            </div>
          </div>
        </section>
      )}

      <PrimaryStatsSection roleUi={roleUi} primaryStats={primaryStats} />
      <RolePrioritySection role={role} roleActionItems={roleActionItems} />

      {moduleActionCards.length > 0 && !isPlatformLevel && (
        <section className={sectionShellClass}>
          <SectionHeader
            icon={Ticket}
            eyebrow="ACTION HUB"
            title="Communication workboard"
            description="Click any tile to open the module and take role-allowed actions."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moduleActionCards.map((item) => (
              <MetricPanel
                key={item.key}
                title={item.title}
                value={item.value}
                helper={item.helper}
                tone={item.tone}
                onClick={item.onClick}
              />
            ))}
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <FeedSection
              title="Pending tickets"
              icon={Ticket}
              items={pendingTicketItems}
              emptyText="No pending tickets."
            />
            <FeedSection
              title="Pending complaints"
              icon={AlertTriangle}
              items={pendingComplaintItems}
              emptyText="No pending complaints."
            />
            <FeedSection
              title="Recent notices"
              icon={Bell}
              items={noticeItems}
              emptyText="No recent notices."
            />
          </div>
        </section>
      )}

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
              <FeedSection title="Recent notices" icon={Bell} items={noticeItems} emptyText="No recent notices." badgeLabel={`${noticeItems.length} updates`} />
              <FeedSection title="Pending bills" icon={Clock} items={pendingBillItems} emptyText="No pending bills." badgeLabel={`${pendingBillsCount.length} pending`} />
            </div>
          </section>

          <FeedSection
            title="Building activity"
            icon={ShieldCheck}
            items={securityFeedItems}
            emptyText="No building activity has been recorded yet."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <OverviewSection
              overviewConfig={overviewConfig}
              isPlatformLevel={isPlatformLevel}
              ticketsBySociety={ticketsBySociety}
              societies={societies}
              navigate={navigate}
              openIssuesCount={openTickets.length + pendingComplaints.length}
              expiringAgreementsCount={expiringTenants.length + expiringContracts.length}
              vehicleCount={fourWheelerCount + twoWheelerCount}
            />

            <div className="grid gap-5">
              <FeedSection title="Recent notices" icon={Bell} items={noticeItems} emptyText="No recent notices." badgeLabel={`${noticeItems.length} items`} />
              <FeedSection title="Security feed" icon={ShieldCheck} items={securityFeedItems} emptyText="No security events yet." />
            </div>
          </div>

          {operationsCards.length > 0 && !isPlatformLevel && (canSeeFinanceSection || isSocietyOpsLevel) && (
            <section className={sectionShellClass}>
              <SectionHeader
                icon={DollarSign}
                eyebrow={canSeeFinanceSection ? "FINANCE" : "OPERATIONS INSIGHT"}
                title={canSeeFinanceSection ? "Financial snapshot" : "Execution snapshot"}
                description={
                  canSeeFinanceSection
                    ? "A cleaner financial view with four concise signals instead of extra graphs."
                    : "Operational indicators relevant to on-ground execution and service quality."
                }
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {operationsCards.map((item) => (
                  <MetricPanel key={item.key} title={item.title} value={item.value} helper={item.helper} tone={item.tone} />
                ))}
              </div>
            </section>
          )}

          {isSocietyOpsLevel && canSeeContractAlerts && (
            <AlertsSection
              canSeeContractAlerts={canSeeContractAlerts}
              expiringContracts={expiringContracts}
              expiringTenants={expiringTenants}
              navigate={navigateToScoped}
            />
          )}
        </>
      )}
    </div>
  );
}
