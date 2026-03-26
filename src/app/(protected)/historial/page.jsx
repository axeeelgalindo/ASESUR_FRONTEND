"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { apiGet } from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
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

                    <div className="space-y-4 md:space-y-6">
                        {registros.map((reg) => (
                            <div key={reg.id} className="bg-surface-container-low rounded-xl px-4 md:px-8 py-5 md:py-6 flex flex-col md:flex-row md:items-center justify-between group hover:bg-surface-container transition-all duration-300 border-l-4 border-surface-container-highest hover:border-primary shadow-sm">
                                <div className="flex items-start md:items-center gap-4 md:gap-6 w-full md:w-auto overflow-hidden">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-surface-container-highest flex shrink-0 items-center justify-center rounded-xl group-hover:bg-primary/10 transition-colors">
                                        <span className={`material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-2xl md:text-3xl`}>{getIcon(reg.entidad)}</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                            <h3 className="font-headline text-base md:text-lg font-bold text-on-surface tracking-tight truncate">
                                                {reg.accion} <span className="text-on-surface-variant/70 font-medium text-sm">en</span> {reg.entidad}
                                            </h3>
                                            {reg.entidadId && (
                                                <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap">
                                                    ID: {reg.entidadId.slice(-8)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-on-surface-variant text-xs md:text-sm line-clamp-3 md:line-clamp-none whitespace-pre-line leading-relaxed">
                                            {reg.detalle}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 md:gap-12 w-full md:w-auto pt-4 md:pt-0 mt-4 md:mt-0 border-t md:border-none border-surface-container-high/50 shrink-0">
                                    <div className="text-left md:text-right flex-1 md:flex-none">
                                        <p className="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-medium mb-1">Responsable</p>
                                        <div className="flex items-center md:justify-end gap-2">
                                            <div className="hidden md:flex w-6 h-6 rounded-full bg-surface-bright items-center justify-center border border-outline-variant/30 text-[10px] font-bold text-secondary">
                                                {reg.usuario?.nombre?.[0] || "?"}
                                            </div>
                                            <span className="text-on-surface font-headline font-semibold text-xs md:text-sm">{reg.usuario?.nombre || "Sistema"}</span>
                                            <span className="material-symbols-outlined text-sm text-secondary-container md:hidden">account_circle</span>
                                        </div>
                                    </div>
                                    <div className="text-right min-w-[100px] md:min-w-[120px]">
                                        <p className="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-medium mb-1">Timestamp</p>
                                        <p className="text-on-surface font-medium text-xs md:text-sm truncate">{fmtDate(reg.creadoEn)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {meta.paginas > 1 && (
                        <div className="flex justify-center mt-10">
                            <Pagination
                                current={filtros.pagina}
                                total={meta.paginas}
                                onPageChange={(p) => setFiltros(prev => ({ ...prev, pagina: p }))}
                            />
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
