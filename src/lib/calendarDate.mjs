// Una fecha de calendario debe conservar el mismo día que muestra el input date.
// No convertirla a la zona horaria del navegador como si fuera un instante.
export function formatCalendarDate(value) {
  const parts = typeof value === "string" && value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
  return parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : "—";
}
