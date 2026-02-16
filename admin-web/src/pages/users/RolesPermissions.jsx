import '../../styles/pages/roles-permissions.css'

const roleResponsibilities = [
  {
    role: 'PLATFORM_OWNER',
    authority: 'Platform Owner',
    responsibility: 'Manages all societies and organizations',
  },
  {
    role: 'ORGANIZATION_OWNER',
    authority: 'Organization Owner',
    responsibility: 'Manages multiple societies under an organization',
  },
  {
    role: 'MANAGER',
    authority: 'Operational Manager',
    responsibility: 'Handles day-to-day management tasks',
  },
  {
    role: 'SOCIETY_ADMIN',
    authority: 'Society Super Admin',
    responsibility: 'Full control over society, all CRUD operations',
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
    responsibility: 'Handles visitors, basic operations',
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
    role: 'PLATFORM_OWNER',
    create: 'ORGANIZATION_OWNER, SOCIETY_ADMIN',
    updateDelete: 'ORGANIZATION_OWNER, SOCIETY_ADMIN',
    read: 'ALL roles',
  },
  {
    role: 'ORGANIZATION_OWNER',
    create: 'SOCIETY_ADMIN in own org',
    updateDelete: 'SOCIETY_ADMIN in own org',
    read: 'Own org roles',
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
    create: 'VISITOR only',
    updateDelete: 'VISITOR only',
    read: 'VISITOR',
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
    <div className="roles-page">
      <header className="roles-hero">
        <div className="roles-hero__content">
          <p className="roles-hero__eyebrow">Access Governance</p>
          <h1 className="roles-hero__title">Roles, Permissions, and Responsibilities</h1>
          <p className="roles-hero__subtitle">
            A strict, auditable access model for platform, organization, and society governance.
          </p>
        </div>
        <div className="roles-hero__glow" />
      </header>

      <section className="roles-section">
        <div className="roles-section__header">
          <h2>Role Responsibilities</h2>
          <p>Defines the authority and primary scope for each role.</p>
        </div>
        <div className="roles-card">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Authority</th>
                <th>Primary Responsibilities</th>
              </tr>
            </thead>
            <tbody>
              {roleResponsibilities.map((item) => (
                <tr key={item.role}>
                  <td><span className="pill pill--role">{item.role}</span></td>
                  <td>{item.authority}</td>
                  <td>{item.responsibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="roles-section">
        <div className="roles-section__header">
          <h2>Permission Matrix</h2>
          <p>CRUD capability per role, aligned to the hierarchy rules.</p>
        </div>
        <div className="roles-card">
          <table className="roles-table roles-table--matrix">
            <thead>
              <tr>
                <th>Role</th>
                <th>Can CREATE</th>
                <th>Can UPDATE/DELETE</th>
                <th>Can READ</th>
              </tr>
            </thead>
            <tbody>
              {permissionMatrix.map((item) => (
                <tr key={item.role}>
                  <td><span className="pill pill--role">{item.role}</span></td>
                  <td>{item.create}</td>
                  <td>{item.updateDelete}</td>
                  <td>{item.read}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="roles-section">
        <div className="roles-section__header">
          <h2>Access Control Rules</h2>
          <p>Non-negotiable rules that guarantee strict data isolation.</p>
        </div>
        <div className="roles-card roles-card--rules">
          <ol className="roles-rules">
            {accessRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
