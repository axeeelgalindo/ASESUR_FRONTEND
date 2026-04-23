"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MiCasoTracker() {
    const { rut } = useParams();
    const [casos, setCasos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchCasos() {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/casos/publico/${rut}`);
                if (res.data?.ok) {
                    setCasos(res.data.casos);
                }
            } catch (err) {
                setError(err.response?.data?.message || "No se encontraron trámites para el RUT ingresado.");
            } finally {
                setLoading(false);
            }
        }
        if (rut) {
            fetchCasos();
        }
    }, [rut]);

    return (
        <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container">
            {/* Navbar Minimalista */}
            <nav className="w-full bg-surface-container-lowest border-b border-outline-variant/10 px-8 py-4 flex justify-between items-center mx-auto">
                <div className="text-xl font-extrabold tracking-tighter text-primary font-headline">
                    ASESUR
                </div>
                <Link href="/login" className="text-sm font-headline font-bold text-on-surface hover:text-primary transition-colors">
                    Volver al Inicio
                </Link>
            </nav>

            <main className="max-w-4xl mx-auto py-12 px-6">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold uppercase tracking-tighter mb-4">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Portal Público
                    </div>
                    <h1 className="font-headline text-3xl font-extrabold tracking-tight mb-2">Estado de tus Trámites</h1>
                    <p className="text-on-surface-variant">RUT Consultante: <span className="font-mono font-semibold">{decodeURIComponent(rut)}</span></p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="bg-error-container text-on-error-container p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
                        <span className="material-symbols-outlined text-5xl">search_off</span>
                        <div>
                            <h3 className="font-bold text-xl mb-1">Sin resultados</h3>
                            <p>{error}</p>
                        </div>
                        <Link href="/login" className="mt-4 bg-surface text-on-surface px-6 py-2 rounded-lg font-bold shadow-sm hover:brightness-95">
                            Intentar con otro RUT
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {casos.map((caso) => (
                            <div key={caso.id} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-6 border-b border-outline-variant/10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-primary-container text-on-primary-container text-xs font-bold px-3 py-1 rounded-full">
                                                Folio: SIN-{String(caso.folio).padStart(6, '0')}
                                            </span>
                                            <span className="text-xs font-semibold text-outline tracking-widest uppercase">
                                                {caso.tipo.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <h3 className="font-headline font-bold text-xl">{caso.nombreCliente}</h3>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <p className="text-on-surface-variant text-sm flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                {caso.direccion}{caso.comuna ? `, ${caso.comuna}` : ''}
                                            </p>
                                            <p className="text-on-surface-variant text-sm flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">person</span>
                                                Asesor a cargo: <span className="font-semibold text-on-surface">{caso.asesor?.nombre || 'Por asignar'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-xs text-outline font-semibold uppercase tracking-widest mb-1">Última actualización</p>
                                        <p className="text-on-surface font-mono font-medium">
                                            {new Date(caso.actualizadoEn).toLocaleString('es-CL', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress / Step indicator */}
                                <div className="overflow-x-auto pb-4">
                                    <h4 className="text-xs text-outline font-semibold uppercase tracking-widest mb-4">Progreso del Caso</h4>
                                    <div className="flex items-start min-w-[700px] justify-between px-4">
                                        <StepIndicator 
                                            active={true} 
                                            completed={["PRE_SINIESTRO", "SINIESTRO", "CERRADO"].includes(caso.etapa)} 
                                            label="Denuncia" 
                                            icon="report_problem" 
                                        />
                                        <StepConnector active={["PRE_SINIESTRO", "SINIESTRO", "CERRADO"].includes(caso.etapa)} />

                                        <StepIndicator 
                                            active={caso.estado === "INSPECCION" || ["SINIESTRO", "CERRADO"].includes(caso.etapa)} 
                                            completed={["PRESUPUESTO", "ENVIO_INFORMACION", "RECEPCION_PROPUESTA", "INFORME_FINAL"].includes(caso.estado) || caso.etapa === "CERRADO"} 
                                            label="Inspección" 
                                            icon="visibility" 
                                        />
                                        <StepConnector active={["PRESUPUESTO", "ENVIO_INFORMACION", "RECEPCION_PROPUESTA", "INFORME_FINAL"].includes(caso.estado) || caso.etapa === "CERRADO"} />

                                        <StepIndicator 
                                            active={caso.estado === "PRESUPUESTO"} 
                                            completed={["ENVIO_INFORMACION", "RECEPCION_PROPUESTA", "INFORME_FINAL"].includes(caso.estado) || caso.etapa === "CERRADO"} 
                                            label="Presupuesto" 
                                            icon="calculate" 
                                        />
                                        <StepConnector active={["ENVIO_INFORMACION", "RECEPCION_PROPUESTA", "INFORME_FINAL"].includes(caso.estado) || caso.etapa === "CERRADO"} />

                                        <StepIndicator 
                                            active={caso.estado === "ENVIO_INFORMACION"} 
                                            completed={["RECEPCION_PROPUESTA", "INFORME_FINAL"].includes(caso.estado) || caso.etapa === "CERRADO"} 
                                            label="Despacho Antecedentes" 
                                            icon="send" 
                                        />
                                        <StepConnector active={["RECEPCION_PROPUESTA", "INFORME_FINAL"].includes(caso.estado) || caso.etapa === "CERRADO"} />

                                        <StepIndicator 
                                            active={caso.estado === "RECEPCION_PROPUESTA"} 
                                            completed={caso.estado === "INFORME_FINAL" || caso.etapa === "CERRADO"} 
                                            label="Recepción Propuesta" 
                                            icon="mark_email_read" 
                                        />
                                        <StepConnector active={caso.estado === "INFORME_FINAL" || caso.etapa === "CERRADO"} />

                                        <StepIndicator 
                                            active={caso.estado === "INFORME_FINAL" || caso.etapa === "CERRADO"} 
                                            completed={caso.etapa === "CERRADO"} 
                                            label="Informe Final Recepcionado" 
                                            icon="task_alt" 
                                        />
                                    </div>

                                    <div className="mt-8 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex flex-col md:flex-row items-start gap-4">
                                        <span className="material-symbols-outlined text-amber-500 font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                        <div>
                                            <p className="font-bold text-sm mb-1">Estado Actual: {caso.estado.replace(/_/g, ' ')}</p>
                                            <p className="text-xs opacity-90 leading-relaxed">Tu caso se encuentra en la etapa de <strong className="font-bold">{caso.etapa.replace(/_/g, ' ')}</strong>. Nuestro equipo está procesando la información.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function StepIndicator({ active, completed, label, icon }) {
    return (
        <div className="flex flex-col items-center gap-2 relative z-10 w-24 md:w-32">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${completed ? 'bg-primary border-primary text-on-primary' : active ? 'bg-surface border-primary text-primary' : 'bg-surface border-outline-variant text-outline-variant'}`}>
                <span className="material-symbols-outlined text-[20px]">{completed ? 'check' : icon}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${active || completed ? 'text-on-surface' : 'text-outline-variant'}`}>{label}</span>
        </div>
    );
}

function StepConnector({ active }) {
    return (
        <div className="flex-1 h-1 bg-outline-variant/30 -mx-4 md:-mx-8 relative top-[-10px] rounded-full overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-500 w-full ${active ? 'origin-left scale-x-100' : 'origin-left scale-x-0'}`}></div>
        </div>
    );
}
