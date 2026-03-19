import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export async function DELETE(request: NextRequest) {
  // --- Validate input ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Ungueltige Anfrage." },
      { status: 400 }
    );
  }

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Passwort ist erforderlich." },
      { status: 400 }
    );
  }

  const { password } = parsed.data;

  // --- Verify authentication ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: "Nicht authentifiziert." },
      { status: 401 }
    );
  }

  // Rate limit: max 3 requests per hour per user
  if (!rateLimit(`delete-account:${user.id}`, 3, 60 * 60 * 1000)) {
    return rateLimitResponse();
  }

  // --- Re-authenticate to verify password ---
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (signInError) {
    return Response.json(
      { error: "Falsches Passwort. Bitte erneut versuchen." },
      { status: 401 }
    );
  }

  // --- Check that this is not an admin (admins use the admin delete endpoint) ---
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("rolle")
    .eq("id", user.id)
    .single();

  if (profile?.rolle === "admin") {
    return Response.json(
      { error: "Admin-Konten koennen nicht ueber diese Route geloescht werden." },
      { status: 403 }
    );
  }

  // --- Delete user (cascades to profiles and future shift/order tables) ---
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return Response.json(
      { error: "Konto konnte nicht geloescht werden. Bitte spaeter erneut versuchen." },
      { status: 500 }
    );
  }

  // --- Sign out current session ---
  await supabase.auth.signOut();

  return Response.json({ success: true });
}
