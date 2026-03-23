function cls(...s) {
    return s.filter(Boolean).join(" ");
}

export function Pill({ children, tone = "gray" }) {
    const tones = {
        gray: "bg-surface-container-high text-on-surface-variant border-outline-variant/20",
        blue: "bg-primary/10 text-primary border-primary/20",
        green: "bg-tertiary-container text-on-tertiary-container border-tertiary/20",
        amber: "bg-secondary/10 text-secondary border-secondary/20",
        red: "bg-error-container text-on-error-container border-error/20",
        purple: "bg-tertiary-fixed-dim text-on-tertiary-fixed border-tertiary-fixed/20",
    };
    return (
        <span
            className={cls(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                tones[tone] || tones.gray
            )}
        >
            {children}
        </span>
    );
}
