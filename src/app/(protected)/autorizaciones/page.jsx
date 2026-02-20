"use client";

// src/app/autorizaciones/page.jsx
import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { mockAutorizaciones } from "@/lib/mockData";

const tonePrioridad = (p) => {
  if (p === "Urgente") return "red";
  if (p === "Alta") return "yellow";
  if (p === "Media") return "blue";
  return "gray";
};

const toneDocs = (d) => (String(d).toLowerCase().includes("completo") ? "green" : "yellow");

export default function AutorizacionesPage() {
  const [rows, setRows] = useState(mockAutorizaciones);

  const kpis = useMemo(() => {
    const urg = rows.filter((r) => r.prioridad === "Urgente").length;
    const alta = rows.filter((r) => r.prioridad === "Alta").length;
    const docsOk = rows.filter((r) => String(r.docs).toLowerCase().includes("completo")).length;
    return { urg, alta, docsOk, total: rows.length };
  }, [rows]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        <div style={cardKpiStyle}>
          <div style={kpiNumStyle}>{kpis.urg}</div>
          <div style={kpiLblStyle}>URGENTES</div>
        </div>
        <div style={cardKpiStyle}>
          <div style={kpiNumStyle}>{kpis.alta}</div>
          <div style={kpiLblStyle}>ALTA PRIORIDAD</div>
        </div>
        <div style={cardKpiStyle}>
          <div style={kpiNumStyle}>{kpis.docsOk}</div>
          <div style={kpiLblStyle}>DOCS COMPLETOS</div>
        </div>
        <div style={cardKpiStyle}>
          <div style={kpiNumStyle}>{kpis.total}</div>
          <div style={kpiLblStyle}>TOTAL PENDIENTES</div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {rows.map((r, idx) => (
          <div
            key={r.id}
            style={{
              padding: 16,
              borderTop: idx === 0 ? "none" : "1px solid #EEF2F7",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "#F59E0B" }} />
                <div style={{ fontWeight: 900, color: "#0F172A" }}>{r.id}</div>
                <Badge tone={tonePrioridad(r.prioridad)}>{r.prioridad}</Badge>
                <Badge tone={toneDocs(r.docs)}>{r.docs}</Badge>
              </div>

              <div style={{ color: "#0F172A", fontWeight: 800 }}>
                {r.cliente} <span style={{ color: "#64748B", fontWeight: 700 }}>– {r.tipo}</span>
              </div>

              <div style={{ fontSize: 12, color: "#64748B" }}>
                Asesor: <b>{r.asesor}</b> &nbsp;&nbsp; Solicitado: <b>{r.solicitado}</b>
                &nbsp;&nbsp; <span style={{ color: "#0F172A", fontWeight: 900 }}>{r.monto}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnSoft}>👁 Revisar</button>
              <button
                style={{ ...btnSolid, background: "#16A34A" }}
                onClick={() => alert(`Aprobar ${r.id} (mock)`)}
              >
                ✓ Aprobar
              </button>
              <button
                style={{ ...btnSoft, borderColor: "#FECACA", color: "#B91C1C" }}
                onClick={() => alert(`Rechazar ${r.id} (mock)`)}
              >
                ✕ Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardKpiStyle = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 16,
  textAlign: "center",
};
const kpiNumStyle = { fontSize: 28, fontWeight: 900, color: "#0F172A" };
const kpiLblStyle = { fontSize: 12, fontWeight: 900, color: "#64748B", letterSpacing: 1 };

const btnSoft = {
  border: "1px solid #E5E7EB",
  background: "#fff",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 900,
};
const btnSolid = {
  border: "1px solid transparent",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 900,
};
