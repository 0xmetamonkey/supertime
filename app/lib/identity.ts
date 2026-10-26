import { currentUser } from '@clerk/nextjs/server';
import { resolveUsername } from '@/app/actions';
import { ADMIN_EMAILS } from '@/app/config';

export interface Identity {
  email: string;
  // All lowercase identifiers this user may legitimately act as:
  // claimed username (preferred), Clerk username, Clerk user id, email prefix.
  usernames: string[];
}

export async function getIdentity(): Promise<Identity | null> {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();
  if (!email) return null;

  const usernames: string[] = [];
  try {
    const claimed = await resolveUsername(email);
    if (claimed) usernames.push(claimed.toLowerCase());
  } catch {}
  if (user?.username) usernames.push(user.username.toLowerCase());
  if (user?.id) usernames.push(user.id.toLowerCase());
  usernames.push(email.split('@')[0]);

  return { email, usernames: [...new Set(usernames)] };
}

export function matchesIdentity(
  candidate: string | null | undefined,
  identity: Identity,
  extraAccepted?: (string | null | undefined)[]
): boolean {
  const values = [candidate, ...(extraAccepted ?? [])];
  return values.some(
    (v) => v && identity.usernames.includes(v.toLowerCase().trim())
  );
}

export async function getAdminEmail(): Promise<string | null> {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase().trim();
  return email && ADMIN_EMAILS.includes(email) ? email : null;
}
