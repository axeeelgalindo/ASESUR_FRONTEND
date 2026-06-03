import React, { useState, useRef, useEffect } from "react";

function cls(...s) {
    return s.filter(Boolean).join(" ");
}

export function Select({ label, value, onChange, options = [], disabled = false, className }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Find selected option
    const selectedOption = options.find(o => String(o.value) === String(value));
    const displayLabel = selectedOption ? selectedOption.label : "Seleccionar...";

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        if (onChange) {
            onChange(val);
        }
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={cls("flex flex-col gap-1.5 relative w-full", disabled && "opacity-50", className)}>
            {label && <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{label}</span>}
            
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 w-full flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 text-sm font-bold text-on-surface outline-none transition-all hover:bg-surface-container focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm text-left disabled:cursor-not-allowed cursor-pointer"
            >
                <span className="truncate">{displayLabel}</span>
                <span className={cls("material-symbols-outlined text-lg transition-transform duration-300 text-on-surface-variant/70", isOpen && "rotate-180")}>
                    keyboard_arrow_down
                </span>
            </button>

            {isOpen && !disabled && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    {options.length === 0 ? (
                        <div className="px-4 py-2.5 text-xs font-bold text-on-surface-variant/50 text-center">
                            Sin opciones
                        </div>
                    ) : (
                        options.map((o) => {
                            const isSelected = String(o.value) === String(value);
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => handleSelect(o.value)}
                                    className={cls(
                                        "w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-between cursor-pointer",
                                        isSelected 
                                            ? "bg-primary/10 text-primary font-black" 
                                            : "text-on-surface hover:bg-surface-container-highest"
                                    )}
                                >
                                    <span className="truncate">{o.label}</span>
                                    {isSelected && (
                                        <span className="material-symbols-outlined text-sm font-bold text-primary">
                                            check
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
