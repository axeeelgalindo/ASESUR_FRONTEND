export function photoSectorLabel(value) {
  return value === "FACHADA" ? "Fachada y registro" : String(value || "EVIDENCIA").replaceAll("_", " ");
}

// La app guarda el comentario del sector en una de sus fotografías.
// Mostrar todos los comentarios distintos evita ocultarlos al tomar otra foto.
export function photoSectorComments(photos = []) {
  const groups = new Map();
  for (const photo of [...photos].sort((a, b) => (Date.parse(b.tomadaEn) || 0) - (Date.parse(a.tomadaEn) || 0))) {
    const comment = String(photo.titulo || "").trim();
    if (!comment) continue;
    const sector = photo.parteCasa || "EVIDENCIA";
    if (!groups.has(sector)) groups.set(sector, new Set());
    groups.get(sector).add(comment);
  }
  return [...groups].map(([sector, comments]) => ({ sector, comments: [...comments] }));
}
