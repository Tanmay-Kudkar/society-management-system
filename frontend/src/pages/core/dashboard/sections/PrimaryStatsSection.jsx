import clsx from "clsx";
import { Activity } from "lucide-react";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import { sectionShellClass } from "../utils/dashboardUtils";

export default function PrimaryStatsSection({ roleUi, primaryStats }) {
  return (
    <section className={sectionShellClass}>
      <SectionHeader icon={Activity} eyebrow={roleUi.eyebrow} title={roleUi.title} description={roleUi.description} />
      <div className={clsx("grid gap-4", primaryStats.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
        {primaryStats.map((card, index) => (
          <StatCard key={card.key} title={card.title} value={card.value} icon={card.icon} variant={card.variant} subtext={card.subtext} delay={index * 40} onClick={card.onClick} />
        ))}
      </div>
    </section>
  );
}
