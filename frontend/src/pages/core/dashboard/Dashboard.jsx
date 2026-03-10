import { Bell, Clock, Cloud, CreditCard, DollarSign, ShieldCheck, Sun, Ticket } from "lucide-react";

import { DashboardSkeleton, WakeUpBanner } from "../../../components/SkeletonLoaders";
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
    isPlatformLevel,
    isPlatformOwner,
    isMemberOrTenant,
    isSocietyOpsLevel,
    canSeeFinanceSection,
    canSeeContractAlerts,
    showSkeleton,
    weather,
    locationName,
    notices,
    societies,
  } = dashboardData;

  const {
    primaryStats,
    roleActionItems,
    overviewConfig,
    noticeItems,
    securityFeedItems,
    pendingBillItems,
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
    pendingTickets,
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
      />

      <PrimaryStatsSection roleUi={roleUi} primaryStats={primaryStats} />
      <RolePrioritySection role={role} roleActionItems={roleActionItems} />

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
            badgeLabel="Live"
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
              <FeedSection title="Security feed" icon={ShieldCheck} items={securityFeedItems} emptyText="No security events yet." badgeLabel="Live" />
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

          {isSocietyOpsLevel && (
            <AlertsSection
              canSeeContractAlerts={canSeeContractAlerts}
              expiringContracts={expiringContracts}
              expiringTenants={expiringTenants}
              pendingTickets={pendingTickets}
            />
          )}
        </>
      )}
    </div>
  );
}
