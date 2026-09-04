"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Boxes,
  ClipboardList,
  Columns3,
  Calendar,
  ArrowLeftRight,
  ShieldCheck,
  Users,
  LogOut,
  Wrench,
  GraduationCap,
  PackageCheck,
  ShoppingCart,
  HardHat,
  BarChart3,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Menu,
  X
} from "lucide-react";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const SIDEBAR_COLLAPSED_KEY = "erp-sidebar-collapsed";
const SIDEBAR_WIDTH_EXPANDED = 272;
const SIDEBAR_WIDTH_COLLAPSED = 76;
const APP_VERSION = "1.0.0";

// ──────────────────────────────────────────────
// Menu Configuration
// ──────────────────────────────────────────────
const menuGroups = [
  {
    title: "GENERAL",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "GL", "SUPERVISEUR", "OPERATEUR"],
      },
    ],
  },
  {
    title: "PRODUCTION",
    items: [
      {
        name: "Stock",
        path: "/stock",
        icon: Boxes,
        roles: ["ADMIN", "GL", "SUPERVISEUR", "OPERATEUR"],
      },
      {
        name: "BOM",
        path: "/bom",
        icon: ClipboardList,
        roles: ["ADMIN", "GL"],
      },
      {
        name: "Panneaux",
        path: "/panneaux",
        icon: Columns3,
        roles: ["ADMIN", "SUPERVISEUR", "GL"],
      },
      {
        name: "Planification",
        path: "/planification",
        icon: Calendar,
        roles: ["ADMIN", "GL", "SUPERVISEUR"],
      },
      {
        name: "Mouv. stock",
        path: "/mouvements-stock",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "GL", "OPERATEUR"],
      },
      {
        name: "Contrôle KHM",
        path: "/khm",
        icon: ShieldCheck,
        roles: ["ADMIN", "SUPERVISEUR"],
      },
      {
        name: "Réservation",
        path: "/reservation",
        icon: PackageCheck,
        roles: ["ADMIN"],
        // badge: 3,
      },
      {
        name: "Commande",
        path: "/commande",
        icon: ShoppingCart,
        roles: ["ADMIN"],
        // badge: 5,
      },
    ],
  },
  {
    title: "MAINTENANCE",
    items: [
      {
        name: "KPIs Maintenance",
        path: "/kpis",
        icon: BarChart3,
        roles: ["ADMIN", "SUPERVISEUR", "GL"],
      },
      {
        name: "Interventions",
        path: "/interventions",
        icon: Wrench,
        roles: ["ADMIN", "SUPERVISEUR", "GL", "OPERATEUR"],
        // badge: 2,
      },
      {
        name: "Techniciens",
        path: "/techniciens",
        icon: HardHat,
        roles: ["ADMIN", "SUPERVISEUR", "GL"],
      },
      {
        name: "Préventive",
        path: "/preventive",
        icon: CalendarCheck,
        roles: ["ADMIN", "SUPERVISEUR", "GL", "OPERATEUR"],
      },
      {
        name: "Compétences & Formations",
        path: "/formation",
        icon: GraduationCap,
        roles: ["ADMIN", "SUPERVISEUR", "GL"],
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      {
        name: "Utilisateurs",
        path: "/utilisateurs",
        icon: Users,
        roles: ["ADMIN", "MANAGER", "GL", "TL", "SUPERVISEUR"],
      },
      {
        name: "Organigramme",
        path: "/organigramme",
        icon: GitBranch,
        roles: ["ADMIN", "SUPERVISEUR", "GL", "MANAGER"],
      },
    ],
  },
];

// ──────────────────────────────────────────────
// Route matching utility
// ──────────────────────────────────────────────
function isRouteActive(pathname, itemPath) {
  if (pathname === itemPath) return true;
  // Match sub-routes only when path has real depth (avoid /d matching /dashboard)
  if (itemPath !== "/" && pathname.startsWith(itemPath + "/")) return true;
  return false;
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

/** Renders a single nav item */
function SidebarItem({ item, isActive, isCollapsed, onNavigate }) {
  const Icon = item.icon;

  return (
    <li className="relative group/item">
      <Link
        href={item.path}
        onClick={onNavigate}
        className={`
          relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
          transition-all duration-200 ease-out
         
          ${isCollapsed ? "justify-center" : ""}
          ${
            isActive
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }
        `}
      >
        {/* Active left border indicator */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1 bottom-1 w-[3px] bg-blue-600 rounded-r-full "
            initial={false}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        <Icon
          className={`flex-shrink-0 h-[18px] w-[18px] transition-colors duration-200 ${
            isActive
              ? "text-blue-600 "
              : "text-slate-600 group-hover/item:text-slate-600 "
          }`}
        />

        {!isCollapsed && (
          <>
            <span className="truncate flex-1">{item.name}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="ml-auto flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold tabular-nums ">
                {item.badge}
              </span>
            )}
          </>
        )}

        {/* Badge dot on collapsed icon */}
        {isCollapsed && item.badge != null && item.badge > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white " />
        )}
      </Link>

      {/* Tooltip (collapsed state only) */}
      {isCollapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-150">
          <div className="relative px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap">
            {item.name}
            {item.badge != null && item.badge > 0 && (
              <span className="ml-2 text-rose-300">{item.badge}</span>
            )}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45 " />
          </div>
        </div>
      )}
    </li>
  );
}

/** Renders a group of menu items with a section title */
function MenuGroup({ group, isCollapsed, pathname, onNavigate, index }) {
  const filteredItems = group.items.filter((item) =>
    /* role check happens in parent */ true
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="mb-5"
    >
      {/* Section title */}
      {!isCollapsed ? (
        <h3 className="px-4 pb-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-[0.08em] select-none ">
          {group.title}
        </h3>
      ) : (
        <div className="flex justify-center py-1">
          <div className="w-5 h-px bg-slate-200 " />
        </div>
      )}

      <ul className="space-y-0.5 px-2">
        {filteredItems.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            isActive={isRouteActive(pathname, item.path)}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </motion.div>
  );
}

/** Renders the user profile footer section */
function UserProfile({ user, isCollapsed, onLogout }) {
  const initial = user.name?.charAt(0)?.toUpperCase() || user.nom?.charAt(0)?.toUpperCase() || "U";
  const displayName = user.name || user.nom || "Utilisateur";
  const displayRole = user.role || "—";

  return (
    <div className="p-3 border-t border-slate-100 flex-shrink-0 ">
      <div
        className={`
          flex items-center gap-3 p-2 rounded-xl transition-colors
          hover:bg-slate-50  group/profile relative
          ${isCollapsed ? "justify-center" : ""}
        `}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {initial}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        {/* Name & role */}
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate ">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-600 font-medium ">
              {displayRole}
            </p>
          </div>
        )}

        {/* Logout button */}
        {!isCollapsed && (
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors "
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}

        {/* Collapsed tooltip */}
        {isCollapsed && (
          <div className="pointer-events-auto absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-150">
            <div className="relative px-3 py-2 bg-white text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap  space-y-1">
              <p className="font-semibold">{displayName}</p>
              <p className="text-slate-600 text-[10px]">{displayRole}</p>
              <button
                onClick={onLogout}
                className="mt-1 flex items-center gap-1.5 text-rose-300 hover:text-rose-100 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Déconnexion
              </button>
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45 " />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Sidebar Component
// ──────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Hydration-safe collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount: restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "true") setIsCollapsed(true);
    } catch {
      // localStorage unavailable (SSR/private browsing)
    }
    setMounted(true);
  }, []);

  // Persist collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Close mobile drawer on navigation
  const handleMobileNav = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Close mobile drawer on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileOpen]);

  // Pre-filter menu groups by user role (memoized)
  const filteredGroups = useMemo(() => {
    if (!user) return [];
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.roles.includes(user.role)),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  // Don't render until mounted (avoids hydration mismatch)
  if (!mounted || !user) return null;

  const sidebarWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <>
      {/* ─── Mobile Hamburger ─── */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white/90 backdrop-blur rounded-xl shadow-md border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors "
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ─── Mobile Overlay ─── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleMobileNav}
            className="md:hidden fixed inset-0 bg-white/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar Panel ─── */}
      <aside
        style={{ width: sidebarWidth }}
        className={`
          fixed top-0 left-0 h-screen z-50
          bg-white
border-r border-slate-200/80
          shadow-[0_0_15px_-3px_rgba(0,0,0,0.07)]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* ── Brand Header ── */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0 ">
          <div
            className={`flex items-center gap-3 overflow-hidden ${
              isCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-[18px] w-[18px] text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <h1 className="font-bold text-[15px] text-slate-800 leading-tight tracking-tight ">
                  Dashboard 
                </h1>
                <p className="text-[12px] text-slate-700 font-semibold uppercase tracking-[0.1em] ">
                  PPE Process
                </p>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button
            onClick={handleMobileNav}
            className="md:hidden p-1.5 text-slate-600 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors "
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Desktop Collapse Toggle ── */}
        <button
          onClick={toggleCollapsed}
          className="hidden md:flex absolute -right-3.5 top-[72px] bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:shadow-md rounded-full p-1.5 shadow-sm transition-all duration-200 z-10 "
          aria-label={isCollapsed ? "Étendre le menu" : "Réduire le menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto pt-5 pb-2 sidebar-scrollbar">
          {filteredGroups.map((group, idx) => (
            <MenuGroup
              key={group.title}
              group={group}
              isCollapsed={isCollapsed}
              pathname={pathname}
              onNavigate={handleMobileNav}
              index={idx}
            />
          ))}
        </nav>

        {/* ── Version Tag ── */}
        {!isCollapsed && (
          <div className="px-4 pb-1">
            <p className="text-[10px] text-slate-700 font-medium text-center ">
              v{APP_VERSION}
            </p>
          </div>
        )}

        {/* ── User Profile Footer ── */}
        <UserProfile
          user={user}
          isCollapsed={isCollapsed}
          onLogout={logout}
        />
      </aside>

      {/* ── Scrollbar Styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .sidebar-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
          }
          .sidebar-scrollbar:hover {
            scrollbar-color: #cbd5e1 transparent;
          }
          .sidebar-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: transparent;
            border-radius: 4px;
          }
          .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
            background: #e2e8f0;
          }
         .sidebar-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.sidebar-scrollbar:hover {
  scrollbar-color: #cbd5e1 transparent;
}

.sidebar-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 4px;
}

.sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #e2e8f0;
}
        `,
        }}
      />
    </>
  );
}
