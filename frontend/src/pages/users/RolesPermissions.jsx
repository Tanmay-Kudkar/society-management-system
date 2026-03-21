import { InfoTooltip } from '../../components'

const roleResponsibilities = [
  {
    role: 'MASTER_ADMIN',
    authority: 'Master Admin',
    responsibility: 'Manages all societies and platform-level operations, can add new tickets, reply to tickets, open/close/resolve issues, and share draft letters/formats/documents when required',
  },
  {
    role: 'MANAGER',
    authority: 'Operational Manager',
    responsibility: 'Handles day-to-day management tasks',
  },
  {
    role: 'SOCIETY_ADMIN',
    authority: 'Society Super Admin',
    responsibility: 'Manages daily operations, handles tickets and resolutions, oversees document records, creates member bills and ledgers, records cash/cheque expenses, and maintains compliance rules/penalties.',
  },
  {
    role: 'CHAIRMAN',
    authority: 'Highest Committee Authority',
    responsibility: 'Presides meetings, final approval, bank signatory',
  },
  {
    role: 'SECRETARY',
    authority: 'Administrative Head',
    responsibility: 'Documentation, records, day-to-day operations',
  },
  {
    role: 'TREASURER',
    authority: 'Financial Head',
    responsibility: 'Finances, billing, payments, accounts',
  },
  {
    role: 'COMMITTEE',
    authority: 'Committee Member',
    responsibility: 'Intermediate management, assigns tasks',
  },
  {
    role: 'EMPLOYEE',
    authority: 'Staff/Security',
    responsibility: 'No system access or operational rights. Only staff records are maintained: attendance, salary details, identity proof documents, and advance payment details.',
  },
  {
    role: 'MEMBER',
    authority: 'Flat Owner',
    responsibility: 'Views own data, raises tickets/complaints',
  },
  {
    role: 'TENANT',
    authority: 'Renter',
    responsibility: 'Limited access to own profile and bills',
  },
  {
    role: 'VISITOR',
    authority: 'Guest',
    responsibility: 'Minimal access, read-only',
  },
]

const permissionMatrix = [
  {
    role: 'MASTER_ADMIN',
    create: 'SOCIETY_ADMIN',
    updateDelete: 'SOCIETY_ADMIN',
    read: 'ALL roles',
  },
  {
    role: 'SOCIETY_ADMIN',
    create: 'ALL below (full access)',
    updateDelete: 'ALL below (full access)',
    read: 'ALL in society',
  },
  {
    role: 'CHAIRMAN',
    create: 'SECRETARY, TREASURER',
    updateDelete: 'SECRETARY, TREASURER',
    read: 'All below',
  },
  {
    role: 'SECRETARY',
    create: 'COMMITTEE only',
    updateDelete: 'COMMITTEE only',
    read: 'COMMITTEE and below',
  },
  {
    role: 'TREASURER',
    create: 'COMMITTEE only',
    updateDelete: 'COMMITTEE only',
    read: 'COMMITTEE and below',
  },
  {
    role: 'COMMITTEE',
    create: 'EMPLOYEE, MEMBER',
    updateDelete: 'EMPLOYEE, MEMBER',
    read: 'EMPLOYEE, MEMBER, below',
  },
  {
    role: 'EMPLOYEE',
    create: 'None',
    updateDelete: 'None',
    read: 'No system access',
  },
  {
    role: 'MEMBER',
    create: 'TENANT only',
    updateDelete: 'TENANT only',
    read: 'TENANT',
  },
  {
    role: 'TENANT',
    create: 'None',
    updateDelete: 'None',
    read: 'Own profile only',
  },
  {
    role: 'VISITOR',
    create: 'None',
    updateDelete: 'None',
    read: 'Own profile only',
  },
]

const accessRules = [
  'Parent creates DIRECT CHILDREN only - no skip-level creation',
  'Read access flows DOWNWARD - parents can read all descendants',
  'Update/Delete LIMITED to direct children - no skip-level modification',
  'Grandchildren are READ-ONLY - can view but not modify',
  'EXCEPTION: SOCIETY_ADMIN has full CRUD on all roles below',
]

export default function RolesPermissions() {
  return (
    <div className="min-h-[calc(100vh-68px)] bg-[radial-gradient(circle_at_top,#0d1424_0%,#0b0f17_55%,#070b12_100%)] px-6 pb-12 pt-7 text-slate-100 max-md:px-4 max-md:pb-10">
      <header className="relative flex items-center justify-between overflow-hidden rounded-[20px] border border-sky-400/20 bg-[linear-gradient(135deg,rgba(36,56,82,0.9),rgba(20,28,45,0.9))] px-9 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] max-[980px]:flex-col max-[980px]:items-start max-[980px]:gap-4 max-md:px-6 max-md:py-7">
        <div className="relative z-[2] max-w-[680px]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-emerald-300">Access Governance</p>
          <h1 className="mb-2.5 inline-flex items-center gap-2 text-[32px] font-bold leading-tight max-md:text-[26px]">
            Roles, Permissions, and Responsibilities
            <InfoTooltip text="A strict, auditable access model for master admin and society governance." />
          </h1>
        </div>
        <div className="pointer-events-none absolute -right-[120px] -top-20 h-80 w-80 bg-[radial-gradient(circle,rgba(62,166,255,0.25),transparent_60%)] blur-md" />
      </header>

      <section className="mt-7">
        <div className="mb-4 flex flex-col gap-1.5">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold">
            Role Responsibilities
            <InfoTooltip text="Defines the authority and primary scope for each role." />
          </h2>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-slate-700 bg-slate-950/90 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm max-md:text-[13px]">
            <thead>
              <tr className="bg-slate-900/90">
                <th className="border-b border-slate-700/70 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400 max-md:px-2.5 max-md:py-3">Role</th>
                <th className="border-b border-slate-700/70 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400 max-md:px-2.5 max-md:py-3">Authority</th>
                <th className="border-b border-slate-700/70 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400 max-md:px-2.5 max-md:py-3">Primary Responsibilities</th>
              </tr>
            </thead>
            <tbody>
              {roleResponsibilities.map((item) => (
                <tr key={item.role} className="transition hover:bg-sky-400/10">
                  <td className="border-b border-slate-700/70 px-4 py-3.5 text-left max-md:px-2.5 max-md:py-3">
                    <span className="inline-flex items-center rounded-full border border-sky-400/35 bg-sky-400/15 px-2.5 py-1 text-[11px] font-bold tracking-[0.05em] text-sky-300">{item.role}</span>
                  </td>
                  <td className="border-b border-slate-700/70 px-4 py-3.5 text-left text-slate-100 max-md:px-2.5 max-md:py-3">{item.authority}</td>
                  <td className="border-b border-slate-700/70 px-4 py-3.5 text-left text-slate-100 max-md:px-2.5 max-md:py-3">{item.responsibility}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex flex-col gap-1.5">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold">
            Permission Matrix
            <InfoTooltip text="CRUD capability per role, aligned to the hierarchy rules." />
          </h2>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-slate-700 bg-slate-950/90 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm max-md:text-[13px]">
            <thead>
              <tr className="bg-slate-900/90">
                <th className="border-b border-slate-700/70 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400 max-md:px-2.5 max-md:py-3">Role</th>
                <th className="border-b border-slate-700/70 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400 max-md:px-2.5 max-md:py-3">Can CREATE</th>
                <th className="border-b border-slate-700/70 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400 max-md:px-2.5 max-md:py-3">Can UPDATE/DELETE</th>
                <th className="border-b border-slate-700/70 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-400 max-md:px-2.5 max-md:py-3">Can READ</th>
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((item) => (
                <tr key={item.role} className="transition hover:bg-sky-400/10">
                  <td className="border-b border-slate-700/70 px-4 py-3.5 text-left max-md:px-2.5 max-md:py-3">
                    <span className="inline-flex items-center rounded-full border border-sky-400/35 bg-sky-400/15 px-2.5 py-1 text-[11px] font-bold tracking-[0.05em] text-sky-300">{item.role}</span>
                  </td>
                  <td className="border-b border-slate-700/70 px-4 py-3.5 text-left text-slate-200 max-md:px-2.5 max-md:py-3">{item.create}</td>
                  <td className="border-b border-slate-700/70 px-4 py-3.5 text-left text-slate-200 max-md:px-2.5 max-md:py-3">{item.updateDelete}</td>
                  <td className="border-b border-slate-700/70 px-4 py-3.5 text-left text-slate-200 max-md:px-2.5 max-md:py-3">{item.read}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-4 flex flex-col gap-1.5">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold">
            Access Control Rules
            <InfoTooltip text="Non-negotiable rules that guarantee strict data isolation." />
          </h2>
        </div>
        <div className="rounded-[18px] border border-slate-700 bg-slate-950/90 px-6 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <ol className="grid list-decimal gap-2.5 pl-6 text-slate-200">
            {accessRules.map((rule) => (
              <li key={rule} className="leading-7 text-slate-300">{rule}</li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
