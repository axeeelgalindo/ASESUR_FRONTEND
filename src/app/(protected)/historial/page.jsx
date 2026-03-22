"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { apiGet } from "@/lib/api";

const ENTITY_ICONS = {
    USUARIO: "group",
    CASO: "shield",
    PARAMETRO: "settings",
    FOTO: "image",
    DOCUMENTO: "description",
    SUPERVISION: "supervisor_account",
    DEFAULT: "history",
};

const ACTION_COLORS = {
    CREAR: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    EDITAR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    ELIMINAR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    LOGIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    DEFAULT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default function HistorialPage() {
    const { data: session } = useSession();
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtros
    const [filtros, setFiltros] = useState({
        entidad: "",
        usuarioId: "",
        desde: "",
        hasta: "",
        pagina: 1,
    });

    const [meta, setMeta] = useState({ total: 0, paginas: 1 });

    const fetchHistorial = async () => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams({
                ...filtros,
                limite: 20,
            }).toString();

            const res = await apiGet(`/historial?${query}`);
            setRegistros(res.data || []);
            setMeta({ total: res.total, paginas: res.paginas });
        } catch (e) {
            console.error(e);
            setError("Error al cargar el historial.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistorial();
    }, [filtros.entidad, filtros.usuarioId, filtros.desde, filtros.hasta, filtros.pagina]);

    const fmtDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getIcon = (entidad) => ENTITY_ICONS[entidad] || ENTITY_ICONS.DEFAULT;
    const getActionClass = (accion) => ACTION_COLORS[accion] || ACTION_COLORS.DEFAULT;

    return (
        <div className="min-h-screen bg-surface p-4 md:p-8 font-['Manrope']">
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">

                <span className="material-symbols-outlined text-4xl text-primary">history</span>

                <p className="text-on-surface-variant text-sm font-medium">
                    Monitoreo global de acciones realizadas en el sistema.
                </p>
            </div>

            {/* Filtros */}
            <div className="bg-surface-container-low border border-surface-container-high rounded-2xl p-6 mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 ml-1">Entidad</label>
                        <select
                            value={filtros.entidad}
                            onChange={(e) => setFiltros(prev => ({ ...prev, entidad: e.target.value, pagina: 1 }))}
                            className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                        >
                            <option value="">Todas</option>
                            <option value="USUARIO">Usuarios</option>
                            <option value="CASO">Casos</option>
                            <option value="PARAMETRO">Configuración</option>
                            <option value="FOTO">Fotos</option>
                            <option value="DOCUMENTO">Documentos</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 ml-1">Desde</label>
                        <input
                            type="date"
                            value={filtros.desde}
                            onChange={(e) => setFiltros(prev => ({ ...prev, desde: e.target.value, pagina: 1 }))}
                            className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70 ml-1">Hasta</label>
                        <input
                            type="date"
                            value={filtros.hasta}
                            onChange={(e) => setFiltros(prev => ({ ...prev, hasta: e.target.value, pagina: 1 }))}
                            className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => setFiltros({ entidad: "", usuarioId: "", desde: "", hasta: "", pagina: 1 })}
                            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">filter_alt_off</span>
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista / Timeline */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-on-surface-variant">Cargando registros...</p>
                </div>
            ) : error ? (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl text-center font-bold">
                    {error}
                </div>
            ) : registros.length === 0 ? (
                <div className="bg-surface-container-low border border-dashed border-surface-container-high rounded-2xl py-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">history_toggle_off</span>
                    <p className="font-bold text-on-surface-variant">No se encontraron registros de actividad.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-xs font-black text-on-surface-variant/50 uppercase tracking-widest">
                            Mostrando {registros.length} de {meta.total} acciones
                        </span>
                    </div>

                    <div className="relative">
                        {/* Linea vertical timeline */}
                        <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-surface-container-high hidden md:block"></div>

                        <div className="space-y-6">
                            {registros.map((reg) => (
                                <div key={reg.id} className="relative flex flex-col md:flex-row gap-4 md:items-start group">
                                    {/* Icono / Punto del timeline */}
                                    <div className="flex-shrink-0 z-10 hidden md:flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-surface-container-high shadow-sm group-hover:border-primary/30 transition-colors">
                                        <span className={`material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary transition-colors`}>{getIcon(reg.entidad)}</span>
                                    </div>

                                    {/* Card de contenido */}
                                    <div className="flex-1 bg-surface-container-low border border-surface-container-high rounded-2xl p-5 hover:bg-surface-container transition-colors shadow-sm">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`${getActionClass(reg.accion)} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                                                    {reg.accion}
                                                </span>
                                                <span className="text-xs font-bold text-on-surface-variant">en</span>
                                                <span className="text-xs font-black text-on-surface uppercase tracking-widest opacity-70">
                                                    {reg.entidad}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-on-surface-variant/60 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                {fmtDate(reg.creadoEn)}
                                            </span>
                                        </div>

                                        <p className="text-sm font-medium text-on-surface leading-relaxed mb-4 whitespace-pre-line">
                                            {reg.detalle}
                                        </p>

                                        <div className="flex items-center justify-between pt-3 border-t border-surface-container-high/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {reg.usuario?.nombre?.[0] || "?"}
                                                </div>
                                                <span className="text-xs font-bold text-on-surface opacity-80">
                                                    {reg.usuario?.nombre || "Sistema"}
                                                </span>
                                                <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                                                    {reg.usuario?.rol || "CORE"}
                                                </span>
                                            </div>

                                            {reg.entidadId && (
                                                <span className="text-[10px] font-mono text-on-surface-variant/40">
                                                    ID: {reg.entidadId.slice(-8)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination */}
                    {meta.paginas > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-10">
                            <button
                                disabled={filtros.pagina === 1}
                                onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                                className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-all hover:bg-primary/10 hover:text-primary"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(meta.paginas)].map((_, i) => {
                                    const p = i + 1;
                                    // Mostrar solo algunas páginas si son muchas
                                    if (meta.paginas > 7) {
                                        if (p !== 1 && p !== meta.paginas && Math.abs(p - filtros.pagina) > 1) {
                                            if (p === 2 || p === meta.paginas - 1) return <span key={p} className="px-1 opacity-30 text-xs">...</span>;
                                            return null;
                                        }
                                    }

                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setFiltros(prev => ({ ...prev, pagina: p }))}
                                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${filtros.pagina === p
                                                ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                                                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                disabled={filtros.pagina === meta.paginas}
                                onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                                className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant disabled:opacity-30 transition-all hover:bg-primary/10 hover:text-primary"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        .active-icon {
          font-variation-settings: 'FILL' 1;
        }
      `}</style>
        </div>
    );
}
