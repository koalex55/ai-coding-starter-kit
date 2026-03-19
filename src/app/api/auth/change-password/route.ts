import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Das Passwort muss mindestens 8 Zeichen haben")
    .refine((pw) => pw !== "1234", {
      message: "Das neue Passwort darf nicht das Standard-Passwort sein",
    }),
});

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

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Ungueltige Eingabe.";
    return Response.json({ error: firstError }, { status: 400 });
  }

  const { newPassword } = parsed.data;

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

  // Rate limit: max 5 requests per 15 minutes per user
  if (!rateLimit(`change-password:${user.id}`, 5, 15 * 60 * 1000)) {
    return rateLimitResponse();
  }

  // --- Update password ---
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
    data: {
      muss_passwort_aendern: false,
    },
  });

  if (updateError) {
    return Response.json(
      { error: "Passwort konnte nicht geaendert werden. Bitte erneut versuchen." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
