import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const createOrderSchema = z
  .object({
    auftragsnummer: z.string().min(1, "Auftragsnummer ist erforderlich."),
    cad_nummer: z.string().optional(),
    beschreibung: z.string().optional(),
    startzeit: z
      .string()
      .regex(timeRegex, "Startzeit muss im Format HH:mm sein.")
      .optional(),
    endzeit: z
      .string()
      .regex(timeRegex, "Endzeit muss im Format HH:mm sein.")
      .optional(),
    notiz: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startzeit && data.endzeit) {
        return data.startzeit !== data.endzeit;
      }
      return true;
    },
    { message: "Startzeit und Endzeit duerfen nicht identisch sein." }
  );

type RouteParams = { params: Promise<{ id: string }> };

// --- GET /api/shifts/[id]/orders ---
// List all auftraege for a shift.

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id: shiftId } = await params;
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

  // Verify shift belongs to user
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("id")
    .eq("id", shiftId)
    .eq("user_id", user.id)
    .single();

  if (shiftError || !shift) {
    return Response.json(
      { error: "Schicht nicht gefunden." },
      { status: 404 }
    );
  }

  const { data: orders, error } = await supabase
    .from("auftraege")
    .select("*")
    .eq("shift_id", shiftId)
    .eq("user_id", user.id)
    .order("erstellt_am", { ascending: true });

  if (error) {
    return Response.json(
      { error: "Fehler beim Laden der Auftraege." },
      { status: 500 }
    );
  }

  return Response.json({ orders });
}

// --- POST /api/shifts/[id]/orders ---
// Create a new auftrag for a shift.

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: shiftId } = await params;
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

  // Verify shift belongs to user
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("id, schichttyp")
    .eq("id", shiftId)
    .eq("user_id", user.id)
    .single();

  if (shiftError || !shift) {
    return Response.json(
      { error: "Schicht nicht gefunden." },
      { status: 404 }
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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Ungueltige Eingabe.";
    return Response.json(
      { error: firstError },
      { status: 400 }
    );
  }

  const { auftragsnummer, cad_nummer, beschreibung, startzeit, endzeit, notiz } =
    parsed.data;

  // Build warnings (soft validation - still save)
  const warnings: string[] = [];

  // Check if times are within shift window (soft warning)
  if (startzeit || endzeit) {
    const { isTimeWithinShift } = await import("@/lib/shifts");
    const schichttyp = shift.schichttyp as "frueh" | "spaet" | "nacht";
    if (startzeit && !isTimeWithinShift(startzeit, schichttyp)) {
      warnings.push("Startzeit liegt ausserhalb der Schichtzeit.");
    }
    if (endzeit && !isTimeWithinShift(endzeit, schichttyp)) {
      warnings.push("Endzeit liegt ausserhalb der Schichtzeit.");
    }
  }

  const { data: order, error } = await supabase
    .from("auftraege")
    .insert({
      shift_id: shiftId,
      user_id: user.id,
      auftragsnummer,
      cad_nummer: cad_nummer || null,
      beschreibung: beschreibung || null,
      startzeit: startzeit || null,
      endzeit: endzeit || null,
      notiz: notiz || null,
    })
    .select("*")
    .single();

  if (error) {
    return Response.json(
      { error: "Fehler beim Erstellen des Auftrags." },
      { status: 500 }
    );
  }

  return Response.json(
    { order, warnings: warnings.length > 0 ? warnings : undefined },
    { status: 201 }
  );
}
