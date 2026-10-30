import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Pencil, Loader2, Save, Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CandidatePhoto } from "@/components/coordinator/AppShell";
import { adminUsersRequest } from "@/lib/admin-users.functions";
import { supabase } from "@/integrations/supabase/client";
import { fileToSmallDataUrl } from "@/lib/coordinator/rules";

type SchoolUser = { id: string; name: string; email: string; photo_url?: string | null; class_id?: string | null; stream_id?: string | null; classesTaught?: string | null; subjectsTaught?: string | null; table: "students" | "teachers" | "admins" };
export default function UserManagement() {
  const { userName, photoUrl, signOut } = useAuth();
  const request = useServerFn(adminUsersRequest);
  const [users, setUsers] = useState<SchoolUser[]>([]), [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<SchoolUser | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string | null }[]>([]);
  const [streams, setStreams] = useState<{ id: string; name: string | null; class_id: string | null }[]>([]);
  async function load() {
    try { const results = await Promise.all((["students", "teachers", "admins"] as const).map(async table => {
      const result = await request({ data: { table, action: "select" } }); if (result.error) throw result.error;
      return (result.data ?? []).map(r => ({ ...r, table })) as unknown as SchoolUser[];
    })); setUsers(results.flat()); }
    catch { toast.error("Users could not be loaded."); } finally { setLoading(false); }
  }
  useEffect(() => { load(); Promise.all([supabase.from("classes").select("id,name"), supabase.from("streams").select("id,name,class_id")]).then(([c, s]) => { setClasses(c.data ?? []); setStreams(s.data ?? []); }); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!selected) return; setBusy(true);
    try { const values = selected.table === "students" ? { name: selected.name, photo_url: selected.photo_url ?? null, class_id: selected.class_id ?? null, stream_id: selected.stream_id ?? null } : selected.table === "teachers" ? { name: selected.name, photo_url: selected.photo_url ?? null, classesTaught: selected.classesTaught ?? null, subjectsTaught: selected.subjectsTaught ?? null } : { name: selected.name };
      const result = await request({ data: { table: selected.table, action: "update", id: selected.id, values } }); if (result.error) throw result.error;
      toast.success("School details updated."); setSelected(null); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "School details could not be saved."); } finally { setBusy(false); }
  }
  const filtered = users.filter(u => `${u.name} ${u.email} ${u.table}`.toLowerCase().includes(search.toLowerCase()));
  return <DashboardLayout userRole="admin" userName={userName} photoUrl={photoUrl} onLogout={signOut}>
    <div className="mx-auto max-w-5xl space-y-6"><div><h1 className="text-3xl font-bold">All Users</h1><p className="mt-1 text-muted-foreground">School register · {users.length} accounts</p></div>
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search users" className="pl-9" placeholder="Search by name, school email or role" value={search} onChange={e => setSearch(e.target.value)} /></div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="divide-y divide-border">{filtered.map(u => <div key={`${u.table}-${u.id}`} className="flex items-center gap-3 py-4">
        <CandidatePhoto name={u.name} url={u.photo_url ?? null} className="h-12 w-12 shrink-0 rounded-full" /><div className="min-w-0 flex-1"><p className="font-semibold break-words">{u.name}</p><p className="text-sm text-muted-foreground break-all">{u.email}</p><p className="mt-1 text-xs text-muted-foreground">{u.table === "students" ? `Pupil · ${classes.find(c => c.id === u.class_id)?.name ?? "Not assigned"} · ${streams.find(s => s.id === u.stream_id)?.name ?? "Not assigned"}` : u.table === "teachers" ? "Teacher" : "Administrator"}</p></div><Button variant="outline" size="icon" aria-label={`Edit ${u.name}`} title={`Edit ${u.name}`} onClick={() => setSelected({ ...u })}><Pencil className="h-4 w-4" /></Button>
      </div>)}{!filtered.length && <p className="py-8 text-muted-foreground">No users found.</p>}</div>}
    </div>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Edit School Details</DialogTitle></DialogHeader>{selected && <form onSubmit={save} className="space-y-4">
      {selected.table !== "admins" && <div className="flex items-center gap-4"><CandidatePhoto name={selected.name} url={selected.photo_url ?? null} className="h-20 w-20 rounded-full" /><div className="space-y-2"><Label htmlFor="admin-user-photo" className="flex items-center gap-2"><Camera className="h-4 w-4" />School Photo</Label><Input id="admin-user-photo" type="file" accept="image/*" disabled={busy} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { const url = await fileToSmallDataUrl(file); setSelected(u => u ? { ...u, photo_url: url } : null); } catch { toast.error("Photo could not be opened."); } finally { setBusy(false); } }} /><Button type="button" variant="ghost" size="sm" disabled={busy || !selected.photo_url} onClick={() => setSelected(u => u ? { ...u, photo_url: null } : null)}>Use default avatar</Button></div></div>}
      <div className="space-y-2"><Label htmlFor="admin-user-name">Full Name</Label><Input id="admin-user-name" value={selected.name} required disabled={busy} onChange={e => setSelected(u => u ? { ...u, name: e.target.value } : null)} /></div>
      <div className="space-y-2"><Label>School Email</Label><Input value={selected.email} disabled /></div>
      {selected.table === "students" && <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Class</Label><Select value={selected.class_id ?? "none"} disabled={busy} onValueChange={v => setSelected(u => u ? { ...u, class_id: v === "none" ? null : v, stream_id: null } : null)}><SelectTrigger aria-label="Assign class"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name ?? c.id}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Stream</Label><Select value={selected.stream_id ?? "none"} disabled={busy || !selected.class_id} onValueChange={v => setSelected(u => u ? { ...u, stream_id: v === "none" ? null : v } : null)}><SelectTrigger aria-label="Assign stream"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{streams.filter(s => s.class_id === selected.class_id).map(s => <SelectItem key={s.id} value={s.id}>{s.name ?? s.id}</SelectItem>)}</SelectContent></Select></div></div>}
      {selected.table === "teachers" && (["classesTaught", "subjectsTaught"] as const).map(key => <div key={key} className="space-y-2"><Label htmlFor={key}>{key === "classesTaught" ? "Classes Taught" : "Subjects Taught"}</Label><Input id={key} value={selected[key] ?? ""} disabled={busy} onChange={e => setSelected(u => u ? { ...u, [key]: e.target.value } : null)} /></div>)}
      <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save school details</Button></div>
    </form>}</DialogContent></Dialog>
  </DashboardLayout>;
}