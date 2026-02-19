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
          "app-nav__link",
          isActive ? "app-nav__link--active" : "app-nav__link--idle",
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
      className="app-nav__item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={clsx(
          "app-nav__trigger",
          isActive ? "app-nav__trigger--active" : "app-nav__trigger--idle",
        )}
      >
        <group.icon size={18} />
        <span>{group.label}</span>
        <ChevronDown
          size={14}
          className={clsx(
            "app-nav__chevron",
            isOpen && "app-nav__chevron--open",
          )}
        />
      </button>

      <div
        className={clsx(
          "app-nav__menu",
          isOpen ? "app-nav__menu--open" : "app-nav__menu--closed",
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
                "app-nav__menu-link",
                isActive
                  ? "app-nav__menu-link--active accent-bg-light accent-text"
                  : "app-nav__menu-link--idle",
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
          "app-mobile__link",
          isActiveGroup
            ? "app-mobile__link--active accent-bg-light accent-text"
            : "app-mobile__link--idle",
        )}
      >
        <group.icon size={20} />
        <span>{group.label}</span>
      </NavLink>
    );
  }

  // Accordion
  return (
    <div className="app-mobile__accordion">
      <button
        onClick={onToggle}
        className={clsx(
          "app-mobile__trigger",
          isActiveGroup
            ? "app-mobile__trigger--active"
            : "app-mobile__trigger--idle",
        )}
      >
        <div className="app-mobile__trigger-row">
          <group.icon size={20} />
          <span>{group.label}</span>
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            "app-mobile__chevron",
            isOpen && "app-mobile__chevron--open",
          )}
        />
      </button>

      <div
        className="app-mobile__panel"
        style={{ height: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="app-mobile__panel-inner">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onMouseEnter={() => onPrefetch?.(item.path)}
              onFocus={() => onPrefetch?.(item.path)}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  "app-mobile__sublink",
                  isActive
                    ? "app-mobile__sublink--active accent-bg-light accent-text"
                    : "app-mobile__sublink--idle",
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
        "app-sidebar__link",
        isActive ? "app-sidebar__link--active" : "app-sidebar__link--idle",
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
    <div className="app-sidebar__group">
      <button
        onClick={onToggle}
        className={clsx(
          "app-sidebar__trigger",
          isActiveGroup || isOpen
            ? "app-sidebar__trigger--active"
            : "app-sidebar__trigger--idle",
        )}
      >
        <div className="app-sidebar__trigger-left">
          <group.icon size={20} />
          <span>{group.label}</span>
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            "app-sidebar__chevron",
            isOpen && "app-sidebar__chevron--open",
          )}
        />
      </button>
      <div
        className="app-sidebar__submenu"
        style={{ height: isOpen ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="app-sidebar__submenu-inner">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onMouseEnter={() => onPrefetch?.(item.path)}
              onFocus={() => onPrefetch?.(item.path)}
              className={({ isActive }) =>
                clsx(
                  "app-sidebar__sublink",
                  isActive
                    ? "app-sidebar__sublink--active"
                    : "app-sidebar__sublink--idle",
                )
              }
            >
              <span className="app-sidebar__dot" />
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
    setTimeout(() => setOpenAccordion(null), 300);
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      // Closing - reset accordions after transition
      setMobileMenuOpen(false);
      setTimeout(() => setOpenAccordion(null), 300);
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
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar">
        <div className="app-sidebar__header">
          <div className="app-sidebar__logo" onClick={() => navigate("/")}>
            <div className="app-sidebar__logo-mark">
              <Building2 size={20} className="app-sidebar__logo-icon" />
            </div>
            <div className="app-sidebar__logo-text">
              <span className="app-sidebar__brand-name">SocietyHub</span>
              <span className="app-sidebar__brand-tag">
                Management Platform
              </span>
            </div>
          </div>
        </div>

        <nav className="app-sidebar__nav">
          <div className="app-sidebar__section-title">Navigation</div>
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

        <div className="app-sidebar__footer">
          <div className="app-sidebar__user-card">
            <div className="app-sidebar__avatar">
              <span className="app-sidebar__initial">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="app-sidebar__user-info">
              <p className="app-sidebar__user-name">{user?.name}</p>
              <p className="app-sidebar__user-role">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="app-sidebar__logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="app-layout__header">
        <div className="app-layout__bar">
          <div className="app-layout__bar-inner">
            {/* Logo - visible on mobile only */}
            <div className="app-layout__logo" onClick={() => navigate("/")}>
              <div className="app-layout__logo-mark">
                <Building2 size={22} className="app-layout__logo-icon" />
              </div>
              <div className="app-layout__logo-text">
                <span className="app-layout__brand">SocietyHub</span>
                <span className="app-layout__subtitle">
                  Management Platform
                </span>
              </div>
            </div>

            {/* Desktop Navigation - hidden, sidebar replaces it */}
            <nav className="app-layout__nav">
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
            <div className="app-layout__user">
              <div className="app-layout__user-card">
                <div className="app-layout__user-avatar">
                  <span className="app-layout__user-initial">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="app-layout__user-info">
                  <p className="app-layout__user-name">{user?.name}</p>
                  <p className="app-layout__user-role">
                    {user?.role?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="app-layout__logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Hamburger - Mobile */}
            <button
              onClick={toggleMobileMenu}
              className="app-layout__menu-button"
            >
              <div className="app-layout__menu-icon">
                <Menu
                  size={24}
                  className={clsx(
                    "app-layout__menu-line",
                    mobileMenuOpen
                      ? "app-layout__menu-line--hidden"
                      : "app-layout__menu-line--visible",
                  )}
                />
                <X
                  size={24}
                  className={clsx(
                    "app-layout__menu-line",
                    mobileMenuOpen
                      ? "app-layout__menu-line--visible"
                      : "app-layout__menu-line--hidden-reverse",
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
          "app-layout__drawer-overlay",
          mobileMenuOpen
            ? "app-layout__drawer-overlay--open"
            : "app-layout__drawer-overlay--closed",
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            "app-layout__drawer-backdrop",
            mobileMenuOpen
              ? "app-layout__drawer-backdrop--open"
              : "app-layout__drawer-backdrop--closed",
          )}
          onClick={closeMobileMenu}
        />

        {/* Drawer */}
        <aside
          className={clsx(
            "app-layout__drawer",
            mobileMenuOpen
              ? "app-layout__drawer--open"
              : "app-layout__drawer--closed",
          )}
        >
          {/* Mobile Header */}
          <div className="app-layout__drawer-header">
            <div className="app-layout__drawer-brand">
              <div className="app-layout__drawer-mark">
                <Building2 size={18} className="app-layout__drawer-icon" />
              </div>
              <div className="app-layout__drawer-text">
                <span className="app-layout__drawer-title">Menu</span>
                <span className="app-layout__drawer-subtitle">Navigation</span>
              </div>
            </div>
            <button
              onClick={closeMobileMenu}
              className="app-layout__drawer-close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="app-layout__drawer-nav">
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
          <div className="app-layout__drawer-user">
            <div className="app-layout__drawer-user-card">
              <div className="app-layout__drawer-avatar">
                <span className="app-layout__drawer-initial">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="app-layout__drawer-info">
                <p className="app-layout__drawer-name">{user?.name}</p>
                <p className="app-layout__drawer-role">
                  {user?.role?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="app-layout__drawer-logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="app-layout__main">
        <div className="app-layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
