"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const getInitials = (name) => {
  const s = String(name || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || parts[0]?.[1] || "";
  return (first + second).toUpperCase() || "U";
};

const NavItem = ({ href, icon, label, badge, isCollapsed }) => {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out group ${active
        ? "bg-surface-container-highest text-secondary border-l-4 border-secondary"
        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
        } ${isCollapsed ? "justify-center px-0 border-l-0" : ""}`}
      title={isCollapsed ? label : ""}
    >
      <span className={`material-symbols-outlined ${active ? "active-icon" : ""}`}
        style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className="font-medium truncate flex-1">{label}</span>
      )}
      {!isCollapsed && badge && (
        <span className="bg-red-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
};

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { data: session, status } = useSession();

  const userName =
    session?.user?.name ||
    session?.user?.nombre ||
    session?.user?.email ||
    "Usuario";

  const userRole = (session?.user?.rol || session?.user?.role || session?.rol || "USUARIO").toUpperCase();
  const initials = getInitials(userName);

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col py-6 bg-surface font-['Manrope'] text-sm tracking-wide z-50 transition-all duration-300 ease-in-out border-r border-surface-container-high  ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      {/* Brand & Toggle */}
      <div className={`px-6 flex items-center mb-10 ${isCollapsed ? "justify-center px-0" : "justify-between"}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "hidden" : ""}`}>
          <div className="w-8 h-8 rounded bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-on-surface">ASESUR</h1>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? "menu" : "menu_open"}
          </span>
        </button>
      </div>

      {/* Navigation — filtrado por rol */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {/* Dashboard: todos menos CAPTADOR */}
        {userRole !== "CAPTADOR" && (
          <NavItem href="/dashboard" icon="dashboard" label="Dashboard" isCollapsed={isCollapsed} />
        )}

        {/* Captaciones: todos */}
        <NavItem href="/captaciones" icon="payments" label="Captaciones" isCollapsed={isCollapsed} />

        {/* Pre-Siniestros: no CAPTADOR */}
        {userRole !== "CAPTADOR" && (
          <NavItem href="/pre-siniestro" icon="fact_check" label="Pre-Siniestros" isCollapsed={isCollapsed} />
        )}

        {/* Siniestros: no CAPTADOR */}
        {userRole !== "CAPTADOR" && (
          <NavItem href="/siniestros" icon="emergency" label="Siniestros" isCollapsed={isCollapsed} />
        )}

        {/* Historial: solo roles avanzados */}
        {!["CAPTADOR", "ASESOR"].includes(userRole) && (
          <NavItem href="/historial" icon="history" label="Historial" isCollapsed={isCollapsed} />
        )}

        {/* Usuarios y Configuración: exclusivo MASTER */}
        {userRole === "MASTER" && (
          <NavItem href="/usuarios" icon="group" label="Usuarios" isCollapsed={isCollapsed} />
        )}
        {userRole === "MASTER" && (
          <NavItem href="/configuracion" icon="settings" label="Configuración" isCollapsed={isCollapsed} />
        )}
      </nav>

      {/* User card (Variation 1: Minimalist Template) */}
      <div className="mt-auto px-2 pb-4">
        <div className={`bg-surface-container-high p-4 rounded-xl transition-all duration-300 ${isCollapsed ? "flex flex-col items-center gap-4" : "flex items-center justify-between group"}`}>
          <div className={`flex items-center gap-4 ${isCollapsed ? "flex-col" : ""}`}>
            <div className="relative w-12 h-12 rounded-lg flex-shrink-0 bg-primary-container text-primary flex items-center justify-center font-bold text-lg overflow-hidden border border-outline-variant/10 shadow-inner">
              {initials}
              <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-green-100 border border-surface-container-low rounded-full"></span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-on-surface font-semibold text-xs leading-tight truncate" title={userName}>{userName}</span>
                <span className="text-on-surface-variant text-xs font-medium truncate">{userRole}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-bright hover:text-on-surface transition-colors active:scale-90 shrink-0"
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
