// src/lib/api.js
import axios from "axios";
import { getSession } from "next-auth/react";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  const token = session?.backendToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Helpers opcionales (para que exista apiGet/apiPost como tú lo estás usando)
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

export default api;
