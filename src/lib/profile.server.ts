import { getPortalSession } from "./auth-session.server";
import { findAccountById } from "./recovery.server";

export async function requirePortalAccount() {
  const session = await getPortalSession();
  const role = session.data.role ?? (session.data.studentId ? "student" : undefined);
  const id = session.data.userId ?? session.data.studentId;
  if (!role || !id) throw new Error("Please sign in to your school account.");
  const account = await findAccountById(role, id);
  if (!account) throw new Error("Please sign in again.");
  return account;
}