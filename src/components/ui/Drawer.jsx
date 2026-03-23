import React, { useEffect } from "react";

export function Drawer({ open, onClose, children, widthClass = "max-w-xl" }) {
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
        <div className="fixed inset-0 z-[70] flex justify-end">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className={`relative ${widthClass} w-full bg-surface-container h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300`}>
                {children}
            </div>
        </div>
    );
}
