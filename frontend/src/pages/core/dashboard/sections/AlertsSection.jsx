import { AlertTriangle, Clock, UserCheck } from "lucide-react";
import AlertCard from "../components/AlertCard";

export default function AlertsSection({ canSeeContractAlerts, expiringContracts, expiringTenants, pendingTickets, navigate }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {canSeeContractAlerts && (
        <AlertCard
          title="Expiring Contracts"
          icon={AlertTriangle}
          tone="yellow"
          items={expiringContracts.map((contract) => ({
            title: contract.title,
            subtitle: new Date(contract.endDate).toLocaleDateString(),
            onClick: () => navigate("/contracts"),
          }))}
          actionLabel="Open Contracts"
          onActionClick={() => navigate("/contracts")}
        />
      )}
      {canSeeContractAlerts && (
        <AlertCard
          title="Expiring Tenant Agreements"
          icon={UserCheck}
          tone="teal"
          items={expiringTenants.map((tenant) => ({
            title: tenant.name,
            subtitle: new Date(tenant.agreementEndDate).toLocaleDateString(),
            onClick: () => navigate("/tenants"),
          }))}
          actionLabel="Open Tenants"
          onActionClick={() => navigate("/tenants")}
        />
      )}
      <AlertCard
        title="Pending Tickets"
        icon={Clock}
        tone="red"
        items={pendingTickets.map((ticket) => ({
          title: ticket.title,
          subtitle: ticket.type,
          onClick: () => navigate("/tickets"),
        }))}
        actionLabel="Open Tickets"
        onActionClick={() => navigate("/tickets")}
      />
    </div>
  );
}
