import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getSchoolProfile } from "@/lib/profile.functions";

interface PersonalInfoProps { userName: string; userRole: string | null; userEmail?: string; personalEmail: string | null; userId?: string; }
export function PersonalInfo(props: PersonalInfoProps) {
  const read = useServerFn(getSchoolProfile);
  const { data, isPending, error } = useQuery({ queryKey: ["school-profile", props.userId], queryFn: () => read() });
  const fields: Record<string, string> = { "Full Name": data?.name ?? props.userName, "School Email": data?.email ?? props.userEmail ?? "" };
  if (props.userRole === "student") { fields.Class = data?.className ?? "Not assigned"; fields.Stream = data?.streamName ?? "Not assigned"; }
  Object.assign(fields, data?.details);
  return <Card><CardHeader><CardTitle>School Information</CardTitle><CardDescription>Your name, class and stream are managed by the school administrator.</CardDescription></CardHeader><CardContent>
    {error ? <p role="alert" className="text-destructive">School details could not be loaded.</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Object.entries(fields).map(([label, value]) => <div key={label} className="min-w-0 space-y-2"><Label htmlFor={`school-${label}`}>{label}</Label>{isPending ? <Skeleton className="h-10 w-full" /> : <Input id={`school-${label}`} value={value} disabled />}</div>)}</div>}
  </CardContent></Card>;
}
