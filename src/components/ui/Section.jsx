import React from "react";

export function Section({ title, desc, children, right, className }) {
    return (
        <div className={`rounded-[2rem] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm ${className || ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black tracking-tight text-on-surface">{title}</h3>
                    {desc && <p className="mt-1 text-sm font-medium text-on-surface-variant/70">{desc}</p>}
                </div>
                {right && <div className="shrink-0">{right}</div>}
            </div>
            <div className="mt-8">{children}</div>
        </div>
    );
}
