/** A reset is only allowed with the exact Gmail linked to the school account. */
export function gmailMatches(linked: string | null | undefined, google: string) {
  return !!linked && linked.trim().toLowerCase() === google.trim().toLowerCase();
}

/**
 * School email format: all name letters joined. Pupils: name@kpm.com,
 * teachers: name.teacher@kpm.com. A number is added when the name is taken.
 */
export function schoolEmailFor(name: string, role: "student" | "teacher", taken: Iterable<string> = []) {
  const base = name.toLowerCase().replace(/[^a-z]/g, "");
  const suffix = role === "teacher" ? ".teacher" : "";
  const used = new Set(Array.from(taken, (e) => e.toLowerCase()));
  let n = 1;
  let email = `${base}${suffix}@kpm.com`;
  while (used.has(email)) email = `${base}${++n}${suffix}@kpm.com`;
  return email;
}
