import React from "react";

function cls(...s) {
    return s.filter(Boolean).join(" ");
}

export function Switch({ label, description, checked, onChange, disabled = false, className }) {
    return (
        <label className={cls("flex cursor-pointer select-none items-center justify-between gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high", disabled && "cursor-not-allowed opacity-50", className)}>
            <div className="flex flex-col gap-0.5">
                {label && <span className="text-sm font-black text-on-surface uppercase tracking-widest">{label}</span>}
                {description && <p className="text-[11px] font-bold text-on-surface-variant/60">{description}</p>}
            </div>
            
            <div className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => onChange && onChange(e.target.checked)}
                    disabled={disabled}
                    className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-outline-variant/30 transition-colors peer-checked:bg-primary"></div>
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm"></div>
            </div>
        </label>
    );
}
