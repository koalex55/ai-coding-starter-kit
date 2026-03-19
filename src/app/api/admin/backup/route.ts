import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/helpers";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  // Rate limit: max 5 requests per minute per user
  if (!rateLimit(`backup:${auth.userId}`, 5, 60 * 1000)) {
    return rateLimitResponse();
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";

  const admin = createAdminClient();

  if (format === "csv") {
    // CSV export: only profiles
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("personalnummer, vorname, nachname, rolle, erstellt_am")
      .order("erstellt_am", { ascending: false });

    if (error) {
      return Response.json(
        { error: "Backup konnte nicht erstellt werden." },
        { status: 500 }
      );
    }

    const rows = profiles ?? [];
    const header = "personalnummer,vorname,nachname,rolle,erstellt_am";
    const csvLines = rows.map((row) =>
      [
        escapeCsvField(row.personalnummer),
        escapeCsvField(row.vorname),
        escapeCsvField(row.nachname),
        escapeCsvField(row.rolle),
        escapeCsvField(row.erstellt_am),
      ].join(",")
    );
    const csv = [header, ...csvLines].join("\n");

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const filename = `backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  }

  // JSON export (default): full backup
  const [profilesResult, shiftsResult, auftraegeResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, personalnummer, vorname, nachname, rolle, erstellt_am")
      .order("erstellt_am", { ascending: false }),
    admin
      .from("shifts")
      .select("*")
      .order("datum", { ascending: false }),
    admin
      .from("auftraege")
      .select("*")
      .order("id", { ascending: false }),
  ]);

  if (profilesResult.error || shiftsResult.error || auftraegeResult.error) {
    return Response.json(
      { error: "Backup konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  const backup = {
    version: "1.0",
    created_at: new Date().toISOString(),
    data: {
      profiles: profilesResult.data ?? [],
      shifts: shiftsResult.data ?? [],
      auftraege: auftraegeResult.data ?? [],
    },
  };

  return Response.json(backup);
}

/**
 * Escape a field value for CSV: wrap in quotes if it contains comma, quote, or newline.
 */
function escapeCsvField(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
