import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SchoolAvatar } from "@/components/ui/school-avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { compressProfilePhoto } from "@/lib/compress-photo";
import { saveProfilePhoto } from "@/lib/profile.functions";
import { useAuth } from "@/hooks/useAuth";

export function ProfilePhotoEditor() {
  const { photoUrl, userName, refreshProfilePhoto } = useAuth();
  const camera = useRef<HTMLInputElement>(null), gallery = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false); const save = useServerFn(saveProfilePhoto);
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setBusy(true);
    try { const photo = await compressProfilePhoto(file); const result = await save({ data: { photo } }); refreshProfilePhoto(result.photoUrl); toast.success("Profile photo updated."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Photo could not be uploaded."); }
    finally { setBusy(false); e.target.value = ""; }
  }
  return <div className="shrink-0"><DropdownMenu><DropdownMenuTrigger asChild>
    <Button type="button" variant="ghost" aria-label="Change profile photo" title="Change profile photo" disabled={busy} className="relative h-20 w-20 rounded-full p-0">
      <Avatar className="h-20 w-20"><AvatarImage src={photoUrl ?? undefined} alt={userName} /><AvatarFallback><SchoolAvatar /></AvatarFallback></Avatar>
      <span className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</span>
    </Button></DropdownMenuTrigger><DropdownMenuContent align="start">
      <DropdownMenuItem onSelect={() => camera.current?.click()}><Camera className="mr-2 h-4 w-4" />Take a photo</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => gallery.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />Choose from gallery</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
    <input ref={camera} type="file" accept="image/*" capture="user" aria-label="Take profile photo" className="hidden" onChange={upload} />
    <input ref={gallery} type="file" accept="image/*" aria-label="Upload profile photo" className="hidden" onChange={upload} />
  </div>;
}