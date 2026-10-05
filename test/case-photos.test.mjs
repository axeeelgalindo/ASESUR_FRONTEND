import test from "node:test";
import assert from "node:assert/strict";
import { photoSectorComments, photoSectorLabel } from "../src/lib/casePhotos.mjs";

test("el comentario de fachada sigue visible aunque otras fotografías no tengan comentario", () => {
  const photos = [
    { parteCasa: "FACHADA", titulo: null, tomadaEn: "2026-10-05T12:00:00Z" },
    { parteCasa: "FACHADA", titulo: "Registro de daños\nSegunda línea", tomadaEn: "2026-10-04T12:00:00Z" },
    { parteCasa: "FACHADA", titulo: "Registro de daños\nSegunda línea" },
    { parteCasa: "COCINA", titulo: "Otro sector" },
  ];
  assert.deepEqual(photoSectorComments(photos), [
    { sector: "FACHADA", comments: ["Registro de daños\nSegunda línea"] },
    { sector: "COCINA", comments: ["Otro sector"] },
  ]);
  assert.equal(photos[0].titulo, null);
  assert.equal(photoSectorLabel("FACHADA"), "Fachada y registro");
});

test("conserva comentarios distintos del mismo sector y admite fotografías sin comentarios", () => {
  assert.deepEqual(photoSectorComments([{ parteCasa: "FACHADA", titulo: "Anterior" }, { parteCasa: "FACHADA", titulo: "Actual", tomadaEn: "2026-10-05" }])[0].comments, ["Actual", "Anterior"]);
  assert.deepEqual(photoSectorComments(), []);
  assert.deepEqual(photoSectorComments([{ titulo: "   " }]), []);
});
