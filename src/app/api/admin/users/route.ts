import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/helpers";

// --- GET: list all users (admin only) ---

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("*")
    .order("erstellt_am", { ascending: false })
    .limit(500);

  if (error) {
    return Response.json(
      { error: "Benutzerliste konnte nicht geladen werden." },
      { status: 500 }
    );
  }

  return Response.json({ users: profiles });
}

// --- POST: create a new user (admin only) ---

const createUserSchema = z.object({
  personalnummer: z.string().min(1, "Personalnummer ist erforderlich"),
  vorname: z.string().min(1, "Vorname ist erforderlich"),
  nachname: z.string().min(1, "Nachname ist erforderlich"),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

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

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? "Ungueltige Eingabe.";
    return Response.json({ error: firstError }, { status: 400 });
  }

  const { personalnummer, vorname, nachname } = parsed.data;
  const admin = createAdminClient();

  // --- Check uniqueness of personalnummer ---
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("personalnummer", personalnummer)
    .single();

  if (existing) {
    return Response.json(
      { error: "Personalnummer bereits vergeben." },
      { status: 409 }
    );
  }

  // --- Create Supabase Auth user ---
  const email = `${personalnummer}@intern.app`;

  const { data: newUser, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: "1234",
      email_confirm: true,
      user_metadata: {
        muss_passwort_aendern: true,
      },
    });

  if (createError || !newUser.user) {
    // Check if user already exists in auth (edge case)
    if (createError?.message?.includes("already been registered")) {
      return Response.json(
        { error: "Personalnummer bereits vergeben." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Benutzer konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  // --- Insert profile ---
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      id: newUser.user.id,
      personalnummer,
      vorname,
      nachname,
      rolle: "worker",
    })
    .select()
    .single();

  if (profileError) {
    // Rollback: delete the auth user if profile creation fails
    await admin.auth.admin.deleteUser(newUser.user.id);
    return Response.json(
      { error: "Profil konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  return Response.json({ profile }, { status: 201 });
}
