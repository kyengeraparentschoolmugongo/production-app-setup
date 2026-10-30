import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import type { PortalRole } from "./auth-session.server";
import { defaultGooglePhoto } from "./photo-rules";

export async function resolveProfilePhoto(value: string | null): Promise<string | null> {
  if (!value || !value.startsWith("profile-photos/")) return value;
  const { data } = await db.storage.from("profile-photos").createSignedUrl(value.slice("profile-photos/".length), 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}
export async function applyGoogleDefault(role: PortalRole, id: string, current: string | null, google: string | null) {
  const selected = defaultGooglePhoto(current, google);
  if (!current && selected) {
    const table = role === "admin" ? "admins" : role === "teacher" ? "teachers" : "students";
    const { error } = await db.from(table).update({ photo_url: selected }).eq("id", id).is("photo_url", null);
    if (error) throw new Error("Google photo could not be saved.");
  }
  return resolveProfilePhoto(selected);
}