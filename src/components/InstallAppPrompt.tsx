import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classCrest } from "@/lib/images";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const DISMISS_KEY = "install-prompt-dismissed";

/** Offers "Install app" on Android/desktop and Add-to-Home-Screen steps on iPhone. */
export function InstallAppPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone || window.self !== window.top || localStorage.getItem(DISMISS_KEY)) return;
    const onPrompt = (e: Event) => { e.preventDefault(); setEvent(e as InstallEvent); setOpen(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) { setIos(true); setOpen(true); }
    const onInstalled = () => setOpen(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!open) return null;
  const dismiss = () => { localStorage.setItem(DISMISS_KEY, "1"); setOpen(false); };
  const install = async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setEvent(null);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Install the school app" className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-lg">
      <img src={classCrest.url} alt="" className="h-10 w-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Install KPM App</p>
        {ios ? (
          <p className="text-muted-foreground">Tap <Share className="inline h-3.5 w-3.5" aria-label="Share" /> then “Add to Home Screen”.</p>
        ) : (
          <p className="text-muted-foreground">Quick access from your home screen.</p>
        )}
      </div>
      {!ios && <Button size="sm" onClick={install}><Download className="mr-1 h-4 w-4" />Install</Button>}
      <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={dismiss}><X className="h-4 w-4" /></Button>
    </div>
  );
}
