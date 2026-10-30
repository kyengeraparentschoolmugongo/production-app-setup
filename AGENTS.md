<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Pages import navigation from `@/lib/router-compat` (thin wrapper over TanStack Router) — kept the imported app's react-router style calls working without rewriting every page.
- The app runs on Lovable Cloud; legacy portal tables keep open anon policies because portal accounts are not Auth identities, while credential columns stay locked by column grants.
- Router uses defaultSsr: false — the app depends on browser-only login state.
- Page entrance animations mount inside page content (DashboardLayout main for dashboard pages), never around the root Outlet or keyed by location — pending navigation must not remount or reanimate outgoing pages.
- Keep the shared loading overlay as a sibling of the root Outlet, driven by router pending and session-restoration state, so navigation never replaces or remounts page content just to show loading.

- Keep shared school identity, contact values and the class/stream list (which classes have published info) in src/lib/school.ts so navigation, footer and class pages stay consistent.
- Pupil passwords are bcrypt hashes verified in a server function; pupil identity is restored from an encrypted server cookie, never trusted from browser storage.
- Google student identities are linked through a server-only link table and database functions; account matching, creation and linking stay server-side so client data never proves identity.
- Legacy orange Tailwind colour utilities are mapped to the school-brand palette in global CSS so imported pages share the current theme without changing functional colour-category data.
- The school crest is held in three copies — `src/assets/class-crest.png.asset.json` (login page + account menu), `public/header.png` (PDF letterhead banner) and `public/school-logo.png` (PDF watermark) — replace all three together so printed and on-screen branding never diverge.
- Coordinator election pages use the imported presentation through a portal navigation/request adapter; all election reads and writes authorize encrypted school sessions server-side, because portal accounts are not Auth identities.
- Election application fields are validated separately from school identity; application writes preserve submitted candidate choices while deriving record ownership from the encrypted session, so profile details never change.
- School identity writes use the administrator user-management server function and encrypted portal role validation; browser directory access is read-only so hiding controls is not the permission boundary.
- Personal interests are stored privately by portal account ID and account type; server functions derive ownership from the encrypted session, keeping school identity outside the editable interests schema.
- Profile photos are compressed in the browser and uploaded through a session-authorized server function to private Storage; account rows store object references and reads issue signed URLs, keeping uploads out of account payloads and preventing arbitrary-user writes.
