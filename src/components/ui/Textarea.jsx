import React from "react";

export function Textarea({ label, value, onChange, placeholder, disabled }) {
    return (
        <label className="group flex flex-col gap-1.5">
            <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 transition-colors group-focus-within:text-primary">
                {label}
            </span>
            <textarea
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(v) => onChange(v.target.value)}
                disabled={disabled}
                className="min-h-[120px] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 disabled:bg-surface-container-low"
            />
        </label>
    );
}
