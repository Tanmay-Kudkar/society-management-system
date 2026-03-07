import { useState, useRef, useEffect, useMemo } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  Layers,
  Wallet,
  Shield,
  Siren,
  SlidersHorizontal,
  Wrench,
  ClipboardList,
  Package,
  CalendarClock,
  UserCog,
  CalendarRange,
  HardHat,
  ArrowLeftRight,
  Ban,
  PawPrint,
  Store,
  BookOpen,
} from "lucide-react";
import clsx from "clsx";

const prefetchedRouteSet = new Set();

const routePrefetchMap = {
  "/": () => import("../pages/core/Dashboard"),
  "/settings": () => import("../pages/core/Settings"),
  "/reports": () => import("../pages/core/Reports"),
  "/users": () => import("../pages/users/Users"),
  "/roles-permissions": () => import("../pages/users/RolesPermissions"),
  "/societies": () => import("../pages/society/Societies"),
  "/society-admins": () => import("../pages/society/SocietyAdmins"),
  "/unit-management": () => import("../pages/unit/UnitManagement"),
  "/wings": () => import("../pages/unit/Wings"),
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
  "/banners": () => import("../pages/communication/Banners"),
  "/tickets": () => import("../pages/communication/Tickets"),
  "/complaints": () => import("../pages/communication/Complaints"),
  "/approvals": () => import("../pages/communication/Approvals"),
  "/emergency-contacts": () =>
    import("../pages/communication/EmergencyContacts"),
  "/documents": () => import("../pages/communication/Documents"),
  "/visitors": () => import("../pages/security/Visitors"),
  "/domestic-staff": () => import("../pages/security/DomesticStaff"),
  "/safety": () => import("../pages/security/Safety"),
  "/guard-patrol": () => import("../pages/security/GuardPatrol"),
  "/work-orders": () => import("../pages/core/WorkOrders"),
  "/assets": () => import("../pages/core/Assets"),
  "/common-areas": () => import("../pages/core/CommonAreas"),
  "/staff-shifts": () => import("../pages/core/StaffShifts"),
  "/facility-booking": () => import("../pages/core/FacilityBooking"),
  "/renovation-nocs": () => import("../pages/core/RenovationNocs"),
  "/move-tracking": () => import("../pages/core/MoveTracking"),
  "/penalties": () => import("../pages/core/Penalties"),
  "/pet-registrations": () => import("../pages/core/PetRegistrations"),
  "/classifieds": () => import("../pages/core/Classifieds"),
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

// MASTER_ADMIN specific menu - simplified for platform management
const platformOwnerMenu = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    id: "society-admins",
    label: "Society Admins",
    icon: UserCheck,
    path: "/society-admins",
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
    path: "/",
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
        path: "/wings",
        icon: Layers,
        label: "Wings",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "MANAGER"],
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
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: Megaphone,
    items: [
      { path: "/notices", icon: Megaphone, label: "Notices" },
      {
        path: "/banners",
        icon: Image,
        label: "Banners",
        roles: ["SOCIETY_ADMIN", "CHAIRMAN", "SECRETARY", "MANAGER"],
      },
      { path: "/tickets", icon: Ticket, label: "Tickets" },
      { path: "/complaints", icon: MessageSquare, label: "Complaints" },
      {
        path: "/approvals",
        icon: FileCheck,
        label: "Approvals",
        roles: [
          "SOCIETY_ADMIN",
          "CHAIRMAN",
          "SECRETARY",
          "TREASURER",
          "COMMITTEE",
          "MANAGER",
        ],
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    icon: FileCheck,
    items: [
      { path: "/emergency-contacts", icon: Phone, label: "Emergency Contacts" },
      { path: "/documents", icon: FileCheck, label: "Documents" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    items: [
      { path: "/visitors", icon: UserCheck, label: "Visitors" },
      { path: "/domestic-staff", icon: Users, label: "Domestic Staff" },
      { path: "/safety", icon: Siren, label: "Safety & SOS" },
      { path: "/guard-patrol", icon: Shield, label: "Guard Patrol" },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    items: [
      { path: "/work-orders", icon: ClipboardList, label: "Work Orders" },
      { path: "/assets", icon: Package, label: "Assets & Inventory" },
      { path: "/common-areas", icon: CalendarClock, label: "Common Areas" },
      { path: "/staff-shifts", icon: UserCog, label: "Staff Shifts" },
      {
        path: "/facility-booking",
        icon: CalendarRange,
        label: "Facility Booking",
      },
      { path: "/renovation-nocs", icon: HardHat, label: "Renovation NOC" },
      { path: "/move-tracking", icon: ArrowLeftRight, label: "Move In/Out" },
      { path: "/penalties", icon: Ban, label: "Penalties" },
      { path: "/pet-registrations", icon: PawPrint, label: "Pet Registry" },
      { path: "/classifieds", icon: Store, label: "Classifieds" },
      { path: "/society-rules", icon: BookOpen, label: "Rules & Bylaws" },
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
function NavDropdown({ group, hasRole, onPrefetch }) {
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
        to={group.path}
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
            to={item.path}
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
        to={group.path}
        onMouseEnter={() => onPrefetch?.(group.path)}
        onFocus={() => onPrefetch?.(group.path)}
        onClick={onNavigate}
        className={clsx(
          "mb-0.5 flex items-center gap-[11px] whitespace-nowrap rounded-[10px] px-3.5 py-[11px] text-sm font-semibold no-underline transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
          isActiveGroup
            ? "bg-[var(--accent-primary)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.06)] hover:text-[var(--text-primary)]",
        )}
      >
        <group.icon size={20} />
        <span>{group.label}</span>
      </NavLink>
    );
  }

  // Accordion
  return (
    <div className="overflow-hidden">
      <button
        onClick={onToggle}
        className={clsx(
          "mb-0.5 flex w-full items-center justify-between rounded-[10px] border-none bg-transparent px-3.5 py-[11px] text-left font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
          isActiveGroup
            ? "bg-[rgba(47,129,247,0.08)] text-[var(--accent-primary)] font-[650]"
            : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.06)] hover:text-[var(--text-primary)]",
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
              to={item.path}
              onMouseEnter={() => onPrefetch?.(item.path)}
              onFocus={() => onPrefetch?.(item.path)}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  "mx-1.5 mb-px flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-[9px] pl-11 text-[13.5px] font-medium no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
                  isActive
                    ? "bg-[rgba(47,129,247,0.1)] text-[var(--accent-primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.08)] hover:text-[var(--text-primary)]",
                )
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

// Desktop sidebar link
function SidebarLink({ group, hasRole, onPrefetch }) {
  const location = useLocation();
  if (group.roles && !hasRole(...group.roles)) return null;
  const isActive = location.pathname === group.path;
  return (
    <NavLink
      to={group.path}
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
function SidebarGroup({ group, hasRole, isOpen, onToggle, onPrefetch }) {
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
          "relative flex w-full items-center justify-between whitespace-nowrap rounded-[10px] border-none bg-transparent px-3.5 py-2.5 text-[13.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
          isActiveGroup || isOpen
            ? "text-[var(--accent-primary)] font-[650]"
            : "text-[var(--text-secondary)] hover:bg-[rgba(47,129,247,0.08)] hover:text-[var(--text-primary)]",
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
              to={item.path}
              onMouseEnter={() => onPrefetch?.(item.path)}
              onFocus={() => onPrefetch?.(item.path)}
              className={({ isActive }) =>
                clsx(
                  "mb-px flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 py-2 pl-[22px] text-[13px] font-medium no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]",
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
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(null);

  // Determine which menu to show based on user role
  const isMasterAdmin =
    user?.role === "MASTER_ADMIN" || user?.role === "MASTER_ADMIN";
  const menuGroups = isMasterAdmin ? platformOwnerMenu : standardMenuGroups;

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
      <aside className="relative hidden before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-0 before:h-[200px] before:bg-[linear-gradient(180deg,rgba(47,129,247,0.03)_0%,transparent_100%)] before:content-[''] lg:fixed lg:inset-y-0 lg:left-0 lg:z-[45] lg:flex lg:w-[260px] lg:flex-col lg:overflow-hidden lg:border-r lg:border-[var(--border-default)] lg:bg-[var(--bg-secondary)]">
        <div className="relative border-b border-[var(--border-default)] px-5 pb-4 pt-5">
          <div className="group flex cursor-pointer items-center gap-3" onClick={() => navigate("/")}>
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
          {menuGroups.map((group) =>
            group.path ? (
              <SidebarLink
                key={group.id}
                group={group}
                hasRole={hasRole}
                onPrefetch={handlePrefetch}
              />
            ) : (
              <SidebarGroup
                key={group.id}
                group={group}
                hasRole={hasRole}
                isOpen={sidebarOpen === group.id}
                onToggle={() => handleSidebarToggle(group.id)}
                onPrefetch={handlePrefetch}
              />
            ),
          )}
        </nav>

      </aside>

      {/* Top Navbar */}
      <header className="fixed inset-x-0 top-0 z-40 lg:left-[260px]">
        <div className="h-16 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] backdrop-blur-[8px]">
          <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between gap-4 px-4 lg:justify-end lg:px-6 [&>*]:min-w-0">
            {/* Logo - visible on mobile only */}
            <div className="group flex cursor-pointer items-center gap-3 text-decoration-none lg:hidden" onClick={() => navigate("/")}>
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
                  hasRole={hasRole}
                  onPrefetch={handlePrefetch}
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
              className="inline-flex items-center justify-center rounded-md border border-[var(--border-default)] bg-transparent p-2 text-[var(--text-secondary)] transition-all duration-150 hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)] lg:hidden"
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
            "absolute right-0 top-0 flex h-full w-[320px] max-w-[85vw] flex-col bg-[var(--bg-card)] shadow-[-4px_0_24px_rgba(0,0,0,0.3)] transition-transform duration-[250ms]",
            mobileMenuOpen
              ? "translate-x-0"
              : "translate-x-full",
          )}
        >
          {/* Mobile Header */}
          <div className="flex h-16 items-center justify-between border-b border-[var(--border-default)] px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--accent-primary)] p-2 shadow-[0_2px_6px_rgba(47,129,247,0.2)]">
                <Building2 size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[var(--text-primary)]">Menu</span>
                <span className="mt-[-2px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Navigation</span>
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
          <nav className="flex-1 overflow-y-auto px-2 pb-40 pt-3">
            {menuGroups.map((group) => (
              <MobileAccordion
                key={group.id}
                group={group}
                hasRole={hasRole}
                onNavigate={closeMobileMenu}
                isOpen={openAccordion === group.id}
                onToggle={() => handleAccordionToggle(group.id)}
                onPrefetch={handlePrefetch}
              />
            ))}
          </nav>

          {/* Mobile User Section */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border-default)] bg-[var(--bg-card)] p-4">
            <div className="mb-3 flex items-center gap-3 rounded-[10px] border border-[rgba(47,129,247,0.1)] bg-[rgba(47,129,247,0.04)] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--accent-primary)_0%,#1d6ce0_100%)] shadow-[0_2px_8px_rgba(47,129,247,0.2)]">
                <span className="font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate whitespace-nowrap text-[13px] font-bold leading-[1.2] text-[var(--text-primary)]">{user?.name}</p>
                <p className="m-0 truncate whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.03em] leading-[1.2] text-[var(--accent-primary)]">
                  {user?.role?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border-none bg-[linear-gradient(135deg,#ef4444_0%,#dc2626_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(239,68,68,0.25)] transition-all duration-150 hover:-translate-y-px hover:bg-[linear-gradient(135deg,#dc2626_0%,#b91c1c_100%)] hover:shadow-[0_4px_14px_rgba(239,68,68,0.35)] active:translate-y-0 active:shadow-[0_1px_4px_rgba(239,68,68,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="min-h-screen pt-[65px] lg:ml-[260px]">
        <div className="p-4 md:p-6 lg:px-7 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
