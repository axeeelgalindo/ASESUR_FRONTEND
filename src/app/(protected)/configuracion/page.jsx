// src/app/configuracion/page.jsx
export default function ConfiguracionPage() {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
          Configuración
        </div>
        <div style={{ marginTop: 8, color: "#64748B" }}>
          Parámetros del sistema, roles, SLA, plantillas, etc.
        </div>
      </div>
    );
  }
  