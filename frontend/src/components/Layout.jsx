import { useState, useRef, useEffect, useMemo } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context";
import { societyApi } from "../../../api";

import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  UserCheck,
  Car,
  Truck,
  Receipt,
  FileText,
  CreditCard,
  DollarSign,
  Megaphone,
  Image,
  Ticket,
  MessageSquare,
  Phone,
  FileCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  Wallet,
  Shield,
  Siren,
  SlidersHorizontal,
  ArrowLeftRight,
  Ban,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import clsx from "clsx";

const prefetchedRouteSet = new Set();

const routePrefetchMap = {
  "/dashboard": () => import("../pages/core/dashboard"),
  "/settings": () => import("../pages/core/Settings"),
  "/reports": () => import("../pages/core/Reports"),
  "/users": () => import("../pages/users/Users"),
  "/employees": () => import("../pages/users/Employees"),
  "/roles-permissions": () => import("../pages/users/RolesPermissions"),
  "/society-admins": () => import("../pages/society/SocietyAdmins"),
  "/login-audit": () => import("../pages/society/LoginAudit"),
  "/unit-management": () => import("../pages/unit/UnitManagement"),
  "/tenants": () => import("../pages/unit/Tenants"),
  "/vehicles": () => import("../pages/unit/Vehicles"),
  "/vendors": () => import("../pages/vendors/Vendors"),
  "/vendor-bills": () => import("../pages/finance/VendorBills"),
  "/contracts": () => import("../pages/finance/Contracts"),
  "/maintenance-bills": () => import("../pages/finance/MaintenanceBills"),
  "/society-settings": () => import("../pages/finance/SocietySettings"),
  "/payments": () => import("../pages/finance/Payments"),
  "/my-bills": () => import("../pages/finance/MyBills"),
  "/transactions": () => import("../pages/finance/Transactions"),
  "/notices": () => import("../pages/communication/Notices"),
  "/tickets": () => import("../pages/communication/Tickets"),
  "/complaints": () => import("../pages/communication/Complaints"),
  "/emergency-contacts": () =>
    import("../pages/communication/EmergencyContacts"),
  "/documents": () => import("../pages/communication/Documents"),
  "/visitors": () => import("../pages/security/Visitors"),
  "/penalties": () => import("../pages/core/Penalties"),
  "/society-rules": () => import("../pages/core/SocietyRules"),
};

const prefetchRoute = (path) => {
  const importer = routePrefetchMap[path];
  if (!importer || prefetchedRouteSet.has(path)) {
    return;
  }
  prefetchedRouteSet.add(path);
  importer().catch(() => null);
};

const withSocietyScope = (path, scopedSocietyId) => {
  if (!path || !scopedSocietyId) return path;
  const [pathname, rawSearch = ""] = path.split("?");
  const params = new URLSearchParams(rawSearch);
  params.set("society", scopedSocietyId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

// MASTER_ADMIN specific menu - simplified for platform management
const platformOwnerMenu = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "society-admins",
    label: "Society Admins",
    icon: UserCheck,
    path: "/society-admins",
  },
  {
    id: "login-audit",
    label: "Login Audit",
    icon: ClipboardList,
    path: "/login-audit",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

// Standard menu for SOCIETY_ADMIN and below - grouped by function
const standardMenuGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "my-bills",
    label: "My Bills",
    icon: CreditCard,
    path: "/my-bills",
    roles: ["MEMBER", "TENANT"],
  },
  {
    id: "management",
    label: "Management",
    icon: Building2,
    items: [
      {
        path: "/unit-management",
        icon: Home,
        label: "Units & Users",
        roles: [
          "SOCIETY_ADMIN",
          "CHAIRMAN",
          "SECRETARY",
          "TREASURER",
          "COMMITTEE",
          "MANAGER",
        ],
      },
      {
        path: "/tenants",
        icon: UserCheck,
        label: "Tenants",
        roles: [
          "SOCIETY_ADMIN",
          "CHAIRMAN",
          "SECRETARY",
          "TREASURER",
          "COMMITTEE",
          "MANAGER",
          "MEMBER",
        ],
      },
      {
        path: "/employees",
        icon: Users,
        label: "Employees",
        roles: [
          "MASTER_ADMIN",
          "SOCIETY_ADMIN",
          "CHAIRMAN",
          "SECRETARY",
          "TREASURER",
          "MANAGER",
        ],
      },
      {
        path: "/vehicles",
        icon: Car,
        label: "Vehicles",
        roles: [
          "SOCIETY_ADMIN",
          "CHAIRMAN",
          "SECRETARY",
          "TREASURER",
          "COMMITTEE",
          "MANAGER",
          "EMPLOYEE",
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: DollarSign,
    roles: [
      "MASTER_ADMIN",
      "SOCIETY_ADMIN",
      "CHAIRMAN",
      "SECRETARY",
      "TREASURER",
    ],
    items: [
      {
        path: "/vendors",
        icon: Truck,
        label: "Vendors",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER"],
      },
      {
        path: "/vendor-bills",
        icon: Receipt,
        label: "Vendor Bills",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER"],
      },
      {
        path: "/contracts",
        icon: FileText,
        label: "Contracts",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER"],
      },
      {
        path: "/maintenance-bills",
        icon: CreditCard,
        label: "Maintenance Bills",
        roles: [
          "SOCIETY_ADMIN",
          "CHAIRMAN",
          "SECRETARY",
          "TREASURER",
          "COMMITTEE",
        ],
      },
      {
        path: "/society-settings",
        icon: SlidersHorizontal,
        label: "Society Settings",
        roles: [
          "MASTER_ADMIN",
          "SOCIETY_ADMIN",
          "CHAIRMAN",
          "SECRETARY",
          "TREASURER",
        ],
      },
      {
        path: "/payments",
        icon: Wallet,
        label: "Online Payments",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER"],
      },
      {
        path: "/transactions",
        icon: DollarSign,
        label: "Transactions",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER"],
      },
      {
        path: "/reports",
        icon: BarChart3,
        label: "Reports",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER"],
      },
      {
        path: "/penalties",
        icon: Ban,
        label: "Penalties",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "TREASURER"],
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: Megaphone,
    items: [
      { path: "/notices", icon: Megaphone, label: "Notices" },
      { path: "/tickets", icon: Ticket, label: "Tickets" },
      { path: "/complaints", icon: MessageSquare, label: "Complaints" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    icon: FileCheck,
    items: [
      { path: "/emergency-contacts", icon: Phone, label: "Emergency Contacts" },
      { path: "/documents", icon: FileCheck, label: "Documents" },
      { path: "/society-rules", icon: BookOpen, label: "Rules & Bylaws" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    items: [
      { path: "/visitors", icon: UserCheck, label: "Visitors" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

// Dropdown component for desktop navbar
function NavDropdown({ group, hasRole, onPrefetch, resolvePath }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);
  const location = useLocation();

  // Check if user has access to the group itself
  if (group.roles && !hasRole(...group.roles)) return null;

  const filteredItems =
    group.items?.filter((item) => {
      if (!item.roles) return true;
      return hasRole(...item.roles);
    }) || [];

  if (group.items && filteredItems.length === 0) return null;

  const isActive = group.path
    ? location.pathname === group.path
    : filteredItems.some((item) => location.pathname === item.path);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  // Single link (no dropdown)
  if (group.path) {
    return (
      <NavLink
        to={resolvePath(group.path)}
        onMouseEnter={() => onPrefetch?.(group.path)}
        onFocus={() => onPrefetch?.(group.path)}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-md border-none bg-transparent px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
          isActive
            ? "bg-[var(--accent-primary)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)]",
        )}
      >
        <group.icon size={18} />
        <span>{group.label}</span>
      </NavLink>
    );
  }

  // Dropdown
  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-md border-none bg-transparent px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
          isActive
            ? "bg-[var(--accent-primary)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)]",
        )}
      >
        <group.icon size={18} />
        <span>{group.label}</span>
        <ChevronDown
          size={14}
          className={clsx(
            "transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={clsx(
          "absolute left-0 top-full z-50 mt-1.5 min-w-[200px] origin-top rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all duration-150",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0",
        )}
      >
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={resolvePath(item.path)}
            onClick={() => setIsOpen(false)}
            onMouseEnter={() => onPrefetch?.(item.path)}
            onFocus={() => onPrefetch?.(item.path)}
            className={({ isActive }) =>
              clsx(
                "mx-1.5 flex items-center gap-2.5 rounded-md px-3.5 py-2 text-[13px] font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
                isActive
                  ? "bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)] font-bold"
                  : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)]",
              )
            }
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// Mobile menu accordion - controlled from parent
function MobileAccordion({
  group,
  hasRole,
  onNavigate,
  isOpen,
  onToggle,
  onPrefetch,
  resolvePath,
}) {
  const location = useLocation();
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Check access permissions
  const hasGroupAccess = !group.roles || hasRole(...group.roles);

  const filteredItems = useMemo(() => {
    if (!group.items) return [];
    return group.items.filter((item) => {
      if (!item.roles) return true;
      return hasRole(...item.roles);
    });
  }, [group.items, hasRole]);

  // Calculate content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [filteredItems]);

  // Early returns after all hooks
  if (!hasGroupAccess) return null;
  if (group.items && filteredItems.length === 0) return null;

  const isActiveGroup = group.path
    ? location.pathname === group.path
    : filteredItems.some((item) => location.pathname === item.path);

  // Single link
  if (group.path) {
    return (
      <NavLink
        to={resolvePath(group.path)}
        onMouseEnter={() => onPrefetch?.(group.path)}
        onFocus={() => onPrefetch?.(group.path)}
        onClick={onNavigate}
        className={clsx(
          "mb-0.5 flex items-center gap-[10px] rounded-[10px] px-3 py-2.5 text-[13px] sm:text-[13.5px] font-semibold no-underline transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
          isActiveGroup
            ? "bg-[var(--accent-primary)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.06)] hover:text-[var(--text-primary)]",
        )}
      >
        <group.icon size={20} />
        <span className="min-w-0 break-words">{group.label}</span>
      </NavLink>
    );
  }

  // Accordion
  return (
    <div className="overflow-hidden">
      <button
        onClick={onToggle}
        className={clsx(
          "mb-0.5 flex w-full items-center justify-between rounded-[10px] border-none px-3 py-2.5 text-left text-[13px] sm:text-[13.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
          isActiveGroup || isOpen
            ? "bg-[color-mix(in_srgb,var(--accent-primary)_6%,transparent)] text-[var(--accent-primary)] font-[650]"
            : "bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.06)] hover:text-[var(--text-primary)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-[11px]">
          <group.icon size={20} />
          <span>{group.label}</span>
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            "shrink-0 opacity-50 transition-transform duration-300",
            isOpen && "rotate-180 opacity-80",
          )}
        />
      </button>

      <div
        className="overflow-hidden transition-[height] duration-300"
        style={{ height: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="bg-transparent px-0 pb-1.5 pt-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={resolvePath(item.path)}
              onMouseEnter={() => onPrefetch?.(item.path)}
              onFocus={() => onPrefetch?.(item.path)}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  "mx-1.5 mb-px flex items-center gap-2.5 rounded-lg py-2 pr-3 pl-[42px] text-[12.5px] sm:text-[13px] font-medium no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
                  isActive
                    ? "bg-[rgba(47,129,247,0.1)] text-[var(--accent-primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.08)] hover:text-[var(--text-primary)]",
                )
              }
            >
              <item.icon size={18} />
              <span className="min-w-0 break-words">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

// Desktop sidebar link
function SidebarLink({ group, hasRole, onPrefetch, resolvePath }) {
  const location = useLocation();
  if (group.roles && !hasRole(...group.roles)) return null;
  const isActive = location.pathname === group.path;
  return (
    <NavLink
      to={resolvePath(group.path)}
      onMouseEnter={() => onPrefetch?.(group.path)}
      onFocus={() => onPrefetch?.(group.path)}
      className={clsx(
        "relative mb-[3px] flex items-center gap-[11px] whitespace-nowrap rounded-[10px] px-3.5 py-2.5 text-[13.5px] font-semibold no-underline transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
        isActive
          ? "bg-[var(--accent-primary)] text-white font-[650] shadow-[0_2px_8px_rgba(47,129,247,0.2),var(--glow-accent,none)]"
          : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.08)] hover:text-[var(--text-primary)]",
      )}
    >
      <group.icon size={20} />
      <span>{group.label}</span>
    </NavLink>
  );
}

// Desktop sidebar accordion group
function SidebarGroup({ group, hasRole, isOpen, onToggle, onPrefetch, resolvePath }) {
  const location = useLocation();
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  const filteredItems = useMemo(() => {
    if (!group.items) return [];
    return group.items.filter((item) => !item.roles || hasRole(...item.roles));
  }, [group.items, hasRole]);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [filteredItems]);

  if (group.roles && !hasRole(...group.roles)) return null;
  if (filteredItems.length === 0) return null;

  const isActiveGroup = filteredItems.some(
    (item) => location.pathname === item.path,
  );

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={clsx(
          "relative mb-0.5 flex w-full items-center justify-between whitespace-nowrap rounded-[10px] border-none px-3.5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
          isActiveGroup || isOpen
            ? "bg-[color-mix(in_srgb,var(--accent-primary)_6%,transparent)] text-[var(--accent-primary)] font-[650]"
            : "bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.06)] hover:text-[var(--text-primary)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-[11px]">
          <group.icon size={20} />
          <span>{group.label}</span>
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            "shrink-0 opacity-50 transition-transform duration-300",
            isOpen && "rotate-180 opacity-80",
          )}
        />
      </button>
      <div
        className="overflow-hidden transition-[height] duration-300"
        style={{ height: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="px-0 pb-1.5 pt-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={resolvePath(item.path)}
              onMouseEnter={() => onPrefetch?.(item.path)}
              onFocus={() => onPrefetch?.(item.path)}
              className={({ isActive }) =>
                clsx(
                  "mb-px flex items-center gap-3 whitespace-nowrap rounded-lg py-2 pr-3.5 pl-[44px] text-[13px] font-medium no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
                  isActive
                    ? "bg-[rgba(47,129,247,0.1)] text-[var(--accent-primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.08)] hover:text-[var(--text-primary)]",
                )
              }
            >
              <item.icon size={16} className="shrink-0 transition-colors duration-150" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(null);
  const lastGuardNoticeRef = useRef("");

  // Determine which menu to show based on user role
  const isMasterAdmin =
    user?.role === "MASTER_ADMIN" || user?.role === "MASTER_ADMIN";

  const societyParam = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("society");
  }, [location.search]);

  const hasSocietyParam = societyParam !== null && String(societyParam).trim() !== "";
  const parsedSocietyParam = Number(societyParam);
  const hasNumericSocietyParam = Number.isInteger(parsedSocietyParam) && parsedSocietyParam > 0;

  const { isError: isMasterSocietyParamMissing } = useQuery({
    queryKey: ["layout-society-exists", parsedSocietyParam],
    queryFn: () => societyApi.getById(parsedSocietyParam).then((res) => res.data),
    enabled: isMasterAdmin && hasSocietyParam && hasNumericSocietyParam,
    retry: false,
    staleTime: 60_000,
  });

  const notifyGuard = (message) => {
    const key = `${location.pathname}|${location.search}|${message}`;
    if (lastGuardNoticeRef.current === key) return;
    lastGuardNoticeRef.current = key;
    toast.error(message);
  };

  useEffect(() => {
    if (!hasSocietyParam) return;

    const params = new URLSearchParams(location.search);
    const replaceUrl = () => {
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true },
      );
    };

    if (!isMasterAdmin) {
      const allowedSociety = user?.societyId ? String(user.societyId) : "";
      const attemptedSociety = String(societyParam);

      if (!allowedSociety) {
        params.delete("society");
        notifyGuard("Society scope in URL was removed because your account has no mapped society.");
        replaceUrl();
        return;
      }

      if (attemptedSociety !== allowedSociety) {
        params.set("society", allowedSociety);
        notifyGuard("Unauthorized society URL detected. Scope reset to your permitted society.");
        replaceUrl();
      }
      return;
    }

    if (!hasNumericSocietyParam) {
      params.delete("society");
      notifyGuard("Invalid society value in URL. Use app navigation to choose a valid society.");
      replaceUrl();
      return;
    }

    if (isMasterSocietyParamMissing) {
      params.delete("society");
      notifyGuard("Society in URL was not found in database. Please select from valid options.");
      replaceUrl();
    }
  }, [
    hasNumericSocietyParam,
    hasSocietyParam,
    isMasterAdmin,
    isMasterSocietyParamMissing,
    location.pathname,
    location.search,
    navigate,
    societyParam,
    toast,
    user?.societyId,
  ]);

  const scopedSocietyId = useMemo(() => {
    if (!isMasterAdmin) return null;
    const searchParams = new URLSearchParams(location.search);
    const societyFromQuery = searchParams.get("society");
    if (societyFromQuery) return societyFromQuery;

    const detailMatch = location.pathname.match(/^\/societies\/([^/]+)$/);
    return detailMatch?.[1] || null;
  }, [isMasterAdmin, location.pathname, location.search]);

  const isMasterSocietyMode = isMasterAdmin && Boolean(scopedSocietyId);
  const menuGroups = isMasterSocietyMode
    ? [platformOwnerMenu[1], ...standardMenuGroups]
    : isMasterAdmin
      ? platformOwnerMenu
      : standardMenuGroups;

  const hasMenuRole = useMemo(() => {
    if (!isMasterSocietyMode) {
      return hasRole;
    }
    return (...roles) => {
      if (!user) return false;
      return roles.includes("SOCIETY_ADMIN");
    };
  }, [hasRole, isMasterSocietyMode, user]);

  const resolvePath = useMemo(() => {
    if (!isMasterSocietyMode) {
      return (path) => path;
    }
    return (path) => withSocietyScope(path, scopedSocietyId);
  }, [isMasterSocietyMode, scopedSocietyId]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    // Reset accordions after drawer closes
    setTimeout(() => setOpenAccordion(null), 250);
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      // Closing - reset accordions after transition
      setMobileMenuOpen(false);
      setTimeout(() => setOpenAccordion(null), 250);
    } else {
      // Opening - reset accordions immediately
      setOpenAccordion(null);
      setMobileMenuOpen(true);
    }
  };

  const handleAccordionToggle = (groupId) => {
    setOpenAccordion((prev) => (prev === groupId ? null : groupId));
  };

  const handleSidebarToggle = (groupId) => {
    setSidebarOpen((prev) => (prev === groupId ? null : groupId));
  };

  const handlePrefetch = (path) => {
    prefetchRoute(path);
  };

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setOpenAccordion(null);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="relative hidden before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-0 before:h-[200px] before:bg-[linear-gradient(180deg,rgba(47,129,247,0.03)_0%,transparent_100%)] before:content-[''] lg:fixed lg:inset-y-0 lg:left-0 lg:z-[45] lg:flex lg:w-[272px] lg:flex-col lg:overflow-hidden lg:border-r lg:border-[var(--border-default)] lg:bg-[var(--bg-secondary)]">
        <div className="relative border-b border-[var(--border-default)] px-5 pb-4 pt-5">
          <div className="group flex cursor-pointer items-center gap-3" onClick={() => navigate(resolvePath("/dashboard"))}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent-primary)_0%,#1d6ce0_100%)] shadow-[0_4px_16px_rgba(47,129,247,0.3)] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(47,129,247,0.4)]">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[20px] font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">SocietyHub</span>
              <span className="mt-[-2px] block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                Management Platform
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-4 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar]:w-1">
          <div className="mb-1 px-3.5 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Navigation</div>
          {isMasterSocietyMode && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeftRight size={14} />
              Exit Society
            </button>
          )}
          {menuGroups.map((group) =>
            group.path ? (
              <SidebarLink
                key={group.id}
                group={group}
                hasRole={hasMenuRole}
                onPrefetch={handlePrefetch}
                resolvePath={resolvePath}
              />
            ) : (
              <SidebarGroup
                key={group.id}
                group={group}
                hasRole={hasMenuRole}
                isOpen={sidebarOpen === group.id}
                onToggle={() => handleSidebarToggle(group.id)}
                onPrefetch={handlePrefetch}
                resolvePath={resolvePath}
              />
            ),
          )}
        </nav>

      </aside>

      {/* Top Navbar */}
      <header className="fixed inset-x-0 top-0 z-40 lg:left-[272px]">
        <div className="h-14 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] backdrop-blur-[8px] sm:h-16">
          <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between gap-4 px-4 lg:justify-end lg:px-6 [&>*]:min-w-0">
            {/* Logo - visible on mobile only */}
            <div className="group flex cursor-pointer items-center gap-3 text-decoration-none lg:hidden" onClick={() => navigate(resolvePath("/dashboard"))}>
              <div className="rounded-lg bg-[var(--accent-primary)] p-2 shadow-[0_2px_6px_rgba(47,129,247,0.2)] transition-transform duration-200 group-hover:scale-[1.04]">
                <Building2 size={22} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] font-extrabold tracking-[-0.02em] text-[var(--text-primary)]">SocietyHub</span>
                <span className="mt-[-2px] text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Management Platform
                </span>
              </div>
            </div>

            {/* Desktop Navigation - hidden, sidebar replaces it */}
            <nav className="hidden">
              {menuGroups.map((group) => (
                <NavDropdown
                  key={group.id}
                  group={group}
                  hasRole={hasMenuRole}
                  onPrefetch={handlePrefetch}
                  resolvePath={resolvePath}
                />
              ))}
            </nav>

            {/* User section - Desktop */}
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex min-h-11 items-center gap-2.5 rounded-lg border border-[var(--border-default)] px-3.5 py-1.5 transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
                  <span className="text-[13px] font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="grid gap-0.5 text-right">
                  <p className="m-0 text-[13px] font-semibold leading-[1.1] text-[var(--text-primary)]">{user?.name}</p>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.04em] leading-[1.1] text-[var(--accent-primary)]">
                    {user?.role?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-md border border-[var(--border-default)] bg-transparent p-2 text-[var(--text-secondary)] transition-all duration-150 hover:border-[rgba(248,113,113,0.4)] hover:bg-[rgba(248,113,113,0.08)] hover:text-[#ef4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Hamburger - Mobile */}
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-transparent p-2.5 text-[var(--text-secondary)] transition-all duration-150 hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] lg:hidden"
            >
              <div className="relative h-6 w-6">
                <Menu
                  size={24}
                  className={clsx(
                    "absolute inset-0 transition-all duration-300",
                    mobileMenuOpen
                      ? "rotate-90 scale-0 opacity-0"
                      : "rotate-0 scale-100 opacity-100",
                  )}
                />
                <X
                  size={24}
                  className={clsx(
                    "absolute inset-0 transition-all duration-300",
                    mobileMenuOpen
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-0 opacity-0",
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div
        className={clsx(
          "fixed inset-0 z-50 transition-opacity duration-300",
          mobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            "absolute inset-0 bg-black/70 transition-opacity duration-300",
            mobileMenuOpen
              ? "opacity-100"
              : "opacity-0",
          )}
          onClick={closeMobileMenu}
        />

        {/* Drawer */}
        <aside
          className={clsx(
            "absolute right-0 top-0 flex h-full w-[min(84vw,312px)] sm:w-[312px] md:w-[332px] max-w-[84vw] flex-col bg-[var(--bg-card)] shadow-[-8px_0_28px_rgba(0,0,0,0.38)] will-change-transform transition-transform duration-300 motion-reduce:transition-none",
            mobileMenuOpen
              ? "translate-x-0"
              : "translate-x-full",
          )}
        >
          {/* Mobile Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-default)] px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--accent-primary)_0%,#1d6ce0_100%)] shadow-sm">
                <Building2 size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-extrabold tracking-tight text-[var(--text-primary)]">SocietyHub</span>
                <span className="mt-[-2px] text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Management</span>
              </div>
            </div>
            <button
              onClick={closeMobileMenu}
              className="rounded-md bg-transparent p-2 text-[var(--text-primary)] transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto px-1.5 pb-28 pt-2 sm:px-2">
            {isMasterSocietyMode && (
              <button
                type="button"
                onClick={() => {
                  navigate("/dashboard");
                  closeMobileMenu();
                }}
                className="mb-2 flex w-full items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeftRight size={14} />
                Exit Society
              </button>
            )}
            {menuGroups.map((group) => (
              <MobileAccordion
                key={group.id}
                group={group}
                  hasRole={hasMenuRole}
                onNavigate={closeMobileMenu}
                isOpen={openAccordion === group.id}
                onToggle={() => handleAccordionToggle(group.id)}
                onPrefetch={handlePrefetch}
                  resolvePath={resolvePath}
              />
            ))}
          </nav>

          {/* Mobile User Section */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border-default)] bg-[var(--bg-card)]/95 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)] font-bold text-white shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold text-[var(--text-primary)]">
                  {user?.name}
                </span>
                <span className="truncate text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                  {user?.role?.replace(/_/g, " ")}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-transparent p-2.5 text-[var(--text-secondary)] transition-all duration-150 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-500 active:scale-95 focus-visible:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="min-h-screen pt-[57px] sm:pt-[65px] lg:ml-[272px]">
        <div className="p-3 sm:p-4 md:p-6 lg:px-7 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
