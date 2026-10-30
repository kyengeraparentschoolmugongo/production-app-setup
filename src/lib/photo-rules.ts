import { z } from "zod";
export const PHOTO_MAX_BYTES = 200 * 1024;
export const PHOTO_MAX_EDGE = 640;
export const photoInput = z.object({ photo: z.string().startsWith("data:image/jpeg;base64,").max(Math.ceil(PHOTO_MAX_BYTES * 4 / 3) + 24) }).strict();
export function defaultGooglePhoto(current: string | null, googlePhoto?: string | null) {
  return current || googlePhoto || null;
}
export function trustedGooglePhoto(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const u = new URL(value); return u.protocol === "https:" && (u.hostname === "googleusercontent.com" || u.hostname.endsWith(".googleusercontent.com")) ? u.href : null; } catch { return null; }
}