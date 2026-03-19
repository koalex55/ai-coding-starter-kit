import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const updateOrderSchema = z
  .object({
    auftragsnummer: z.string().min(1, "Auftragsnummer ist erforderlich.").optional(),
    cad_nummer: z.string().nullable().optional(),
    beschreibung: z.string().nullable().optional(),
    startzeit: z
      .string()
      .regex(timeRegex, "Startzeit muss im Format HH:mm sein.")
      .nullable()
      .optional(),
    endzeit: z
      .string()
      .regex(timeRegex, "Endzeit muss im Format HH:mm sein.")
      .nullable()
      .optional(),
    notiz: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startzeit && data.endzeit && data.startzeit === data.endzeit) {
        return false;
      }
      return true;
    },
    { message: "Startzeit und Endzeit duerfen nicht identisch sein." }
  );

type RouteParams = { params: Promise<{ id: string; orderId: string }> };

// --- PUT /api/shifts/[id]/orders/[orderId] ---
// Update an existing auftrag.

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: shiftId, orderId } = await params;
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

  // Verify the order exists and belongs to this user and shift
  const { data: existingOrder, error: fetchError } = await supabase
    .from("auftraege")
    .select("id, shift_id, user_id")
    .eq("id", orderId)
    .eq("shift_id", shiftId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingOrder) {
    return Response.json(
      { error: "Auftrag nicht gefunden." },
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

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Ungueltige Eingabe.";
    return Response.json(
      { error: firstError },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  const data = parsed.data;

  if (data.auftragsnummer !== undefined) updates.auftragsnummer = data.auftragsnummer;
  if (data.cad_nummer !== undefined) updates.cad_nummer = data.cad_nummer || null;
  if (data.beschreibung !== undefined) updates.beschreibung = data.beschreibung || null;
  if (data.startzeit !== undefined) updates.startzeit = data.startzeit || null;
  if (data.endzeit !== undefined) updates.endzeit = data.endzeit || null;
  if (data.notiz !== undefined) updates.notiz = data.notiz || null;

  if (Object.keys(updates).length === 0) {
    // Nothing to update, return existing
    const { data: order } = await supabase
      .from("auftraege")
      .select("*")
      .eq("id", orderId)
      .single();

    return Response.json({ order });
  }

  // Build warnings (soft validation)
  const warnings: string[] = [];

  if (updates.startzeit || updates.endzeit) {
    const { data: shift } = await supabase
      .from("shifts")
      .select("schichttyp")
      .eq("id", shiftId)
      .single();

    if (shift) {
      const { isTimeWithinShift } = await import("@/lib/shifts");
      const schichttyp = shift.schichttyp as "frueh" | "spaet" | "nacht";
      if (updates.startzeit && !isTimeWithinShift(updates.startzeit as string, schichttyp)) {
        warnings.push("Startzeit liegt ausserhalb der Schichtzeit.");
      }
      if (updates.endzeit && !isTimeWithinShift(updates.endzeit as string, schichttyp)) {
        warnings.push("Endzeit liegt ausserhalb der Schichtzeit.");
      }
    }
  }

  const { data: order, error } = await supabase
    .from("auftraege")
    .update(updates)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return Response.json(
      { error: "Fehler beim Aktualisieren des Auftrags." },
      { status: 500 }
    );
  }

  return Response.json(
    { order, warnings: warnings.length > 0 ? warnings : undefined }
  );
}

// --- DELETE /api/shifts/[id]/orders/[orderId] ---
// Delete an auftrag.

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id: shiftId, orderId } = await params;
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
    .from("auftraege")
    .delete()
    .eq("id", orderId)
    .eq("shift_id", shiftId)
    .eq("user_id", user.id);

  if (error) {
    return Response.json(
      { error: "Fehler beim Loeschen des Auftrags." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
