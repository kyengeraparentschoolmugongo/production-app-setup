import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { finishGoogleLink, loginWithGoogle } from "@/lib/google.functions";
import { cachePortalLogin } from "@/lib/portal-login";
import { useNavigate } from "@/lib/router-compat";
import { toast } from "sonner";
import { linkRecoveryGmail } from "@/lib/recovery.functions";
import { GOOGLE_READY_KEY } from "@/lib/google-verify";

export const Route = createFileRoute("/auth/google-callback")({
  validateSearch: (search: Record<string, unknown>) => ({ intent: (["link", "recovery-link", "reset", "change-password"] as const).find((i) => i === search.intent) }),
  head: () => ({ meta: [
    { title: "Google Sign-In | KPM School Portal" },
    { name: "description", content: "Completing secure Google sign-in for the KPM School Portal." },
    { property: "og:title", content: "Google Sign-In | KPM School Portal" },
    { property: "og:description", content: "Completing secure Google sign-in for the KPM School Portal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: GoogleCallback,
});

function GoogleCallback() {
  const { intent } = Route.useSearch();
  const login = useServerFn(loginWithGoogle);
  const link = useServerFn(finishGoogleLink);
  const linkGmail = useServerFn(linkRecoveryGmail);
  const navigate = useNavigate();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      // Direct (non-Lovable host) sign-in returns ?code=; exchange it if the client hasn't yet.
      const code = new URLSearchParams(window.location.search).get("code");
      let { data } = await supabase.auth.getSession();
      if (!data.session && code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => undefined);
        ({ data } = await supabase.auth.getSession());
      }
      if (!data.session) throw new Error("Google sign-in did not complete.");
      if (intent === "recovery-link") { const r = await linkGmail(); await supabase.auth.signOut(); toast.success(`Linked ${r.linkedGmail}.`); navigate("/profile", { replace: true }); return; }
      if (intent === "reset") { sessionStorage.setItem(GOOGLE_READY_KEY, "reset"); navigate("/login", { replace: true }); return; }
      if (intent === "change-password") { sessionStorage.setItem(GOOGLE_READY_KEY, "change-password"); navigate("/profile", { replace: true }); return; }
      if (intent === "link") { await link(); navigate("/account-settings", { replace: true }); return; }
      const result = await login({ data: {} });
      if (!result.success) { sessionStorage.setItem("google-match-email", result.email); toast.info(result.message); navigate("/login", { replace: true }); return; }
      cachePortalLogin(result); navigate(`/${result.role}`, { replace: true });
    })().catch((error) => { toast.error(error instanceof Error ? error.message : "Google sign-in failed."); navigate(intent === "link" ? "/account-settings" : intent === "recovery-link" || intent === "change-password" ? "/profile" : "/login", { replace: true }); });
  }, [intent, link, linkGmail, login, navigate]);
  return <main className="min-h-screen grid place-items-center p-6"><p className="text-muted-foreground">Completing Google sign-in…</p></main>;
}