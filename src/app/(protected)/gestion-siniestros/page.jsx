"use client";

// src/app/gestion-siniestros/page.jsx
import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import { mockSiniestros } from "@/lib/mockData";

const toneEstado = (e) => {
  if (e === "Resuelto") return "green";
  if (e === "Autorizado") return "green";
  if (e === "Pendiente") return "yellow";
  return "gray";
};

const tonePrioridad = (p) => {
  if (p === "Urgente") return "red";
  if (p === "Alta") return "yellow";
  if (p === "Media") return "blue";
  return "gray";
};

export default function GestionSiniestrosPage() {
  const [tab, setTab] = useState("todos");
  const [q, setQ] = useState("");
  const rows = mockSiniestros;

  const filtered = useMemo(() => {
    let out = rows;

    if (tab === "en-proceso") out = out.filter((r) => r.estado === "En proceso");
    if (tab === "pendiente") out = out.filter((r) => r.estado === "Pendiente");
    if (tab === "autorizado") out = out.filter((r) => r.estado === "Autorizado");
    if (tab === "resuelto") out = out.filter((r) => r.estado === "Resuelto");

    const s = q.trim().toLowerCase();
    if (s) {
      out = out.filter(
        (r) =>
          r.id.toLowerCase().includes(s) ||
          r.cliente.toLowerCase().includes(s) ||
          r.tipo.toLowerCase().includes(s)
      );
    }

    return out;
  }, [rows, tab, q]);

  const counts = useMemo(() => {
    const c = (estado) => rows.filter((r) => r.estado === estado).length;
    return {
      enProceso: c("En proceso"),
      pendiente: c("Pendiente"),
      autorizado: c("Autorizado"),
      resuelto: c("Resuelto"),
    };
  }, [rows]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>
            Gestión de Siniestros
          </div>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            {rows.length} casos en el sistema
          </div>
        </div>

        <button
          onClick={() => alert("Nuevo Caso (mock)")}
          style={{
            background: "#0B1F3B",
            border: "1px solid #0B1F3B",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ＋ Nuevo Caso
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "todos", label: "Todos" },
              { value: "en-proceso", label: `En proceso ${counts.enProceso}` },
              { value: "pendiente", label: `Pendiente ${counts.pendiente}` },
              { value: "autorizado", label: `Autorizado ${counts.autorizado}` },
              { value: "resuelto", label: `Resuelto ${counts.resuelto}` },
            ]}
          />
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          style={{
            width: 260,
            maxWidth: "40vw",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            outline: "none",
            background: "#fff",
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 1fr 160px 140px",
            padding: "12px 16px",
            borderBottom: "1px solid #EEF2F7",
            fontSize: 12,
            fontWeight: 900,
            color: "#64748B",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          <div>CASO</div>
          <div>CLIENTE</div>
          <div>TIPO</div>
          <div>ESTADO</div>
          <div>PRIORIDAD</div>
        </div>

        {filtered.map((r, idx) => (
          <div
            key={r.id}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr 1fr 160px 140px",
              padding: "14px 16px",
              borderTop: idx === 0 ? "none" : "1px solid #F1F5F9",
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 900, color: "#0F172A" }}>{r.id}</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{r.date}</div>
            </div>
            <div style={{ color: "#0F172A", fontWeight: 800 }}>{r.cliente}</div>
            <div style={{ color: "#1D4ED8", fontWeight: 800 }}>{r.tipo}</div>
            <div>
              <Badge tone={toneEstado(r.estado)}>{r.estado}</Badge>
            </div>
            <div>
              <Badge tone={tonePrioridad(r.prioridad)}>{r.prioridad}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
