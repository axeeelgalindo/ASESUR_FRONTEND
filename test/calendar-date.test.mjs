import test from "node:test";
import assert from "node:assert/strict";
import { formatCalendarDate } from "../src/lib/calendarDate.mjs";

test("fecha de ocurrencia conserva el día del formulario en Chile y otras zonas horarias", () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ["America/Santiago", "UTC", "Pacific/Auckland"]) {
      process.env.TZ = timezone;
      assert.equal(formatCalendarDate("2020-05-09T00:00:00.000Z"), "09-05-2020");
      assert.equal(formatCalendarDate("2026-01-01T00:00:00.000Z"), "01-01-2026");
      assert.equal(formatCalendarDate("2024-02-29"), "29-02-2024");
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("fechas ausentes o ilegibles tienen un texto neutro", () => {
  for (const value of [null, undefined, "", "invalid"]) assert.equal(formatCalendarDate(value), "—");
});
