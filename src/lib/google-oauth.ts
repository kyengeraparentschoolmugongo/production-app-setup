import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lovable-hosted sites use Lovable's managed Google broker (/~oauth).
 * Other hosts (e.g. Vercel) have no broker, so they redirect straight to the
 * backend's Google provider. Set VITE_GOOGLE_OAUTH_MODE=direct|lovable to force.
 */
export function usesLovableBroker(hostname = window.location.hostname.toLowerCase()) {
  const mode = import.meta.env.VITE_GOOGLE_OAUTH_MODE as string | undefined;
  if (mode === "direct") return false;
  if (mode === "lovable") return true;
  return /(^|\.)(lovable\.app|lovableproject\.com|lovableproject-dev\.com|lovable\.dev)$/.test(hostname);
}

type Options = { redirectTo: string; params?: Record<string, string> };

/** Returns { redirected } like the Lovable helper; throws on error. */
export async function startGoogleSignIn({ redirectTo, params }: Options) {
  if (usesLovableBroker()) {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirectTo, extraParams: params });
    if (result.error) throw result.error;
    return { redirected: !!result.redirected };
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: params, skipBrowserRedirect: true },
  });
  if (error) throw error;
  await assertProviderReady(data.url);
  window.location.assign(data.url);
  return { redirected: true };
}

/**
 * A misconfigured backend answers /authorize with a JSON 400 instead of redirecting
 * to Google, which would strand the user on a raw error page. Probe first so we can
 * show a readable message; a healthy provider responds with an (opaque) redirect.
 */
async function assertProviderReady(authorizeUrl: string) {
  const probe = await fetch(authorizeUrl, { redirect: "manual" }).catch(() => null);
  if (!probe || probe.type === "opaqueredirect" || probe.ok) return;
  const body = (await probe.json().catch(() => null)) as { msg?: string } | null;
  if (body?.msg?.toLowerCase().includes("oauth secret")) {
    throw new Error("Google sign-in isn't set up for this website yet. Please sign in with your portal password, or ask the school administrator to enable Google sign-in.");
  }
  throw new Error(body?.msg || "Google sign-in is temporarily unavailable.");
}
