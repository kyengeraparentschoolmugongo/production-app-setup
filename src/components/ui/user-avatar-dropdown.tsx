import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SchoolAvatar } from "@/components/ui/school-avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@/lib/router-compat";


interface UserAvatarDropdownProps {
  userName: string;
  photoUrl?: string | null;
  onLogout: () => void;
}

export function UserAvatarDropdown({ userName, photoUrl, onLogout }: UserAvatarDropdownProps) {
  const navigate = useNavigate();
  const { photoUrl: currentPhoto } = useAuth();

  return (
    <Button variant="ghost" size="icon" aria-label="Open my profile" title="Open my profile" onClick={() => navigate("/profile")} className="rounded-full">
        <Avatar className="h-9 w-9">
          <AvatarImage src={currentPhoto ?? photoUrl ?? undefined} alt={`${userName}'s profile photo`} />
          <AvatarFallback>
            <SchoolAvatar />
          </AvatarFallback>
        </Avatar>
    </Button>
  );
}
