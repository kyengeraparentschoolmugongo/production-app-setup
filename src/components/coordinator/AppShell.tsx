import { Link } from "@/lib/coordinator/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Users, Vote, BarChart3, FileText, UserCircle2 } from "lucide-react";
import crest from "@/assets/class-crest.png.asset.json";
import { SchoolAvatar } from "@/components/ui/school-avatar";
import { usePageView, useUser } from "@/hooks/use-coordinator";
import { useAuth } from "@/hooks/useAuth";

export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return <img src={crest.url} alt="Kyengera Parents School crest" className={`${className} rounded-full bg-background object-contain p-0.5 ring-2 ring-primary`} />;
}

const nav = [
  { to: "/", label: "Candidates", icon: Users },
  { to: "/vote", label: "Vote", icon: Vote },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/apply", label: "Register", icon: FileText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { photoUrl, userName } = useAuth();
  usePageView();
  return (
    <div className="election-shell mx-auto min-h-screen max-w-xl pb-28 bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/80 px-5 py-4 backdrop-blur">
        <Link to="/portal" aria-label="Back to school portal" className="text-primary"><ArrowLeft className="h-5 w-5" /></Link>
        <Link to="/" className="flex items-center gap-3">
          <Crest />
          <div className="leading-tight">
            <p className="font-display text-lg font-bold text-primary">KPM Elections 2026</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Action Not Words</p>
          </div>
        </Link>
        <Link
          to={user ? "/profile" : "/auth"}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-foreground"
          aria-label={user ? "Open my profile" : "Sign in"}
        >
          {user ? <CandidatePhoto name={userName} url={photoUrl} className="h-9 w-9 rounded-full" /> : <UserCircle2 className="h-6 w-6" />}
        </Link>
      </header>
      <main className="animate-page-in px-5">{children}</main>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl px-4 pb-4">
        <div className="grid grid-cols-4 rounded-2xl border border-primary/40 bg-card/95 p-1.5 shadow-election backdrop-blur">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              
              
              
              className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium election-tab"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function CandidatePhoto({ name, url, className = "" }: { name: string; url: string | null; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return url && failedUrl !== url ? <img src={url} alt={name} loading="lazy" onError={() => setFailedUrl(url)} className={`object-cover ${className}`} /> : <SchoolAvatar name={name} className={className} />;
}
