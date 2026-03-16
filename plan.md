# Login Audit Viewer Page — Implementation Plan

## Goal
Add a **Login Audit** page for MASTER_ADMIN to view login/logout sessions of Society Admins, with proximity monitoring data, device info parsing, and filtering capabilities.

## Files to Modify

### 1. `api/index.js` — Add login audit API methods
Add a `loginAuditApi` export to the existing `authApi` object:
```js
// inside authApi:
getAuditByUser: (userId) => api.get(`/auth/login-audit/user/${userId}`),
getAuditBySociety: (societyId) => api.get(`/auth/login-audit/society/${societyId}`),
```

### 2. `frontend/src/pages/society/LoginAudit.jsx` — New page (main work)
Create the Login Audit viewer page following existing patterns (SocietyAdmins.jsx, Tickets.jsx style). Features:

- **Society filter dropdown** — Fetch societies via `societyApi.getAll()`, let MASTER_ADMIN select which society to view audits for
- **Table view** — Show audit records with columns:
  - Admin Name & Email
  - Action (LOGIN / LOGOUT) with color-coded pill
  - Timestamp (formatted with `formatDateTime`)
  - IP Address
  - Device (OS + Browser parsed from userAgent using `deviceDetect.js`)
  - Proximity status (Nearby/Not Nearby/N/A pill, distance in meters)
- **Search** — Filter by admin name/email
- **Action filter** — All / LOGIN / LOGOUT dropdown
- **Proximity filter** — All / Nearby / Not Nearby
- **Summary cards** — Total sessions, Logins, Logouts, Not Nearby count
- **Skeleton loading** — Use existing `HeroSkeleton`, `FiltersSkeleton`, `TableSkeleton` from `SkeletonLoaders.jsx`
- Uses `@tanstack/react-query` (`useQuery`), `useMemo` for filtering, Tailwind CSS with CSS custom properties

### 3. `frontend/src/App.jsx` — Add route
- Add lazy import: `const LoginAudit = lazyWithMinDelay(() => import('./pages/society/LoginAudit'))`
- Add route: `<Route path="login-audit" element={<LoginAudit />} />` inside the protected routes
- Add to `PAGE_TITLES`: `'/login-audit': 'Login Audit'`

### 4. `frontend/src/components/Layout.jsx` — Add sidebar nav item
- Add `ClipboardList` to lucide-react imports
- Add to `platformOwnerMenu` (between Society Admins and Settings):
  ```js
  { id: 'login-audit', label: 'Login Audit', icon: ClipboardList, path: '/login-audit' }
  ```
- Add to `routePrefetchMap`:
  ```js
  '/login-audit': () => import('../pages/society/LoginAudit')
  ```

## Design Decisions
- **Place in `pages/society/`** — Login audit is a platform-level feature alongside SocietyAdmins
- **Table layout** (not cards) — Audit data is tabular, rows with many columns suit a table better than cards
- **Parse userAgent client-side** — Reuse the existing `deviceDetect.js` functions but adapted for parsing arbitrary UA strings (the existing functions read `navigator.userAgent`; we'll write a small wrapper that parses the stored UA string)
- **No backend changes** — The endpoints and data are already complete
- **Society-scoped view** — Default: select a society, then see all SOCIETY_ADMIN login/logout for that society. Also allow viewing all audits across societies.
