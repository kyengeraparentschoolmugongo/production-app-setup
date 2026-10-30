import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminRole } from "./profile-rules";
import type { Database } from "@/integrations/supabase/types";
type UserRow = Partial<Database["public"]["Tables"]["students"]["Row"] & Database["public"]["Tables"]["teachers"]["Row"]>;
type Reply = { data: UserRow[] | null; error: { message: string; code?: string } | null };

const fields = z.object({ name: z.string().trim().min(2).max(100).optional(), email: z.string().email().optional(), photo_url: z.string().max(500000).nullable().optional(), class_id: z.string().nullable().optional(), stream_id: z.string().nullable().optional(), gender: z.string().nullable().optional(), nationality: z.string().nullable().optional(), sex: z.string().nullable().optional(), contactNumber: z.number().nullable().optional(), subjectsTaught: z.string().nullable().optional(), classesTaught: z.string().nullable().optional(), is_verified: z.boolean().optional() }).strict();
export const adminUsersRequest = createServerFn({ method: "POST" })
  .inputValidator(input => z.object({ table: z.enum(["students", "teachers", "admins"]), action: z.enum(["select", "insert", "update", "delete"]), values: z.unknown().optional(), id: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data }): Promise<Reply> => {
    const { requirePortalAccount } = await import("./profile.server");
    const account = await requirePortalAccount(); requireAdminRole(account.role);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    // All table names and write keys have been allowlisted; normalize SDK errors to serializable DTOs.
    const table = db.from(data.table) as any;
    const reply = async (query: PromiseLike<{ data: UserRow[] | null; error: { message: string; code?: string } | null }>): Promise<Reply> => {
      const result = await query;
      const { resolveProfilePhoto } = await import("./profile-photo.server");
      const rows = result.data ? await Promise.all(result.data.map(async row => ({ ...row, photo_url: await resolveProfilePhoto(row.photo_url ?? null) }))) : null;
      return { data: rows, error: result.error ? { message: result.error.message, code: result.error.code } : null };
    };
    const columns = data.table === "students" ? "id,name,email,photo_url,class_id,stream_id,gender,is_verified,created_at" : data.table === "teachers" ? "id,name,email,photo_url,nationality,sex,contactNumber,subjectsTaught,classesTaught,is_verified,created_at" : "id,name,email,photo_url,is_verified,created_at";
    if (data.action === "select") return reply(table.select(columns));
    if (data.action === "delete") { if (!data.id || data.id === account.id) throw new Error("Choose another account."); return reply(table.delete().eq("id", data.id)); }
    let patch = fields.parse(data.values);
    if (data.table === "students" && (patch.class_id !== undefined || patch.stream_id !== undefined)) {
      const { data: current } = data.id ? await db.from("students").select("class_id,stream_id").eq("id", data.id).maybeSingle() : { data: null };
      const classId = patch.class_id === undefined ? current?.class_id : patch.class_id;
      const streamId = patch.stream_id === undefined ? current?.stream_id : patch.stream_id;
      if (classId) { const { data: c } = await db.from("classes").select("id").eq("id", classId).maybeSingle(); if (!c) throw new Error("Choose a registered class."); }
      if (streamId) { const { data: s } = await db.from("streams").select("class_id").eq("id", streamId).maybeSingle(); if (!s || s.class_id !== classId) throw new Error("Choose a stream belonging to this class."); }
    }
    if (data.action === "update") { if (!data.id) throw new Error("Choose a user."); return reply(table.update(patch).eq("id", data.id)); }
    if (data.table === "admins") throw new Error("Administrator creation is not available here.");
    const { schoolEmailFor } = await import("./recovery-rules");
    const { hash } = await import("bcryptjs");
    if (!patch.name) throw new Error("Enter the user's name.");
    const { data: existing } = await db.from(data.table).select("email");
    patch = { ...patch, email: schoolEmailFor(patch.name, data.table === "students" ? "student" : "teacher", (existing ?? []).flatMap(r => r.email ? [r.email] : [])) };
    const row = { ...patch, password_hash: await hash("6667", 10), is_verified: true };
    return reply(table.insert({ ...row, default_password: data.table === "students" ? "6667" : 6667 }));
  });