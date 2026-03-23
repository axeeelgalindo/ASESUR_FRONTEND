import React from 'react';

export function Pagination({ current, total, onPageChange }) {
    if (total <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                disabled={current === 1}
                onClick={() => onPageChange(current - 1)}
                className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-all hover:bg-primary/10 hover:text-primary hover:shadow-sm active:scale-95"
            >
                <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <div className="flex items-center gap-1">
                {[...Array(total)].map((_, i) => {
                    const p = i + 1;
                    // Ellipsis logic for many pages
                    if (total > 7) {
                        if (p !== 1 && p !== total && Math.abs(p - current) > 1) {
                            if (p === 2 || p === total - 1) return <span key={p} className="px-1 opacity-40 text-xs tracking-tighter">...</span>;
                            return null;
                        }
                    }

                    return (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all active:scale-95 ${current === p
                                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
                                }`}
                        >
                            {p}
                        </button>
                    );
                })}
            </div>

            <button
                disabled={current === total}
                onClick={() => onPageChange(current + 1)}
                className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-all hover:bg-primary/10 hover:text-primary hover:shadow-sm active:scale-95"
            >
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
    );
}
