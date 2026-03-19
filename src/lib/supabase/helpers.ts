import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

/**
 * Get the authenticated user's profile from the server-side Supabase client.
 * Returns null if not authenticated or profile not found.
 */
export async function getAuthenticatedProfile(): Promise<{
  userId: string;
  profile: UserProfile;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    userId: user.id,
    profile: profile as UserProfile,
  };
}

/**
 * Require admin role. Returns the profile or a 401/403 Response.
 */
export async function requireAdmin(): Promise<
  | { profile: UserProfile; userId: string }
  | { error: Response }
> {
  const result = await getAuthenticatedProfile();

  if (!result) {
    return {
      error: Response.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      ),
    };
  }

  if (result.profile.rolle !== "admin") {
    return {
      error: Response.json(
        { error: "Keine Berechtigung. Nur Admins haben Zugriff." },
        { status: 403 }
      ),
    };
  }

  return result;
}
