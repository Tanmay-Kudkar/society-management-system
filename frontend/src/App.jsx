import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect, lazy, Suspense, useRef } from "react";
import {
  useAuth,
  ToastProvider,
  ThemeProvider,
  ConfirmDialogProvider,
} from "./context";

import { Layout, HeroSkeleton, StatCardSkeleton } from "./components";

const lazyWithMinDelay = (importer, delay = 320) =>
  lazy(() =>
    Promise.all([
      importer(),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]).then(([module]) => module),
  );

const Welcome = lazyWithMinDelay(() => import("./pages/auth/Welcome"));
const Login = lazyWithMinDelay(() => import("./pages/auth/Login"));
const ForgotPassword = lazyWithMinDelay(
  () => import("./pages/auth/ForgotPassword"),
);
const ResetPassword = lazyWithMinDelay(
  () => import("./pages/auth/ResetPassword"),
);

const Dashboard = lazyWithMinDelay(() => import("./pages/core/dashboard"));
const Settings = lazyWithMinDelay(() => import("./pages/core/Settings"));
const Reports = lazyWithMinDelay(() => import("./pages/core/Reports"));

const Users = lazyWithMinDelay(() => import("./pages/users/Users"));
const RolesPermissions = lazyWithMinDelay(
  () => import("./pages/users/RolesPermissions"),
);

const SocietyAdmins = lazyWithMinDelay(
  () => import("./pages/society/SocietyAdmins"),
);

const UnitManagement = lazyWithMinDelay(
  () => import("./pages/unit/UnitManagement"),
);
const Wings = lazyWithMinDelay(() => import("./pages/unit/Wings"));
const Tenants = lazyWithMinDelay(() => import("./pages/unit/Tenants"));
const Vehicles = lazyWithMinDelay(() => import("./pages/unit/Vehicles"));

const VendorBills = lazyWithMinDelay(
  () => import("./pages/finance/VendorBills"),
);
const Contracts = lazyWithMinDelay(() => import("./pages/finance/Contracts"));
const MaintenanceBills = lazyWithMinDelay(
  () => import("./pages/finance/MaintenanceBills"),
);
const SocietySettings = lazyWithMinDelay(
  () => import("./pages/finance/SocietySettings"),
);
const Transactions = lazyWithMinDelay(
  () => import("./pages/finance/Transactions"),
);
const Payments = lazyWithMinDelay(() => import("./pages/finance/Payments"));
const MyBills = lazyWithMinDelay(() => import("./pages/finance/MyBills"));

const Notices = lazyWithMinDelay(() => import("./pages/communication/Notices"));
const Tickets = lazyWithMinDelay(() => import("./pages/communication/Tickets"));
const Complaints = lazyWithMinDelay(
  () => import("./pages/communication/Complaints"),
);
const Approvals = lazyWithMinDelay(
  () => import("./pages/communication/Approvals"),
);
const EmergencyContacts = lazyWithMinDelay(
  () => import("./pages/communication/EmergencyContacts"),
);
const Documents = lazyWithMinDelay(
  () => import("./pages/communication/Documents"),
);

const Vendors = lazyWithMinDelay(() => import("./pages/vendors/Vendors"));

const Visitors = lazyWithMinDelay(() => import("./pages/security/Visitors"));
const Penalties = lazyWithMinDelay(() => import("./pages/core/Penalties"));
const SocietyRules = lazyWithMinDelay(
  () => import("./pages/core/SocietyRules"),
);

const About = lazyWithMinDelay(() => import("./pages/footer/About"));
const Privacy = lazyWithMinDelay(() => import("./pages/footer/Privacy"));
const Terms = lazyWithMinDelay(() => import("./pages/footer/Terms"));
const Contact = lazyWithMinDelay(() => import("./pages/footer/Contact"));
const Pricing = lazyWithMinDelay(() => import("./pages/footer/Pricing"));
const Blog = lazyWithMinDelay(() => import("./pages/footer/Blog"));
const Demo = lazyWithMinDelay(() => import("./pages/footer/Demo"));
const Help = lazyWithMinDelay(() => import("./pages/footer/Help"));

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-12 w-12 rounded-full border-2 border-violet-500/25 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset scroll on both window and document element to cover all containers
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

const PAGE_TITLES = {
  "/": "Welcome",
  "/login": "Sign In",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
  "/about": "About",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/contact": "Contact",
  "/pricing": "Pricing",
  "/blog": "Blog",
  "/demo": "Demo",
  "/help": "Help",
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/society-admins": "Society Admins",
  "/wings": "Wings",
  "/unit-management": "Unit & User Management",
  "/tenants": "Tenants",
  "/vehicles": "Vehicles",
  "/vendors": "Vendors",
  "/vendor-bills": "Vendor Bills",
  "/contracts": "Contracts",
  "/maintenance-bills": "Maintenance Bills",
  "/society-settings": "Society Settings",
  "/payments": "Online Payments",
  "/my-bills": "My Bills",
  "/transactions": "Transactions",
  "/reports": "Reports",
  "/roles-permissions": "Roles & Permissions",
  "/notices": "Notices",
  "/tickets": "Tickets",
  "/complaints": "Complaints",
  "/approvals": "Approvals",
  "/emergency-contacts": "Emergency Contacts",
  "/documents": "Documents",
  "/visitors": "Visitors",
  "/penalties": "Penalties & Fines",
  "/society-rules": "Society Rules & Bylaws",
  "/settings": "Settings",
};

const DynamicTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = PAGE_TITLES[pathname] || null;
    document.title = title ? `${title} - SocietyHub` : "SocietyHub";
  }, [pathname]);

  return null;
};

const SocietyRouteRedirect = () => {
  const { id } = useParams();
  const scopedId = encodeURIComponent(id || "");
  return <Navigate to={`/?society=${scopedId}`} replace />;
};

function App() {
  const { user } = useAuth();
  const didPrefetchRef = useRef(false);

  useEffect(() => {
    if (!user || didPrefetchRef.current) {
      return;
    }

    const role = user?.role;
    const importers = [
      () => import("./pages/core/dashboard"),
      () => import("./pages/core/Settings"),
      () => import("./pages/communication/Notices"),
    ];

    if (role === "MASTER_ADMIN" || role === "MASTER_ADMIN") {
      importers.push(
        () => import("./pages/society/SocietyAdmins"),
        () => import("./pages/users/Users"),
        () => import("./pages/core/Reports"),
      );
    } else if (role === "MEMBER" || role === "TENANT") {
      importers.push(
        () => import("./pages/finance/MyBills"),
        () => import("./pages/communication/Tickets"),
        () => import("./pages/communication/Complaints"),
      );
    } else {
      importers.push(
        () => import("./pages/unit/UnitManagement"),
        () => import("./pages/unit/Tenants"),
        () => import("./pages/unit/Vehicles"),
        () => import("./pages/finance/MaintenanceBills"),
        () => import("./pages/finance/Transactions"),
      );
    }

    const runPrefetch = () => {
      importers.slice(0, 8).forEach((loadPage) => {
        loadPage().catch(() => null);
      });
    };

    let idleId;
    let timeoutId;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(runPrefetch, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(runPrefetch, 350);
    }

    didPrefetchRef.current = true;

    return () => {
      if (
        idleId &&
        typeof window !== "undefined" &&
        "cancelIdleCallback" in window
      ) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [user]);

  const routeFallback = (
    <div className="px-6 py-6">
      <HeroSkeleton statCount={0} />
      <StatCardSkeleton count={4} />
    </div>
  );

  return (
    <ThemeProvider>
      <ConfirmDialogProvider>
        <ToastProvider>
          <ScrollToTop />
          <DynamicTitle />
          <Suspense fallback={routeFallback}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/welcome" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/help" element={<Help />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route
                  path="societies"
                  element={<Navigate to="/society-admins" replace />}
                />
                <Route path="society-admins" element={<SocietyAdmins />} />
                <Route path="societies/:id" element={<SocietyRouteRedirect />} />
                <Route path="wings" element={<Wings />} />
                <Route
                  path="flats"
                  element={<Navigate to="/unit-management" replace />}
                />
                <Route path="unit-management" element={<UnitManagement />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="vendor-bills" element={<VendorBills />} />
                <Route path="contracts" element={<Contracts />} />
                <Route
                  path="maintenance-bills"
                  element={<MaintenanceBills />}
                />
                <Route path="society-settings" element={<SocietySettings />} />
                <Route path="payments" element={<Payments />} />
                <Route path="my-bills" element={<MyBills />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="reports" element={<Reports />} />
                <Route
                  path="roles-permissions"
                  element={<RolesPermissions />}
                />
                <Route path="notices" element={<Notices />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="complaints" element={<Complaints />} />
                <Route path="approvals" element={<Approvals />} />
                <Route
                  path="emergency-contacts"
                  element={<EmergencyContacts />}
                />
                <Route path="documents" element={<Documents />} />
                <Route path="visitors" element={<Visitors />} />
                <Route path="penalties" element={<Penalties />} />
                <Route path="society-rules" element={<SocietyRules />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </ConfirmDialogProvider>
    </ThemeProvider>
  );
}

export default App;
