import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  personalnummer: z.string().min(1, "Personalnummer ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

const LOCKOUT_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Personalnummer und Passwort sind erforderlich." },
      { status: 400 }
    );
  }

  const { personalnummer, password } = parsed.data;
  const admin = createAdminClient();

  // --- Cleanup old login_attempts (older than 24h) to prevent unbounded growth ---
  await admin
    .from("login_attempts")
    .delete()
    .lt(
      "attempted_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    );

  // --- Check lockout ---
  const windowStart = new Date(
    Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const { count: failedCount, error: countError } = await admin
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("personalnummer", personalnummer)
    .eq("success", false)
    .gte("attempted_at", windowStart);

  if (countError) {
    return Response.json(
      { error: "Interner Fehler. Bitte spaeter erneut versuchen." },
      { status: 500 }
    );
  }

  if (failedCount !== null && failedCount >= MAX_FAILED_ATTEMPTS) {
    // Find the earliest failed attempt in the window to calculate remaining time
    const { data: earliestAttempt } = await admin
      .from("login_attempts")
      .select("attempted_at")
      .eq("personalnummer", personalnummer)
      .eq("success", false)
      .gte("attempted_at", windowStart)
      .order("attempted_at", { ascending: true })
      .limit(1)
      .single();

    let minutesRemaining = LOCKOUT_WINDOW_MINUTES;
    if (earliestAttempt) {
      const unlockAt =
        new Date(earliestAttempt.attempted_at).getTime() +
        LOCKOUT_WINDOW_MINUTES * 60 * 1000;
      minutesRemaining = Math.ceil((unlockAt - Date.now()) / 60000);
      if (minutesRemaining < 1) minutesRemaining = 1;
    }

    return Response.json(
      {
        error: `Zu viele fehlgeschlagene Anmeldeversuche. Bitte in ${minutesRemaining} Minuten erneut versuchen.`,
        lockedOut: true,
        minutesRemaining,
      },
      { status: 429 }
    );
  }

  // --- Look up profile by personalnummer ---
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("personalnummer", personalnummer)
    .single();

  if (profileError || !profile) {
    // Log failed attempt (personalnummer not found -- still log to prevent enumeration timing)
    await admin.from("login_attempts").insert({
      personalnummer,
      success: false,
    });

    return Response.json(
      { error: "Anmeldung fehlgeschlagen. Bitte Personalnummer und Passwort pruefen." },
      { status: 401 }
    );
  }

  // --- Sign in with Supabase Auth ---
  const email = `${personalnummer}@intern.app`;
  const supabase = await createClient();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.user) {
    // Log failed attempt
    await admin.from("login_attempts").insert({
      personalnummer,
      success: false,
    });

    return Response.json(
      { error: "Anmeldung fehlgeschlagen. Bitte Personalnummer und Passwort pruefen." },
      { status: 401 }
    );
  }

  // --- Log successful attempt ---
  await admin.from("login_attempts").insert({
    personalnummer,
    success: true,
  });

  // --- Check must-change-password flag ---
  const mustChangePassword =
    signInData.user.user_metadata?.muss_passwort_aendern === true;

  return Response.json({
    user: {
      id: signInData.user.id,
      email: signInData.user.email,
    },
    profile: {
      id: profile.id,
      personalnummer: profile.personalnummer,
      vorname: profile.vorname,
      nachname: profile.nachname,
      rolle: profile.rolle,
      erstellt_am: profile.erstellt_am,
    },
    mustChangePassword,
  });
}
