import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  _request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id: targetUserId } = await context.params;

  // --- Prevent deactivating yourself ---
  if (targetUserId === auth.userId) {
    return Response.json(
      { error: "Du kannst deinen eigenen Account nicht sperren." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // --- Fetch current profile ---
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("id, aktiv")
    .eq("id", targetUserId)
    .single();

  if (fetchError || !profile) {
    return Response.json(
      { error: "Benutzer nicht gefunden." },
      { status: 404 }
    );
  }

  // --- Toggle aktiv status ---
  const newStatus = !profile.aktiv;

  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update({ aktiv: newStatus })
    .eq("id", targetUserId)
    .select()
    .single();

  if (updateError || !updated) {
    return Response.json(
      { error: "Status konnte nicht geaendert werden." },
      { status: 500 }
    );
  }

  return Response.json({ profile: updated });
}
