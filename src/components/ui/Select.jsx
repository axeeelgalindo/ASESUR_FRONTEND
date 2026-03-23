import React from "react";

function cls(...s) {
    return s.filter(Boolean).join(" ");
}

export function Select({ label, value, onChange, options = [], disabled = false, className }) {
    return (
        <label className={cls("flex flex-col gap-1.5", disabled && "opacity-50", className)}>
            {label && <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{label}</span>}
            <select
                value={value ?? ""}
                onChange={(e) => onChange && onChange(e.target.value)}
                disabled={disabled}
                className="h-11 w-full appearance-none rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 text-sm font-bold text-on-surface outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm disabled:cursor-not-allowed disabled:bg-surface-container-highest"
            >
                <option value="" disabled hidden>Seleccionar...</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </label>
    );
}
