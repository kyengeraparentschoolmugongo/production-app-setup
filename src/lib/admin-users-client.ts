import { adminUsersRequest } from "./admin-users.functions";
import { supabase as browserDb } from "@/integrations/supabase/client";
type Table = "students" | "teachers" | "admins";
type Reply = { data: any; error: any; count?: number };
class UserQuery implements PromiseLike<Reply> {
  private action: "select" | "insert" | "update" | "delete" = "select";
  private values?: unknown;
  private id?: string;
  private predicates: ((r: any) => boolean)[] = [];
  private sort?: { key: string; ascending: boolean };
  private limits?: [number, number];
  constructor(private table: Table) {}
  select(_columns = "*", _options?: unknown) { return this; }
  insert(values: unknown) { this.action = "insert"; this.values = Array.isArray(values) ? values[0] : values; return this; }
  update(values: unknown) { this.action = "update"; this.values = values; return this; }
  delete() { this.action = "delete"; return this; }
  eq(key: string, value: unknown) { if (key === "id") this.id = String(value); this.predicates.push(r => r[key] === value); return this; }
  or(search: string) { const term = search.match(/ilike\.%([^%]*)%/)?.[1]?.toLowerCase() ?? ""; this.predicates.push(r => [r.name, r.email, r.id].some(v => String(v).toLowerCase().includes(term))); return this; }
  order(key: string, options?: { ascending?: boolean }) { this.sort = { key, ascending: options?.ascending ?? true }; return this; }
  range(start: number, end: number) { this.limits = [start, end]; return this; }
  then<A = Reply, B = never>(ok?: ((reply: Reply) => A | PromiseLike<A>) | null, fail?: ((error: any) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return adminUsersRequest({ data: { table: this.table, action: this.action, values: this.values, id: this.id } }).then(result => {
      let rows = Array.isArray(result.data) ? result.data.filter(r => this.predicates.every(p => p(r))) : result.data;
      const count = Array.isArray(rows) ? rows.length : undefined;
      const sort = this.sort;
      if (sort && Array.isArray(rows)) rows.sort((a, b) => String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? "")) * (sort.ascending ? 1 : -1));
      if (this.limits && Array.isArray(rows)) rows = rows.slice(this.limits[0], this.limits[1] + 1);
      return { data: rows, error: result.error, count };
    }).catch(e => ({ data: null, error: { message: e instanceof Error ? e.message : "Could not complete this action." } })).then(ok, fail);
  }
}
function from(table: Table): UserQuery;
function from(table: "classes" | "streams"): ReturnType<typeof browserDb.from>;
function from(table: Table | "classes" | "streams") { return table === "classes" || table === "streams" ? browserDb.from(table) : new UserQuery(table); }
export const adminUsers = { from };