import { createServerFn } from "@tanstack/react-start";
import { interestsSchema } from "./profile-rules";

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
  return { id: a.id, role: a.role, name: a.name, email: a.email, photoUrl: a.photo_url, linkedGmail: a.personal_email, className, streamName, details };
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