import React from "react";

function cls(...s) {
    return s.filter(Boolean).join(" ");
}

export function Button({
    children,
    onClick,
    disabled,
    variant = "primary",
    className,
    type = "button",
}) {
    const v = {
        primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/10 border-transparent",
        secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30",
        danger: "bg-error text-on-error hover:bg-error/90 shadow-lg shadow-error/10 border-transparent",
        ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent",
    }[variant];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            type={type}
            className={cls(
                "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
                v,
                className
            )}
        >
            {children}
        </button>
    );
}
