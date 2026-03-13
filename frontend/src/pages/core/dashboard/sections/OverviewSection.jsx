import { Building2, ChevronRight } from "lucide-react";
import ProgressBoard from "../components/ProgressBoard";
import SectionHeader from "../components/SectionHeader";
import { panelClass, sectionShellClass } from "../utils/dashboardUtils";

export default function OverviewSection({
  overviewConfig,
  isPlatformLevel,
  ticketsBySociety,
  societies,
  navigate,
  openIssuesCount,
  expiringAgreementsCount,
  vehicleCount,
}) {
  return (
    <section className={sectionShellClass}>
      <SectionHeader icon={Building2} eyebrow={overviewConfig.eyebrow} title={overviewConfig.title} description={overviewConfig.description} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProgressBoard
          title={overviewConfig.boardA.title}
          caption={overviewConfig.boardA.caption}
          items={overviewConfig.boardA.items}
          emptyText={overviewConfig.boardA.emptyText}
        />
        <ProgressBoard
          title={overviewConfig.boardB.title}
          caption={overviewConfig.boardB.caption}
          items={overviewConfig.boardB.items}
          emptyText={overviewConfig.boardB.emptyText}
        />
        <ProgressBoard
          title={overviewConfig.boardC.title}
          caption={overviewConfig.boardC.caption}
          items={overviewConfig.boardC.items}
          emptyText={overviewConfig.boardC.emptyText}
        />
        <div className={panelClass}>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{isPlatformLevel ? "Tickets by society" : "Critical reminders"}</h3>
          <div className="mt-4 space-y-3">
            {isPlatformLevel ? (
              ticketsBySociety.length > 0 ? (
                ticketsBySociety.map((item) => (
                  <div
                    key={item.name}
                    className="cursor-pointer rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
                    onClick={() => {
                      const society = societies.find((entry) => entry.name === item.name);
                      if (society) navigate(`/dashboard?society=${society.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                      <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.count} open tickets{item.urgent > 0 ? ` - ${item.urgent} high/urgent` : ""}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">No open tickets across societies.</p>
              )
            ) : (
              <>
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Open issues</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{openIssuesCount} items need attention right now.</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Expiring agreements</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{expiringAgreementsCount} agreements expire in 30 days.</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Parking footprint</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{vehicleCount} registered vehicles currently mapped to units.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
