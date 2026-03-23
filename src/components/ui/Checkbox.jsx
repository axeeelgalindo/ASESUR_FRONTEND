import React from "react";

function cls(...s) {
    return s.filter(Boolean).join(" ");
}

export function Checkbox({ label, checked, onChange, disabled = false, className }) {
    return (
        <label className={cls("flex cursor-pointer select-none items-center gap-3", disabled && "cursor-not-allowed opacity-50", className)}>
            <div className="relative flex items-center justify-center">
                <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => onChange && onChange(e.target.checked)}
                    disabled={disabled}
                    className="peer sr-only"
                />
                <div className="h-5 w-5 rounded-md border-2 border-outline-variant/40 bg-surface-container transition-all peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20"></div>
                <span className="material-symbols-outlined pointer-events-none absolute text-[16px] text-on-primary opacity-0 transition-opacity peer-checked:opacity-100">
                    check
                </span>
            </div>
            {label && <span className="text-sm font-bold text-on-surface">{label}</span>}
        </label>
    );
}
