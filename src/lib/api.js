// src/lib/api.js
import axios from "axios";
import { getSession } from "next-auth/react";


/**
 * API base (con /api)
 * Ej: http://192.168.50.208:3002/api
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

  

/**
 * ORIGIN del backend (sin /api)
 * Ej: http://192.168.50.208:3002
 *
 * Si NEXT_PUBLIC_API_URL = http://192.168.50.208:3002/api
 * entonces ORIGIN = http://192.168.50.208:3002
 */
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

// Axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Inyecta Bearer token desde NextAuth (session.backendToken)
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  const token = session?.backendToken;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Helpers HTTP
export async function apiGet(path, config = {}) {
  const res = await api.get(path, config);
  return res.data;
}

export async function apiPost(path, body, config = {}) {
  const res = await api.post(path, body, config);
  return res.data;
}

export async function apiPut(path, body, config = {}) {
  const res = await api.put(path, body, config);
  return res.data;
}

export async function apiDel(path, config = {}) {
  const res = await api.delete(path, config);
  return res.data;
}

/**
 * ✅ multipart/form-data (subida de archivos)
 * IMPORTANTE:
 * - NO pongas Content-Type manual.
 * - axios lo setea con boundary automáticamente.
 */
export async function apiPostForm(path, formData, config = {}) {
  const res = await api.post(path, formData, config);
  return res.data;
}

/**
 * ✅ Para mostrar/abrir archivos subidos
 * Si guardas en DB urlArchivo como "/uploads/xxx.pdf"
 * esto lo transforma a "http://TU_BACKEND:3002/uploads/xxx.pdf"
 */
export function fileUrl(url) {
  if (!url) return "";
  // Ya es absoluta (http/https)
  if (/^https?:\/\//i.test(url)) return url;
  // Asegura que /uploads/... apunte al backend
  if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
}

export async function apiPatch(path, body, config = {}) {
  const res = await api.patch(path, body, config);
  return res.data;
}

export { API_BASE, API_ORIGIN };
export default api;