import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import UserManagement from "@/pages/admin/UserManagement";
export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [
    { title: "All Users | KPM School Administration" },
    { name: "description", content: "School administrators manage pupil and teacher names, photographs and class assignments." },
    { property: "og:title", content: "All Users | KPM School Administration" },
    { property: "og:description", content: "Manage school account details and class assignments at Kyengera Parents School Mugongo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>,
});