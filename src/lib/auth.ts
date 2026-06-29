import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "super_admin" | "admin" | "member";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
};

export type Session = {
  userId: string;
  email: string | null;
  profile: Profile | null;
};

/** Where a role lands after login. */
export function roleHomePath(role: Role): string {
  return role === "member" ? "/member" : "/admin";
}

export function isAdminRole(role: Role): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Returns the current authenticated user + their profile, or null if not
 * logged in. `profile` can be null if the auth user has no profiles row yet.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile | null) ?? null,
  };
}

/**
 * Require an admin/super_admin. Redirects:
 *  - not logged in            -> /login
 *  - logged in, no profile    -> /login?error=no_profile
 *  - logged in as a member    -> /member
 */
export async function requireAdmin(): Promise<Session & { profile: Profile }> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.profile) redirect("/login?error=no_profile");
  if (!isAdminRole(session.profile.role)) redirect("/member");
  return session as Session & { profile: Profile };
}

/**
 * Require a member. Redirects:
 *  - not logged in            -> /login
 *  - logged in, no profile    -> /login?error=no_profile
 *  - logged in as an admin    -> /admin  (admins are not members)
 */
export async function requireMember(): Promise<Session & { profile: Profile }> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.profile) redirect("/login?error=no_profile");
  if (session.profile.role !== "member") redirect("/admin");
  return session as Session & { profile: Profile };
}
