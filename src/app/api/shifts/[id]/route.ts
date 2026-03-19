import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SHIFT_CONFIG } from "@/lib/shifts";

const updateShiftSchema = z.object({
  schichttyp: z.enum(["frueh", "spaet", "nacht"]).optional(),
  datum: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format YYYY-MM-DD sein")
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// --- GET /api/shifts/[id] ---
// Get a single shift with nested auftraege.

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
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

  const { data: shift, error } = await supabase
    .from("shifts")
    .select("*, auftraege(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !shift) {
    return Response.json(
      { error: "Schicht nicht gefunden." },
      { status: 404 }
    );
  }

  return Response.json({ shift });
}

// --- PUT /api/shifts/[id] ---
// Update schichttyp and/or datum of a shift.

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
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
  const { data: existingShift, error: fetchError } = await supabase
    .from("shifts")
    .select("id, user_id, schichttyp, datum")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingShift) {
    return Response.json(
      { error: "Schicht nicht gefunden." },
      { status: 404 }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Ungueltige Anfrage." },
      { status: 400 }
    );
  }

  const parsed = updateShiftSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Ungueltige Eingabe.";
    return Response.json(
      { error: firstError },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  const { schichttyp, datum } = parsed.data;

  // If datum changes, check uniqueness
  if (datum && datum !== existingShift.datum) {
    const { data: conflict } = await supabase
      .from("shifts")
      .select("id")
      .eq("user_id", user.id)
      .eq("datum", datum)
      .neq("id", id)
      .maybeSingle();

    if (conflict) {
      return Response.json(
        { error: "Fuer diesen Tag ist bereits eine Schicht erfasst." },
        { status: 409 }
      );
    }
    updates.datum = datum;
  }

  // If schichttyp changes, update regulaere_stunden
  if (schichttyp && schichttyp !== existingShift.schichttyp) {
    updates.schichttyp = schichttyp;
    updates.regulaere_stunden = SHIFT_CONFIG[schichttyp].durationHours;
  }

  if (Object.keys(updates).length === 0) {
    // Nothing to update — return existing shift with auftraege
    const { data: shift } = await supabase
      .from("shifts")
      .select("*, auftraege(*)")
      .eq("id", id)
      .single();

    return Response.json({ shift });
  }

  const { data: shift, error } = await supabase
    .from("shifts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*, auftraege(*)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "Fuer diesen Tag ist bereits eine Schicht erfasst." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Fehler beim Aktualisieren der Schicht." },
      { status: 500 }
    );
  }

  return Response.json({ shift });
}

// --- DELETE /api/shifts/[id] ---
// Delete a shift (cascades to auftraege).

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
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

  const { error } = await supabase
    .from("shifts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return Response.json(
      { error: "Fehler beim Loeschen der Schicht." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
