import { useSettings } from "@/hooks/use-coordinator";
import { ClosedCard } from "@/components/coordinator/Notice";
import { Link, useNavigate } from "@/lib/coordinator/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, CandidatePhoto } from "@/components/coordinator/AppShell";
import { supabase } from "@/lib/coordinator/client";
import { useUser } from "@/hooks/use-coordinator";
import { AGES, PUPILS, CLASSES, STREAMS, fileToSmallDataUrl, positionLabel, positionsForClass } from "@/lib/coordinator/rules";



import { Button } from "@/components/ui/button";

const steps = ["Details", "Position", "Review"];

export default function ApplyPage() {
  const { user, ready } = useUser();
  const { data: settings } = useSettings();
  const nav = useNavigate();
  const qc = useQueryClient();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [f, setF] = useState({ student_name: "", class_name: "", stream_name: "", age: "", position: "", experience: "", manifesto: "", photo_url: "", youtube_url: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!user) return;
    supabase.from("electoral_applications").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setExistingId(data.id); setLocked(data.status !== "pending"); setPhotos(data.manifesto_photos); }
      setF({ student_name: data?.student_name ?? "", class_name: data?.class_name ?? "", stream_name: data?.stream_name ?? "", age: data?.age ? String(data.age) : "", position: data?.position ?? "", experience: data?.experience ?? "", manifesto: data?.manifesto ?? "", photo_url: data?.photo_url ?? "", youtube_url: data?.youtube_url ?? "" });
    }).catch(() => toast.error("Your application could not be loaded."));
  }, [user]);

  if (settings && !settings.applications_open) {
    return <AppShell><ClosedCard title="Applications are closed" text="The Electoral Commission is no longer accepting new candidates." /></AppShell>;
  }
  if (ready && !user) {
    return <AppShell><Gate text="Sign in to register as a candidate." /></AppShell>;
  }
  if (locked) {
    return <AppShell><Gate text="Your application has already been reviewed." to="/status" cta="View my application" /></AppShell>;
  }

  const positions = positionsForClass(f.class_name);
  const canNext = [
    PUPILS.includes(f.student_name) && CLASSES.includes(f.class_name) && STREAMS.includes(f.stream_name) && !photoBusy,
    f.position,
    true,
  ][step];

  async function submit() {
    if (!user || !f.student_name || !f.stream_name || !positions.some(p => p.value === f.position)) return;
    setBusy(true);
    const { data: verified, error: authError } = await supabase.auth.getUser();
    if (authError || !verified.user) { setBusy(false); toast.error("Please sign in again before submitting your application."); return; }
    const { data: currentSettings, error: settingsError } = await supabase.from("election_settings").select("applications_open").eq("id", 1).maybeSingle();
    if (settingsError || !currentSettings) { setBusy(false); toast.error("Election settings are unavailable. Please try again shortly."); return; }
    if (!currentSettings.applications_open) { setBusy(false); toast.error("Applications are closed."); return; }
    const row = { user_id: verified.user.id, student_name: f.student_name.trim(), class_name: f.class_name, stream_name: f.stream_name || null, age: f.age ? Number(f.age) : null, position: f.position, experience: f.experience || null, manifesto: f.manifesto.trim(), photo_url: f.photo_url || null, status: "pending", manifesto_photos: photos, youtube_url: f.youtube_url || null };
    const { error } = existingId
      ? await supabase.from("electoral_applications").update({ ...row, updated_at: new Date().toISOString() }).eq("id", existingId)
      : await supabase.from("electoral_applications").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Application for ${positionLabel(f.position)} submitted to the Electoral Commission.`);
    qc.invalidateQueries();
    nav({ to: "/status" });
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try { set("photo_url", await fileToSmallDataUrl(file)); }
    catch { toast.error("This photo could not be opened. Please choose another image."); }
    finally { setPhotoBusy(false); e.target.value = ""; }
  }

  return (
    <AppShell>
      <h1 className="mt-2 font-display text-3xl font-bold">{existingId ? "Edit registration" : "Register as a candidate"}</h1>
      <div className="mt-4 flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-gradient-primary" : "bg-card"}`} />
            <p className={`mt-1 text-[11px] uppercase ${i === step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4 rounded-3xl border-2 border-primary/50 bg-card p-5">
        {step === 0 && (
          <>
            <div className="mx-auto flex w-fit flex-col items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button type="button" variant="ghost" disabled={photoBusy} aria-label="Choose application photo" title="Choose application photo" className="relative h-28 w-28 rounded-full p-0 [&>div>svg]:h-3/5 [&>div>svg]:w-3/5">
                  <CandidatePhoto name={f.student_name || "Application photo"} url={f.photo_url || null} className="h-28 w-28 rounded-full ring-2 ring-primary" />
                  <span className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground">{photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</span>
                </Button></DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onSelect={() => cameraInput.current?.click()}><Camera className="mr-2 h-4 w-4" />Take a photo</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => galleryInput.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />Choose from gallery</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input ref={cameraInput} aria-label="Take application photo" type="file" accept="image/*" capture="user" className="hidden" onChange={uploadPhoto} />
              <input ref={galleryInput} aria-label="Upload application photo" type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
            </div>
            <div className="space-y-2"><Label>Pupil Name</Label><Select value={f.student_name} onValueChange={v => set("student_name", v)}><SelectTrigger aria-label="Pupil name" className="w-full"><SelectValue placeholder="Select name" /></SelectTrigger><SelectContent>{PUPILS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-2"><Label>Class</Label><Select value={f.class_name} onValueChange={v => { set("class_name", v); set("position", ""); }}><SelectTrigger aria-label="Class" className="w-full"><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="min-w-0 space-y-2"><Label>Stream</Label><Select value={f.stream_name} onValueChange={v => set("stream_name", v)}><SelectTrigger aria-label="Stream" className="w-full"><SelectValue placeholder="Select stream" /></SelectTrigger><SelectContent>{STREAMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="min-w-0 space-y-2"><Label>Age</Label><Select value={f.age || "none"} onValueChange={v => set("age", v === "none" ? "" : v)}><SelectTrigger aria-label="Age" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Optional</SelectItem>{AGES.map(age => <SelectItem key={age} value={age}>{age}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </>
        )}
        {step === 1 && (
          positions.length === 0 ? (
            <p className="text-muted-foreground">There are no coordinator positions open for {f.class_name}. Select a class from P1–P7.</p>
          ) : (
            <div className="space-y-3"><Label>Position</Label><Select value={f.position} onValueChange={v => set("position", v)}><SelectTrigger aria-label="Position" className="w-full"><SelectValue placeholder="Select position" /></SelectTrigger><SelectContent>{positions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select>{f.position && <p className="text-sm text-muted-foreground">{positions.find(p => p.value === f.position)?.description}</p>}</div>
          )
        )}
        {step === 2 && (
          <div className="space-y-2 text-sm">
            <CandidatePhoto name={f.student_name} url={f.photo_url || null} className="mx-auto mb-4 h-28 w-28 rounded-full" />
            <Row k="Name" v={f.student_name} /><Row k="Class" v={`${f.class_name} ${f.stream_name}`} /><Row k="Position" v={positionLabel(f.position)} />
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1 rounded-full border border-primary/50 py-3">Back</Button>}
        {step < 2 ? (
          <Button variant="ghost" disabled={!canNext} onClick={() => setStep(step + 1)} className="flex-1 rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-40">Next</Button>
        ) : (
          <Button variant="ghost" disabled={busy} onClick={submit} className="flex-1 rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-40">{existingId ? "Update application" : "Submit application"}</Button>
        )}
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-primary/20 py-2"><span className="shrink-0 text-muted-foreground">{k}</span><span className="min-w-0 break-words text-right font-semibold">{v}</span></div>;
}

export function Gate({ text, to = "/auth", cta = "Sign in" }: { text: string; to?: string; cta?: string }) {
  return (
    <div className="mt-16 rounded-3xl border-2 border-primary/60 bg-card p-8 text-center">
      <p className="font-display text-xl">{text}</p>
      <Link to={to} className="mt-6 block rounded-full bg-gradient-primary py-3 font-semibold text-primary-foreground">{cta}</Link>
    </div>
  );
}
