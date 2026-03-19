import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { useEffect, lazy, Suspense, useRef } from "react";
import {
  useAuth,
  ToastProvider,
  ThemeProvider,
  ConfirmDialogProvider,
} from "./context";

import { Layout } from "./components";
import { PermissionDenied } from "./components";

const lazyWithMinDelay = (importer) => lazy(importer);

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
const Employees = lazyWithMinDelay(() => import("./pages/users/Employees"));
const RolesPermissions = lazyWithMinDelay(
  () => import("./pages/users/RolesPermissions"),
);

const SocietyAdmins = lazyWithMinDelay(
  () => import("./pages/society/SocietyAdmins"),
);
const LoginAudit = lazyWithMinDelay(
  () => import("./pages/society/LoginAudit"),
);

const UnitManagement = lazyWithMinDelay(
  () => import("./pages/unit/UnitManagement"),
);
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

const RoleRoute = ({ children, allow, requireSocietyScope = false, message = "You don't have permission to access this page" }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const isAllowed = typeof allow === "function" ? allow(user) : true;
  if (!isAllowed) {
    return <PermissionDenied message={message} />;
  }

  if (requireSocietyScope && user?.role === "MASTER_ADMIN") {
    const societyParam = new URLSearchParams(location.search).get("society");
    const parsedSocietyId = Number(societyParam);
    const hasValidSocietyScope = Number.isInteger(parsedSocietyId) && parsedSocietyId > 0;

    if (!hasValidSocietyScope) {
      return (
        <PermissionDenied message="Select a society first (use ?society=<id>) to view society-scoped data" />
      );
    }
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
  "/demo": "Demo",
  "/help": "Help",
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/employees": "Employees",
  "/society-admins": "Society Admins",
  "/login-audit": "Login Audit",
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
  return <Navigate to={`/dashboard?society=${scopedId}`} replace />;
};

const LegacyWingsRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/unit-management${search || ""}`} replace />;
};

const hasAnyRole = (user, roles) => roles.includes(user?.role);

function App() {
  const { user } = useAuth();
  const didPrefetchRef = useRef(false);

  const isLowEndClient = () => {
    if (typeof window === "undefined") return false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const reducedData = window.matchMedia?.("(prefers-reduced-data: reduce)")?.matches;
    const deviceMemory = navigator.deviceMemory || 0;
    const cpuCores = navigator.hardwareConcurrency || 0;
    return (
      Boolean(reducedMotion || reducedData) ||
      (deviceMemory > 0 && deviceMemory <= 4) ||
      (cpuCores > 0 && cpuCores <= 4)
    );
  };

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
        () => import("./pages/society/LoginAudit"),
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
      const prefetchBudget = isLowEndClient() ? 3 : 8;
      importers.slice(0, prefetchBudget).forEach((loadPage) => {
        loadPage().catch(() => null);
      });
    };

    let idleId;
    let timeoutId;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(runPrefetch, { timeout: isLowEndClient() ? 2800 : 1500 });
    } else {
      timeoutId = window.setTimeout(runPrefetch, isLowEndClient() ? 900 : 350);
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

  const routeFallback = null;

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
                <Route
                  path="users"
                  element={
                    <RoleRoute
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                        "COMMITTEE",
                        "EMPLOYEE",
                        "MEMBER",
                      ])}
                    >
                      <Users />
                    </RoleRoute>
                  }
                />
                <Route
                  path="employees"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                        "MANAGER",
                      ])}
                    >
                      <Employees />
                    </RoleRoute>
                  }
                />
                <Route
                  path="societies"
                  element={<Navigate to="/society-admins" replace />}
                />
                <Route
                  path="society-admins"
                  element={
                    <RoleRoute
                      allow={(currentUser) => currentUser?.role === "MASTER_ADMIN"}
                      message="Only Master Admin can access society administration"
                    >
                      <SocietyAdmins />
                    </RoleRoute>
                  }
                />
                <Route
                  path="login-audit"
                  element={
                    <RoleRoute
                      allow={(currentUser) => currentUser?.role === "MASTER_ADMIN"}
                      message="Only Master Admin can access login audit"
                    >
                      <LoginAudit />
                    </RoleRoute>
                  }
                />
                <Route path="societies/:id" element={<SocietyRouteRedirect />} />
                <Route path="wings" element={<LegacyWingsRedirect />} />
                <Route
                  path="flats"
                  element={<Navigate to="/unit-management" replace />}
                />
                <Route
                  path="unit-management"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                        "COMMITTEE",
                        "MANAGER",
                      ])}
                    >
                      <UnitManagement />
                    </RoleRoute>
                  }
                />
                <Route
                  path="tenants"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                        "COMMITTEE",
                        "MANAGER",
                        "MEMBER",
                      ])}
                    >
                      <Tenants />
                    </RoleRoute>
                  }
                />
                <Route
                  path="vehicles"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                        "COMMITTEE",
                        "MANAGER",
                        "EMPLOYEE",
                      ])}
                    >
                      <Vehicles />
                    </RoleRoute>
                  }
                />
                <Route
                  path="vendors"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "MANAGER",
                      ])}
                    >
                      <Vendors />
                    </RoleRoute>
                  }
                />
                <Route
                  path="vendor-bills"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                      ])}
                    >
                      <VendorBills />
                    </RoleRoute>
                  }
                />
                <Route
                  path="contracts"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                      ])}
                    >
                      <Contracts />
                    </RoleRoute>
                  }
                />
                <Route
                  path="maintenance-bills"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                      ])}
                    >
                      <MaintenanceBills />
                    </RoleRoute>
                  }
                />
                <Route
                  path="society-settings"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                      ])}
                    >
                      <SocietySettings />
                    </RoleRoute>
                  }
                />
                <Route path="payments" element={<Payments />} />
                <Route
                  path="my-bills"
                  element={
                    <RoleRoute
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MEMBER",
                        "TENANT",
                        "VENDOR",
                      ])}
                    >
                      <MyBills />
                    </RoleRoute>
                  }
                />
                <Route
                  path="transactions"
                  element={
                    <RoleRoute
                      requireSocietyScope
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                      ])}
                    >
                      <Transactions />
                    </RoleRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <RoleRoute
                      allow={(currentUser) => hasAnyRole(currentUser, [
                        "MASTER_ADMIN",
                        "SOCIETY_ADMIN",
                        "CHAIRMAN",
                        "SECRETARY",
                        "TREASURER",
                        "COMMITTEE",
                        "MANAGER",
                      ])}
                    >
                      <Reports />
                    </RoleRoute>
                  }
                />
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
                <Route
                  path="visitors"
                  element={
                    <RoleRoute requireSocietyScope>
                      <Visitors />
                    </RoleRoute>
                  }
                />
                <Route path="penalties" element={<Penalties />} />
                <Route path="society-rules" element={<SocietyRules />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route
                path="*"
                element={<Navigate to={user ? "/dashboard" : "/"} replace />}
              />
            </Routes>
          </Suspense>
        </ToastProvider>
      </ConfirmDialogProvider>
    </ThemeProvider>
  );
}

export default App;
