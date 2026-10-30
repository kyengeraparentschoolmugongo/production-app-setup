import { startGoogleSignIn } from "@/lib/google-oauth";

export type GoogleIntent = "recovery-link" | "reset" | "change-password";
export const GOOGLE_READY_KEY = "google-verified-intent";

/**
 * Asks the user to confirm a Google account. Returns true when the Google
 * session is ready now (popup); false when the browser is redirecting and the
 * callback page will resume the action.
 */
export async function verifyWithGoogle(intent: GoogleIntent, hint?: string) {
  const result = await startGoogleSignIn({
    redirectTo: `${window.location.origin}/auth/google-callback?intent=${intent}`,
    params: { prompt: "select_account", ...(hint ? { login_hint: hint } : {}) },
  });
  return !result.redirected;
}
