import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecoverySettings, linkRecoveryGmail, unlinkRecoveryGmail, resetPasswordWithGoogle } from "@/lib/recovery.functions";
import { verifyWithGoogle, GOOGLE_READY_KEY } from "@/lib/google-verify";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Link2, Loader2, ShieldCheck, Unlink } from "lucide-react";
import { toast } from "sonner";

type Settings = Awaited<ReturnType<typeof getRecoverySettings>>;

export function RecoverySettings() {
  const read = useServerFn(getRecoverySettings);
  const link = useServerFn(linkRecoveryGmail);
  const unlink = useServerFn(unlinkRecoveryGmail);
  const reset = useServerFn(resetPasswordWithGoogle);
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const load = () => read().then(setS).catch((e) => toast.error(e.message));
  useEffect(() => {
    load();
    const ready = sessionStorage.getItem(GOOGLE_READY_KEY);
    if (ready === "change-password") { sessionStorage.removeItem(GOOGLE_READY_KEY); setChanging(true); }
  }, []);

  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); } };

  const linkGmail = () => run(async () => {
    if (!(await verifyWithGoogle("recovery-link"))) return;
    const r = await link();
    await supabase.auth.signOut();
    toast.success(`Linked ${r.linkedGmail}.`);
    await load();
  });

  const startChange = () => run(async () => {
    if (await verifyWithGoogle("change-password", s?.linkedGmail ?? undefined)) setChanging(true);
  });

  const saveChange = () => run(async () => {
    if (password.length < 4) throw new Error("Password must have at least 4 characters.");
    if (password !== confirm) throw new Error("Passwords do not match.");
    try { await reset({ data: { schoolEmail: s!.schoolEmail, newPassword: password } }); }
    finally { await supabase.auth.signOut(); }
    toast.success("Password changed.");
    setChanging(false); setPassword(""); setConfirm("");
  });

  if (!s) return <Card><CardContent className="py-6 text-sm text-muted-foreground">Loading account security…</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Gmail & password</CardTitle>
        <CardDescription>School email: {s.schoolEmail}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!s.linkedGmail && (
          <Alert><AlertDescription>We recommend linking a Gmail account. School emails can't receive mail, so your linked Gmail is the only way to reset a forgotten password. You can also sign in with it using "Sign in with Google".</AlertDescription></Alert>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
          <div className="min-w-0"><p className="text-sm font-medium">Linked Gmail</p><p className="truncate text-sm text-muted-foreground">{s.linkedGmail ?? "Not linked"}</p></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={linkGmail} disabled={busy}><Link2 className="mr-1 h-4 w-4" />{s.linkedGmail ? "Change" : "Link Gmail"}</Button>
            {s.linkedGmail && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(async () => { await unlink(); await load(); toast.success("Gmail unlinked."); })}><Unlink className="mr-1 h-4 w-4" />Unlink</Button>}
          </div>
        </div>
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium flex items-center gap-2"><KeyRound className="h-4 w-4" />Change password</p>
          {!s.linkedGmail ? (
            <p className="text-sm text-muted-foreground">Link a Gmail first. You'll confirm with it before changing your password.</p>
          ) : !changing ? (
            <Button size="sm" variant="outline" onClick={startChange} disabled={busy}>Confirm with {s.linkedGmail}</Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1"><Label htmlFor="cp-new">New password</Label><Input id="cp-new" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="cp-confirm">Confirm new password</Label><Input id="cp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
              <Button size="sm" onClick={saveChange} disabled={busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save password</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
