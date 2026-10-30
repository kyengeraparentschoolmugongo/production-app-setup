import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecoverySettings } from "@/components/profile/RecoverySettings";
import { useAuth } from "@/hooks/useAuth";
import { PersonalInterests } from "@/components/profile/PersonalInterests";

export const Route = createFileRoute("/account-settings")({
  head: () => ({ meta: [
    { title: "Account Settings | KPM School Portal" },
    { name: "description", content: "Securely link or unlink Google from your KPM student portal account." },
    { property: "og:title", content: "Account Settings | KPM School Portal" },
    { property: "og:description", content: "Securely link or unlink Google from your KPM student portal account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() { return <ProtectedRoute><AccountSettings /></ProtectedRoute>; }
function AccountSettings() {
  const { userRole, userName, photoUrl, signOut } = useAuth();
    return <DashboardLayout userRole={userRole as any} userName={userName} photoUrl={photoUrl} onLogout={signOut}>
    <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-3xl font-bold">Account settings</h1></div><PersonalInterests /><RecoverySettings /></div>
  </DashboardLayout>;
}