// src/components/ui/StatCard.jsx
export default function StatCard({ title, value, delta, deltaHint }) {
    const isNeg = String(delta || "").trim().startsWith("-");
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          padding: 18,
          minHeight: 92,
        }}
      >
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#0F172A" }}>
          {value}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isNeg ? "#B91C1C" : "#15803D",
            }}
          >
            {delta}
          </span>
          <span style={{ fontSize: 12, color: "#64748B" }}>{deltaHint}</span>
        </div>
      </div>
    );
  }
  