"use client";

// src/app/(protected)/validacion-pre-siniestro/page.jsx
import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";

const toneByStatus = {
  COMPLETADO: "green",
  PENDIENTE: "yellow",
  BLOQUEADO: "red",
};

const labelByStatus = {
  COMPLETADO: "Completado",
  PENDIENTE: "Pendiente",
  BLOQUEADO: "Bloqueado",
};

export default function ValidacionPreSiniestroPage() {
  // ===== Mock de caso (reemplazar por API) =====
  const [mockCase] = useState({
    folio: "SIN-2026-0142",
    etapa: "PRE_SINIESTRO",
    cliente: "Carlos Martinez",
    motivo: "Daño por agua",
    direccion: "Calle Mayor 42, Madrid",
    tipoPoliza: "B", // A = Hipotecario, B = Particular
  });

  // ===== Documentos (según requerimientos) =====
  // Nota: En Pre-siniestro los obligatorios dependen A/B.
  // Aquí dejamos un mix para mostrar la UI.
  const [docs] = useState([
    {
      id: "denuncia-mail",
      label: "Correo respaldo denuncia de siniestro",
      status: "COMPLETADO",
      hint: "Obligatorio (Pre-siniestro)",
      requiredFor: ["A", "B"],
    },
    {
      id: "asignacion-formal",
      label: "Correo asignación formal del liquidador",
      status: "PENDIENTE",
      hint: "Obligatorio (cuando exista asignación)",
      requiredFor: ["A", "B"],
      action: "upload",
    },

    // Solo B (Póliza particular)
    {
      id: "dominio-vigente",
      label: "Certificado dominio vigente",
      status: "COMPLETADO",
      hint: "Obligatorio solo Póliza Particular (B)",
      requiredFor: ["B"],
    },
    {
      id: "hipotecas-gravamenes",
      label: "Certificado de hipotecas y gravámenes",
      status: "PENDIENTE",
      hint: "Obligatorio solo Póliza Particular (B)",
      requiredFor: ["B"],
      action: "upload",
    },
    {
      id: "recepcion-municipal",
      label: "Recepción municipal",
      status: "BLOQUEADO",
      hint: "Falta número/antecedente para solicitarlo",
      requiredFor: ["B"],
    },

    // Opcional
    {
      id: "poliza",
      label: "Póliza (opcional)",
      status: "COMPLETADO",
      hint: "Opcional",
      requiredFor: ["A", "B"],
    },

    // Revisión Operaciones (obligatorios para autorizar paso a siniestro)
    {
      id: "inspeccion-asesur",
      label: "Inspección ASESUR",
      status: "COMPLETADO",
      hint: "Obligatorio para autorizar paso a siniestro",
      requiredFor: ["A", "B"],
    },
    {
      id: "fotos-videos",
      label: "Fotos y/o videos",
      status: "COMPLETADO",
      hint: "Obligatorio para autorizar paso a siniestro",
      requiredFor: ["A", "B"],
    },
    {
      id: "mandato-notarial",
      label: "Mandato de asesoría (notarial)",
      status: "PENDIENTE",
      hint: "Obligatorio para autorizar paso a siniestro",
      requiredFor: ["A", "B"],
      action: "upload",
    },
    {
      id: "contrato-asesoria",
      label: "Contrato de asesoría",
      status: "COMPLETADO",
      hint: "Obligatorio para autorizar paso a siniestro",
      requiredFor: ["A", "B"],
    },
    {
      id: "datos-liquidador",
      label: "Datos del liquidador (nombre / contacto)",
      status: "PENDIENTE",
      hint: "Obligatorio para autorizar paso a siniestro",
      requiredFor: ["A", "B"],
      action: "edit",
    },
    {
      id: "numero-siniestro",
      label: "N° de siniestro + Compañía",
      status: "PENDIENTE",
      hint: "Obligatorio para autorizar paso a siniestro",
      requiredFor: ["A", "B"],
      action: "edit",
    },
  ]);

  const visibleDocs = useMemo(() => {
    // Muestra docs aplicables al tipo de póliza
    const t = mockCase.tipoPoliza;
    return docs.filter((d) => (d.requiredFor || []).includes(t));
  }, [docs, mockCase.tipoPoliza]);

  const counts = useMemo(() => {
    const total = visibleDocs.length;
    const completados = visibleDocs.filter((d) => d.status === "COMPLETADO").length;
    const pendientes = visibleDocs.filter((d) => d.status === "PENDIENTE").length;
    const bloqueados = visibleDocs.filter((d) => d.status === "BLOQUEADO").length;

    const progreso = total ? Math.round((completados / total) * 100) : 0;

    return { total, completados, pendientes, bloqueados, progreso };
  }, [visibleDocs]);

  const canRequestAuth = counts.bloqueados === 0 && counts.pendientes === 0;

  return (
    <div className="grid gap-4">
      {/* Header caso */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{mockCase.folio}</h1>
              <Badge tone="blue">Pre-siniestro</Badge>
              <span className="text-xs font-extrabold text-slate-400">
                {mockCase.tipoPoliza === "A" ? "Hipotecario (A)" : "Póliza Particular (B)"}
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-semibold text-slate-600">
              {mockCase.cliente} – {mockCase.motivo} – {mockCase.direccion}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-900 shadow-sm hover:bg-slate-50"
              onClick={() => alert("Ver Caso (mock)")}
            >
              ↗ Ver Caso
            </button>
          </div>
        </div>
      </div>

      {/* Bloque de “validación / hitos” (VB°, denuncia, asignación) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <CardBox
          title="Validación VB° (Asesor)"
          subtitle="El asesor valida la captación con fecha y hora."
          right={<Badge tone="green">OK</Badge>}
        >
          <KV label="Estado" value="Validado" />
          <KV label="Fecha / hora" value="2026-02-10 10:30" />
          <KV label="Observación" value="Captación revisada y completa." />
          <ActionRow>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white hover:opacity-95"
              onClick={() => alert("Editar VB° (mock)")}
            >
              Editar VB°
            </button>
          </ActionRow>
        </CardBox>

        <CardBox
          title="Denuncia a compañía"
          subtitle="Cargar correo respaldo de la denuncia."
          right={<Badge tone="green">Cargado</Badge>}
        >
          <KV label="Correo respaldo" value="denuncia@compania.cl (PDF adjunto)" />
          <KV label="Fecha" value="2026-02-08" />
          <ActionRow>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
              onClick={() => alert("Ver denuncia (mock)")}
            >
              Ver
            </button>
          </ActionRow>
        </CardBox>

        <CardBox
          title="Asignación formal"
          subtitle="Cuando el liquidador asigna el caso formalmente."
          right={<Badge tone="yellow">Pendiente</Badge>}
        >
          <KV label="Estado" value="Aún no cargado" />
          <KV label="Requerido" value="Sí (cuando exista asignación)" />
          <ActionRow>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
              onClick={() => alert("Subir asignación (mock)")}
            >
              ⬆ Subir
            </button>
          </ActionRow>
        </CardBox>
      </div>

      {/* Documentación requerida */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Documentación requerida</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Operaciones revisa que esté todo lo necesario para autorizar paso a Siniestro.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="blue">
              {counts.completados} de {counts.total} documentos
            </Badge>
          </div>
        </div>

        {/* Resumen + progreso */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <LegendDot color="bg-green-500" label={`Completados (${counts.completados})`} />
            <LegendDot color="bg-amber-500" label={`Pendientes (${counts.pendientes})`} />
            <LegendDot color="bg-red-500" label={`Bloqueados (${counts.bloqueados})`} />
            <div className="ml-auto text-xs font-extrabold text-slate-500">
              Progreso: {counts.progreso}%
            </div>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900"
              style={{ width: `${counts.progreso}%` }}
            />
          </div>
        </div>

        {/* Lista */}
        <div className="mt-3 divide-y divide-slate-100">
          {visibleDocs.map((d) => (
            <DocRow
              key={d.id}
              label={d.label}
              hint={d.hint}
              status={d.status}
              action={d.action}
              onAction={() => {
                if (d.action === "upload") alert(`Subir archivo: ${d.label} (mock)`);
                if (d.action === "edit") alert(`Completar datos: ${d.label} (mock)`);
              }}
            />
          ))}
        </div>
      </div>

      {/* Alert bloqueados */}
      {counts.bloqueados > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black text-rose-700">Documentos bloqueados</div>
            <div className="mt-1 text-sm font-semibold text-rose-700/90">
              Resuelve los documentos bloqueados antes de solicitar autorización.
            </div>
            <div className="mt-2 text-xs font-extrabold text-rose-700">
              Hay {counts.bloqueados} documento(s) bloqueado(s).
            </div>
          </div>

          <button
            type="button"
            className="rounded-xl bg-[#D8B06A] px-4 py-2 text-sm font-black text-[#0B1F3B] hover:opacity-95"
            onClick={() => alert("Ir a bloqueados (mock)")}
          >
            Ver bloqueados
          </button>
        </div>
      ) : null}

      {/* Solicitar autorización */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black text-slate-900">Paso a Siniestro</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            Cuando esté todo OK, el asesor solicita autorización y Operaciones decide.
          </div>
          <div className="mt-2 text-xs font-extrabold text-slate-500">
            Requisitos: 0 pendientes y 0 bloqueados.
          </div>
        </div>

        <button
          type="button"
          disabled={!canRequestAuth}
          className={[
            "rounded-xl px-4 py-2 text-sm font-black",
            canRequestAuth
              ? "bg-[#D8B06A] text-[#0B1F3B] hover:opacity-95"
              : "cursor-not-allowed bg-slate-200 text-slate-500",
          ].join(" ")}
          onClick={() => alert("Solicitar Autorización (mock)")}
          title={
            canRequestAuth
              ? "Solicitar autorización"
              : "Aún faltan pendientes o hay bloqueados"
          }
        >
          ✈ Solicitar autorización
        </button>
      </div>
    </div>
  );
}

/* =========================
   Components
========================= */

function CardBox({ title, subtitle, right, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black text-slate-900">{title}</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">{subtitle}</div>
        </div>
        <div className="shrink-0">{right}</div>
      </div>

      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="text-xs font-extrabold text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ActionRow({ children }) {
  return <div className="mt-2 flex justify-end gap-2">{children}</div>;
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs font-extrabold text-slate-600">{label}</span>
    </div>
  );
}

function DocRow({ label, hint, status, action, onAction }) {
  const tone = toneByStatus[status] || "blue";
  const statusLabel = labelByStatus[status] || status;

  return (
    <div className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div className="min-w-0">
        <div className="text-sm font-extrabold text-slate-900">{label}</div>
        {hint ? (
          <div className="mt-1 text-xs font-semibold text-slate-500">{hint}</div>
        ) : null}
      </div>

      <div className="justify-self-start sm:justify-self-center">
        <Badge tone={tone}>{statusLabel}</Badge>
      </div>

      <div className="justify-self-start sm:justify-self-end">
        {action ? (
          <button
            type="button"
            onClick={onAction}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50"
            title={action === "upload" ? "Subir" : "Completar"}
          >
            {action === "upload" ? "⬆" : "✎"}
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
      </div>
    </div>
  );
}
