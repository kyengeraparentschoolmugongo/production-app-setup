import { createServerFn } from "@tanstack/react-start";
import { interestsSchema } from "./profile-rules";
import { photoInput, PHOTO_MAX_BYTES } from "./photo-rules";

export const saveProfilePhoto = createServerFn({ method: "POST" }).inputValidator(input => photoInput.parse(input)).handler(async ({ data }) => {
  const { requirePortalAccount } = await import("./profile.server");
  const account = await requirePortalAccount();
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const binary = atob(data.photo.split(",")[1] ?? "");
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  if (bytes.length > PHOTO_MAX_BYTES || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw new Error("Please upload a compressed JPEG photo.");
  const path = `${account.role}/${account.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await db.storage.from("profile-photos").upload(path, bytes, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error("Profile photo could not be uploaded.");
  const table = account.role === "admin" ? "admins" : account.role === "teacher" ? "teachers" : "students";
  const { error: saveError } = await db.from(table).update({ photo_url: `profile-photos/${path}` }).eq("id", account.id);
  if (saveError) { await db.storage.from("profile-photos").remove([path]); throw new Error("Profile photo could not be saved."); }
  const { resolveProfilePhoto } = await import("./profile-photo.server");
  const photoUrl = await resolveProfilePhoto(`profile-photos/${path}`);
  if (account.photo_url?.startsWith("profile-photos/")) await db.storage.from("profile-photos").remove([account.photo_url.slice("profile-photos/".length)]);
  return { photoUrl };
});

export const getSchoolProfile = createServerFn({ method: "GET" }).handler(async () => {
  const { requirePortalAccount } = await import("./profile.server");
  const a = await requirePortalAccount();
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  let className = "Not assigned", streamName = "Not assigned";
  let details: Record<string, string> = {};
  if (a.role === "student") {
    const { data } = await db.from("students").select("class_id,stream_id").eq("id", a.id).single();
    const [c, s] = await Promise.all([
      data?.class_id ? db.from("classes").select("name").eq("id", data.class_id).maybeSingle() : Promise.resolve({ data: null }),
      data?.stream_id ? db.from("streams").select("name").eq("id", data.stream_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    className = c.data?.name ?? className; streamName = s.data?.name ?? streamName;
  } else if (a.role === "teacher") {
    const { data } = await db.from("teachers").select('sex,nationality,subjectsTaught,classesTaught,contactNumber').eq("id", a.id).single();
    details = { Gender: data?.sex ?? "Not specified", Nationality: data?.nationality ?? "Not specified", "Subjects Taught": data?.subjectsTaught ?? "Not assigned", "Classes Taught": data?.classesTaught ?? "Not assigned", "Contact Number": data?.contactNumber?.toString() ?? "Not provided" };
  }
  const { resolveProfilePhoto } = await import("./profile-photo.server");
  return { id: a.id, role: a.role, name: a.name, email: a.email, photoUrl: await resolveProfilePhoto(a.photo_url), linkedGmail: a.personal_email, className, streamName, details };
});

export const getPersonalInterests = createServerFn({ method: "GET" }).handler(async () => {
  const { requirePortalAccount } = await import("./profile.server");
  const a = await requirePortalAccount();
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data, error } = await db.from("portal_interests").select("hobbies,best_colour,favourite_dish,cartoon,celebrity,best_friend,other_interests").eq("user_id", a.id).eq("account_type", a.role).maybeSingle();
  if (error) throw new Error("Your interests could not be loaded.");
  return interestsSchema.parse(data ?? {});
});

export const savePersonalInterests = createServerFn({ method: "POST" })
  .inputValidator(input => interestsSchema.parse(input))
  .handler(async ({ data }) => {
    const { requirePortalAccount } = await import("./profile.server");
    const a = await requirePortalAccount();
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { error } = await db.from("portal_interests").upsert({ ...data, user_id: a.id, account_type: a.role, updated_at: new Date().toISOString() });
    if (error) throw new Error("Your interests could not be saved.");
    return data;
  });