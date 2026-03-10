import { AlertTriangle, Clock, UserCheck } from "lucide-react";
import AlertCard from "../components/AlertCard";

export default function AlertsSection({ canSeeContractAlerts, expiringContracts, expiringTenants, pendingTickets }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {canSeeContractAlerts && <AlertCard title="Expiring Contracts" icon={AlertTriangle} tone="yellow" items={expiringContracts.map((contract) => ({ title: contract.title, subtitle: new Date(contract.endDate).toLocaleDateString() }))} />}
      {canSeeContractAlerts && <AlertCard title="Expiring Tenant Agreements" icon={UserCheck} tone="teal" items={expiringTenants.map((tenant) => ({ title: tenant.name, subtitle: new Date(tenant.agreementEndDate).toLocaleDateString() }))} />}
      <AlertCard title="Pending Tickets" icon={Clock} tone="red" items={pendingTickets.map((ticket) => ({ title: ticket.title, subtitle: ticket.type }))} />
    </div>
  );
}
