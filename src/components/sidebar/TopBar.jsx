"use client";

// src/components/sidebar/TopBar.jsx
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { mockUser } from "@/lib/mockData";

const pageTitle = (pathname) => {
  const map = {
    "/dashboard": "Panel Principal",
    "/notificaciones": "Notificaciones",
    "/autorizaciones": "Autorizaciones",
    "/validacion-pre-siniestro": "Validación Pre-Siniestro",
    "/gestion-siniestros": "Gestión de Siniestros",
    "/reportes-analitica": "Reportes y Analítica",
    "/usuarios": "Usuarios",
    "/configuracion": "Configuración",
  };
  return map[pathname] || "ASESUR";
};

export default function TopBar() {
  const pathname = usePathname();
  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const [q, setQ] = useState("");

  return (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        borderBottom: "1px solid #E5E7EB",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 1, height: 26, background: "#E5E7EB" }} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontSize: 14, color: "#64748B" }}>ASESUR</div>
          <div style={{ fontSize: 14, color: "#94A3B8" }}>/</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            {title}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 420, maxWidth: "48vw" }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: 10,
                fontSize: 14,
                color: "#94A3B8",
              }}
            >
              🔎
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar caso, cliente..."
              style={{
                width: "100%",
                padding: "10px 12px 10px 34px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                outline: "none",
                background: "#fff",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            background: "#fff",
            cursor: "pointer",
            position: "relative",
          }}
          title="Notificaciones"
        >
          🔔
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: "#EF4444",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "grid",
              placeItems: "center",
              border: "2px solid #fff",
            }}
          >
            4
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "#0F172A",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {mockUser.initials}
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
              {mockUser.name}
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{mockUser.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
