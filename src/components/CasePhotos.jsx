"use client";

import { useRef, useState } from "react";
import { apiPatch, apiPatchForm, apiPostForm, fileUrl } from "@/lib/api";
import { caseRole } from "@/lib/casePermissions";
import { photoSectorLabel } from "@/lib/casePhotos.mjs";
import PhotoSectorComments from "@/components/PhotoSectorComments";

const PARTS = ["FACHADA", "LIVING_COMEDOR", "COCINA", "DORMITORIO_PRINCIPAL", "DORMITORIO_SECUNDARIO", "BANO", "PASILLO", "ESCALERA", "TECHUMBRE", "TECHO", "PATIO", "GARAGE", "LOGGIA", "OTRO"];
const EDIT_ACTION_STYLE = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function PhotoActionIcon({ type }) {
  return <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {type === "image" ? <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1" /><path d="m21 15-5-5L5 21" /></> : <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3H13M15 5l4 4m-8 4 1-4 7-7 3 3-7 7-4 1Z" /></>}
  </svg>;
}

export default function CasePhotos({ caso, user, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [part, setPart] = useState("FACHADA");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(null);
  const [inputKey, setInputKey] = useState(0);
  const fileInput = useRef(null);
  const replacementInput = useRef(null);
  const privileged = ["SUPERADMIN", "MASTER", "GERENTE", "OPERACIONES"].includes(caseRole(user));
  const inspector = caso.inspectorId === user?.id || (!caso.inspectorId && caso.asesorId === user?.id);
  const canUpload = privileged || [caso.asesorId, caso.inspectorId, caso.captadoPorId, caso.creadoPorId].includes(user?.id);
  const run = async (action) => {
    setBusy(true);
    setError("");
    try { await action(); }
    catch (e) { setError(e.response?.data?.message || e.response?.data?.error || e.message || "No se pudo guardar la imagen"); }
    finally { setBusy(false); }
  };
  const upload = () => run(async () => {
    let fotos = [...(caso.fotos || [])];
    // Reflejar cada éxito para no ocultar cargas parciales si falla otro archivo.
    for (const file of files) {
      const data = new FormData();
      data.append("parteCasa", part);
      data.append("titulo", title);
      data.append("file", file);
      const result = await apiPostForm(`/casos/${caso.id}/fotos`, data);
      fotos = [...fotos, result.foto];
      onChange(fotos);
      setFiles((pending) => pending.filter((item) => item !== file));
    }
    setTitle("");
    setInputKey((key) => key + 1);
  });
  const save = () => run(async () => {
    const url = `/casos/${caso.id}/fotos/${editing.id}`;
    let result;
    if (editing.file) {
      const data = new FormData();
      data.append("titulo", editing.titulo);
      data.append("file", editing.file);
      result = await apiPatchForm(url, data);
    } else result = await apiPatch(url, { titulo: editing.titulo });
    onChange(caso.fotos.map((foto) => foto.id === editing.id ? result.foto : foto));
    setEditing(null);
  });
  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/20 p-5">
      <h4 className="font-bold">Imágenes de preinspección ({caso.fotos?.length || 0})</h4>
      {error && <p role="alert" className="text-error">{error}</p>}
      {canUpload && <div className="grid gap-3">
        <label>Sector <select className="w-full rounded border p-2" value={part} disabled={busy} onChange={(e) => setPart(e.target.value)}>{PARTS.map((p) => <option key={p} value={p}>{photoSectorLabel(p)}</option>)}</select></label>
        <label>Comentario <input className="w-full rounded border p-2" maxLength={500} value={title} disabled={busy} onChange={(e) => setTitle(e.target.value)} /></label>
        <div className="space-y-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <input ref={fileInput} key={inputKey} className="hidden" aria-label="Seleccionar imágenes" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-surface px-4 py-2.5 font-bold text-primary shadow-sm transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
            {files.length ? "Cambiar selección" : "Seleccionar imágenes"}
          </button>
          <p className="text-sm text-on-surface-variant">Puedes elegir varias imágenes JPG, PNG o WebP.</p>
          <div aria-live="polite" aria-atomic="true" className="text-sm">
            {files.length ? <>
              <p className="font-semibold">{files.length} {files.length === 1 ? "imagen lista para subir" : "imágenes listas para subir"}</p>
              <ul className="mt-2 flex flex-wrap gap-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="max-w-full truncate rounded-lg border border-outline-variant/30 bg-surface px-3 py-1.5 text-on-surface" title={file.name}>{file.name}</li>)}</ul>
            </> : <p className="text-on-surface-variant">Aún no has seleccionado imágenes.</p>}
          </div>
        </div>
        <button type="button" className="rounded bg-primary p-2 text-on-primary disabled:opacity-50" disabled={busy || !files.length} onClick={upload}>{busy ? "Guardando…" : `Subir imágenes${files.length ? ` (${files.length})` : ""}`}</button>
      </div>}
      <PhotoSectorComments photos={caso.fotos} />
      <div className="grid gap-4 sm:grid-cols-2">
        {(caso.fotos || []).map((foto) => <div key={foto.id} className="space-y-2 rounded border border-outline-variant/20 p-3">
          <a href={fileUrl(foto.urlArchivo)} target="_blank" rel="noreferrer"><img src={fileUrl(foto.urlArchivo)} alt={foto.titulo || foto.parteCasa || "Preinspección"} className="h-40 w-full object-contain" /></a>
          <p className="text-sm">{photoSectorLabel(foto.parteCasa)}</p>
          {editing?.id === foto.id ? <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary"><PhotoActionIcon type={editing.mode} />{editing.mode === "image" ? "Reemplazar imagen" : "Editar comentario"}</p>
            {editing.mode === "comment" && <label>Comentario <input autoFocus className="w-full rounded border p-2" maxLength={500} disabled={busy} value={editing.titulo} onChange={(e) => setEditing({ ...editing, titulo: e.target.value })} /></label>}
            {editing.mode === "image" && <div className="space-y-2">
              <input ref={replacementInput} className="hidden" aria-label="Seleccionar imagen de reemplazo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => setEditing({ ...editing, file: e.target.files?.[0] })} />
              <button type="button" disabled={busy} onClick={() => replacementInput.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 py-2 font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1" /><path d="m21 15-5-5L5 21" /></svg>
                Seleccionar otra imagen
              </button>
              {editing.file && <p aria-live="polite" className="break-all text-sm text-on-surface-variant">{editing.file.name}</p>}
            </div>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || (editing.mode === "image" && !editing.file)} onClick={save}>
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                {busy ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-semibold transition hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50" disabled={busy} onClick={() => setEditing(null)}>
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
                Cancelar
              </button>
            </div>
          </div> : <><p className="whitespace-pre-wrap break-words text-sm">{foto.titulo}</p>{(privileged || inspector || foto.subidoPorId === user?.id) && <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" className={EDIT_ACTION_STYLE} title="Reemplazar esta imagen" aria-label="Editar imagen" disabled={busy} onClick={() => setEditing({ id: foto.id, titulo: foto.titulo || "", file: null, mode: "image" })}><PhotoActionIcon type="image" />Imagen</button>
            <button type="button" className={EDIT_ACTION_STYLE} title="Editar el comentario de esta imagen" aria-label="Editar comentario" disabled={busy} onClick={() => setEditing({ id: foto.id, titulo: foto.titulo || "", file: null, mode: "comment" })}><PhotoActionIcon type="comment" />Comentario</button>
          </div>}</>}
        </div>)}
      </div>
    </section>
  );
}
