import { createClient } from "@supabase/supabase-js";
import { getCookie, setCookie, deleteCookie, getRequestHeader, getRequestUrl, setResponseHeader } from "@tanstack/react-start/server";

const COOKIE = "kpm-portal-session";
export function portalClient(google = false) {
  const url = process.env["SUPABASE_URL"] || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("School connection is unavailable.");
  const bearer = google ? getRequestHeader("authorization") : undefined;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      if (bearer) headers.set("Authorization", bearer);
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}
export function portalToken() { setResponseHeader("Cache-Control", "no-store"); return getCookie(COOKIE) ?? ""; }
export function storePortalToken(token: string) {
  const url = new URL(getRequestUrl());
  const local = url.protocol === "http:";
  const preview = /(^|\.)(lovable\.app|lovableproject\.com|lovableproject-dev\.com)$/.test(url.hostname);
  setCookie(COOKIE, token, { httpOnly: true, secure: !local, sameSite: preview ? "none" : "lax", partitioned: preview && !local, path: "/", maxAge: 86400 });
}
export function clearPortalToken() { deleteCookie(COOKIE, { path: "/" }); }
export async function portalCall<T = any>(operation: string, payload: unknown = {}, google = false): Promise<T> {
  const { data, error } = await portalClient(google).rpc("portal_execute", { p_token: portalToken(), p_operation: operation, p_payload: payload });
  if (error) throw new Error(error.message);
  return data as T;
}
export function loginDto(row: any) {
  return { success: true as const, role: row.role as "student" | "teacher" | "admin", name: row.name as string, email: row.email as string, token: crypto.randomUUID(), user_id: row.id as string, student_id: row.role === "student" ? row.id as string : undefined, is_verified: !!row.is_verified, photo_url: row.photo_url as string | null, personal_email: row.personal_email as string | null, created: !!row.created };
}