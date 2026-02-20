// src/app/captura-caso/page.jsx
export default function CapturaCasoPage() {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
            Captura de Caso (Backoffice)
          </div>
          <div style={{ marginTop: 8, color: "#64748B", lineHeight: 1.6 }}>
            En tu flujo real, la <b>captura completa</b> conviene hacerla en la <b>app móvil</b>
            (fotos, geolocalización, firma, etc.).  
            Esta vista web puede quedar como “creación rápida” o “edición” de un caso.
          </div>
        </div>
  
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 14,
            padding: 16,
            opacity: 0.9,
          }}
        >
          <div style={{ fontWeight: 900, color: "#0F172A" }}>Formulario (mock)</div>
          <div style={{ marginTop: 8, color: "#94A3B8" }}>
            Lo armamos después con tu API y validaciones.
          </div>
        </div>
      </div>
    );
  }
  