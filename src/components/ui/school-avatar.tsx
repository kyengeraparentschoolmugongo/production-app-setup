import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function SchoolAvatar({ className, name = "Default school avatar" }: { className?: string; name?: string }) {
  return <div role="img" aria-label={name} className={cn("flex h-full w-full items-center justify-center bg-primary text-primary-foreground", className)}><UserRound className="h-3/5 w-3/5" strokeWidth={1.5} /></div>;
}