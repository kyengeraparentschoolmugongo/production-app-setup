# Deploying to Vercel

1. Import the GitHub repo in Vercel. Framework: auto (TanStack Start/Nitro detects Vercel). Build command `npm run build`, Node 22.
2. Environment variables (Production + Preview):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (copy from `.env`)
   - `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (same values as above)
   - `SUPABASE_SERVICE_ROLE_KEY` — required by server functions (login, admin, photos). Not available on Lovable Cloud; only usable if the backend is moved to a Supabase project you own.
   - `PUPIL_SESSION_SECRET` — any random 64-character string (keep it secret, never change it casually: changing it signs everyone out).
3. Google sign-in on Vercel goes directly to the backend (no Lovable broker):
   - Backend auth settings → Google: use your own Google OAuth Client ID/Secret.
   - Google Cloud Console → Authorized redirect URI: the backend callback `https://<backend>/auth/v1/callback`.
   - Backend auth → Redirect URLs: add `https://<your-app>.vercel.app/**` (and your custom domain).
4. Install as app: manifest + icons are in `public/`; the install banner appears on Android/desktop Chrome and shows Add-to-Home-Screen steps on iPhone.
