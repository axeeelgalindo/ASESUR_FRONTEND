// src/components/ui/Tabs.jsx
// src/components/ui/Tabs.jsx
import React from 'react';

function cls(...s) {
  return s.filter(Boolean).join(" ");
}

export function Tabs({ tab, setTab, items, value, onChange }) {
  // Support both APIs (tab/setTab vs value/onChange)
  const activeValue = value !== undefined ? value : tab;
  const handleChange = onChange || setTab;

  return (
    <div className="flex overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low p-1.5 shadow-inner">
      {items.map((it) => {
        const itemKey = it.value !== undefined ? it.value : it.key;
        const active = activeValue === itemKey;
        return (
          <button
            key={itemKey}
            onClick={() => handleChange(itemKey)}
            className={cls(
              "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-500",
              active
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                : "text-on-surface-variant hover:bg-on-surface/5"
            )}
            type="button"
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
