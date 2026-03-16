import clsx from "clsx";
import { Briefcase } from "lucide-react";
import SectionHeader from "../components/SectionHeader";
import MetricPanel from "../components/MetricPanel";
import { sectionShellClass } from "../utils/dashboardUtils";

export default function RolePrioritySection({ role, roleActionItems }) {
  return (
    <section className={sectionShellClass}>
      <SectionHeader icon={Briefcase} eyebrow="ROLE PRIORITIES" title={`${(role || "USER").replace("_", " ")} action queue`} description="This queue is generated from live records and scoped to your role responsibilities." />
      <div className={clsx("grid gap-4", roleActionItems.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
        {roleActionItems.map((item) => <MetricPanel key={item.title} title={item.title} value={item.value} helper={item.helper} tone={item.tone} onClick={item.onClick} />)}
      </div>
    </section>
  );
}
