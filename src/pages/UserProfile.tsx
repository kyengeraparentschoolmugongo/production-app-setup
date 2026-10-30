import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useNavigate } from "@/lib/router-compat";
import { PersonalInfo } from "@/components/profile/PersonalInfoWithDatabase";
import { ProfilePhotoEditor } from "@/components/profile/ProfilePhotoEditor";
import { Button } from "@/components/ui/button";
import { RecoverySettings } from "@/components/profile/RecoverySettings";
import { PersonalInterests } from "@/components/profile/PersonalInterests";

export default function UserProfile() {
  const { userRole, userName, photoUrl, signOut, personalEmail, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.info("You have been logged out");
      navigate("/login");
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

  return (
    <DashboardLayout userRole={userRole || "student"} userName={userName} photoUrl={photoUrl} onLogout={handleLogout}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <ProfilePhotoEditor />
              <div className="min-w-0">
                <CardTitle className="break-words text-2xl">{userName}</CardTitle>
                <CardDescription className="capitalize">{userRole} Account</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information - Read Only */}
        <PersonalInfo 
          userName={userName}
          userRole={userRole}
          userEmail={user?.email}
          userId={user?.id}
          personalEmail={personalEmail}
        />

        <PersonalInterests />
        <RecoverySettings />
      </div>
    </DashboardLayout>
  );
}