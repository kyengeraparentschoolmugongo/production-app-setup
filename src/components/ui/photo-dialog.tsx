import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SchoolAvatar } from "@/components/ui/school-avatar";

interface PhotoDialogProps {
  photoUrl?: string | null;
  userName: string;
  size?: string;
}

export function PhotoDialog({ photoUrl, userName, size = "h-20 w-20" }: PhotoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Avatar className={`cursor-pointer hover:opacity-80 transition-opacity ${size}`}>
          <AvatarImage src={photoUrl ?? undefined} alt={`${userName}'s photo`} />
          <AvatarFallback>
            <SchoolAvatar />
          </AvatarFallback>
        </Avatar>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center space-y-4">
          {photoUrl ? <img
            src={photoUrl}
            alt={`${userName}'s photo`}
            className="w-full h-auto max-h-96 object-contain rounded-lg"
          /> : <SchoolAvatar className="h-56 w-56 rounded-full" />}
          <p className="text-lg font-medium text-center">{userName}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}