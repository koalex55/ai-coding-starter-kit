import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SHIFT_CONFIG } from "@/lib/shifts";

// --- Zod schemas ---

const createShiftSchema = z.object({
  schichttyp: z.enum(["frueh", "spaet", "nacht"]),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format YYYY-MM-DD sein"),
});

// --- GET /api/shifts ---
// List shifts for the authenticated user, optionally filtered by year/month.
// Returns shifts with nested auftraege.

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Nicht authentifiziert." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let query = supabase
    .from("shifts")
    .select("*, auftraege(*)")
    .eq("user_id", user.id)
    .order("datum", { ascending: true });

  // Filter by year and month if provided
  if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return Response.json(
        { error: "Ungueltige Jahr/Monat-Parameter." },
        { status: 400 }
      );
    }
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    // Last day of month
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("datum", startDate).lte("datum", endDate);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json(
      { error: "Fehler beim Laden der Schichten." },
      { status: 500 }
    );
  }

  return Response.json({ shifts: data });
}

// --- POST /api/shifts ---
// Create a new shift for the authenticated user.

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Nicht authentifiziert." },
      { status: 401 }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Ungueltige Anfrage." },
      { status: 400 }
    );
  }

  const parsed = createShiftSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Ungueltige Eingabe.";
    return Response.json(
      { error: firstError },
      { status: 400 }
    );
  }

  const { schichttyp, datum } = parsed.data;

  // Check for existing shift on the same date
  const { data: existing } = await supabase
    .from("shifts")
    .select("id")
    .eq("user_id", user.id)
    .eq("datum", datum)
    .maybeSingle();

  if (existing) {
    return Response.json(
      { error: "Fuer diesen Tag ist bereits eine Schicht erfasst." },
      { status: 409 }
    );
  }

  // Determine regulaere_stunden from schichttyp
  const regulaere_stunden = SHIFT_CONFIG[schichttyp].durationHours;

  const { data: shift, error } = await supabase
    .from("shifts")
    .insert({
      user_id: user.id,
      schichttyp,
      datum,
      regulaere_stunden,
    })
    .select("*, auftraege(*)")
    .single();

  if (error) {
    // Handle unique constraint violation as a fallback
    if (error.code === "23505") {
      return Response.json(
        { error: "Fuer diesen Tag ist bereits eine Schicht erfasst." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Fehler beim Erstellen der Schicht." },
      { status: 500 }
    );
  }

  return Response.json({ shift }, { status: 201 });
}
