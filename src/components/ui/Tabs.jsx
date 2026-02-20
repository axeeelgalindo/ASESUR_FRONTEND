// src/components/ui/Tabs.jsx
export default function Tabs({ items, value, onChange }) {
    return (
      <div style={{ display: "flex", gap: 14, borderBottom: "1px solid #E5E7EB" }}>
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              onClick={() => onChange(it.value)}
              style={{
                background: "transparent",
                border: "none",
                padding: "10px 0",
                cursor: "pointer",
                color: active ? "#0F172A" : "#64748B",
                fontWeight: active ? 700 : 600,
                borderBottom: active ? "2px solid #0F172A" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }
  