import { cookies } from "next/headers";
import { verifyToken, type SessionPayload } from "./auth";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireRole(
  ...roles: SessionPayload["role"][]
): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new Error("Forbidden");
  return session;
}
