import React, { useEffect } from "react";

export function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-md" }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop fijo — siempre cubre toda la pantalla */}
            <div
                className="fixed inset-0 z-[79] bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Contenedor scrollable por encima del backdrop */}
            <div className="fixed inset-0 z-[80] overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 py-8">
                    <div className={`relative ${maxWidth} w-full bg-surface-container rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
                                <h2 className="font-headline font-extrabold text-lg text-on-surface uppercase tracking-tight">
                                    {title}
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        )}
                        <div className="p-6">
                            {children}
                        </div>
                        {footer && (
                            <div className="flex items-center justify-end gap-3 border-t border-outline-variant/10 bg-surface-container-lowest/50 px-6 py-4">
                                {footer}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

