import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id: targetUserId } = await context.params;

  // --- Prevent self-deletion ---
  if (targetUserId === auth.userId) {
    return Response.json(
      { error: "Du kannst dein eigenes Konto nicht loeschen." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // --- Check that the target user exists ---
  const { data: targetProfile, error: targetError } = await admin
    .from("profiles")
    .select("rolle")
    .eq("id", targetUserId)
    .single();

  if (targetError || !targetProfile) {
    return Response.json(
      { error: "Benutzer nicht gefunden." },
      { status: 404 }
    );
  }

  // --- Prevent deleting the last admin ---
  if (targetProfile.rolle === "admin") {
    const { count: adminCount, error: countError } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("rolle", "admin");

    if (countError) {
      return Response.json(
        { error: "Interner Fehler. Bitte spaeter erneut versuchen." },
        { status: 500 }
      );
    }

    if (adminCount !== null && adminCount <= 1) {
      return Response.json(
        { error: "Der letzte Admin-Account kann nicht geloescht werden." },
        { status: 400 }
      );
    }
  }

  // --- Delete auth user (cascades to profiles via ON DELETE CASCADE) ---
  const { error: deleteError } = await admin.auth.admin.deleteUser(
    targetUserId
  );

  if (deleteError) {
    return Response.json(
      { error: "Benutzer konnte nicht geloescht werden." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
