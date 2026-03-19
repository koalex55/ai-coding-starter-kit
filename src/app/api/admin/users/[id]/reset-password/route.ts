import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: Request,
  context: RouteContext
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id: targetUserId } = await context.params;
  const admin = createAdminClient();

  // --- Check that the target user exists ---
  const { data: targetProfile, error: targetError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .single();

  if (targetError || !targetProfile) {
    return Response.json(
      { error: "Benutzer nicht gefunden." },
      { status: 404 }
    );
  }

  // --- Reset password to "1234" and set must-change flag ---
  const { error: updateError } = await admin.auth.admin.updateUserById(
    targetUserId,
    {
      password: "1234",
      user_metadata: {
        muss_passwort_aendern: true,
      },
    }
  );

  if (updateError) {
    return Response.json(
      { error: "Passwort konnte nicht zurueckgesetzt werden." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
