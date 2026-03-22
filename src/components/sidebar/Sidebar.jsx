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

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon="dashboard" label="Dashboard" isCollapsed={isCollapsed} />
        <NavItem href="/captaciones" icon="payments" label="Captaciones" isCollapsed={isCollapsed} />
        <NavItem href="/pre-siniestro" icon="fact_check" label="Pre-Siniestros" isCollapsed={isCollapsed} />
        <NavItem href="/siniestros" icon="emergency" label="Siniestros" isCollapsed={isCollapsed} />

        <NavItem href="/usuarios" icon="group" label="Usuarios" isCollapsed={isCollapsed} />
        <NavItem href="/configuracion" icon="settings" label="Configuración" isCollapsed={isCollapsed} />
        <NavItem href="/historial" icon="history" label="Historial" isCollapsed={isCollapsed} />
      </nav>

      {/* User card */}
      <div className="mt-auto px-4 pt-4">
        <div className={`bg-surface-container-high rounded-xl p-4 mb-4 transition-all duration-300 ${isCollapsed ? "p-2 flex flex-col items-center" : ""}`}>
          <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? "mb-1" : ""}`}>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary font-bold">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-surface-container-high rounded-full"></span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-on-surface" title={userName}>{userName}</p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary-container text-on-tertiary-container">
                  {userRole}
                </span>
              </div>
            )}
          </div>
          <div className={`flex flex-col gap-1 ${isCollapsed ? "items-center" : ""}`}>
            <Link href="/perfil" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface text-xs py-1 transition-colors">
              <span className="material-symbols-outlined text-base">account_circle</span>
              {!isCollapsed && <span>Perfil</span>}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-error/80 hover:text-error text-xs py-1 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              {!isCollapsed && <span>Salir</span>}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
