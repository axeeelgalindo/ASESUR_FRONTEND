// Mantener alineado con api/src/utils/casePermissions.js.
const CASE_MANAGERS = ["gbarria@asesoriasasesur.com", "cdebeer@asesoriasasesur.com", "rpoblete@asesoriasasesur.com", "jascencio@asesoriasasesur.com"];
export const managesAllCases = (user) => CASE_MANAGERS.includes(String(user?.email || "").trim().toLowerCase());
export const caseRole = (user) => managesAllCases(user) ? "SUPERADMIN" : String(user?.rol || user?.role || "").toUpperCase();
