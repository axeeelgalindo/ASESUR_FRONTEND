// src/components/ui/Badge.jsx
export default function Badge({ children, tone = "gray" }) {
    const styles = {
      gray: { bg: "#EEF2F7", fg: "#334155", bd: "#E2E8F0" },
      green: { bg: "#E7F7EE", fg: "#166534", bd: "#BBF7D0" },
      yellow:{ bg: "#FFF7E6", fg: "#92400E", bd: "#FDE68A" },
      red:   { bg: "#FEECEC", fg: "#991B1B", bd: "#FECACA" },
      blue:  { bg: "#EAF2FF", fg: "#1E40AF", bd: "#BFDBFE" },
    };
  
    const s = styles[tone] || styles.gray;
  
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          fontSize: 12,
          borderRadius: 999,
          background: s.bg,
          color: s.fg,
          border: `1px solid ${s.bd}`,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    );
  }
  