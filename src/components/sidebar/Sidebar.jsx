"use client";

// src/components/sidebar/Sidebar.jsx
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

const prettyRole = (rol) => {
  const r = String(rol || "").trim();
  if (!r) return "Usuario";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
};

const NavItem = ({ href, icon, label, badge }) => {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: 10,
        color: active ? "#0F172A" : "#CBD5E1",
        background: active ? "#1118271A" : "transparent",
        border: active ? "1px solid #FFFFFF22" : "1px solid transparent",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 18, textAlign: "center" }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: active ? 700 : 600 }}>
          {label}
        </span>
      </span>

      {badge ? (
        <span
          style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: "#991B1B",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
};

export default function Sidebar() {
  const { data: session, status } = useSession();

  const userName =
    session?.user?.name ||
    session?.user?.nombre ||
    session?.user?.email ||
    "Usuario";

  const userRole =
    session?.user?.rol || session?.user?.role || session?.rol || "USUARIO";

  const initials = getInitials(userName);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0B1F3B] text-slate-200 border-r border-[#0B1F3B] p-4 flex flex-col overflow-y-auto">
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#FBBF24",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            color: "#0B1F3B",
          }}
        >
          A
        </div>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>ASESUR</div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Asesoría de Seguros</div>
        </div>
      </div>

      {/* Principal */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, color: "#64748B", padding: "8px 10px" }}>
          PRINCIPAL
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <NavItem href="/dashboard" icon="▦" label="Panel Principal" />
          <NavItem href="/captura-caso" icon="▣" label="Captura de Caso" />
          <NavItem
            href="/validacion-pre-siniestro"
            icon="✓"
            label="Validación Pre-Siniestro"
          />
          <NavItem
            href="/autorizaciones"
            icon="🛡"
            label="Autorizaciones"
            badge="5"
          />
          <NavItem href="/gestion-siniestros" icon="📄" label="Gestión de Siniestros" />
        </div>
      </div>

      {/* Sistema */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, color: "#64748B", padding: "8px 10px" }}>
          SISTEMA
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <NavItem href="/notificaciones" icon="🔔" label="Notificaciones" badge="12" />
          <NavItem href="/reportes-analitica" icon="📊" label="Reportes y Analítica" />
          <NavItem href="/usuarios" icon="👥" label="Usuarios" />
          <NavItem href="/configuracion" icon="⚙️" label="Configuración" />
        </div>
      </div>

      {/* User card */}
      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#0F2A52",
            border: "1px solid #163A6B",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#0F172A",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
            }}
            title={userName}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* ✅ hover tooltip con el nombre completo */}
            <div
              title={userName}
              style={{
                fontSize: 13,
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "default",
              }}
            >
              {status === "loading" ? "Cargando..." : userName}
            </div>

            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              {prettyRole(userRole)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              border: "1px solid #244B7C",
              background: "#0B1F3B",
              color: "#E2E8F0",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
