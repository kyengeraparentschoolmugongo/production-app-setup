import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { emptyInterests, interestFields, type Interests } from "@/lib/profile-rules";
import { getPersonalInterests, savePersonalInterests } from "@/lib/profile.functions";

export function PersonalInterests() {
  const read = useServerFn(getPersonalInterests), save = useServerFn(savePersonalInterests);
  const [values, setValues] = useState<Interests>(emptyInterests);
  const [initial, setInitial] = useState<Interests>(emptyInterests);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    read().then(data => { if (active) { setValues(data); setInitial(data); } }).catch(() => { if (active) setError("Your interests could not be loaded. Please try again."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [read]);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { const data = await save({ data: values }); setValues(data); setInitial(data); toast.success("Your interests have been saved."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Your interests could not be saved."); }
    finally { setSaving(false); }
  }
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />My Personal Interests</CardTitle><CardDescription>A little about you. These details stay private to your account.</CardDescription></CardHeader>
    <CardContent>{error ? <p role="alert" className="text-destructive">{error}</p> : <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{interestFields.map(field => <div key={field.key} className={`min-w-0 space-y-2 ${field.key === "other_interests" ? "sm:col-span-2" : ""}`}>
        <Label htmlFor={`interest-${field.key}`}>{field.label}</Label>
        {field.key === "other_interests" ? <Textarea id={`interest-${field.key}`} value={values[field.key]} placeholder={field.placeholder} maxLength={1000} disabled={loading || saving} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} /> : <Input id={`interest-${field.key}`} value={values[field.key]} placeholder={field.placeholder} maxLength={300} disabled={loading || saving} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} />}
      </div>)}</div>
      <div className="flex justify-end"><Button type="submit" disabled={loading || saving || !dirty}>{saving || loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? "Saving…" : "Save interests"}</Button></div>
    </form>}</CardContent>
  </Card>;
}