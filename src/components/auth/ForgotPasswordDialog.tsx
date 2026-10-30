import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { resetPasswordWithGoogle } from "@/lib/recovery.functions";
import { verifyWithGoogle, GOOGLE_READY_KEY } from "@/lib/google-verify";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMAIL_KEY = "reset-school-email";

export function ForgotPasswordDialog() {
  const reset = useServerFn(resetPasswordWithGoogle);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // Resume after a full-page Google redirect.
  useEffect(() => {
    if (sessionStorage.getItem(GOOGLE_READY_KEY) !== "reset") return;
    sessionStorage.removeItem(GOOGLE_READY_KEY);
    const email = sessionStorage.getItem(EMAIL_KEY);
    if (email) { setSchoolEmail(email); setStep("password"); setOpen(true); }
  }, []);

  const close = () => { setOpen(false); setStep("email"); setPassword(""); setConfirm(""); sessionStorage.removeItem(EMAIL_KEY); };

  const startGoogle = async () => {
    if (!/^\S+@\S+\.\S+$/.test(schoolEmail.trim())) return toast.error("Enter your school email, for example name@kpm.com.");
    setBusy(true);
    try {
      sessionStorage.setItem(EMAIL_KEY, schoolEmail.trim().toLowerCase());
      if (await verifyWithGoogle("reset")) setStep("password");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Google verification failed."); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (password.length < 4) return toast.error("Password must have at least 4 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      await reset({ data: { schoolEmail, newPassword: password } });
      toast.success("Password changed. Sign in with your school email and new password.");
      close();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not reset password."); }
    finally { await supabase.auth.signOut(); setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0 font-normal text-sm">Forgot Password?</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "School emails can't receive mail. Enter your school email, then confirm with the Gmail account you linked in your profile."
              : `Gmail confirmed. Choose a new password for ${schoolEmail}.`}
          </DialogDescription>
        </DialogHeader>
        {step === "email" ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reset-school-email">School email</Label>
              <Input id="reset-school-email" type="email" placeholder="name@kpm.com" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} disabled={busy} />
            </div>
            <Button className="w-full" onClick={startGoogle} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Continue with linked Gmail
            </Button>
            <p className="text-xs text-muted-foreground">Only the Gmail linked to this school account is accepted. If you never linked one, ask the school administrator to reset your password.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label htmlFor="reset-new">New password</Label><Input id="reset-new" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="reset-confirm">Confirm new password</Label><Input id="reset-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            <Button className="w-full" onClick={save} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save new password</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
