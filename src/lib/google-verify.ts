import { lovable } from "@/integrations/lovable";

export type GoogleIntent = "recovery-link" | "reset" | "change-password";
export const GOOGLE_READY_KEY = "google-verified-intent";

/**
 * Asks the user to confirm a Google account. Returns true when the Google
 * session is ready now (popup); false when the browser is redirecting and the
 * callback page will resume the action.
 */
export async function verifyWithGoogle(intent: GoogleIntent, hint?: string) {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}/auth/google-callback?intent=${intent}`,
    extraParams: { prompt: "select_account", ...(hint ? { login_hint: hint } : {}) },
  });
  if (result.error) throw result.error;
  return !result.redirected;
}
