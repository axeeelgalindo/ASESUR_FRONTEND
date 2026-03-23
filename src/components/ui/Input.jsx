import React from "react";

function cls(...s) {
    return s.filter(Boolean).join(" ");
}

export function Input({ label, value, onChange, placeholder, type = "text", disabled = false, className }) {
    return (
        <label className={cls("flex flex-col gap-1.5", disabled && "opacity-50", className)}>
            {label && <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{label}</span>}
            <input
                type={type}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(e) => onChange && onChange(e.target.value)}
                disabled={disabled}
                className="h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm disabled:bg-surface-container-highest disabled:cursor-not-allowed"
            />
        </label>
    );
}
