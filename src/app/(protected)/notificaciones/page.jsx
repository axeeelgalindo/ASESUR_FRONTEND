"use client";

// src/app/notificaciones/page.jsx
import { useMemo, useState } from "react";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import { mockNotificaciones } from "@/lib/mockData";

const iconByType = {
  auth: "🛡",
  doc: "📄",
  comment: "💬",
  alert: "⚠️",
  ok: "✅",
};

const toneByType = {
  auth: "blue",
  doc: "green",
  comment: "yellow",
  alert: "red",
  ok: "green",
};

export default function NotificacionesPage() {
  const [tab, setTab] = useState("todas");
  const [items, setItems] = useState(mockNotificaciones);

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items]);

  const filtered = useMemo(() => {
    if (tab === "no-leidas") return items.filter((n) => n.unread);
    if (tab === "autorizaciones") return items.filter((n) => n.type === "auth");
    if (tab === "documentos") return items.filter((n) => n.type === "doc");
    if (tab === "comentarios") return items.filter((n) => n.type === "comment");
    return items;
  }, [items, tab]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>
            Centro de Notificaciones
          </div>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            {unreadCount} notificaciones sin leer
          </div>
        </div>

        <button
          onClick={() => setItems((prev) => prev.map((n) => ({ ...n, unread: false })))}
          style={{
            border: "1px solid #E5E7EB",
            background: "#fff",
            borderRadius: 12,
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          ✓ Marcar todo como leído
        </button>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "todas", label: "Todas" },
          { value: "no-leidas", label: `No leídas (${unreadCount})` },
          { value: "autorizaciones", label: "Autorizaciones" },
          { value: "documentos", label: "Documentos" },
          { value: "comentarios", label: "Comentarios" },
        ]}
      />

      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {filtered.map((n, idx) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              gap: 14,
              padding: 16,
              borderTop: idx === 0 ? "none" : "1px solid #EEF2F7",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: "#F1F5F9",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              {iconByType[n.type] || "🔔"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {n.unread ? (
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "#0B1F3B" }} />
                ) : (
                  <span style={{ width: 8, height: 8 }} />
                )}
                <div style={{ fontWeight: 900, color: "#0F172A" }}>{n.title}</div>
                <Badge tone={toneByType[n.type] || "gray"}>{n.type}</Badge>
              </div>

              <div style={{ marginTop: 6, color: "#334155", fontSize: 13, lineHeight: 1.5 }}>
                {n.text}
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 14, alignItems: "center" }}>
                <button
                  onClick={() => alert(`${n.linkLabel} (mock)`) }
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#1D4ED8",
                    fontWeight: 800,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {n.linkLabel} →
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>
              {n.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
