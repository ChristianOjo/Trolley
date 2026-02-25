import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/database.types";

/** Get the current user + their role. Redirects to login if not authenticated. */
export async function requireAuth(requiredRole?: UserRole) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, phone")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");
  if (requiredRole && profile.role !== requiredRole) redirect("/auth/unauthorised");

  return { user, profile };
}

/** Sign out action */
export async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
